import uuid
from contextlib import asynccontextmanager

from sqlalchemy import and_, delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import result_rowcount
from app.core.exceptions import AuthorizationError, NotFoundError
from app.domains.shopping.models.cart import Cart, CartItem
from app.domains.shopping.models.saved_cart import SavedCart, SavedCartItem


class SavedCartService:
    """Service for saved cart operations."""

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

    async def create_saved_cart(
        self, user_id: uuid.UUID, name: str, description: str | None = None, source_cart_id: uuid.UUID | None = None
    ) -> SavedCart:
        """Create a new saved cart."""
        if source_cart_id:
            cart_stmt = select(Cart).where(Cart.id == source_cart_id)
            cart_res = await self.db.execute(cart_stmt)
            source_cart = cart_res.scalar_one_or_none()
            if not source_cart:
                raise NotFoundError("Cart", str(source_cart_id))
            if source_cart.user_id and source_cart.user_id != user_id:
                raise AuthorizationError("You do not have permission to save items from this cart")

        # Use transaction for atomic saved cart creation
        async with self._transaction():
            saved_cart = SavedCart(user_id=user_id, name=name, description=description)
            self.db.add(saved_cart)
            await self.db.flush()

            if source_cart_id:
                stmt = select(CartItem).where(CartItem.cart_id == source_cart_id)
                items_result = await self.db.execute(stmt)
                source_items = list(items_result.scalars().all())

                for item in source_items:
                    saved_item = SavedCartItem(
                        saved_cart_id=saved_cart.id,
                        product_id=item.product_id,
                        quantity=item.quantity,
                        notes=item.notes,
                    )
                    self.db.add(saved_item)

            saved_cart_id = saved_cart.id

        # Reload and return
        result = await self.get_by_id(saved_cart_id)
        if result is None:
            raise NotFoundError("SavedCart", str(saved_cart_id))
        return result

    async def get_by_id(self, saved_cart_id: uuid.UUID) -> SavedCart | None:
        """Get saved cart by ID with items."""
        stmt = (
            select(SavedCart)
            .where(SavedCart.id == saved_cart_id)
            .options(selectinload(SavedCart.items).selectinload(SavedCartItem.product))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_saved_carts(self, user_id: uuid.UUID, offset: int = 0, limit: int = 20) -> list[SavedCart]:
        """List user's saved carts."""
        stmt = (
            select(SavedCart)
            .where(SavedCart.user_id == user_id)
            .order_by(SavedCart.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def delete_saved_cart(self, saved_cart_id: uuid.UUID) -> bool:
        """Hard delete a saved cart (since we don't have soft delete mixin on it yet, or using it as needed)."""
        # Use transaction for atomic deletion
        async with self._transaction():
            stmt = delete(SavedCart).where(SavedCart.id == saved_cart_id)
            result = await self.db.execute(stmt)
        return result_rowcount(result) > 0

    async def restore_to_cart(self, saved_cart_id: uuid.UUID, target_cart_id: uuid.UUID, replace: bool = False) -> Cart:
        """Restore saved cart to active cart."""
        saved_cart = await self.get_by_id(saved_cart_id)
        if not saved_cart:
            raise NotFoundError("SavedCart", str(saved_cart_id))

        target_cart_stmt = select(Cart).where(Cart.id == target_cart_id)
        target_cart_res = await self.db.execute(target_cart_stmt)
        target_cart = target_cart_res.scalar_one_or_none()
        if not target_cart:
            raise NotFoundError("Cart", str(target_cart_id))
        if target_cart.user_id and target_cart.user_id != saved_cart.user_id:
            raise AuthorizationError("You do not have permission to restore items into this cart")

        # Use transaction for atomic restore
        async with self._transaction():
            # Clear target if replace
            if replace:
                await self.db.execute(delete(CartItem).where(CartItem.cart_id == target_cart_id))

            # Add items
            for item in saved_cart.items:
                # We can use CartService's add_item but here we'll do it directly for simplicity
                # or better, use the instance if available.
                existing_stmt = select(CartItem).where(
                    and_(CartItem.cart_id == target_cart_id, CartItem.product_id == item.product_id)
                )
                existing_result = await self.db.execute(existing_stmt)
                existing = existing_result.scalar_one_or_none()

                if existing:
                    existing.quantity += item.quantity
                else:
                    new_item = CartItem(
                        cart_id=target_cart_id, product_id=item.product_id, quantity=item.quantity, notes=item.notes
                    )
                    self.db.add(new_item)

        # Reload cart
        stmt = select(Cart).where(Cart.id == target_cart_id).options(selectinload(Cart.items))
        res = await self.db.execute(stmt)
        return res.scalar_one()
