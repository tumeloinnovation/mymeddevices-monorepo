import uuid
from typing import List, Optional
from sqlalchemy import select, and_, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domains.shopping.models.saved_cart import SavedCart, SavedCartItem
from app.domains.shopping.models.cart import Cart, CartItem


class SavedCartService:
    """Service for saved cart operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_saved_cart(
        self,
        user_id: uuid.UUID,
        name: str,
        description: Optional[str] = None,
        source_cart_id: Optional[uuid.UUID] = None
    ) -> SavedCart:
        """Create a new saved cart."""
        saved_cart = SavedCart(
            user_id=user_id,
            name=name,
            description=description
        )
        self.db.add(saved_cart)
        await self.db.flush()

        if source_cart_id:
            stmt = select(CartItem).where(CartItem.cart_id == source_cart_id)
            result = await self.db.execute(stmt)
            source_items = list(result.scalars().all())

            for item in source_items:
                saved_item = SavedCartItem(
                    saved_cart_id=saved_cart.id,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    notes=item.notes
                )
                self.db.add(saved_item)

        await self.db.commit()
        await self.db.refresh(saved_cart)
        return saved_cart

    async def get_by_id(self, saved_cart_id: uuid.UUID) -> Optional[SavedCart]:
        """Get saved cart by ID with items."""
        stmt = select(SavedCart).where(SavedCart.id == saved_cart_id).options(
            selectinload(SavedCart.items).selectinload(SavedCartItem.product)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_saved_carts(
        self,
        user_id: uuid.UUID,
        offset: int = 0,
        limit: int = 20
    ) -> List[SavedCart]:
        """List user's saved carts."""
        stmt = select(SavedCart).where(SavedCart.user_id == user_id).order_by(
            SavedCart.created_at.desc()
        ).offset(offset).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def delete_saved_cart(self, saved_cart_id: uuid.UUID) -> bool:
        """Hard delete a saved cart (since we don't have soft delete mixin on it yet, or using it as needed)."""
        # Actually, let's use hard delete for now if we didn't add SoftDeleteMixin
        stmt = delete(SavedCart).where(SavedCart.id == saved_cart_id)
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount > 0

    async def restore_to_cart(
        self,
        saved_cart_id: uuid.UUID,
        target_cart_id: uuid.UUID,
        replace: bool = False
    ) -> Cart:
        """Restore saved cart to active cart."""
        saved_cart = await self.get_by_id(saved_cart_id)
        if not saved_cart:
            raise ValueError("Saved cart not found")

        # Clear target if replace
        if replace:
            await self.db.execute(delete(CartItem).where(CartItem.cart_id == target_cart_id))

        # Add items
        for item in saved_cart.items:
            # We can use CartService's add_item but here we'll do it directly for simplicity
            # or better, use the instance if available.
            existing_stmt = select(CartItem).where(
                and_(
                    CartItem.cart_id == target_cart_id,
                    CartItem.product_id == item.product_id
                )
            )
            existing_result = await self.db.execute(existing_stmt)
            existing = existing_result.scalar_one_or_none()

            if existing:
                existing.quantity += item.quantity
            else:
                new_item = CartItem(
                    cart_id=target_cart_id,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    notes=item.notes
                )
                self.db.add(new_item)

        await self.db.commit()
        
        # Reload cart
        stmt = select(Cart).where(Cart.id == target_cart_id).options(selectinload(Cart.items))
        res = await self.db.execute(stmt)
        return res.scalar_one()
