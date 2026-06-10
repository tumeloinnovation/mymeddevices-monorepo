import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    # 1. Register
    register_data = {
        "email": "test@example.com",
        "password": "password123",
        "first_name": "Test",
        "last_name": "User"
    }
    response = await client.post("/api/v1/auth/register", json=register_data)
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"
    
    # 2. Login
    login_data = {
        "email": "test@example.com",
        "password": "password123",
        "device_id": "test_device_001",
        "device_name": "Test Browser"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    login_data = {
        "email": "wrong@example.com",
        "password": "wrongpassword",
        "device_id": "test_device_001"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 401
