import logging
import secrets
import uuid
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta
from decimal import Decimal

logger = logging.getLogger(__name__)

from sqlalchemy import and_, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import BusinessRuleError, NotFoundError
from app.domains.catalog.models.product import Product
from app.domains.shopping.models.cart import Cart, CartItem
from app.domains.shopping.models.cart_merge import CartMergeLog


def _utcnow() -> datetime:
    """Return current UTC time as a naive datetime for DB comparison safety."""
    return datetime.now(UTC).replace(tzinfo=None)


class CartService:
    """Service for shopping cart operations."""

    MAX_ITEMS_PER_CART = 100
    MAX_QUANTITY_PER_ITEM = 9999

    def __init__(self, db: AsyncSession):
        self.db = db

    @asynccontextmanager
    async def _transaction(self):
        if self.db.in_transaction():
            async with self.db.begin_nested():
                yield
        else:
            async with self.db.begin():
                yield

    async def get_or_create_cart(
        self, user_id: uuid.UUID | None = None, session_id: str | None = None, cart_token: str | None = None
    ) -> Cart:
        """Get existing cart or create new one."""
        # 1. Try by token
        if cart_token:
            stmt = select(Cart).where(and_(Cart.cart_token == cart_token, Cart.is_active == True))
            result = await self.db.execute(stmt)
            cart = result.scalar_one_or_none()
            if cart:
                if cart.expires_at and cart.expires_at.replace(tzinfo=None) < _utcnow():
                    # Use transaction for update
                    async with self._transaction():
                        cart.is_active = False
                else:
                    return cart

        # 2. Try user cart
        if user_id:
            stmt = (
                select(Cart)
                .where(and_(Cart.user_id == user_id, Cart.cart_type == "persistent", Cart.is_active == True))
                .order_by(Cart.created_at.desc())
            )
            result = await self.db.execute(stmt)
            cart = result.scalar_one_or_none()
            if cart:
                return cart

        # 3. Try session-based guest cart
        if session_id:
            stmt = select(Cart).where(
                and_(Cart.session_id == session_id, Cart.cart_type == "guest", Cart.is_active == True)
            )
            result = await self.db.execute(stmt)
            cart = result.scalar_one_or_none()
            if cart:
                if not cart.expires_at or cart.expires_at.replace(tzinfo=None) >= _utcnow():
                    return cart

        # 4. Create new cart
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Use transaction for cart creation
                async with self._transaction():
                    cart = Cart(
                        id=uuid.uuid4(),
                        user_id=user_id,
                        session_id=session_id or secrets.token_hex(16) if not user_id else None,
                        cart_token=secrets.token_urlsafe(32) if not user_id else None,
                        expires_at=_utcnow() + timedelta(hours=48) if not user_id else None,
                        is_active=True,
                        cart_type="guest" if not user_id else "persistent",
                    )

                    self.db.add(cart)
                    cart_id = cart.id

                await self.db.commit()

                # Reload and return
                stmt = select(Cart).where(Cart.id == cart_id)
                result = await self.db.execute(stmt)
                return result.scalar_one()
            except Exception as e:
                # Handle potential unique constraint violations (very rare but possible)
                if attempt < max_retries - 1 and "unique" in str(e).lower():
                    continue
                raise
        raise RuntimeError("Failed to create cart after multiple attempts")

    async def get_by_id(self, cart_id: uuid.UUID) -> Cart | None:
        """Get cart by ID with items loaded."""
        try:
            stmt = (
                select(Cart)
                .where(and_(Cart.id == cart_id, Cart.is_active == True))
                .options(
                    selectinload(Cart.items).selectinload(CartItem.product),
                    selectinload(Cart.items).selectinload(CartItem.product_variant),
                )
            )
            result = await self.db.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as e:
            # Log error and return None instead of raising
            import logging

            logger = logging.getLogger(__name__)
            logger.error(f"Error fetching cart by ID {cart_id}: {str(e)}", exc_info=True)
            return None

    async def add_item(
        self,
        cart_id: uuid.UUID,
        product_id: uuid.UUID,
        product_variant_id: uuid.UUID | None = None,
        quantity: int = 1,
        notes: str | None = None,
        substitution_allowed: bool = True,
        unit_price: float | None = None,
    ) -> CartItem:
        """Add item to cart or update quantity if already exists."""
        item_id = None
        # Use transaction for atomic item addition
        async with self._transaction():
            # Verify product exists and is available
            prod_stmt = select(Product).where(Product.id == product_id)
            prod_result = await self.db.execute(prod_stmt)
            product = prod_result.scalar_one_or_none()
            if not product:
                raise NotFoundError("Product", product_id)
            if product.status != "published":
                raise BusinessRuleError("Product is not available for purchase")

            # If variant_id is provided, verify variant exists and belongs to product
            if product_variant_id is not None:
                from app.domains.catalog.models.product_variant import ProductVariant

                var_stmt = select(ProductVariant).where(
                    and_(
                        ProductVariant.id == product_variant_id,
                        ProductVariant.product_id == product_id,
                        ProductVariant.is_active == True,
                    )
                )
                var_result = await self.db.execute(var_stmt)
                variant = var_result.scalar_one_or_none()
                if not variant:
                    raise NotFoundError("ProductVariant", product_variant_id)

            # Check existing item matching both product_id and product_variant_id
            item_conditions = [CartItem.cart_id == cart_id, CartItem.product_id == product_id]
            if product_variant_id is not None:
                item_conditions.append(CartItem.product_variant_id == product_variant_id)
            else:
                item_conditions.append(CartItem.product_variant_id.is_(None))

            item_stmt = select(CartItem).where(and_(*item_conditions))
            item_result = await self.db.execute(item_stmt)
            item = item_result.scalar_one_or_none()

            if item:
                item.quantity += quantity
                if item.quantity > self.MAX_QUANTITY_PER_ITEM:
                    item.quantity = self.MAX_QUANTITY_PER_ITEM
                if notes:
                    item.notes = notes
                item.substitution_allowed = substitution_allowed
                if unit_price is not None:
                    item.unit_price = Decimal(str(unit_price))
                item_id = item.id
                logger.info(f"[BACKEND CART] Updated existing item {item_id}: new quantity={item.quantity}")
            else:
                item = CartItem(
                    id=uuid.uuid4(),
                    cart_id=cart_id,
                    product_id=product_id,
                    product_variant_id=product_variant_id,
                    quantity=min(quantity, self.MAX_QUANTITY_PER_ITEM),
                    notes=notes,
                    substitution_allowed=substitution_allowed,
                    unit_price=Decimal(str(unit_price)) if unit_price is not None else None,
                )
                self.db.add(item)
                item_id = item.id
                logger.info(f"[BACKEND CART] Created new item {item_id}: cart_id={cart_id}, product_id={product_id}, quantity={quantity}")

        # EXPLICIT COMMIT to ensure data is persisted
        try:
            await self.db.commit()
            logger.info(f"[BACKEND CART] Explicit commit successful for item {item_id}")
        except Exception as e:
            logger.error(f"[BACKEND CART] Explicit commit failed for item {item_id}: {e}")
            await self.db.rollback()
            raise

        # Specific expiration of cart items so subsequent queries reload collection
        cart_stmt = select(Cart).where(Cart.id == cart_id)
        cart_res = await self.db.execute(cart_stmt)
        cart_obj = cart_res.scalar_one_or_none()
        if cart_obj:
            self.db.expire(cart_obj, ["items"])

        # Reload and return
        stmt = (
            select(CartItem)
            .where(CartItem.id == item_id)
            .options(selectinload(CartItem.product), selectinload(CartItem.product_variant))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def merge_guest_cart(
        self, guest_cart_token: str, user_id: uuid.UUID, merge_method: str = "merge"
    ) -> tuple[Cart, CartMergeLog]:
        """Merge guest cart into user cart."""
        # Get guest cart
        stmt = (
            select(Cart)
            .where(and_(Cart.cart_token == guest_cart_token, Cart.is_active == True))
            .options(selectinload(Cart.items))
        )
        result = await self.db.execute(stmt)
        guest_cart = result.scalar_one_or_none()

        if not guest_cart:
            raise NotFoundError("Cart", guest_cart_token)

        # Get or create user cart
        target_cart = await self.get_or_create_cart(user_id=user_id)

        source_count = len(guest_cart.items)
        target_count_before = len(target_cart.items) if target_cart.items else 0

        merge_log = CartMergeLog(
            id=uuid.uuid4(),
            source_cart_id=guest_cart.id,
            target_cart_id=target_cart.id,
            user_id=user_id,
            merge_method=merge_method,
            source_item_count=source_count,
            target_item_count_before=target_count_before,
            target_item_count_after=target_count_before,
        )

        if merge_method == "replace":
            # Clear target items
            await self.db.execute(delete(CartItem).where(CartItem.cart_id == target_cart.id))
            for item in guest_cart.items:
                item.cart_id = target_cart.id
            merge_log.target_item_count_after = source_count
        elif merge_method == "merge":
            for item in guest_cart.items:
                try:
                    await self.add_item(
                        target_cart.id,
                        item.product_id,
                        item.product_variant_id,
                        item.quantity,
                        item.notes,
                        item.substitution_allowed,
                        float(item.unit_price) if item.unit_price is not None else None,
                    )
                except (ValueError, BusinessRuleError, NotFoundError):
                    pass

            recount_stmt = select(func.count(CartItem.id)).where(CartItem.cart_id == target_cart.id)
            recount_res = await self.db.execute(recount_stmt)
            merge_log.target_item_count_after = recount_res.scalar() or 0

        guest_cart.is_active = False
        self.db.add(merge_log)
        target_cart_id = target_cart.id
        merge_log_id = merge_log.id

        await self.db.commit()

        # Reload and return
        cart_stmt = (
            select(Cart)
            .where(Cart.id == target_cart_id)
            .options(selectinload(Cart.items))
            .execution_options(populate_existing=True)
        )
        cart_result = await self.db.execute(cart_stmt)
        target_cart = cart_result.scalar_one()

        log_stmt = select(CartMergeLog).where(CartMergeLog.id == merge_log_id)
        log_result = await self.db.execute(log_stmt)
        merge_log = log_result.scalar_one()

        return target_cart, merge_log
