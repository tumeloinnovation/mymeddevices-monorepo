import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domains.auth.models.user import User
from app.domains.vendor.models.vendor_profile import VendorProfile
from app.domains.catalog.models.category import Category
from app.domains.catalog.models.product import Product
from app.core.security import get_password_hash

@pytest.fixture
async def seed_customer(db: AsyncSession) -> User:
    # Check if user already exists
    email = "customer@mymeddevices.com"
    stmt = select(User).where(User.email == email)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    if existing_user:
        return existing_user

    user = User(
        email=email,
        password_hash=get_password_hash("password123"),
        role="customer",
        first_name="Jane",
        last_name="Doe",
        phone="+254722222222",
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@pytest.fixture
async def sample_category(db: AsyncSession) -> Category:
    slug = f"cat-{uuid.uuid4().hex[:6]}"
    category = Category(
        name="Diagnostic Equipment",
        slug=slug,
        is_active=True
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

@pytest.fixture
async def published_product(db: AsyncSession, vendor_user: User, sample_category: Category) -> Product:
    stmt = select(VendorProfile).where(VendorProfile.user_id == vendor_user.id)
    result = await db.execute(stmt)
    profile = result.scalar_one()
    
    slug = f"prod-{uuid.uuid4().hex[:6]}"
    product = Product(
        vendor_id=profile.id,
        category_id=sample_category.id,
        name="Digital Blood Pressure Monitor",
        slug=slug,
        sku=f"SKU-{uuid.uuid4().hex[:6]}",
        base_price=1000.0,
        price=1050.0,
        status="published",
        stock_quantity=10,
        short_description="A test blood pressure monitor",
        description="Detailed test blood pressure monitor description"
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product

@pytest.mark.asyncio
async def test_seed_customer_flow(
    client: AsyncClient,
    seed_customer: User,
    published_product: Product,
    db: AsyncSession
):
    # 1. Login with seed credentials
    login_payload = {
        "email": "customer@mymeddevices.com",
        "password": "password123",
        "device_id": "test-device-id",
        "device_name": "Test Client Device"
    }
    
    login_resp = await client.post("/auth/login", json=login_payload)
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    login_data = login_resp.json()["data"]
    access_token = login_data["access_token"]
    assert access_token is not None
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # 2. Add product to cart
    add_payload = {
        "product_id": str(published_product.id),
        "quantity": 1
    }
    add_resp = await client.post("/shopping/cart/items", json=add_payload, headers=headers)
    assert add_resp.status_code == 200, f"Add to cart failed: {add_resp.text}"
    
    cart_data = add_resp.json()["data"]
    print("POST /items response data:", cart_data)
    cart_id = cart_data["id"]
    
    # 3. View cart
    view_cart_resp = await client.get("/shopping/cart/my", headers=headers)
    assert view_cart_resp.status_code == 200, f"View cart failed: {view_cart_resp.text}"
    view_cart_data = view_cart_resp.json()["data"]
    print("GET /cart/my response data:", view_cart_data)
    assert view_cart_data["id"] == cart_id
    cart_items = view_cart_data["items"]
    assert len(cart_items) == 1
    assert cart_items[0]["product_id"] == str(published_product.id)
    
    # 4. View checkout (totals)
    checkout_totals_resp = await client.get(f"/shopping/cart/totals?cart_id={cart_id}", headers=headers)
    assert checkout_totals_resp.status_code == 200, f"View checkout totals failed: {checkout_totals_resp.text}"
    totals = checkout_totals_resp.json()["data"]
    assert totals["subtotal"] == 1050.0
    
    # 5. Place order
    checkout_payload = {
        "cart_id": cart_id,
        "shipping_address": {
            "full_name": "Jane Doe",
            "address_line1": "100 Ngong Road",
            "city": "Nairobi",
            "country": "Kenya"
        },
        "notes": "Fast shipping please"
    }
    checkout_resp = await client.post("/shopping/checkout", json=checkout_payload, headers=headers)
    assert checkout_resp.status_code == 201, f"Checkout failed: {checkout_resp.text}"
    order_data = checkout_resp.json()["data"]
    order_id = order_data["id"]
    
    # 6. View order history
    orders_resp = await client.get("/shopping/orders", headers=headers)
    assert orders_resp.status_code == 200, f"View orders failed: {orders_resp.text}"
    orders_data = orders_resp.json()["data"]
    orders = orders_data.get("orders", orders_data) if isinstance(orders_data, dict) else orders_data
    assert any(o["id"] == order_id for o in orders)
