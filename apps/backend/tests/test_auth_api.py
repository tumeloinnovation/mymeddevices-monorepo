import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_user_registration_success(client: AsyncClient):
    """Test successful user registration endpoint."""
    payload = {
        "email": "newcustomer@mymeddevices.co.ke",
        "password": "Password123!",
        "first_name": "Jane",
        "last_name": "Doe",
        "phone": "+254712345678",
        "role": "customer",
    }
    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert res_data["data"]["email"] == "newcustomer@mymeddevices.co.ke"
    assert "id" in res_data["data"]


@pytest.mark.asyncio
async def test_user_registration_duplicate_email(client: AsyncClient):
    """Test user registration with existing email returns 409 conflict."""
    payload = {
        "email": "duplicate@mymeddevices.co.ke",
        "password": "Password123!",
        "first_name": "First",
        "last_name": "User",
        "phone": "+254711111111",
        "role": "customer",
    }
    res1 = await client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 200

    res2 = await client.post("/api/v1/auth/register", json=payload)
    assert res2.status_code == 409


@pytest.mark.asyncio
async def test_user_login_success(client: AsyncClient):
    """Test successful login with registered credentials."""
    # Register user
    reg_payload = {
        "email": "loginuser@mymeddevices.co.ke",
        "password": "SecurePassword123!",
        "first_name": "Login",
        "last_name": "User",
        "phone": "+254722222222",
        "role": "customer",
    }
    reg_res = await client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_res.status_code == 200

    # Attempt login
    login_payload = {
        "email": "loginuser@mymeddevices.co.ke",
        "password": "SecurePassword123!",
        "device_id": "test-device-uuid-12345",
    }
    login_res = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 200
    data = login_res.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_user_login_invalid_password(client: AsyncClient):
    """Test login failure with wrong password returns 401."""
    reg_payload = {
        "email": "wrongpass@mymeddevices.co.ke",
        "password": "CorrectPassword123!",
        "first_name": "Test",
        "last_name": "User",
        "phone": "+254733333333",
        "role": "customer",
    }
    await client.post("/api/v1/auth/register", json=reg_payload)

    login_payload = {
        "email": "wrongpass@mymeddevices.co.ke",
        "password": "WrongPassword999!",
        "device_id": "test-device-uuid-99999",
    }
    login_res = await client.post("/api/v1/auth/login", json=login_payload)
    assert login_res.status_code == 401


@pytest.mark.asyncio
async def test_guest_login_success(client: AsyncClient):
    """Test guest login endpoint generates guest token."""
    guest_payload = {"device_id": "guest-device-unique-001"}
    response = await client.post("/api/v1/auth/guest", json=guest_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
