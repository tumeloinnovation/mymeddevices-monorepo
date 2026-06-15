import pytest
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.domains.shopping.services.cart_share_service import CartShareService
from app.domains.shopping.models.cart import Cart

@pytest.mark.asyncio
async def test_create_share_success(db: AsyncSession):
    # Setup: Create a cart
    cart = Cart(cart_type="persistent", is_active=True)
    db.add(cart)
    await db.commit()
    await db.refresh(cart)
    
    service = CartShareService(db)
    share = await service.create_share(cart.id, expires_days=7)
    
    assert share.share_token is not None
    assert len(share.share_token) == 32
    assert share.cart_id == cart.id
