import secrets
import uuid
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import AuthorizationError, NotFoundError
from app.domains.shopping.models.cart import Cart, CartItem
from app.domains.shopping.models.cart_share import CartShare


class CartShareService:
    def __init__(self, db: AsyncSession):
        self.db = db

    @asynccontextmanager
    async def _transaction(self):
        """Use begin_nested (SAVEPOINT) when already in a transaction."""
        if self.db.in_transaction():
            async with self.db.begin_nested():
                yield
        else:
            async with self.db.begin():
                yield

    async def create_share(
        self, cart_id: uuid.UUID, user_id: uuid.UUID | None = None, expires_days: int = 7
    ) -> CartShare:
        cart_stmt = select(Cart).where(Cart.id == cart_id)
        cart_res = await self.db.execute(cart_stmt)
        cart = cart_res.scalar_one_or_none()
        if not cart:
            raise NotFoundError("Cart", str(cart_id))

        if cart.user_id:
            if not user_id or cart.user_id != user_id:
                raise AuthorizationError("You do not have permission to share this cart")

        share = CartShare(
            id=uuid.uuid4(),
            cart_id=cart_id,
            share_token=secrets.token_hex(16),
            expires_at=datetime.now(UTC) + timedelta(days=expires_days),
            created_by_user_id=user_id,
        )
        # Use transaction for atomic share creation
        async with self._transaction():
            self.db.add(share)
            await self.db.flush()

        # Reload and return
        stmt = select(CartShare).where(CartShare.id == share.id)
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def get_shared_cart(self, token: str) -> Cart | None:
        stmt = (
            select(CartShare)
            .where(CartShare.share_token == token)
            .options(selectinload(CartShare.cart).selectinload(Cart.items).selectinload(CartItem.product))
        )
        result = await self.db.execute(stmt)
        share = result.scalar_one_or_none()

        if not share:
            return None

        if share.expires_at:
            now = datetime.now(UTC)
            expires_at = share.expires_at if share.expires_at.tzinfo else share.expires_at.replace(tzinfo=UTC)
            if expires_at < now:
                return None

        # Use transaction for atomic access count update
        async with self._transaction():
            share.access_count += 1

        return share.cart
