import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.domains.auth.models.user import User
from app.domains.catalog.models.product import Product
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.mark.asyncio
async def test_full_checkout_workflow_success(client: AsyncClient, db_session: AsyncSession):
    """Test full e2e checkout workflow: create cart, add item, convert to order."""
    # 1. Setup vendor user and vendor profile in DB
    vendor_user = User(
        id=uuid.uuid4(),
        email="vendor@mymeddevices.co.ke",
        password_hash=get_password_hash("VendorPass123!"),
        role="vendor",
        is_active=True,
        is_verified=True,
    )
    vendor_profile = VendorProfile(
        id=uuid.uuid4(), user_id=vendor_user.id, store_name="Nairobi Med Supplies", approval_status="approved"
    )
    # 2. Setup active product
    product = Product(
        id=uuid.uuid4(),
        vendor_id=vendor_profile.id,
        name="Stethoscope Pro",
        slug="stethoscope-pro",
        price=2500.00,
        base_price=2000.00,
        stock_quantity=50,
        stock_status="instock",
        status="published",
        is_deleted=False,
    )
    db_session.add_all([vendor_user, vendor_profile, product])
    await db_session.commit()

    # 3. Create/Get Cart
    cart_res = await client.get("/api/v1/shopping/cart/my")
    assert cart_res.status_code == 200
    cart_data = cart_res.json()["data"]
    cart_id = cart_data["id"]
    cart_token = cart_data.get("cart_token")

    # 4. Add product to cart
    item_payload = {"product_id": str(product.id), "quantity": 2}
    url = f"/api/v1/shopping/cart/items?cart_token={cart_token}" if cart_token else "/api/v1/shopping/cart/items"
    add_res = await client.post(url, json=item_payload)
    assert add_res.status_code == 200

    # 5. Execute checkout
    checkout_payload = {
        "cart_id": cart_id,
        "guest_token": cart_token,
        "shipping_address": {
            "recipient_name": "Dr. John Kimani",
            "phone": "+254712345678",
            "city": "Nairobi",
            "street": "Kenyatta Avenue",
            "country": "KE",
        },
        "notes": "Deliver during office hours",
    }
    checkout_res = await client.post("/api/v1/shopping/checkout", json=checkout_payload)
    assert checkout_res.status_code == 201
    order_data = checkout_res.json()["data"]
    assert "id" in order_data
    assert order_data["status"] == "pending"
    assert order_data["total_amount"] > 0


@pytest.mark.asyncio
async def test_checkout_empty_cart_fails(client: AsyncClient):
    """Test checking out an empty cart returns 400 Bad Request."""
    cart_res = await client.get("/api/v1/shopping/cart/my")
    cart_id = cart_res.json()["data"]["id"]

    checkout_payload = {
        "cart_id": cart_id,
        "shipping_address": {
            "recipient_name": "Test User",
            "phone": "+254700000000",
            "city": "Nairobi",
            "street": "Moi Avenue",
        },
    }
    checkout_res = await client.post("/api/v1/shopping/checkout", json=checkout_payload)
    assert checkout_res.status_code == 400


@pytest.mark.asyncio
async def test_checkout_nonexistent_cart_fails(client: AsyncClient):
    """Test checking out a non-existent cart UUID returns 404."""
    random_cart_id = str(uuid.uuid4())
    checkout_payload = {
        "cart_id": random_cart_id,
        "shipping_address": {
            "recipient_name": "Test User",
            "phone": "+254700000000",
            "city": "Nairobi",
            "street": "Moi Avenue",
        },
    }
    checkout_res = await client.post("/api/v1/shopping/checkout", json=checkout_payload)
    assert checkout_res.status_code == 404
