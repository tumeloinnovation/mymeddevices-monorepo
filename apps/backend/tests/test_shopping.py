import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domains.auth.models.user import User
from app.domains.vendor.models.vendor_profile import VendorProfile
from app.domains.catalog.models.category import Category
from app.domains.catalog.models.product import Product
from app.core.security import get_password_hash, create_access_token

@pytest.fixture
async def customer_user(db: AsyncSession) -> User:
    # Use a unique email to avoid conflicts with other tests
    email = f"customer_{uuid.uuid4().hex[:6]}@example.com"
    user = User(
        email=email,
        password_hash=get_password_hash("Test123!"),
        role="customer",
        first_name="Customer",
        last_name="One",
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@pytest.fixture
async def customer_token(customer_user: User) -> str:
    return create_access_token({"sub": str(customer_user.id)})

@pytest.fixture
async def vendor_user(db: AsyncSession) -> User:
    email = f"vendor_{uuid.uuid4().hex[:6]}@example.com"
    user = User(
        email=email,
        password_hash=get_password_hash("Test123!"),
        role="vendor",
        first_name="Vendor",
        last_name="Shop",
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    profile = VendorProfile(
        user_id=user.id,
        store_name=f"Store_{uuid.uuid4().hex[:6]}",
        approval_status="approved"
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return user

@pytest.fixture
async def sample_category(db: AsyncSession) -> Category:
    slug = f"cat-{uuid.uuid4().hex[:6]}"
    category = Category(
        name="Shopping Category",
        slug=slug,
        is_active=True
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

@pytest.fixture
async def published_product(db: AsyncSession, vendor_user: User, sample_category: Category) -> Product:
    # Get vendor profile id
    stmt = select(VendorProfile).where(VendorProfile.user_id == vendor_user.id)
    result = await db.execute(stmt)
    profile = result.scalar_one()
    
    slug = f"prod-{uuid.uuid4().hex[:6]}"
    product = Product(
        vendor_id=profile.id,
        category_id=sample_category.id,
        name="Test Product",
        slug=slug,
        sku=f"SKU-{uuid.uuid4().hex[:6]}",
        base_price=1000.0,
        price=1050.0, # 5% markup
        status="published",
        stock_quantity=10,
        short_description="A test product",
        description="Detailed test product description"
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product

@pytest.mark.asyncio
async def test_complete_shopping_experience(
    client: AsyncClient, 
    customer_token: str, 
    published_product: Product,
    db: AsyncSession
):
    headers = {"Authorization": f"Bearer {customer_token}"}
    
    # 1. Initialize Cart (Establish session/active cart)
    # The CartService.get_or_create_cart is called by the API
    response = await client.get("/api/v1/shopping/cart/my", headers=headers)
    assert response.status_code == 200
    cart_data = response.json()["data"]
    cart_id = cart_data["id"]
    assert cart_id is not None
    
    # 2. Add Item to Cart
    add_payload = {
        "product_id": str(published_product.id),
        "quantity": 2
    }
    add_resp = await client.post("/api/v1/shopping/cart/items", json=add_payload, headers=headers)
    assert add_resp.status_code == 200
    
    # 3. Validate Totals
    # totals endpoint expects cart_id as query param according to grep (wait, grep showed Query(...) for some)
    # let's re-verify cart_api.py totals endpoint
    totals_resp = await client.get(f"/api/v1/shopping/cart/totals?cart_id={cart_id}", headers=headers)
    assert totals_resp.status_code == 200
    totals = totals_resp.json()["data"]
    # 1050.0 * 2 = 2100.0
    assert totals["subtotal"] == 2100.0
    assert totals["total"] == 2100.0 # No tax/shipping for now
    
    # 4. Checkout (Convert Cart to Order)
    checkout_payload = {
        "cart_id": cart_id,
        "shipping_address": {
            "full_name": "Test Customer",
            "address_line1": "123 Medical Way",
            "city": "Nairobi",
            "country": "Kenya"
        },
        "notes": "Please deliver during business hours."
    }
    checkout_resp = await client.post("/api/v1/shopping/checkout", json=checkout_payload, headers=headers)
    assert checkout_resp.status_code == 201
    order_data = checkout_resp.json()["data"]
    order_id = order_data["id"]
    assert order_data["status"] == "pending"
    assert order_data["total_amount"] == 2500.0
    assert len(order_data["items"]) == 1
    assert order_data["items"][0]["product_id"] == str(published_product.id)
    
    # 5. Verify Order History
    orders_resp = await client.get("/api/v1/shopping/orders", headers=headers)
    assert orders_resp.status_code == 200
    orders_data = orders_resp.json()["data"]
    # Handle the new OrderListResponse schema which includes 'orders' and 'total'
    orders = orders_data.get("orders", orders_data) if isinstance(orders_data, dict) else orders_data
    assert any(o["id"] == order_id for o in orders)
    
    # 6. Verify Cart is now inactive/empty
    # After checkout, the cart should be marked is_active=False
    # Calling /cart/my should now return a new empty cart or at least not the old items
    cart_after_resp = await client.get("/api/v1/shopping/cart/my", headers=headers)
    assert cart_after_resp.status_code == 200
    cart_after_data = cart_after_resp.json()["data"]
    assert cart_after_data["id"] != cart_id
    assert len(cart_after_data.get("items", [])) == 0
