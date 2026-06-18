import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domains.auth.models.user import User
from app.domains.vendor.models.vendor_profile import VendorProfile
from app.domains.catalog.models.category import Category
from app.domains.catalog.models.product import Product
from app.domains.shopping.models.order import Order, OrderStatus
from app.core.security import get_password_hash, create_access_token

@pytest.fixture
async def sample_category(db: AsyncSession) -> Category:
    slug = f"cat-{uuid.uuid4().hex[:6]}"
    category = Category(
        name="Test Category",
        slug=slug,
        is_active=True
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

async def create_vendor_with_product(db: AsyncSession, category: Category, name: str, price: float) -> tuple[User, Product]:
    email = f"vendor_{uuid.uuid4().hex[:6]}@example.com"
    user = User(
        email=email,
        password_hash=get_password_hash("Test123!"),
        role="vendor",
        first_name=f"Vendor",
        last_name=name,
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    profile = VendorProfile(
        user_id=user.id,
        store_name=f"Store {name}",
        approval_status="approved"
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    
    slug = f"prod-{uuid.uuid4().hex[:6]}"
    product = Product(
        vendor_id=profile.id,
        category_id=category.id,
        name=f"Product from {name}",
        slug=slug,
        sku=f"SKU-{uuid.uuid4().hex[:6]}",
        base_price=price,
        price=price * 1.05,
        status="published",
        stock_quantity=100
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return user, product

@pytest.fixture
async def admin_token() -> str:
    # Create a dummy admin user if needed or just a token with admin role
    # In many systems we'd need to actually create the user in DB
    return create_access_token({"sub": str(uuid.uuid4()), "role": "admin"})

@pytest.mark.asyncio
async def test_order_audit_workflow(client: AsyncClient, db: AsyncSession, sample_category: Category):
    # 1. Setup Vendors and Products
    vendor_a_user, product_a = await create_vendor_with_product(db, sample_category, "A", 1000.0)
    vendor_b_user, product_b = await create_vendor_with_product(db, sample_category, "B", 2000.0)

    # Create an admin user for status updates
    admin_email = f"admin_{uuid.uuid4().hex[:6]}@example.com"
    admin_user = User(
        email=admin_email,
        password_hash=get_password_hash("Admin123!"),
        role="admin",
        is_active=True
    )
    db.add(admin_user)
    await db.commit()
    admin_token = create_access_token({"sub": str(admin_user.id), "role": "admin"})
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Customer Registration
    customer_email = f"customer_{uuid.uuid4().hex[:6]}@example.com"
    reg_payload = {
        "email": customer_email,
        "password": "TestPassword123!",
        "role": "customer",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+254712345678"
    }
    reg_resp = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 200
    
    # 3. Login
    login_payload = {
        "email": customer_email,
        "password": "TestPassword123!",
        "device_id": "test-device",
        "device_name": "Test Browser"
    }
    login_resp = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_resp.status_code == 200
    token = login_resp.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 4. Shopping Session 1: One vendor, one time
    # Get/Create Cart
    cart_resp = await client.get("/api/v1/shopping/cart/my", headers=headers)
    assert cart_resp.status_code == 200
    cart_id = cart_resp.json()["data"]["id"]

    # Add Product A
    add_item_payload = {"product_id": str(product_a.id), "quantity": 1}
    add_resp = await client.post("/api/v1/shopping/cart/items", json=add_item_payload, headers=headers)
    assert add_resp.status_code == 200

    # Checkout
    checkout_payload = {
        "cart_id": cart_id,
        "shipping_address": {
            "full_name": "John Doe",
            "address_line1": "123 Main St",
            "city": "Nairobi",
            "country": "Kenya"
        },
        "notes": "First order"
    }
    checkout_resp = await client.post("/api/v1/shopping/checkout", json=checkout_payload, headers=headers)
    assert checkout_resp.status_code == 201
    order_id = checkout_resp.json()["data"]["id"]
    
    # Verify Order Status Transitions: PENDING -> PAID -> PROCESSING
    assert checkout_resp.json()["data"]["status"] == "pending"
    
    # Paid (using Admin API)
    paid_resp = await client.patch(
        f"/api/v1/admin/shopping/orders/{order_id}/status", 
        json={"status": "paid"}, 
        headers=admin_headers
    )
    assert paid_resp.status_code == 200
    assert paid_resp.json()["data"]["status"] == "paid"

    # Processing (using Admin API)
    proc_resp = await client.patch(
        f"/api/v1/admin/shopping/orders/{order_id}/status", 
        json={"status": "processing"}, 
        headers=admin_headers
    )
    assert proc_resp.status_code == 200
    assert proc_resp.json()["data"]["status"] == "processing"

    # 5. Shopping Session 2: Products from 2 vendors
    # Get new cart
    cart_resp2 = await client.get("/api/v1/shopping/cart/my", headers=headers)
    assert cart_resp2.status_code == 200
    cart_id2 = cart_resp2.json()["data"]["id"]
    assert cart_id != cart_id2

    # Add Product A and Product B
    await client.post("/api/v1/shopping/cart/items", json={"product_id": str(product_a.id), "quantity": 1}, headers=headers)
    await client.post("/api/v1/shopping/cart/items", json={"product_id": str(product_b.id), "quantity": 2}, headers=headers)

    # Checkout
    checkout_resp2 = await client.post(
        "/api/v1/shopping/checkout", 
        json={
            "cart_id": cart_id2, 
            "shipping_address": {"city": "Mombasa"}, 
            "notes": "Multi-vendor order"
        }, 
        headers=headers
    )
    assert checkout_resp2.status_code == 201
    order2_data = checkout_resp2.json()["data"]
    assert len(order2_data["items"]) == 2
    vendor_ids = [item["vendor_id"] for item in order2_data["items"]]
    assert str(product_a.vendor_id) in vendor_ids
    assert str(product_b.vendor_id) in vendor_ids

    # 6. Guest Ordering (Truly Anonymous)
    # Get Guest Cart (Establish guest session)
    g_cart_resp = await client.get("/api/v1/shopping/cart/my")
    assert g_cart_resp.status_code == 200
    g_cart_data = g_cart_resp.json()["data"]
    g_cart_id = g_cart_data["id"]
    g_token = g_cart_data["cart_token"]
    assert g_token is not None

    # Add Product B to guest cart
    await client.post(
        f"/api/v1/shopping/cart/items?cart_token={g_token}", 
        json={"product_id": str(product_b.id), "quantity": 1}
    )

    # Checkout as Guest
    g_checkout_payload = {
        "cart_id": g_cart_id,
        "shipping_address": {
            "full_name": "Guest User",
            "city": "Nairobi"
        },
        "guest_token": g_token
    }
    g_checkout_resp = await client.post("/api/v1/shopping/checkout", json=g_checkout_payload)
    assert g_checkout_resp.status_code == 201
    g_order_data = g_checkout_resp.json()["data"]
    assert g_order_data["status"] == "pending"
    assert g_order_data["user_id"] is None
    assert g_order_data["guest_token"] == g_token
