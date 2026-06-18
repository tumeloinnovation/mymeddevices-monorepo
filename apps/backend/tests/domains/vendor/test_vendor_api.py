import pytest
from httpx import AsyncClient
import uuid
from app.main import app
from app.core.security import get_password_hash

async def get_token_headers(client: AsyncClient, email: str, password: str) -> dict:
    login_data = {
        "email": email,
        "password": password,
        "device_id": "test_device",
        "device_name": "Test Runner"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    token = response.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
async def vendor_user(db):
    from app.domains.auth.models.user import User
    from app.domains.vendor.models.vendor_profile import VendorProfile
    
    email = f"vendor_{uuid.uuid4().hex[:6]}@example.com"
    user = User(
        email=email,
        password_hash=get_password_hash("Test123!"),
        role="vendor",
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    profile = VendorProfile(
        user_id=user.id,
        store_name="Test Store",
        address_country="KE",
        approval_status="approved"
    )
    db.add(profile)
    await db.commit()
    return user

@pytest.fixture
async def admin_user(db):
    from app.domains.auth.models.user import User
    email = f"admin_{uuid.uuid4().hex[:6]}@example.com"
    user = User(
        email=email,
        password_hash=get_password_hash("Test123!"),
        role="admin",
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@pytest.fixture
async def customer_user(db):
    from app.domains.auth.models.user import User
    email = f"customer_{uuid.uuid4().hex[:6]}@example.com"
    user = User(
        email=email,
        password_hash=get_password_hash("Test123!"),
        role="customer",
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@pytest.mark.asyncio
async def test_vendor_status_unauthorized(client: AsyncClient):
    response = await client.get("/api/v1/vendors/me/status")
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_vendor_status_authorized_as_customer(client: AsyncClient, customer_user):
    headers = await get_token_headers(client, customer_user.email, "Test123!")
    response = await client.get("/api/v1/vendors/me/status", headers=headers)
    assert response.status_code == 403

@pytest.mark.asyncio
async def test_vendor_status_authorized_as_vendor(client: AsyncClient, vendor_user):
    headers = await get_token_headers(client, vendor_user.email, "Test123!")
    response = await client.get("/api/v1/vendors/me/status", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "approval_status" in data["data"]

@pytest.mark.asyncio
async def test_admin_list_vendors(client: AsyncClient, admin_user):
    headers = await get_token_headers(client, admin_user.email, "Test123!")
    # Search for "all" vendors
    response = await client.get("/api/v1/vendors/admin/list", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "vendors" in data["data"]

@pytest.mark.asyncio
async def test_admin_list_vendors_with_filter(client: AsyncClient, admin_user):
    headers = await get_token_headers(client, admin_user.email, "Test123!")
    # Test with the newly aligned "status" query param
    response = await client.get("/api/v1/vendors/admin/list?status=pending", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "vendors" in data["data"]

@pytest.mark.asyncio
async def test_admin_vendor_actions(client: AsyncClient, admin_user, vendor_user):
    headers = await get_token_headers(client, admin_user.email, "Test123!")
    vendor_id = str(vendor_user.id)
    
    # Test Suspend
    response = await client.post(
        f"/api/v1/vendors/admin/{vendor_id}/suspend",
        headers=headers,
        json={"action": "suspend", "reason": "Test suspension"}
    )
    assert response.status_code == 200
    assert response.json()["data"]["approval_status"] == "suspended"
    
    # Test Reactivate (Approve)
    response = await client.post(
        f"/api/v1/vendors/admin/{vendor_id}/reactivate",
        headers=headers
    )
    assert response.status_code == 200
    assert response.json()["data"]["approval_status"] == "approved"
