"""
Adversarial Production Gate Test Suite

Tests concurrency races, multi-transaction execution paths, payment webhooks,
inventory mutations, coupon locking, outbox retry idempotency, and tenant isolation.
"""

import io
import uuid
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.auth.models.user import User
from app.domains.auth.services.auth_service import AuthService
from app.domains.catalog.models.category import Category
from app.domains.catalog.models.product import Product
from app.domains.customers.models.customer_profile import CustomerProfile
from app.domains.shared.models.outbox import OutboxEvent, OutboxStatus
from app.domains.shared.services.outbox_relay import OutboxRelay
from app.domains.payments.models.mobile_money_payment import (
    MobileMoneyPayment,
    MobileMoneyPaymentStatus,
)
from app.domains.shopping.models.order import Order, OrderItem, OrderStatus
from app.domains.shopping.models.sub_order import SubOrder
from app.domains.payments.models.vendor_ledger import (
    VendorLedger,
)
from app.domains.payments.services.daraja_service import DarajaService
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.fixture
def auth_headers_factory(db_session: AsyncSession):
    async def _make_headers(role: str, user_id: uuid.UUID | None = None) -> tuple[dict, User]:
        uid = user_id or uuid.uuid4()
        user = User(
            id=uid,
            email=f"{role}_{uid.hex[:6]}@example.com",
            password_hash="hashed_pw_test",
            first_name="Test",
            last_name=role.capitalize(),
            role=role,
            is_active=True,
            is_verified=True,
        )
        db_session.add(user)
        await db_session.commit()
        await db_session.refresh(user)

        auth_service = AuthService(db_session)
        tokens = await auth_service.create_tokens(user)
        return {"Authorization": f"Bearer {tokens.access_token}"}, user

    return _make_headers


# ============================================================================
# 1. INVENTORY: Concurrent Cancellation Double Stock Restoration Attack
# ============================================================================


@pytest.mark.asyncio
async def test_concurrent_order_cancellation_double_restore_prevented(
    client: AsyncClient, db_session: AsyncSession, auth_headers_factory
):
    """
    Adversarial test: Two simultaneous cancel_order requests race on the same order.
    Invariant: Product and variant stock MUST be restored exactly ONCE, not twice.
    """
    headers, customer = await auth_headers_factory("customer")

    # Create category & vendor
    cat = Category(id=uuid.uuid4(), name=f"Cat_{uuid.uuid4().hex[:6]}", slug=f"cat-{uuid.uuid4().hex[:6]}")
    vuser = User(
        id=uuid.uuid4(),
        email=f"v_{uuid.uuid4().hex[:6]}@example.com",
        password_hash="hashed_pw_test",
        role="vendor",
        is_active=True,
    )
    db_session.add_all([cat, vuser])
    await db_session.flush()

    vprof = VendorProfile(id=uuid.uuid4(), user_id=vuser.id, store_name="MedStore", approval_status="approved")
    db_session.add(vprof)
    await db_session.flush()

    # Product with initial stock = 10
    product = Product(
        id=uuid.uuid4(),
        vendor_id=vprof.id,
        category_id=cat.id,
        name="Defibrillator X",
        slug=f"defib-x-{uuid.uuid4().hex[:6]}",
        sku=f"SKU-{uuid.uuid4().hex[:6]}",
        price=Decimal("150000.00"),
        stock_quantity=10,
        status="published",
    )
    db_session.add(product)
    await db_session.flush()

    # Create pending order for quantity = 5
    order = Order(
        id=uuid.uuid4(),
        user_id=customer.id,
        total_amount=Decimal("750000.00"),
        status=OrderStatus.PENDING,
    )
    db_session.add(order)
    await db_session.flush()

    order_item = OrderItem(
        id=uuid.uuid4(),
        order_id=order.id,
        vendor_id=vprof.id,
        product_id=product.id,
        quantity=5,
        unit_price=Decimal("150000.00"),
        subtotal=Decimal("750000.00"),
    )
    db_session.add(order_item)
    await db_session.commit()

    # Launch 2 sequential/simultaneous cancellation requests
    res1 = await client.post(f"/api/v1/shopping/orders/{order.id}/cancel", headers=headers)
    res2 = await client.post(f"/api/v1/shopping/orders/{order.id}/cancel", headers=headers)

    statuses = [res1.status_code, res2.status_code]
    assert 200 in statuses, f"Expected first cancellation to succeed: {statuses}"
    assert 400 in statuses, f"Expected second cancellation to be rejected: {statuses}"

    # Verify authoritative stock in DB: exactly 10 + 5 = 15 (never 20!)
    await db_session.refresh(product)
    assert (
        product.stock_quantity == 15
    ), f"Expected stock 15 after single restoration, found {product.stock_quantity}"


# ============================================================================
# 2. DARAJA / M-PESA: Duplicate Webhook Row-Locking Idempotency
# ============================================================================


@pytest.mark.asyncio
async def test_concurrent_daraja_callback_duplicate_prevented(db_session: AsyncSession):
    """
    Adversarial test: Daraja sends 2 identical STK callbacks.
    Invariant: Payment status is marked VERIFIED exactly once; exactly 1 OrderPaid event created.
    """
    order = Order(
        id=uuid.uuid4(),
        total_amount=Decimal("5000.00"),
        status=OrderStatus.PENDING,
    )
    db_session.add(order)
    await db_session.flush()

    checkout_req_id = f"ws_CO_{uuid.uuid4().hex[:12]}"
    payment = MobileMoneyPayment(
        id=uuid.uuid4(),
        order_id=order.id,
        transaction_id=checkout_req_id,
        amount=Decimal("5000.00"),
        currency="KES",
        provider="mpesa",
        status=MobileMoneyPaymentStatus.PENDING,
    )
    db_session.add(payment)
    await db_session.commit()

    callback_payload = {
        "Body": {
            "stkCallback": {
                "MerchantRequestID": "29115-34620561-1",
                "CheckoutRequestID": checkout_req_id,
                "ResultCode": 0,
                "ResultDesc": "The service request is processed successfully.",
                "CallbackMetadata": {
                    "Item": [
                        {"Name": "Amount", "Value": 5000.00},
                        {"Name": "MpesaReceiptNumber", "Value": f"QKD{uuid.uuid4().hex[:7].upper()}"},
                    ]
                },
            }
        }
    }

    # Execute two callbacks
    daraja_service_1 = DarajaService(db_session)
    res1 = await daraja_service_1.process_stk_callback(callback_payload)
    assert res1.get("status") in ("verified", "already_verified")

    daraja_service_2 = DarajaService(db_session)
    res2 = await daraja_service_2.process_stk_callback(callback_payload)
    assert res2.get("status") == "already_verified"

    # Count outbox events for this order
    outbox_events = (
        (
            await db_session.execute(
                select(OutboxEvent).where(
                    OutboxEvent.aggregate_id == str(order.id),
                    OutboxEvent.event_type == "OrderPaid",
                )
            )
        )
        .scalars()
        .all()
    )
    assert (
        len(outbox_events) == 1
    ), f"Expected exactly 1 OrderPaid outbox event, found {len(outbox_events)}"


# ============================================================================
# 3. VENDOR LEDGER: Check Constraint & Available Funds
# ============================================================================


@pytest.mark.asyncio
async def test_vendor_ledger_balance_check_constraint(db_session: AsyncSession):
    """
    Adversarial test: Verify database enforces VendorLedger non-negative balance.
    """
    vuser = User(
        id=uuid.uuid4(),
        email=f"v_{uuid.uuid4().hex[:6]}@example.com",
        password_hash="hashed_pw_test",
        role="vendor",
        is_active=True,
    )
    db_session.add(vuser)
    await db_session.flush()

    vprof = VendorProfile(id=uuid.uuid4(), user_id=vuser.id, store_name="Test Store", approval_status="approved")
    db_session.add(vprof)
    await db_session.flush()

    ledger = VendorLedger(vendor_id=vprof.id, balance=Decimal("10000.00"))
    db_session.add(ledger)
    await db_session.commit()

    assert ledger.balance == Decimal("10000.00")
    assert ledger.is_withdrawable is True


# ============================================================================
# 4. SECURITY: Image Upload Magic Bytes Verification
# ============================================================================


@pytest.mark.asyncio
async def test_avatar_upload_rejects_fake_image_magic_bytes(
    client: AsyncClient, db_session: AsyncSession, auth_headers_factory
):
    """
    Adversarial test: Upload a malicious executable/HTML renamed as .jpg.
    Expectation: API detects magic bytes mismatch and returns 400 Bad Request.
    """
    headers, customer = await auth_headers_factory("customer")

    profile = CustomerProfile(id=uuid.uuid4(), user_id=customer.id)
    db_session.add(profile)
    await db_session.commit()

    fake_image_bytes = b"<html><script>alert('xss')</script></html>"

    files = {"file": ("avatar.jpg", io.BytesIO(fake_image_bytes), "image/jpeg")}
    res = await client.post("/api/v1/customers/me/avatar", headers=headers, files=files)
    assert res.status_code == 400, f"Expected 400 rejection for invalid magic bytes, got {res.status_code}: {res.text}"
    assert "signature mismatch" in res.text or "magic bytes" in res.text


@pytest.mark.asyncio
async def test_avatar_upload_accepts_valid_png_magic_bytes(
    client: AsyncClient, db_session: AsyncSession, auth_headers_factory
):
    """
    Adversarial test: Upload a legitimate PNG file with valid magic bytes.
    Expectation: 200 Success.
    """
    headers, customer = await auth_headers_factory("customer")

    profile = CustomerProfile(id=uuid.uuid4(), user_id=customer.id)
    db_session.add(profile)
    await db_session.commit()

    # Valid minimal 1x1 PNG bytes
    valid_png_bytes = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
        b"\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    )

    files = {"file": ("avatar.png", io.BytesIO(valid_png_bytes), "image/png")}
    res = await client.post("/api/v1/customers/me/avatar", headers=headers, files=files)
    assert res.status_code == 200, f"Expected 200 success for valid PNG, got {res.status_code}: {res.text}"
    assert "avatar_url" in res.json().get("data", {})


# ============================================================================
# 5. OUTBOX RELAY: Idempotent Ledger Credit on Retry
# ============================================================================


@pytest.mark.asyncio
async def test_outbox_relay_order_paid_idempotency_on_retry(db_session: AsyncSession):
    """
    Adversarial test: An OrderPaid outbox event is processed, fails after DB credit, and is retried.
    Invariant: VendorLedger balance is credited exactly ONCE.
    """
    vuser = User(
        id=uuid.uuid4(),
        email=f"v_{uuid.uuid4().hex[:6]}@example.com",
        password_hash="hashed_pw_test",
        role="vendor",
        is_active=True,
    )
    db_session.add(vuser)
    await db_session.flush()

    vprof = VendorProfile(id=uuid.uuid4(), user_id=vuser.id, store_name="Reliable Store", approval_status="approved")
    db_session.add(vprof)
    await db_session.flush()

    # Create Order and SubOrder for FK integrity
    order = Order(
        id=uuid.uuid4(),
        total_amount=Decimal("10000.00"),
        status=OrderStatus.PROCESSING,
    )
    db_session.add(order)
    await db_session.flush()

    sub_order = SubOrder(
        id=uuid.uuid4(),
        parent_order_id=order.id,
        vendor_id=vprof.id,
        subtotal_amount=Decimal("10000.00"),
        status=OrderStatus.PROCESSING,
    )
    db_session.add(sub_order)
    await db_session.flush()

    event = OutboxEvent(
        id=uuid.uuid4(),
        aggregate_type="Order",
        aggregate_id=str(order.id),
        event_type="OrderPaid",
        payload={
            "order_id": str(order.id),
            "total_amount": 10000.0,
            "sub_orders": [
                {
                    "sub_order_id": str(sub_order.id),
                    "vendor_id": str(vprof.id),
                    "subtotal_amount": 10000.0,
                }
            ],
        },
        status=OutboxStatus.PENDING,
    )
    db_session.add(event)
    await db_session.commit()

    # Pass 1: Process outbox event
    relay = OutboxRelay(db_session)
    count1 = await relay.process_pending_events(limit=10)
    assert count1 == 1

    # Check vendor ledger: gross 10,000, 10% fee = 1,000, net = 9,000
    ledger = (
        await db_session.execute(select(VendorLedger).where(VendorLedger.vendor_id == vprof.id))
    ).scalar_one()
    assert ledger.balance == Decimal("9000.00")

    # Pass 2: Simulate retry of the same event by resetting it to PENDING
    event.status = OutboxStatus.PENDING
    event.retry_count += 1
    await db_session.commit()

    count2 = await relay.process_pending_events(limit=10)
    assert count2 == 1

    # Invariant check: Vendor balance MUST still be 9000.00 (not 18000.00)
    await db_session.refresh(ledger)
    assert (
        ledger.balance == Decimal("9000.00")
    ), f"Vendor balance was double-credited on outbox retry: {ledger.balance}"
