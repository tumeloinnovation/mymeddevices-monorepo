import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_get_devices(client: AsyncClient, vendor_token: str):
    # This assumes vendor_token provides a valid user
    headers = {"Authorization": f"Bearer {vendor_token}"}
    response = await client.get("/api/v1/auth/devices", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert isinstance(data["data"], list)

@pytest.mark.asyncio
async def test_delete_device(client: AsyncClient, vendor_token: str):
    headers = {"Authorization": f"Bearer {vendor_token}"}
    # Get devices first
    response = await client.get("/api/v1/auth/devices", headers=headers)
    devices = response.json()["data"]
    
    if len(devices) > 0:
        device_id = devices[0]["id"]
        # Delete device
        response = await client.delete(f"/api/v1/auth/devices/{device_id}", headers=headers)
        assert response.status_code == 200
        assert response.json()["success"] == True
