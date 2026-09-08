import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from httpx import AsyncClient

from app.core.security import get_password_hash
from app.domains.auth.models.user import User
from app.domains.auth.services.auth_service import AuthService
from app.domains.catalog.models.product import Product
from app.domains.shopping.models.cart import Cart, CartItem
from app.domains.shopping.models.coupon import Coupon
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.fixture
async def shopping_setup(db_session):
    """Fixture with admin, vendor, customer, and sample medical products."""
    auth_service = AuthService(db_session)

    # Admin User
    admin = User(
        id=uuid.uuid4(),
        email="admin_shopping@test.com",
        password_hash=get_password_hash("AdminPass123!"),
        role="admin",
        is_active=True,
    )
    db_session.add(admin)

    # Vendor User & Profile
    vendor_user = User(
        id=uuid.uuid4(),
        email="vendor_shopping@test.com",
        password_hash=get_password_hash("VendorPass123!"),
        role="vendor",
        is_active=True,
    )
    db_session.add(vendor_user)
    await db_session.flush()

    vendor_profile = VendorProfile(
        id=uuid.uuid4(),
        user_id=vendor_user.id,
        store_name="Nairobi Surgical Supplies",
        approval_status="approved",
    )
    db_session.add(vendor_profile)
    await db_session.flush()

    # Products
    product1 = Product(
        id=uuid.uuid4(),
        vendor_id=vendor_profile.id,
        name="Digital Thermometer Pro",
        slug="digital-thermometer-pro",
        price=2500.00,
        stock_quantity=50,
        status="published",
        is_verified=True,
    )
    product2 = Product(
        id=uuid.uuid4(),
        vendor_id=vendor_profile.id,
        name="Surgical Face Masks (50 Pack)",
        slug="surgical-face-masks-50pk",
        price=800.00,
        stock_quantity=200,
        status="published",
        is_verified=True,
    )
    db_session.add_all([product1, product2])

    # Customer User
    customer = User(
        id=uuid.uuid4(),
        email="customer_shopping@test.com",
        password_hash=get_password_hash("CustomerPass123!"),
        role="customer",
        is_active=True,
    )
    db_session.add(customer)
    await db_session.commit()

    tokens_admin = await auth_service.create_tokens(admin)
    tokens_vendor = await auth_service.create_tokens(vendor_user)
    tokens_customer = await auth_service.create_tokens(customer)

    return {
        "admin": admin,
        "tokens_admin": tokens_admin,
        "vendor_user": vendor_user,
        "vendor_profile": vendor_profile,
        "tokens_vendor": tokens_vendor,
        "customer": customer,
        "tokens_customer": tokens_customer,
        "product1": product1,
        "product2": product2,
    }


@pytest.mark.asyncio
async def test_cart_operations_and_calculations(client: AsyncClient, shopping_setup):
    """SHOP-001: Cart item lifecycle, bulk operations, clear cart, validate, and totals."""
    d = shopping_setup
    cust_headers = {"Authorization": f"Bearer {d['tokens_customer'].access_token}"}
    p1_id = str(d["product1"].id)
    p2_id = str(d["product2"].id)

    # 1. Retrieve current customer cart
    my_cart_res = await client.get("/api/v1/shopping/cart/my", headers=cust_headers)
    assert my_cart_res.status_code == 200
    cart_data = my_cart_res.json()["data"]
    cart_id = cart_data["id"]

    # 2. Add single item to cart
    add_res = await client.post(
        "/api/v1/shopping/cart/items",
        json={"product_id": p1_id, "quantity": 2},
        headers=cust_headers,
    )
    assert add_res.status_code == 200
    items = add_res.json()["data"]["items"]
    assert len(items) == 1
    item_id = items[0]["id"]
    assert items[0]["quantity"] == 2

    # 3. Update item quantity
    update_res = await client.patch(
        f"/api/v1/shopping/cart/items/{item_id}",
        json={"quantity": 3},
        headers=cust_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["quantity"] == 3

    # 4. Bulk add items
    bulk_add = await client.post(
        "/api/v1/shopping/cart/items/bulk",
        json=[{"product_id": p2_id, "quantity": 5}],
        headers=cust_headers,
    )
    assert bulk_add.status_code == 200
    assert bulk_add.json()["data"]["added_count"] == 1

    # 5. Get cart totals
    totals_res = await client.get(f"/api/v1/shopping/cart/totals?cart_id={cart_id}", headers=cust_headers)
    assert totals_res.status_code == 200
    assert "subtotal" in totals_res.json()["data"]

    # 6. Validate cart
    val_res = await client.post(f"/api/v1/shopping/cart/validate?cart_id={cart_id}", headers=cust_headers)
    assert val_res.status_code == 200
    assert val_res.json()["data"]["is_valid"] is True

    # 7. Clear cart
    clear_res = await client.delete("/api/v1/shopping/cart/clear", headers=cust_headers)
    assert clear_res.status_code == 200
    assert clear_res.json()["data"]["removed_count"] >= 1


@pytest.mark.asyncio
async def test_admin_and_vendor_coupon_management(client: AsyncClient, shopping_setup):
    """SHOP-002: Admin & Vendor coupons creation, update, listing, stats, and deletion."""
    d = shopping_setup
    admin_headers = {"Authorization": f"Bearer {d['tokens_admin'].access_token}"}
    vendor_headers = {"Authorization": f"Bearer {d['tokens_vendor'].access_token}"}

    # 1. Admin creates platform-wide coupon -> 201
    adm_coupon_payload = {
        "code": "HEALTH2026",
        "description": "New Year Health 10% Discount",
        "coupon_type": "percentage",
        "discount_value": 10.0,
        "min_order_value": 1000.0,
        "max_discount_amount": 5000.0,
        "global_usage_limit": 100,
        "valid_from": datetime.now(UTC).isoformat(),
        "valid_until": (datetime.now(UTC) + timedelta(days=30)).isoformat(),
    }
    create_adm_c = await client.post("/api/v1/admin/shopping/coupons", json=adm_coupon_payload, headers=admin_headers)
    assert create_adm_c.status_code == 201
    adm_c_id = create_adm_c.json()["data"]["id"]

    # 2. Admin list coupons
    list_adm_c = await client.get("/api/v1/admin/shopping/coupons", headers=admin_headers)
    assert list_adm_c.status_code == 200
    assert any(c["id"] == adm_c_id for c in list_adm_c.json()["data"])

    # 3. Admin update coupon
    update_adm_c = await client.patch(
        f"/api/v1/admin/shopping/coupons/{adm_c_id}",
        json={"description": "Updated Health 10% Discount"},
        headers=admin_headers,
    )
    assert update_adm_c.status_code == 200
    assert update_adm_c.json()["data"]["description"] == "Updated Health 10% Discount"

    # 4. Vendor creates vendor coupon -> 201
    vendor_coupon_payload = {
        "code": "SURGICAL500",
        "description": "KES 500 off surgical tools",
        "coupon_type": "fixed_amount",
        "discount_value": 500.0,
        "min_order_value": 2000.0,
        "valid_from": datetime.now(UTC).isoformat(),
    }
    create_ven_c = await client.post("/api/v1/shopping/vendor/coupons", json=vendor_coupon_payload, headers=vendor_headers)
    assert create_ven_c.status_code == 201
    ven_c_id = create_ven_c.json()["data"]["id"]

    # 5. Vendor get coupon stats
    ven_stats = await client.get(f"/api/v1/shopping/vendor/coupons/{ven_c_id}/stats", headers=vendor_headers)
    assert ven_stats.status_code == 200
    assert "total_uses" in ven_stats.json()["data"]

    # 6. Vendor delete coupon -> 200
    del_ven_c = await client.delete(f"/api/v1/shopping/vendor/coupons/{ven_c_id}", headers=vendor_headers)
    assert del_ven_c.status_code == 200


@pytest.mark.asyncio
async def test_cart_coupon_application_and_validation(client: AsyncClient, shopping_setup, db_session):
    """SHOP-003: Applying, validating, and removing coupons on customer cart."""
    d = shopping_setup
    cust_headers = {"Authorization": f"Bearer {d['tokens_customer'].access_token}"}
    p1_id = str(d["product1"].id)

    # 1. Create active coupon in DB
    coupon = Coupon(
        id=uuid.uuid4(),
        code="SAVE20PERCENT",
        description="20% off all orders",
        coupon_type="percentage",
        discount_value=Decimal("20.0"),
        is_active=True,
        valid_from=datetime.now(UTC) - timedelta(days=1),
        valid_until=datetime.now(UTC) + timedelta(days=10),
    )
    db_session.add(coupon)
    await db_session.commit()

    # 2. Add product to cart (Price: 2500 * 2 = 5000)
    add_res = await client.post(
        "/api/v1/shopping/cart/items",
        json={"product_id": p1_id, "quantity": 2},
        headers=cust_headers,
    )
    cart_id = add_res.json()["data"]["id"]

    # 3. Validate coupon endpoint
    val_c = await client.get(f"/api/v1/shopping/cart/coupon/validate?code=SAVE20PERCENT&cart_id={cart_id}", headers=cust_headers)
    assert val_c.status_code == 200
    assert val_c.json()["data"]["is_valid"] is True

    # 4. Apply coupon to cart (query parameters: code, cart_id)
    apply_c = await client.post(
        f"/api/v1/shopping/cart/coupon?code=SAVE20PERCENT&cart_id={cart_id}",
        headers=cust_headers,
    )
    assert apply_c.status_code == 200
    assert apply_c.json()["data"]["code"] == "SAVE20PERCENT"
    assert apply_c.json()["data"]["discount_amount"] > 0

    # 5. Remove coupon from cart
    rem_c = await client.delete(f"/api/v1/shopping/cart/coupon?cart_id={cart_id}", headers=cust_headers)
    assert rem_c.status_code == 200


@pytest.mark.asyncio
async def test_admin_abandoned_carts_and_analytics(client: AsyncClient, shopping_setup, db_session):
    """SHOP-004: Admin abandoned cart management, recovery trigger, and shopping analytics."""
    d = shopping_setup
    admin_headers = {"Authorization": f"Bearer {d['tokens_admin'].access_token}"}

    # Create abandoned cart in DB
    abandoned_cart = Cart(
        id=uuid.uuid4(),
        user_id=d["customer"].id,
        is_active=True,
        cart_token="abandoned-cart-token-001",
        updated_at=datetime.now(UTC) - timedelta(hours=48),
    )
    db_session.add(abandoned_cart)
    await db_session.flush()

    item = CartItem(
        id=uuid.uuid4(),
        cart_id=abandoned_cart.id,
        product_id=d["product1"].id,
        quantity=3,
        unit_price=Decimal("2500.00"),
    )
    db_session.add(item)
    await db_session.commit()

    # 1. Admin lists abandoned carts
    list_ab = await client.get("/api/v1/admin/shopping/carts/abandoned?hours=24", headers=admin_headers)
    assert list_ab.status_code == 200
    assert any(c["id"] == str(abandoned_cart.id) for c in list_ab.json()["data"])

    # 2. Admin get abandoned cart details
    get_ab = await client.get(f"/api/v1/admin/shopping/carts/abandoned/{abandoned_cart.id}", headers=admin_headers)
    assert get_ab.status_code == 200
    assert get_ab.json()["data"]["id"] == str(abandoned_cart.id)

    # 3. Admin recovers abandoned cart -> 200
    rec_ab = await client.post(f"/api/v1/admin/shopping/carts/abandoned/{abandoned_cart.id}/recover", headers=admin_headers)
    assert rec_ab.status_code == 200

    # 4. Admin shopping analytics
    analytics_res = await client.get("/api/v1/admin/shopping/analytics", headers=admin_headers)
    assert analytics_res.status_code == 200
    assert "total_orders" in analytics_res.json()["data"]
