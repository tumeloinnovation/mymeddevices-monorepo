import uuid
from decimal import Decimal

import pytest
from httpx import AsyncClient

from app.domains.auth.models.user import User
from app.domains.auth.services.auth_service import AuthService
from app.domains.catalog.models.product import Product
from app.domains.customers.models.customer_profile import CustomerProfile
from app.domains.shopping.models.cart import Cart, CartItem
from app.domains.shopping.models.order import Order, OrderStatus
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.fixture
async def two_customers_setup(db_session):
    """Fixture providing two distinct customer accounts, an admin account, a vendor, and products."""
    auth_service = AuthService(db_session)

    # 1. Customer User A
    user_a = User(
        id=uuid.uuid4(),
        email="customer_a@test.com",
        password_hash="test_hash_a",
        first_name="Alice",
        last_name="User",
        phone="+254711111111",
        role="customer",
        is_active=True,
    )
    db_session.add(user_a)
    await db_session.flush()

    profile_a = CustomerProfile(
        id=uuid.uuid4(),
        user_id=user_a.id,
        loyalty_points=500,
        loyalty_tier="bronze",
    )
    db_session.add(profile_a)

    # 2. Customer User B
    user_b = User(
        id=uuid.uuid4(),
        email="customer_b@test.com",
        password_hash="test_hash_b",
        first_name="Bob",
        last_name="Attacker",
        phone="+254722222222",
        role="customer",
        is_active=True,
    )
    db_session.add(user_b)
    await db_session.flush()

    profile_b = CustomerProfile(
        id=uuid.uuid4(),
        user_id=user_b.id,
        loyalty_points=100,
        loyalty_tier="bronze",
    )
    db_session.add(profile_b)

    # 3. Admin User
    admin_user = User(
        id=uuid.uuid4(),
        email="admin_staff@test.com",
        password_hash="test_hash_admin",
        first_name="Admin",
        last_name="Staff",
        role="admin",
        is_active=True,
    )
    db_session.add(admin_user)
    await db_session.flush()

    # 4. Vendor User & Profile
    vendor_user = User(
        id=uuid.uuid4(),
        email="vendor_idor@test.com",
        password_hash="test_hash_vendor",
        role="vendor",
        is_active=True,
    )
    db_session.add(vendor_user)
    await db_session.flush()

    vendor = VendorProfile(
        id=uuid.uuid4(),
        user_id=vendor_user.id,
        store_name="IDOR Medical Supplies",
        approval_status="approved",
    )
    db_session.add(vendor)
    await db_session.flush()

    # 5. Product
    product = Product(
        id=uuid.uuid4(),
        vendor_id=vendor.id,
        name="Stethoscope Pro",
        slug="stethoscope-pro-idor",
        price=4500.00,
        stock_quantity=100,
        status="published",
        is_verified=True,
    )
    db_session.add(product)

    # 6. User A's Cart with an item
    cart_a = Cart(
        id=uuid.uuid4(),
        user_id=user_a.id,
        cart_token="token_a_123456",
        is_active=True,
    )
    db_session.add(cart_a)
    await db_session.flush()

    cart_item_a = CartItem(
        id=uuid.uuid4(),
        cart_id=cart_a.id,
        product_id=product.id,
        quantity=2,
        unit_price=Decimal("4500.00"),
    )
    db_session.add(cart_item_a)

    # 7. User B's Cart
    cart_b = Cart(
        id=uuid.uuid4(),
        user_id=user_b.id,
        cart_token="token_b_654321",
        is_active=True,
    )
    db_session.add(cart_b)

    # 8. User A's Order
    order_a = Order(
        id=uuid.uuid4(),
        user_id=user_a.id,
        order_number=90003,
        status=OrderStatus.PROCESSING,
        total_amount=Decimal("9000.00"),
        shipping_address={"full_name": "Alice User", "city": "Nairobi", "address": "123 Alice St"},
    )
    db_session.add(order_a)

    await db_session.commit()

    tokens_a = await auth_service.create_tokens(user_a)
    tokens_b = await auth_service.create_tokens(user_b)
    tokens_admin = await auth_service.create_tokens(admin_user)

    return {
        "user_a": user_a,
        "profile_a": profile_a,
        "tokens_a": tokens_a,
        "user_b": user_b,
        "profile_b": profile_b,
        "tokens_b": tokens_b,
        "admin_user": admin_user,
        "tokens_admin": tokens_admin,
        "product": product,
        "cart_a": cart_a,
        "cart_item_a": cart_item_a,
        "cart_b": cart_b,
        "order_a": order_a,
    }


@pytest.mark.asyncio
async def test_customer_address_idor_prevention(client: AsyncClient, two_customers_setup):
    """Verify that User B cannot modify, delete, or set as default User A's address."""
    d = two_customers_setup
    headers_a = {"Authorization": f"Bearer {d['tokens_a'].access_token}"}
    headers_b = {"Authorization": f"Bearer {d['tokens_b'].access_token}"}

    # 1. User A creates Address
    create_res = await client.post(
        "/api/v1/customers/addresses",
        json={
            "first_name": "Alice",
            "last_name": "User",
            "phone": "+254711111111",
            "address_line1": "Private Residence A",
            "city": "Nairobi",
            "state": "Nairobi County",
            "postal_code": "00100",
            "country": "Kenya",
            "type": "shipping",
            "is_default": True,
        },
        headers=headers_a,
    )
    assert create_res.status_code == 200
    addr_id = create_res.json()["data"]["id"]

    # 2. User B tries to UPDATE User A's address -> Must fail (404/403)
    hack_update = await client.put(
        f"/api/v1/customers/addresses/{addr_id}",
        json={"address_line1": "Hacked Address B", "city": "Mombasa"},
        headers=headers_b,
    )
    assert hack_update.status_code in (403, 404)

    # 3. User B tries to SET AS DEFAULT User A's address -> Must fail (404/403)
    hack_default = await client.put(
        f"/api/v1/customers/addresses/{addr_id}/default", json={"type": "shipping"}, headers=headers_b
    )
    assert hack_default.status_code in (403, 404)

    # 4. User B tries to DELETE User A's address -> Must fail (404/403)
    hack_delete = await client.delete(f"/api/v1/customers/addresses/{addr_id}", headers=headers_b)
    assert hack_delete.status_code in (403, 404)

    # 5. User A can still view and modify their own address
    owner_update = await client.put(
        f"/api/v1/customers/addresses/{addr_id}", json={"address_line1": "Updated Residence A"}, headers=headers_a
    )
    assert owner_update.status_code == 200
    assert owner_update.json()["data"]["address_line1"] == "Updated Residence A"


@pytest.mark.asyncio
async def test_customer_wishlist_idor_prevention(client: AsyncClient, two_customers_setup):
    """Verify that User B cannot modify or delete User A's wishlist items."""
    d = two_customers_setup
    headers_a = {"Authorization": f"Bearer {d['tokens_a'].access_token}"}
    headers_b = {"Authorization": f"Bearer {d['tokens_b'].access_token}"}

    # 1. User A adds product to wishlist
    add_res = await client.post(
        "/api/v1/customers/wishlist",
        json={"product_id": str(d["product"].id), "notes": "Alice personal note"},
        headers=headers_a,
    )
    assert add_res.status_code == 200
    item_id = add_res.json()["data"]["id"]

    # 2. User B tries to update User A's wishlist item notes -> Must fail (404)
    hack_update = await client.put(
        f"/api/v1/customers/wishlist/items/{item_id}", json={"notes": "Bob tampered note"}, headers=headers_b
    )
    assert hack_update.status_code == 404

    # 3. User B tries to delete User A's wishlist item -> Must fail (404)
    hack_delete = await client.delete(f"/api/v1/customers/wishlist/items/{item_id}", headers=headers_b)
    assert hack_delete.status_code == 404

    # 4. User A can update their own item
    owner_update = await client.put(
        f"/api/v1/customers/wishlist/items/{item_id}", json={"notes": "Alice updated note"}, headers=headers_a
    )
    assert owner_update.status_code == 200
    assert owner_update.json()["data"]["notes"] == "Alice updated note"


@pytest.mark.asyncio
async def test_cart_share_and_saved_cart_idor_prevention(client: AsyncClient, two_customers_setup):
    """Verify cross-cart access controls in cart sharing and saved cart operations."""
    d = two_customers_setup
    headers_a = {"Authorization": f"Bearer {d['tokens_a'].access_token}"}
    headers_b = {"Authorization": f"Bearer {d['tokens_b'].access_token}"}

    cart_a_id = str(d["cart_a"].id)
    cart_b_id = str(d["cart_b"].id)

    # 1. Cart Share IDOR: User B tries to generate a share link for User A's cart -> Must fail (403)
    hack_share = await client.post(
        f"/api/v1/shopping/cart/share?cart_id={cart_a_id}", json={"expires_days": 3}, headers=headers_b
    )
    assert hack_share.status_code == 403

    # User A generates a share link -> Succeeded
    owner_share = await client.post(
        f"/api/v1/shopping/cart/share?cart_id={cart_a_id}", json={"expires_days": 3}, headers=headers_a
    )
    assert owner_share.status_code == 200
    share_token = owner_share.json()["data"]["share_token"]

    # Public user can read shared cart via share token
    public_get = await client.get(f"/api/v1/shopping/cart/share/{share_token}")
    assert public_get.status_code == 200
    assert public_get.json()["data"]["item_count"] == 1

    # 2. Saved Cart IDOR: User B attempts to save User A's cart as their own saved cart -> Must fail (403)
    hack_save = await client.post(
        f"/api/v1/shopping/cart/saved?source_cart_id={cart_a_id}",
        json={"name": "Bob stealing Alice cart"},
        headers=headers_b,
    )
    assert hack_save.status_code == 403

    # User A creates saved cart from their own cart -> Succeeded
    owner_save = await client.post(
        f"/api/v1/shopping/cart/saved?source_cart_id={cart_a_id}",
        json={"name": "Alice favorite setup"},
        headers=headers_a,
    )
    assert owner_save.status_code == 201
    saved_cart_id = owner_save.json()["data"]["id"]

    # User B attempts to read User A's saved cart -> Must fail (404)
    hack_read_saved = await client.get(f"/api/v1/shopping/cart/saved/{saved_cart_id}", headers=headers_b)
    assert hack_read_saved.status_code == 404

    # User B attempts to delete User A's saved cart -> Must fail (404)
    hack_del_saved = await client.delete(f"/api/v1/shopping/cart/saved/{saved_cart_id}", headers=headers_b)
    assert hack_del_saved.status_code == 404

    # User A attempts to restore their saved cart into User B's active cart -> Must fail (403)
    hack_restore_cross = await client.post(
        f"/api/v1/shopping/cart/saved/{saved_cart_id}/restore?target_cart_id={cart_b_id}&replace=true",
        headers=headers_a,
    )
    assert hack_restore_cross.status_code == 403


@pytest.mark.asyncio
async def test_shipping_authorization_and_idor_prevention(client: AsyncClient, two_customers_setup):
    """Verify that shipment details are owner/staff scoped and mock shipping requires admin role."""
    d = two_customers_setup
    headers_a = {"Authorization": f"Bearer {d['tokens_a'].access_token}"}
    headers_b = {"Authorization": f"Bearer {d['tokens_b'].access_token}"}
    headers_admin = {"Authorization": f"Bearer {d['tokens_admin'].access_token}"}
    order_a_id = str(d["order_a"].id)

    # 1. Non-admin customer User A or User B cannot call /shipping/ship-mock -> Must fail (403 Forbidden)
    cust_ship_attempt = await client.post(
        "/api/v1/shopping/shipping/ship-mock", json={"order_id": order_a_id, "carrier": "Speedaf"}, headers=headers_a
    )
    assert cust_ship_attempt.status_code == 403

    # 2. Admin can successfully ship mock order
    admin_ship = await client.post(
        "/api/v1/shopping/shipping/ship-mock",
        json={"order_id": order_a_id, "carrier": "Speedaf Express"},
        headers=headers_admin,
    )
    assert admin_ship.status_code == 200
    assert admin_ship.json()["carrier"] == "Speedaf Express"

    # 3. User B attempts to read shipment details for User A's order -> Must fail (403)
    hack_shipment_get = await client.get(f"/api/v1/shopping/shipping/order/{order_a_id}", headers=headers_b)
    assert hack_shipment_get.status_code == 403

    # 4. User A (Owner) can read shipment details for their own order
    owner_shipment_get = await client.get(f"/api/v1/shopping/shipping/order/{order_a_id}", headers=headers_a)
    assert owner_shipment_get.status_code == 200
    assert owner_shipment_get.json()["order_id"] == order_a_id

    # 5. Admin can read shipment details for any order
    admin_shipment_get = await client.get(f"/api/v1/shopping/shipping/order/{order_a_id}", headers=headers_admin)
    assert admin_shipment_get.status_code == 200
