import pytest
import uuid
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from app.domains.shopping.models.cart import Cart
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
async def test_merge_carts_response_schema(client: AsyncClient, customer_token: str, db: AsyncSession):
    # Setup: Create a guest cart
    guest_cart = Cart(cart_token="test-token", cart_type="guest", is_active=True)
    db.add(guest_cart)
    await db.commit()
    
    headers = {"Authorization": f"Bearer {customer_token}"}
    payload = {"guest_cart_token": "test-token", "merge_method": "merge"}
    
    response = await client.post("/api/v1/shopping/cart/merge", json=payload, headers=headers)
    
    assert response.status_code == 200
    data = response.json()["data"]
    # Verify merge_log_id is present in the response
    assert "merge_log_id" in data
