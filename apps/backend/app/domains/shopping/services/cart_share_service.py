import uuid
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.domains.shopping.models.cart import Cart, CartItem
from app.domains.shopping.models.cart_share import CartShare

class CartShareService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_share(
        self, 
        cart_id: uuid.UUID, 
        user_id: Optional[uuid.UUID] = None, 
        expires_days: int = 7
    ) -> CartShare:
        share = CartShare(
            cart_id=cart_id,
            share_token=secrets.token_hex(16),
            expires_at=datetime.now(timezone.utc) + timedelta(days=expires_days),
            created_by_user_id=user_id
        )
        self.db.add(share)
        await self.db.commit()
        await self.db.refresh(share)
        return share

    async def get_shared_cart(self, token: str) -> Optional[Cart]:
        stmt = select(CartShare).where(CartShare.share_token == token).options(
            selectinload(CartShare.cart).selectinload(Cart.items).selectinload(CartItem.product)
        )
        result = await self.db.execute(stmt)
        share = result.scalar_one_or_none()
        
        if not share or (share.expires_at and share.expires_at < datetime.now(timezone.utc)):
            return None
            
        share.access_count += 1
        await self.db.commit()
        return share.cart
