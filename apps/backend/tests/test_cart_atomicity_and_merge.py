import uuid
from decimal import Decimal

import pytest

from app.core.exceptions import ConflictError
from app.domains.auth.models.user import User
from app.domains.catalog.models.product import Product
from app.domains.shopping.services.cart_service import CartService
from app.domains.shopping.services.order_service import CheckoutService
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.fixture
async def cart_setup(db_session):
    # 1. Customer
    customer = User(
        id=uuid.uuid4(),
        email="shopper@test.com",
        password_hash="test_hash",
        first_name="Jane",
        last_name="Shopper",
        role="customer",
        is_active=True,
    )
    db_session.add(customer)

    # 2. Vendor & Product with limited stock (e.g. stock=2)
    vendor = VendorProfile(
        id=uuid.uuid4(),
        user_id=customer.id,
        store_name="Stocked Pharmacy",
        approval_status="approved",
    )
    db_session.add(vendor)
    await db_session.flush()

    product = Product(
        id=uuid.uuid4(),
        name="Pulse Oximeter",
        slug=f"oximeter-{uuid.uuid4().hex[:6]}",
        sku=f"SKU-OX-{uuid.uuid4().hex[:6]}",
        vendor_id=vendor.id,
        base_price=Decimal("5000.00"),
        price=Decimal("5000.00"),
        stock_quantity=2,
        status="published",
    )
    db_session.add(product)
    await db_session.commit()

    return {
        "customer": customer,
        "vendor": vendor,
        "product": product,
    }


@pytest.mark.asyncio
async def test_cart_merge_guest_to_user(cart_setup, db_session):
    """Test guest cart migration into registered user's cart."""
    data = cart_setup
    cart_service = CartService(db_session)

    # 1. Create guest cart and add 1 item
    guest_cart = await cart_service.get_or_create_cart(session_id="guest_session_123")
    await cart_service.add_item(guest_cart.id, data["product"].id, quantity=1)

    # 2. Merge guest cart into user cart
    merged_cart, merge_log = await cart_service.merge_guest_cart(
        guest_cart_token=guest_cart.cart_token, user_id=data["customer"].id, merge_method="merge"
    )

    assert merged_cart.user_id == data["customer"].id
    assert len(merged_cart.items) == 1
    assert merged_cart.items[0].product_id == data["product"].id
    assert merged_cart.items[0].quantity == 1
    assert merge_log.source_item_count == 1
    assert merge_log.target_item_count_after == 1


@pytest.mark.asyncio
async def test_checkout_stock_depletion_conflict(cart_setup, db_session):
    """Test that attempting to checkout more items than available raises ConflictError."""
    data = cart_setup
    cart_service = CartService(db_session)
    checkout_service = CheckoutService(db_session)

    # 1. User cart with quantity=3 (stock is only 2)
    user_cart = await cart_service.get_or_create_cart(user_id=data["customer"].id)
    await cart_service.add_item(user_cart.id, data["product"].id, quantity=3)

    # 2. Checkout must fail with ConflictError
    with pytest.raises(ConflictError) as exc_info:
        await checkout_service.create_order_from_cart(
            cart_id=user_cart.id,
            user_id=data["customer"].id,
            shipping_address={
                "full_name": "Jane Shopper",
                "phone_number": "254712345678",
                "street_address": "Kenyatta Ave",
            },
        )

    assert "Insufficient stock" in str(exc_info.value)
