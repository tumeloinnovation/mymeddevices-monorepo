import uuid

import pytest
from httpx import AsyncClient

from app.domains.auth.models.user import User
from app.domains.auth.services.auth_service import AuthService
from app.domains.catalog.models.product import Product
from app.domains.customers.models.customer_profile import CustomerProfile
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.fixture
async def customer_test_setup(db_session):
    auth_service = AuthService(db_session)

    # 1. Customer User
    customer_user = User(
        id=uuid.uuid4(),
        email="patient_jane@test.com",
        password_hash="test_hash",
        first_name="Jane",
        last_name="Doe",
        phone="+254712345678",
        role="customer",
        is_active=True,
    )
    db_session.add(customer_user)
    await db_session.flush()

    # 2. Customer Profile with loyalty points
    profile = CustomerProfile(
        id=uuid.uuid4(),
        user_id=customer_user.id,
        loyalty_points=1250,
        loyalty_tier="silver",
        marketing_enabled=True,
    )
    db_session.add(profile)

    # 3. Vendor and Product for Wishlist tests
    vendor_user = User(
        id=uuid.uuid4(),
        email="vendor_wish@test.com",
        password_hash="test_hash",
        role="vendor",
        is_active=True,
    )
    db_session.add(vendor_user)
    await db_session.flush()

    vendor = VendorProfile(
        id=uuid.uuid4(),
        user_id=vendor_user.id,
        store_name="Wishlist Vendor",
        approval_status="approved",
    )
    db_session.add(vendor)
    await db_session.flush()

    product = Product(
        id=uuid.uuid4(),
        vendor_id=vendor.id,
        name="Digital Pulse Oximeter",
        slug="digital-pulse-oximeter",
        price=3200.00,
        stock_quantity=50,
        status="published",
    )
    db_session.add(product)
    await db_session.commit()

    tokens = await auth_service.create_tokens(customer_user)

    return {
        "user": customer_user,
        "profile": profile,
        "product": product,
        "tokens": tokens,
    }


@pytest.mark.asyncio
async def test_customer_profile_and_preferences(client: AsyncClient, customer_test_setup):
    """Test customer profile retrieval and preferences update."""
    data = customer_test_setup
    headers = {"Authorization": f"Bearer {data['tokens'].access_token}"}

    # 1. Get profile
    res = await client.get("/api/v1/customers/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["data"]["email"] == "patient_jane@test.com"
    assert res.json()["data"]["loyalty_tier"] == "silver"
    assert res.json()["data"]["loyalty_points"] == 1250

    # 2. Update profile preferences
    update_res = await client.put(
        "/api/v1/customers/me",
        json={
            "first_name": "Janet",
            "email_order_updates": True,
            "sms_order_updates": True,
            "theme": "dark",
        },
        headers=headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["first_name"] == "Janet"
    assert update_res.json()["data"]["email_order_updates"] is True


@pytest.mark.asyncio
async def test_customer_address_lifecycle(client: AsyncClient, customer_test_setup):
    """Test creating, setting default, and listing customer addresses."""
    data = customer_test_setup
    headers = {"Authorization": f"Bearer {data['tokens'].access_token}"}

    # 1. Create primary delivery address
    # 1. Create primary delivery address
    addr_res = await client.post(
        "/api/v1/customers/addresses",
        json={
            "first_name": "Janet",
            "last_name": "Doe",
            "phone": "+254712345678",
            "address_line1": "Westlands Commercial Centre, Block B",
            "city": "Nairobi",
            "state": "Nairobi County",
            "postal_code": "00100",
            "country": "Kenya",
            "type": "shipping",
            "is_default": True,
        },
        headers=headers,
    )
    assert addr_res.status_code == 200
    addr_id = addr_res.json()["data"]["id"]

    # 2. Query default shipping address
    ship_res = await client.get("/api/v1/customers/addresses/default/shipping", headers=headers)
    assert ship_res.status_code == 200
    assert ship_res.json()["data"]["id"] == addr_id
    assert ship_res.json()["data"]["city"] == "Nairobi"

    # 3. List addresses
    list_res = await client.get("/api/v1/customers/addresses", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) >= 1


@pytest.mark.asyncio
async def test_customer_wishlist_workflow(client: AsyncClient, customer_test_setup):
    """Test customer wishlist addition and retrieval."""
    data = customer_test_setup
    headers = {"Authorization": f"Bearer {data['tokens'].access_token}"}

    # 1. Add item to wishlist
    add_res = await client.post(
        "/api/v1/customers/wishlist",
        json={
            "product_id": str(data["product"].id),
            "notes": "Required for home health clinic setup",
        },
        headers=headers,
    )
    assert add_res.status_code == 200
    item_id = add_res.json()["data"]["id"]

    # 2. Get wishlist
    wish_res = await client.get("/api/v1/customers/wishlist", headers=headers)
    assert wish_res.status_code == 200
    assert len(wish_res.json()["data"]) >= 1
    assert wish_res.json()["data"][0]["notes"] == "Required for home health clinic setup"

    # 3. Delete wishlist item
    del_res = await client.delete(f"/api/v1/customers/wishlist/items/{item_id}", headers=headers)
    assert del_res.status_code == 200
