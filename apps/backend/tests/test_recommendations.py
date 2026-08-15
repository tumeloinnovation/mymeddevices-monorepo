import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_trending_recommendations(client: AsyncClient):
    """Test get trending recommendations endpoint."""
    response = await client.get("/api/v1/recommendations/trending?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert isinstance(data["data"], list)
