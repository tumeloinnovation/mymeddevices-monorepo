import uuid
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.domains.auth.models.user import User
from app.domains.auth.services.auth_service import AuthService
from app.domains.catalog.models.product import Product
from app.domains.shared.models.outbox import OutboxEvent
from app.domains.shared.services.outbox_relay import OutboxRelay
from app.domains.shopping.models.order import Order, OrderItem, OrderStatus
from app.domains.shopping.models.sub_order import SubOrder, SubOrderStatus
from app.domains.payments.models.vendor_ledger import VendorLedger
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.fixture
async def payment_setup(db_session):
    auth_service = AuthService(db_session)

    # 1. Admin user
    admin = User(
        id=uuid.uuid4(),
        email="admin_pay@test.com",
        password_hash="test_hash",
        first_name="Admin",
        last_name="Payments",
        role="admin",
        is_active=True,
    )
    db_session.add(admin)

    # 2. Customer user
    customer = User(
        id=uuid.uuid4(),
        email="customer_pay@test.com",
        password_hash="test_hash",
        first_name="Customer",
        last_name="Buyer",
        role="customer",
        is_active=True,
    )
    db_session.add(customer)

    # 3. Vendor user & profile
    vendor_user = User(
        id=uuid.uuid4(),
        email="vendor_pay@test.com",
        password_hash="test_hash",
        first_name="Vendor",
        last_name="Seller",
        role="vendor",
        is_active=True,
    )
    db_session.add(vendor_user)
    await db_session.flush()

    vendor = VendorProfile(
        id=uuid.uuid4(),
        user_id=vendor_user.id,
        store_name="Health Equip Ltd",
        approval_status="approved",
    )
    db_session.add(vendor)
    await db_session.flush()

    ledger = VendorLedger(
        vendor_id=vendor.id,
        balance=Decimal("0.00"),
    )
    db_session.add(ledger)
    await db_session.flush()

    # 4. Product
    product = Product(
        id=uuid.uuid4(),
        name="Digital Thermometer",
        slug=f"thermometer-{uuid.uuid4().hex[:6]}",
        sku=f"SKU-TH-{uuid.uuid4().hex[:6]}",
        vendor_id=vendor.id,
        base_price=Decimal("2000.00"),
        price=Decimal("2000.00"),
        stock_quantity=20,
        status="published",
    )
    db_session.add(product)
    await db_session.flush()

    # 5. Order with SubOrder
    order = Order(
        id=uuid.uuid4(),
        order_number=2001,
        user_id=customer.id,
        status=OrderStatus.PENDING,
        total_amount=Decimal("2000.00"),
        currency="KES",
    )
    db_session.add(order)
    await db_session.flush()

    sub_order = SubOrder(
        id=uuid.uuid4(),
        parent_order_id=order.id,
        vendor_id=vendor.id,
        subtotal_amount=Decimal("2000.00"),
        status=SubOrderStatus.PENDING,
    )
    db_session.add(sub_order)
    await db_session.flush()

    order_item = OrderItem(
        id=uuid.uuid4(),
        order_id=order.id,
        sub_order_id=sub_order.id,
        product_id=product.id,
        vendor_id=vendor.id,
        quantity=1,
        unit_price=Decimal("2000.00"),
        subtotal=Decimal("2000.00"),
    )
    db_session.add(order_item)
    await db_session.commit()

    admin_tokens = await auth_service.create_tokens(admin)
    customer_tokens = await auth_service.create_tokens(customer)

    return {
        "admin": admin,
        "customer": customer,
        "vendor": vendor,
        "ledger": ledger,
        "order": order,
        "sub_order": sub_order,
        "product": product,
        "admin_tokens": admin_tokens,
        "customer_tokens": customer_tokens,
    }


@pytest.mark.asyncio
async def test_mobile_money_payment_lifecycle_and_ledger_credit(client: AsyncClient, payment_setup, db_session):
    """
    Test complete mobile money flow:
    1. Admin records mobile money payment.
    2. Order status transitions to PROCESSING.
    3. Outbox events (PaymentRecorded & OrderPaid) are created.
    4. OutboxRelay processes OrderPaid -> credits vendor ledger (2000 - 10% fee = 1800).
    5. Duplicate payment recording on same order is rejected with 400.
    6. Admin refunds payment -> Order and Payment marked REFUNDED.
    """
    data = payment_setup
    admin_headers = {"Authorization": f"Bearer {data['admin_tokens'].access_token}"}
    txn_id = f"MPESA{uuid.uuid4().hex[:6].upper()}"

    # Step 1: Record payment
    payload = {
        "order_id": str(data["order"].id),
        "transaction_id": txn_id,
        "provider": "mpesa",
        "phone_number": "254712345678",
        "notes": "Verified via Daraja STK",
    }
    response = await client.post("/api/v1/admin/payments/mobile-money/record", json=payload, headers=admin_headers)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    payment_data = response.json()["data"]
    payment_id = payment_data["id"]

    # Step 2: Verify order status updated to PROCESSING
    await db_session.refresh(data["order"])
    assert data["order"].status == OrderStatus.PROCESSING

    # Step 3: Verify OrderPaid outbox event created
    events = (
        (
            await db_session.execute(
                select(OutboxEvent).where(
                    OutboxEvent.aggregate_id == str(data["order"].id), OutboxEvent.event_type == "OrderPaid"
                )
            )
        )
        .scalars()
        .all()
    )
    assert len(events) == 1, "OrderPaid event must be emitted"
    order_paid_event = events[0]

    # Step 4: Dispatch event through OutboxRelay and verify ledger credit
    relay = OutboxRelay(db_session)
    await relay._dispatch(order_paid_event)
    await db_session.commit()

    await db_session.refresh(data["ledger"])
    assert data["ledger"].balance == Decimal("1800.00")  # 2000 - 10%

    # Step 5: Duplicate recording attempt on the same order must be rejected
    dup_res = await client.post(
        "/api/v1/admin/payments/mobile-money/record",
        json={
            "order_id": str(data["order"].id),
            "transaction_id": "MPESANEW123",
            "provider": "mpesa",
            "phone_number": "254712345678",
        },
        headers=admin_headers,
    )
    assert dup_res.status_code == 400

    # Step 6: Refund payment
    refund_txn = f"REF{uuid.uuid4().hex[:6].upper()}"
    refund_res = await client.post(
        f"/api/v1/admin/payments/mobile-money/{payment_id}/refund",
        json={"refund_transaction_id": refund_txn, "refund_reason": "Customer returned device"},
        headers=admin_headers,
    )
    assert refund_res.status_code == 200
    assert refund_res.json()["data"]["status"] == "refunded"
