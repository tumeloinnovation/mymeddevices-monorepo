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
from app.domains.admin.services import SystemSettingService

@pytest.fixture
async def logistics_customer(db: AsyncSession) -> User:
    email = f"logistics_cust_{uuid.uuid4().hex[:6]}@example.com"
    user = User(
        email=email,
        password_hash=get_password_hash("Test123!"),
        role="customer",
        first_name="Logistics",
        last_name="Customer",
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@pytest.fixture
async def logistics_customer_token(logistics_customer: User) -> str:
    return create_access_token({"sub": str(logistics_customer.id)})

@pytest.fixture
async def logistics_driver(db: AsyncSession) -> User:
    email = f"driver_{uuid.uuid4().hex[:6]}@example.com"
    user = User(
        email=email,
        password_hash=get_password_hash("Test123!"),
        role="driver",
        first_name="John",
        last_name="Rider",
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@pytest.fixture
async def logistics_vendor(db: AsyncSession) -> User:
    email = f"logistics_vend_{uuid.uuid4().hex[:6]}@example.com"
    user = User(
        email=email,
        password_hash=get_password_hash("Test123!"),
        role="vendor",
        first_name="Logistics",
        last_name="Vendor",
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    # Store at Kilimani, Nairobi: -1.2921, 36.7915 (approx. 1.4 km from Office)
    profile = VendorProfile(
        user_id=user.id,
        store_name=f"GeoStore_{uuid.uuid4().hex[:6]}",
        approval_status="approved",
        address_street="Kilimani, Nairobi",
        latitude=-1.2921,
        longitude=36.7915,
        place_id="ChIJN1t_5UYdLxgRdc46wcl9h88"
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return user

@pytest.fixture
async def logistics_category(db: AsyncSession) -> Category:
    slug = f"cat-log_{uuid.uuid4().hex[:6]}"
    category = Category(
        name="Logistics Category",
        slug=slug,
        is_active=True
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

@pytest.fixture
async def logistics_product(db: AsyncSession, logistics_vendor: User, logistics_category: Category) -> Product:
    stmt = select(VendorProfile).where(VendorProfile.user_id == logistics_vendor.id)
    result = await db.execute(stmt)
    profile = result.scalar_one()
    
    slug = f"prod-log_{uuid.uuid4().hex[:6]}"
    product = Product(
        vendor_id=profile.id,
        category_id=logistics_category.id,
        name="Logistics Product",
        slug=slug,
        sku=f"SKU-LOG-{uuid.uuid4().hex[:6]}",
        base_price=100.0,
        price=105.0,
        status="published",
        stock_quantity=10,
        short_description="A logistics test product",
        description="Detailed logistics test product description"
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product

@pytest.mark.asyncio
async def test_distance_based_shipping_calculations(
    client: AsyncClient,
    logistics_customer_token: str,
    logistics_product: Product,
    logistics_driver: User,
    db: AsyncSession
):
    headers = {"Authorization": f"Bearer {logistics_customer_token}"}
    
    # 1. Update shipping settings in db to custom values
    await SystemSettingService.set_setting(
        db,
        "shipping_settings",
        {
            "flat_fee": 150.0,
            "rate_per_km": 10.0,
            "max_radius_km": 50.0,
            "courier_fee": 500.0
        }
    )
    
    # Get Cart
    response = await client.get("/api/v1/shopping/cart/my", headers=headers)
    assert response.status_code == 200
    cart_id = response.json()["data"]["id"]
    
    # Add Item
    add_resp = await client.post(
        "/api/v1/shopping/cart/items",
        json={"product_id": str(logistics_product.id), "quantity": 1},
        headers=headers
    )
    assert add_resp.status_code == 200

    # Test Case A: Customer is within Nairobi surroundings (e.g. Westlands: -1.2638, 36.8024)
    # Distance from office to Westlands is ~4.1 km. Vendor (Kilimani) to Westlands is ~3.3 km.
    # Total route: Office -> Vendor -> Westlands is approx. 1.4 km + 3.3 km = 4.7 km.
    # Shipping cost: 150.0 + (4.7 * 10) = ~197.0
    totals_local_resp = await client.get(
        f"/api/v1/shopping/cart/totals?cart_id={cart_id}&lat=-1.2638&lon=36.8024",
        headers=headers
    )
    assert totals_local_resp.status_code == 200
    totals_local = totals_local_resp.json()["data"]
    assert totals_local["logistics_type"] == "company_rider"
    assert totals_local["calculated_distance_km"] > 0.0
    assert totals_local["shipping_amount"] > 150.0

    # Test Case B: Customer is outside Nairobi (e.g. Mombasa: -4.0435, 39.6682)
    # Distance is > 50km
    totals_far_resp = await client.get(
        f"/api/v1/shopping/cart/totals?cart_id={cart_id}&lat=-4.0435&lon=39.6682",
        headers=headers
    )
    assert totals_far_resp.status_code == 200
    totals_far = totals_far_resp.json()["data"]
    assert totals_far["logistics_type"] == "courier"
    assert totals_far["shipping_amount"] == 500.0 # Flat courier fee

    # Checkout within Nairobi
    checkout_payload = {
        "cart_id": cart_id,
        "shipping_address": {
            "full_name": "Nairobi Cust",
            "address_line1": "Westlands, Nairobi",
            "city": "Nairobi",
            "country": "Kenya",
            "latitude": -1.2638,
            "longitude": 36.8024,
            "phone": "+254700000000"
        },
        "notes": "Testing logistics routing."
    }
    checkout_resp = await client.post(
        "/api/v1/shopping/checkout",
        json=checkout_payload,
        headers=headers
    )
    assert checkout_resp.status_code == 201
    order_data = checkout_resp.json()["data"]
    
    # Verify order number generated sequentially (should be >= 100001)
    assert order_data["order_number"] is not None
    assert order_data["order_number"] >= 100001
    
    # Verify driver was auto-assigned
    assert order_data["shipping_address"]["assigned_driver_id"] == str(logistics_driver.id)
    assert order_data["shipping_address"]["logistics_type"] == "company_rider"
    assert len(order_data["shipping_address"]["route_coordinates"]) >= 3
