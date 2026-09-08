"""
Tests for checkout financial integrity improvements:

- Exact Decimal money pipeline end-to-end (cart -> order -> sub-order -> items)
- Coupon re-validation at checkout (expired coupons abort checkout)
- Guest coupon usage recording (global limits hold for guests)
- Free-shipping coupons actually zero the shipping charge
- Cancellation unwinding: loyalty points, coupon usage, vendor ledger reversal
- Loyalty award on OrderPaid outbox processing (idempotent)
- Auth enumeration fixes (generic 400s for unknown emails)
"""

import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.core.exceptions import BusinessRuleError
from app.core.security import create_access_token
from app.domains.auth.models.user import User
from app.domains.catalog.models.product import Product
from app.domains.customers.models.customer_profile import CustomerProfile
from app.domains.customers.models.loyalty_ledger import LoyaltyLedger
from app.domains.shared.models.outbox import OutboxEvent
from app.domains.shared.services.outbox_relay import OutboxRelay
from app.domains.shopping.models.cart_discount import CartDiscount
from app.domains.shopping.models.coupon import Coupon, CouponRestriction, CouponUsage
from app.domains.shopping.models.order import OrderStatus, OrderTimelineEvent
from app.domains.shopping.models.sub_order import SubOrder
from app.domains.payments.models.vendor_ledger import LedgerTransaction, LedgerTransactionType, VendorLedger
from app.domains.shopping.services.cart_calculation_service import CartCalculationService
from app.domains.shopping.services.cart_service import CartService
from app.domains.shopping.services.order_service import CheckoutService
from app.domains.vendor.models.vendor_profile import VendorProfile

SHIPPING_ADDRESS = {
    "full_name": "Decimal Buyer",
    "phone_number": "254712345678",
    "street_address": "Nairobi",
}


@pytest.fixture
async def money_setup(db_session):
    """Customer with loyalty points, vendor, product, and a 10% coupon."""
    customer = User(
        id=uuid.uuid4(),
        email="decimal_buyer@test.com",
        password_hash="test_hash",
        first_name="Decimal",
        last_name="Buyer",
        role="customer",
        is_active=True,
    )
    db_session.add(customer)

    vendor_user = User(
        id=uuid.uuid4(),
        email="decimal_vendor@test.com",
        password_hash="test_hash",
        first_name="Vendor",
        last_name="User",
        role="vendor",
        is_active=True,
    )
    db_session.add(vendor_user)
    await db_session.flush()

    vendor = VendorProfile(
        id=uuid.uuid4(),
        user_id=vendor_user.id,
        store_name="Decimal Medical Supplies",
        approval_status="approved",
    )
    db_session.add(vendor)
    await db_session.flush()

    product = Product(
        id=uuid.uuid4(),
        name="Digital Thermometer",
        slug=f"therm-{uuid.uuid4().hex[:6]}",
        sku=f"SKU-TH-{uuid.uuid4().hex[:6]}",
        vendor_id=vendor.id,
        base_price=Decimal("10000.00"),
        price=Decimal("10000.00"),
        stock_quantity=10,
        status="published",
    )
    db_session.add(product)

    profile = CustomerProfile(user_id=customer.id, loyalty_points=500, loyalty_tier="bronze")
    db_session.add(profile)

    coupon = Coupon(
        id=uuid.uuid4(),
        code="DECIMAL10",
        description="10% off",
        coupon_type="percentage",
        discount_value=Decimal("10.00"),
        discount_scope="cart",
        valid_from=datetime.now(UTC) - timedelta(days=1),
        valid_until=datetime.now(UTC) + timedelta(days=30),
        is_active=True,
    )
    db_session.add(coupon)
    await db_session.flush()

    db_session.add(CouponRestriction(id=uuid.uuid4(), coupon_id=coupon.id, one_time_per_user=True))
    await db_session.commit()

    return {
        "customer": customer,
        "vendor": vendor,
        "product": product,
        "coupon": coupon,
        "profile": profile,
    }


async def _apply_coupon_discount(db_session, cart_id: uuid.UUID, code: str, discount_value: Decimal):
    discount = CartDiscount(
        id=uuid.uuid4(),
        cart_id=cart_id,
        coupon_code=code,
        discount_type="percentage",
        discount_value=discount_value,
        discount_amount=Decimal("0"),
        is_applied=True,
    )
    db_session.add(discount)
    await db_session.commit()


@pytest.mark.asyncio
async def test_checkout_decimal_exactness_end_to_end(money_setup, db_session):
    """Totals flow through the pipeline as exact 2-decimal Decimals, no float drift.

    subtotal 10000.00 - 10% coupon 1000.00 + 16% VAT on 9000.00 (1440.00)
    + shipping 250.00 (no coordinates -> flat fee) + packaging 100.00
    + services 50.00 - loyalty 50.00 (100 points at 2 points/KES) = 10790.00
    """
    data = money_setup
    cart_service = CartService(db_session)
    cart = await cart_service.get_or_create_cart(user_id=data["customer"].id)
    await cart_service.add_item(cart.id, data["product"].id, quantity=1)
    await _apply_coupon_discount(db_session, cart.id, "DECIMAL10", Decimal("10.00"))

    order = await CheckoutService(db_session).create_order_from_cart(
        cart_id=cart.id,
        user_id=data["customer"].id,
        shipping_address=dict(SHIPPING_ADDRESS),
        points_to_redeem=100,
    )

    assert order.total_amount == Decimal("10790.00")
    assert order.loyalty_discount == Decimal("50.00")
    assert order.loyalty_points_redeemed == 100

    sub_order = (await db_session.execute(select(SubOrder).where(SubOrder.parent_order_id == order.id))).scalar_one()
    assert sub_order.subtotal_amount == Decimal("10000.00")

    item = order.items[0]
    assert item.unit_price == Decimal("10000.00")
    assert item.subtotal == Decimal("10000.00")
    assert item.tax_amount_snapshot == Decimal("1600.00")  # 16% VAT snapshot on line

    # Fee breakdown stored in the JSON shipping address stays JSON-serializable
    assert isinstance(order.shipping_address["shipping_amount"], float)


@pytest.mark.asyncio
async def test_expired_coupon_blocks_checkout(money_setup, db_session):
    """A coupon that expired after being applied to the cart aborts checkout."""
    data = money_setup
    data["coupon"].valid_until = datetime.now(UTC) - timedelta(hours=1)
    await db_session.commit()

    cart_service = CartService(db_session)
    cart = await cart_service.get_or_create_cart(user_id=data["customer"].id)
    await cart_service.add_item(cart.id, data["product"].id, quantity=1)
    await _apply_coupon_discount(db_session, cart.id, "DECIMAL10", Decimal("10.00"))

    with pytest.raises(BusinessRuleError, match="no longer valid"):
        await CheckoutService(db_session).create_order_from_cart(
            cart_id=cart.id,
            user_id=data["customer"].id,
            shipping_address=dict(SHIPPING_ADDRESS),
        )


@pytest.mark.asyncio
async def test_guest_coupon_usage_recorded(money_setup, db_session):
    """Guest checkouts record coupon usage (user_id NULL) so global limits hold."""
    data = money_setup
    cart_service = CartService(db_session)
    cart = await cart_service.get_or_create_cart()  # creates a guest cart
    guest_token = cart.cart_token
    await cart_service.add_item(cart.id, data["product"].id, quantity=1)
    await _apply_coupon_discount(db_session, cart.id, "DECIMAL10", Decimal("10.00"))

    order = await CheckoutService(db_session).create_order_from_cart(
        cart_id=cart.id,
        guest_token=guest_token,
        shipping_address=dict(SHIPPING_ADDRESS),
    )

    usage = (
        await db_session.execute(select(CouponUsage).where(CouponUsage.order_id == order.id))
    ).scalar_one_or_none()
    assert usage is not None
    assert usage.user_id is None
    assert usage.is_refunded is False


@pytest.mark.asyncio
async def test_free_shipping_coupon_zeroes_shipping(money_setup, db_session):
    """A free-shipping coupon must actually remove the shipping charge."""
    data = money_setup
    cart_service = CartService(db_session)
    cart = await cart_service.get_or_create_cart(user_id=data["customer"].id)
    await cart_service.add_item(cart.id, data["product"].id, quantity=1)

    calc = CartCalculationService(db_session)
    address_with_coords = {**SHIPPING_ADDRESS, "latitude": -1.29, "longitude": 36.79}

    totals_without = await calc.calculate_totals(cart.id, address_with_coords)
    assert totals_without["shipping_amount"] > 0

    db_session.add(
        CartDiscount(
            id=uuid.uuid4(),
            cart_id=cart.id,
            coupon_code="FREESHIP",
            discount_type="free_shipping",
            discount_value=Decimal("0"),
            discount_amount=Decimal("0"),
            is_applied=True,
        )
    )
    await db_session.commit()

    totals_with = await calc.calculate_totals(cart.id, address_with_coords)
    assert totals_with["shipping_amount"] == 0.0
    assert totals_with["total"] < totals_without["total"]


@pytest.mark.asyncio
async def test_cancel_unwinds_loyalty_coupon_and_emits_event(client: AsyncClient, db_session, money_setup):
    """Cancelling an order restores redeemed loyalty points, refunds coupon usage,
    and emits an OrderCancelled outbox event for vendor ledger reversal."""
    data = money_setup
    cart_service = CartService(db_session)
    cart = await cart_service.get_or_create_cart(user_id=data["customer"].id)
    await cart_service.add_item(cart.id, data["product"].id, quantity=1)
    await _apply_coupon_discount(db_session, cart.id, "DECIMAL10", Decimal("10.00"))

    order = await CheckoutService(db_session).create_order_from_cart(
        cart_id=cart.id,
        user_id=data["customer"].id,
        shipping_address=dict(SHIPPING_ADDRESS),
        points_to_redeem=100,
    )

    # Points were redeemed at checkout
    await db_session.refresh(data["profile"])
    assert data["profile"].loyalty_points == 400

    usage = (await db_session.execute(select(CouponUsage).where(CouponUsage.order_id == order.id))).scalar_one()
    assert usage.is_refunded is False

    token = create_access_token(
        data={"sub": str(data["customer"].id), "email": data["customer"].email, "role": data["customer"].role}
    )
    response = await client.post(
        f"/api/v1/shopping/orders/{order.id}/cancel",
        headers={"Authorization": f"Bearer {token}"},
        params={"reason": "changed my mind"},
    )
    assert response.status_code == 200

    # Loyalty points restored
    await db_session.refresh(data["profile"])
    assert data["profile"].loyalty_points == 500
    restore_entry = (
        await db_session.execute(
            select(LoyaltyLedger).where(
                LoyaltyLedger.customer_id == data["customer"].id,
                LoyaltyLedger.reference_type == "order_cancel",
            )
        )
    ).scalar_one_or_none()
    assert restore_entry is not None
    assert restore_entry.points == 100

    # Coupon usage refunded
    await db_session.refresh(usage)
    assert usage.is_refunded is True

    # OrderCancelled outbox event + timeline entry
    cancel_event = (
        await db_session.execute(
            select(OutboxEvent).where(
                OutboxEvent.aggregate_id == str(order.id), OutboxEvent.event_type == "OrderCancelled"
            )
        )
    ).scalar_one_or_none()
    assert cancel_event is not None
    assert len(cancel_event.payload["sub_orders"]) == 1

    await db_session.refresh(order)
    assert order.status == OrderStatus.CANCELLED
    timeline = (
        await db_session.execute(
            select(OrderTimelineEvent).where(
                OrderTimelineEvent.order_id == order.id, OrderTimelineEvent.status == OrderStatus.CANCELLED.value
            )
        )
    ).scalar_one_or_none()
    assert timeline is not None


@pytest.mark.asyncio
async def test_orderpaid_relay_credits_ledger_and_awards_loyalty_idempotently(db_session, money_setup):
    """Relay processing of OrderPaid credits vendor ledgers and awards loyalty
    points exactly once, even when the event is processed twice."""
    data = money_setup
    cart_service = CartService(db_session)
    cart = await cart_service.get_or_create_cart(user_id=data["customer"].id)
    await cart_service.add_item(cart.id, data["product"].id, quantity=1)
    await _apply_coupon_discount(db_session, cart.id, "DECIMAL10", Decimal("10.00"))

    await CheckoutService(db_session).create_order_from_cart(
        cart_id=cart.id,
        user_id=data["customer"].id,
        shipping_address=dict(SHIPPING_ADDRESS),
        points_to_redeem=100,
    )
    # total_amount == 10790.00 -> 107 base points (bronze multiplier 1.0)

    relay = OutboxRelay(db_session)
    await relay.process_pending_events()

    # Vendor ledger credited: 10000 gross - 10% platform fee = 9000 net
    ledger = (await db_session.execute(select(VendorLedger).where(VendorLedger.vendor_id == data["vendor"].id))).scalar_one()
    assert ledger.balance == Decimal("9000.00")

    # Loyalty awarded on top of the restored-after-redemption balance
    await db_session.refresh(data["profile"])
    assert data["profile"].loyalty_points == 400 + 107

    # Second processing run must not double-credit or double-award
    await relay.process_pending_events()
    await db_session.refresh(ledger)
    await db_session.refresh(data["profile"])
    assert ledger.balance == Decimal("9000.00")
    assert data["profile"].loyalty_points == 507

    earn_entries = (
        await db_session.execute(
            select(LoyaltyLedger).where(
                LoyaltyLedger.customer_id == data["customer"].id,
                LoyaltyLedger.transaction_type == "earn",
                LoyaltyLedger.reference_type == "order",
            )
        )
    ).scalars().all()
    assert len(earn_entries) == 1


@pytest.mark.asyncio
async def test_ordercancelled_relay_reverses_vendor_ledger(client: AsyncClient, db_session, money_setup):
    """Full lifecycle: COD checkout -> ledger credit -> cancel -> ledger reversal,
    idempotent on repeated relay runs."""
    data = money_setup
    cart_service = CartService(db_session)
    cart = await cart_service.get_or_create_cart(user_id=data["customer"].id)
    await cart_service.add_item(cart.id, data["product"].id, quantity=1)
    await _apply_coupon_discount(db_session, cart.id, "DECIMAL10", Decimal("10.00"))

    order = await CheckoutService(db_session).create_order_from_cart(
        cart_id=cart.id,
        user_id=data["customer"].id,
        shipping_address=dict(SHIPPING_ADDRESS),
    )

    relay = OutboxRelay(db_session)
    await relay.process_pending_events()

    ledger = (await db_session.execute(select(VendorLedger).where(VendorLedger.vendor_id == data["vendor"].id))).scalar_one()
    assert ledger.balance == Decimal("9000.00")

    # Cancel the paid order
    token = create_access_token(
        data={"sub": str(data["customer"].id), "email": data["customer"].email, "role": data["customer"].role}
    )
    response = await client.post(
        f"/api/v1/shopping/orders/{order.id}/cancel", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200

    # Process remaining events (OrderCancelled)
    await relay.process_pending_events()

    await db_session.refresh(ledger)
    assert ledger.balance == Decimal("0.00")

    reversal = (
        await db_session.execute(
            select(LedgerTransaction).where(
                LedgerTransaction.vendor_id == data["vendor"].id,
                LedgerTransaction.transaction_type == LedgerTransactionType.DEBIT_REFUND,
            )
        )
    ).scalar_one_or_none()
    assert reversal is not None
    assert reversal.net_amount == Decimal("9000.00")

    # Re-running the relay must not double-reverse (balance stays 0, one reversal row)
    await relay.process_pending_events()
    await db_session.refresh(ledger)
    assert ledger.balance == Decimal("0.00")
    reversals = (
        await db_session.execute(
            select(LedgerTransaction).where(
                LedgerTransaction.vendor_id == data["vendor"].id,
                LedgerTransaction.transaction_type == LedgerTransactionType.DEBIT_REFUND,
            )
        )
    ).scalars().all()
    assert len(reversals) == 1


@pytest.mark.asyncio
async def test_otp_verify_unknown_email_returns_generic_400(client: AsyncClient):
    """/otp/verify must not reveal whether an email is registered (no 404)."""
    response = await client.post(
        "/api/v1/otp/verify",
        json={"email": "does-not-exist@test.com", "code": "123456", "purpose": "verification"},
    )
    assert response.status_code == 400
    assert "Invalid or expired verification code" in response.json()["detail"]


@pytest.mark.asyncio
async def test_reset_password_unknown_email_returns_generic_400(client: AsyncClient):
    """/auth/reset-password must not reveal whether an email is registered (no 404)."""
    response = await client.post(
        "/api/v1/auth/reset-password",
        json={"email": "does-not-exist@test.com", "code": "123456", "new_password": "NewSecurePass123!"},
    )
    assert response.status_code == 400
    assert "Invalid or expired verification code" in response.json()["detail"]
