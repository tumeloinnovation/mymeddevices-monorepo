import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest

from app.core.exceptions import BusinessRuleError
from app.domains.auth.models.user import User
from app.domains.catalog.models.product import Product
from app.domains.shopping.models.cart_discount import CartDiscount
from app.domains.shopping.models.coupon import Coupon, CouponRestriction
from app.domains.shopping.services.cart_service import CartService
from app.domains.shopping.services.order_service import CheckoutService
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.fixture
async def coupon_setup(db_session):
    # 1. Customer
    customer = User(
        id=uuid.uuid4(),
        email="coupon_buyer@test.com",
        password_hash="test_hash",
        first_name="Coupon",
        last_name="Buyer",
        role="customer",
        is_active=True,
    )
    db_session.add(customer)

    # 2. Vendor & Product
    vendor = VendorProfile(
        id=uuid.uuid4(),
        user_id=customer.id,
        store_name="Pharma Supply",
        approval_status="approved",
    )
    db_session.add(vendor)
    await db_session.flush()

    product = Product(
        id=uuid.uuid4(),
        name="Stethoscope",
        slug=f"steth-{uuid.uuid4().hex[:6]}",
        sku=f"SKU-ST-{uuid.uuid4().hex[:6]}",
        vendor_id=vendor.id,
        base_price=Decimal("10000.00"),
        price=Decimal("10000.00"),
        stock_quantity=10,
        status="published",
    )
    db_session.add(product)

    # 3. Limited usage coupon (limit = 1)
    coupon = Coupon(
        id=uuid.uuid4(),
        code="LIMITED10",
        description="10% off limited to 1 total use",
        coupon_type="percentage",
        discount_value=Decimal("10.00"),
        discount_scope="cart",
        valid_from=datetime.now(UTC) - timedelta(days=1),
        valid_until=datetime.now(UTC) + timedelta(days=30),
        is_active=True,
    )
    db_session.add(coupon)
    await db_session.flush()

    restriction = CouponRestriction(
        id=uuid.uuid4(),
        coupon_id=coupon.id,
        global_usage_limit=1,
        one_time_per_user=True,
    )
    db_session.add(restriction)
    await db_session.commit()

    return {
        "customer": customer,
        "vendor": vendor,
        "product": product,
        "coupon": coupon,
    }


@pytest.mark.asyncio
async def test_coupon_usage_limit_enforced_at_checkout(coupon_setup, db_session):
    """Test that checkout enforces coupon usage limits and blocks re-use."""
    data = coupon_setup
    cart_service = CartService(db_session)
    checkout_service = CheckoutService(db_session)

    # 1. First order with coupon applied
    cart1 = await cart_service.get_or_create_cart(user_id=data["customer"].id)
    await cart_service.add_item(cart1.id, data["product"].id, quantity=1)

    # Apply discount to cart
    discount1 = CartDiscount(
        id=uuid.uuid4(),
        cart_id=cart1.id,
        coupon_code="LIMITED10",
        discount_type="percentage",
        discount_value=Decimal("10.00"),
        discount_amount=Decimal("1000.00"),
        is_applied=True,
    )
    db_session.add(discount1)
    await db_session.commit()

    # Checkout 1st order -> succeeds
    order1 = await checkout_service.create_order_from_cart(
        cart_id=cart1.id,
        user_id=data["customer"].id,
        shipping_address={"full_name": "Coupon Buyer", "phone_number": "254712345678", "street_address": "Nairobi"},
    )
    assert order1 is not None

    # 2. Second order attempting to use the same single-use coupon
    cart2 = await cart_service.get_or_create_cart(user_id=data["customer"].id)
    await cart_service.add_item(cart2.id, data["product"].id, quantity=1)

    discount2 = CartDiscount(
        id=uuid.uuid4(),
        cart_id=cart2.id,
        coupon_code="LIMITED10",
        discount_type="percentage",
        discount_value=Decimal("10.00"),
        discount_amount=Decimal("1000.00"),
        is_applied=True,
    )
    db_session.add(discount2)
    await db_session.commit()

    # Checkout 2nd order must fail with BusinessRuleError because coupon usage limit was reached
    with pytest.raises(BusinessRuleError) as exc_info:
        await checkout_service.create_order_from_cart(
            cart_id=cart2.id,
            user_id=data["customer"].id,
            shipping_address={"full_name": "Coupon Buyer", "phone_number": "254712345678", "street_address": "Nairobi"},
        )

    assert "invalid" in str(exc_info.value).lower() or "limit" in str(exc_info.value).lower()
