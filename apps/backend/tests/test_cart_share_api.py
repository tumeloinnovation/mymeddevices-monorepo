import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.domains.auth.models.user import User
from app.core.security import get_password_hash, create_access_token

@pytest.fixture
async def customer_user(db: AsyncSession) -> User:
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

@pytest.mark.asyncio
async def test_share_cart_api_flow(client: AsyncClient, customer_token: str):
    # 1. Create/Get a cart first
    headers = {"Authorization": f"Bearer {customer_token}"}
    cart_resp = await client.get("/api/v1/shopping/cart/my", headers=headers)
    assert cart_resp.status_code == 200
    cart_id = cart_resp.json()["data"]["id"]
    
    # 2. Share the cart
    share_resp = await client.post(
        f"/api/v1/shopping/cart/share?cart_id={cart_id}", 
        json={"expires_days": 5}, 
        headers=headers
    )
    # Expected to fail (404) until router is registered
    assert share_resp.status_code == 200
    token = share_resp.json()["data"]["share_token"]
    assert token is not None
    
    # 3. Retrieve via public link (no auth)
    public_resp = await client.get(f"/api/v1/shopping/cart/share/{token}")
    assert public_resp.status_code == 200
    data = public_resp.json()["data"]
    assert "items" in data
    assert data["cart_id"] == cart_id
