import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleError
from app.domains.auth.models.user import User
from app.domains.catalog.models.product import Product
from app.domains.catalog.services.catalog_service import CatalogService
from app.domains.customers.models.customer_profile import CustomerProfile
from app.domains.customers.services.loyalty_service import LoyaltyService
from app.domains.shopping.models.coupon import Coupon, CouponRestriction
from app.domains.shopping.models.order import Order, OrderStatus
from app.domains.shopping.services.coupon_service import CouponService
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.fixture
async def concurrency_fixtures(db_session: AsyncSession):
    # 1. Create a customer
    customer = User(
        id=uuid.uuid4(),
        email="concurrency_cust@test.com",
        first_name="Concurrency",
        last_name="Tester",
        password_hash="fake_hash_123",
        role="customer",
        is_active=True,
        is_verified=True,
        created_at=datetime.now(UTC),
    )
    db_session.add(customer)

    # 2. Create customer profile with initial points
    profile = CustomerProfile(
        id=uuid.uuid4(),
        user_id=customer.id,
        loyalty_points=500,
        loyalty_tier="bronze",
    )
    db_session.add(profile)

    # 3. Create a coupon with usage limit of 2 and one_time_per_user=True
    coupon = Coupon(
        id=uuid.uuid4(),
        code="CONCURRENCY50",
        coupon_type="fixed_amount",
        discount_value=Decimal("50.00"),
        discount_scope="cart",
        valid_from=datetime.now(UTC) - timedelta(days=1),
        valid_until=datetime.now(UTC) + timedelta(days=7),
        is_active=True,
    )
    db_session.add(coupon)
    await db_session.flush()

    restriction = CouponRestriction(
        id=uuid.uuid4(),
        coupon_id=coupon.id,
        one_time_per_user=True,
        global_usage_limit=2,
    )
    db_session.add(restriction)

    # 4. Create an order
    order = Order(
        id=uuid.uuid4(),
        user_id=customer.id,
        order_number=90002,
        status=OrderStatus.PENDING,
        currency="KES",
        total_amount=Decimal("4950.00"),
        shipping_address={"address": "Test Address"},
    )
    db_session.add(order)

    # 5. Create a vendor and published product
    vendor_user = User(
        id=uuid.uuid4(),
        email="concurrency_vendor@test.com",
        first_name="Vendor",
        last_name="Tester",
        password_hash="fake_hash_123",
        role="vendor",
        is_active=True,
        is_verified=True,
    )
    db_session.add(vendor_user)

    vendor_profile = VendorProfile(
        id=uuid.uuid4(),
        user_id=vendor_user.id,
        store_name="Concurrency Med Supplies",
    )
    db_session.add(vendor_profile)

    product = Product(
        id=uuid.uuid4(),
        vendor_id=vendor_profile.id,
        name="Concurrency Pulse Oximeter",
        slug="concurrency-pulse-oximeter",
        sku="OX-CONCUR-001",
        status="published",
        is_verified=True,
        is_deleted=False,
        base_price=Decimal("4000.00"),
        markup_price=Decimal("500.00"),
        commission_fee=Decimal("0.00"),
        price=Decimal("4500.00"),
        stock_quantity=50,
        view_count=10,
    )
    db_session.add(product)

    await db_session.commit()

    return {
        "customer": customer,
        "profile": profile,
        "coupon": coupon,
        "order": order,
        "product": product,
    }


@pytest.mark.asyncio
async def test_loyalty_earn_and_redeem_atomicity(db_session: AsyncSession, concurrency_fixtures):
    """Verify that loyalty earn and redeem operations update balance accurately and prevent overdrawing."""
    customer_id = concurrency_fixtures["customer"].id
    service = LoyaltyService(db_session)

    # 1. Earn 300 points
    earn_res = await service.earn_points(
        customer_id=customer_id,
        points=300,
        description="Purchased monitor",
    )
    assert earn_res.points == 300
    assert earn_res.balance_after == 800

    summary = await service.get_summary(customer_id)
    assert summary["total_points"] == 800

    # 2. Redeem 500 points
    redeem_res = await service.redeem_points(
        customer_id=customer_id,
        points=500,
        description="Discount voucher redemption",
    )
    assert redeem_res.points == -500
    assert redeem_res.balance_after == 300

    summary2 = await service.get_summary(customer_id)
    assert summary2["total_points"] == 300

    # 3. Attempt to redeem more points than available -> Must raise BusinessRuleError
    with pytest.raises(BusinessRuleError, match="Insufficient points"):
        await service.redeem_points(
            customer_id=customer_id,
            points=400,
            description="Overdraw attempt",
        )

    # Balance must remain unchanged at 300
    summary3 = await service.get_summary(customer_id)
    assert summary3["total_points"] == 300


@pytest.mark.asyncio
async def test_coupon_usage_limit_and_per_user_limit_guards(db_session: AsyncSession, concurrency_fixtures):
    """Verify that coupon usage limits and per-user limits are strictly enforced during recording."""
    coupon = concurrency_fixtures["coupon"]
    customer = concurrency_fixtures["customer"]
    order = concurrency_fixtures["order"]
    service = CouponService(db_session)

    # 1. First usage by customer -> Succeeds
    usage1 = await service.record_coupon_usage(
        coupon_id=coupon.id,
        user_id=customer.id,
        order_id=order.id,
        discount_amount=Decimal("50.00"),
    )
    assert usage1.coupon_id == coupon.id

    # 2. Second usage by same customer -> Must fail because one_time_per_user=True
    with pytest.raises(BusinessRuleError, match="already used this coupon"):
        await service.record_coupon_usage(
            coupon_id=coupon.id,
            user_id=customer.id,
            order_id=order.id,
            discount_amount=Decimal("50.00"),
        )

    # 3. Second user uses the coupon -> Succeeds (total usages = 2)
    user2 = User(
        id=uuid.uuid4(),
        email="concurrency_user2@test.com",
        first_name="User2",
        last_name="Tester",
        password_hash="fake_hash_123",
        role="customer",
        is_active=True,
    )
    db_session.add(user2)
    await db_session.commit()

    usage2 = await service.record_coupon_usage(
        coupon_id=coupon.id,
        user_id=user2.id,
        order_id=order.id,
        discount_amount=Decimal("50.00"),
    )
    assert usage2.coupon_id == coupon.id

    # 4. Third user tries to use the coupon -> Must fail because global usage_limit=2 is exhausted
    user3 = User(
        id=uuid.uuid4(),
        email="concurrency_user3@test.com",
        first_name="User3",
        last_name="Tester",
        password_hash="fake_hash_123",
        role="customer",
        is_active=True,
    )
    db_session.add(user3)
    await db_session.commit()

    with pytest.raises(BusinessRuleError, match="reached its usage limit"):
        await service.record_coupon_usage(
            coupon_id=coupon.id,
            user_id=user3.id,
            order_id=order.id,
            discount_amount=Decimal("50.00"),
        )


@pytest.mark.asyncio
async def test_atomic_product_view_count_increment(db_session: AsyncSession, concurrency_fixtures):
    """Verify that get_storefront_product_by_slug atomically increments the view counter."""
    product = concurrency_fixtures["product"]
    catalog_service = CatalogService(db_session)

    initial_count = product.view_count

    # Fetch product by slug
    fetched_product = await catalog_service.get_storefront_product_by_slug(product.slug)
    assert fetched_product.id == product.id
    assert fetched_product.view_count == initial_count + 1

    # Fetch again
    fetched_again = await catalog_service.get_storefront_product_by_slug(product.slug)
    assert fetched_again.view_count == initial_count + 2
