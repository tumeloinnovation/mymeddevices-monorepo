import uuid
from typing import List, Optional
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domains.shopping.models.cart import Cart, CartItem
from app.domains.shopping.models.cart_discount import CartDiscount
from app.domains.catalog.models.product import Product


class CartCalculationService:
    """Service for cart calculations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def calculate_totals(self, cart_id: uuid.UUID) -> dict:
        """Calculate cart totals with discounts.

        Returns:
            dict with keys: subtotal, discount_amount, tax_amount, shipping_amount, total, currency, item_count
        """
        # Get cart with items and discounts - eager load products to avoid N+1 queries
        stmt = select(Cart).where(Cart.id == cart_id).options(
            selectinload(Cart.items).selectinload(CartItem.product)
        )
        result = await self.db.execute(stmt)
        cart = result.scalar_one_or_none()
        if not cart:
            raise ValueError("Cart not found")

        items = cart.items

        # Calculate subtotal
        subtotal = 0.0
        for item in items:
            # product.price is Decimal (Numeric) in model but float in schema
            # We'll use float for calculations
            price = float(item.unit_price) if item.unit_price is not None else float(item.product.price or 0.0)
            subtotal += price * item.quantity

        # Get applied discounts
        discount_stmt = select(CartDiscount).where(
            and_(
                CartDiscount.cart_id == cart_id,
                CartDiscount.is_applied == True
            )
        )
        discount_result = await self.db.execute(discount_stmt)
        discounts = list(discount_result.scalars().all())

        # Calculate discount amount
        discount_amount = 0.0
        for discount in discounts:
            # Use the stored discount_amount if it exists and is > 0, otherwise calculate
            if discount.discount_amount and discount.discount_amount > 0:
                # Use the pre-calculated discount amount
                discount_amount += float(discount.discount_amount)
            elif discount.discount_type == "percentage":
                disc = (subtotal * float(discount.discount_value)) / 100.0
                discount_amount += disc
                # Update discount amount on record
                discount.discount_amount = Decimal(str(round(disc, 2)))
            elif discount.discount_type == "fixed":
                discount_amount += float(discount.discount_value)
                discount.discount_amount = discount.discount_value

        # Commit the updated discount amounts to database (if any were calculated)
        await self.db.commit()

        # Calculate subtotal after discount
        discounted_subtotal = max(0.0, subtotal - discount_amount)

        # Calculate tax (simplified)
        tax_amount = await self.calculate_tax(cart_id, discounted_subtotal)

        # Calculate shipping (placeholder)
        shipping_amount = await self.calculate_shipping(cart_id, discounted_subtotal)

        # Calculate total
        total = discounted_subtotal + tax_amount + shipping_amount

        return {
            "subtotal": round(subtotal, 2),
            "discount_amount": round(discount_amount, 2),
            "tax_amount": round(tax_amount, 2),
            "shipping_amount": round(shipping_amount, 2),
            "total": round(total, 2),
            "currency": "KES",
            "item_count": len(items),
            "applied_discounts": [
                {
                    "id": str(d.id),
                    "coupon_code": d.coupon_code,
                    "description": d.description,
                    "discount_amount": float(d.discount_amount)
                }
                for d in discounts
            ]
        }

    async def calculate_tax(
        self,
        cart_id: uuid.UUID,
        subtotal: float
    ) -> float:
        """Calculate tax for cart. Placeholder implementation."""
        return 0.0

    async def calculate_shipping(
        self,
        cart_id: uuid.UUID,
        subtotal: float
    ) -> float:
        """Calculate shipping for cart. Placeholder implementation."""
        return 0.0

    async def get_item_price(self, item: CartItem) -> float:
        """Get the current price for a cart item."""
        if item.unit_price:
            return float(item.unit_price)

        stmt = select(Product.price).where(Product.id == item.product_id)
        result = await self.db.execute(stmt)
        price = result.scalar_one_or_none()
        return float(price) if price else 0.0
