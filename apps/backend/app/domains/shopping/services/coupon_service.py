import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple
from decimal import Decimal
from sqlalchemy import select, and_, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domains.shopping.models.coupon import (
    Coupon,
    CouponRestriction,
    CouponUsage,
    UserCoupon,
    CouponCategory,
    CouponProduct
)
from app.domains.shopping.models.cart_discount import CartDiscount
from app.domains.shopping.models.cart import Cart, CartItem


class CouponService:
    """Service for coupon operations including CRUD, validation, and usage tracking."""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ========================================================================
    # CRUD OPERATIONS
    # ========================================================================

    async def create_coupon(
        self,
        code: str,
        coupon_type: str,
        discount_value: float,
        description: Optional[str] = None,
        min_order_value: Optional[float] = None,
        max_discount_amount: Optional[float] = None,
        global_usage_limit: Optional[int] = None,
        valid_from: Optional[datetime] = None,
        valid_until: Optional[datetime] = None,
        new_users_only: bool = False,
        vendor_id: Optional[uuid.UUID] = None,
        created_by_id: Optional[uuid.UUID] = None,
        discount_scope: str = "cart",
        is_stackable: bool = False,
        distribution_type: str = "public",
        first_purchase_only: bool = False,
        one_time_per_user: bool = True,
        # Category and product restrictions
        category_ids: Optional[List[str]] = None,
        product_ids: Optional[List[uuid.UUID]] = None,
    ) -> Coupon:
        """Create a new coupon with optional restrictions."""
        # Check if code exists
        stmt = select(Coupon).where(func.lower(Coupon.code) == code.lower())
        result = await self.db.execute(stmt)
        if result.scalar_one_or_none():
            raise ValueError(f"Coupon code '{code}' already exists")

        coupon = Coupon(
            code=code.upper(),
            description=description,
            coupon_type=coupon_type,
            discount_value=Decimal(str(discount_value)),
            discount_scope=discount_scope,
            valid_from=valid_from or datetime.now(timezone.utc),
            valid_until=valid_until,
            vendor_id=vendor_id,
            created_by_id=created_by_id,
            is_active=True,
            is_stackable=is_stackable,
            distribution_type=distribution_type
        )
        self.db.add(coupon)
        await self.db.flush()

        # Create restrictions
        restriction = CouponRestriction(
            coupon_id=coupon.id,
            min_order_value=Decimal(str(min_order_value)) if min_order_value else None,
            max_discount_amount=Decimal(str(max_discount_amount)) if max_discount_amount else None,
            global_usage_limit=global_usage_limit,
            new_users_only=new_users_only,
            vendor_only=True if vendor_id else False,
            first_purchase_only=first_purchase_only,
            one_time_per_user=one_time_per_user
        )
        self.db.add(restriction)

        # Add category restrictions if provided
        if category_ids:
            for category in category_ids:
                cat = CouponCategory(coupon_id=coupon.id, category=category)
                self.db.add(cat)

        # Add product restrictions if provided
        if product_ids:
            for product_id in product_ids:
                prod = CouponProduct(coupon_id=coupon.id, product_id=product_id)
                self.db.add(prod)

        await self.db.commit()
        await self.db.refresh(coupon)
        return coupon

    async def get_by_id(self, coupon_id: uuid.UUID, include_restrictions: bool = True) -> Optional[Coupon]:
        """Get coupon by ID."""
        stmt = select(Coupon).where(Coupon.id == coupon_id)
        if include_restrictions:
            stmt = stmt.options(
                selectinload(Coupon.restrictions),
                selectinload(Coupon.categories),
                selectinload(Coupon.products)
            )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str, include_restrictions: bool = True) -> Optional[Coupon]:
        """Get active coupon by code (case-insensitive)."""
        stmt = select(Coupon).where(
            func.lower(Coupon.code) == code.lower()
        )
        if include_restrictions:
            stmt = stmt.options(
                selectinload(Coupon.restrictions),
                selectinload(Coupon.categories),
                selectinload(Coupon.products)
            )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update_coupon(
        self,
        coupon_id: uuid.UUID,
        **updates
    ) -> Optional[Coupon]:
        """Update coupon fields."""
        coupon = await self.get_by_id(coupon_id)
        if not coupon:
            return None

        # Extract category_ids and product_ids if provided
        category_ids = updates.pop("category_ids", None)
        product_ids = updates.pop("product_ids", None)

        for key, value in updates.items():
            if hasattr(coupon, key):
                setattr(coupon, key, value)
            elif coupon.restrictions and hasattr(coupon.restrictions, key):
                setattr(coupon.restrictions, key, value)

        # Update categories if provided
        if category_ids is not None:
            await self.db.execute(
                delete(CouponCategory).where(CouponCategory.coupon_id == coupon.id)
            )
            for category in category_ids:
                cat = CouponCategory(coupon_id=coupon.id, category=category)
                self.db.add(cat)

        # Update products if provided
        if product_ids is not None:
            await self.db.execute(
                delete(CouponProduct).where(CouponProduct.coupon_id == coupon.id)
            )
            for product_id in product_ids:
                prod = CouponProduct(coupon_id=coupon.id, product_id=product_id)
                self.db.add(prod)

        await self.db.commit()
        await self.db.refresh(coupon)
        return coupon

    async def delete_coupon(self, coupon_id: uuid.UUID) -> bool:
        """Delete a coupon (soft delete by setting is_active=False)."""
        coupon = await self.get_by_id(coupon_id, include_restrictions=False)
        if not coupon:
            return False

        # Soft delete
        coupon.is_active = False
        await self.db.commit()
        return True

    async def list_coupons(
        self,
        only_active: bool = True,
        vendor_id: Optional[uuid.UUID] = None,
        offset: int = 0,
        limit: int = 50
    ) -> Tuple[List[Coupon], int]:
        """List coupons with pagination."""
        # Build base query
        stmt = select(Coupon)
        count_stmt = select(func.count(Coupon.id))

        if only_active:
            stmt = stmt.where(Coupon.is_active == True)
            count_stmt = count_stmt.where(Coupon.is_active == True)

        if vendor_id:
            stmt = stmt.where(Coupon.vendor_id == vendor_id)
            count_stmt = count_stmt.where(Coupon.vendor_id == vendor_id)

        # Get total count
        total_result = await self.db.execute(count_stmt)
        total_count = total_result.scalar() or 0

        # Get paginated results with restrictions
        stmt = stmt.options(
            selectinload(Coupon.restrictions),
            selectinload(Coupon.categories),
            selectinload(Coupon.products)
        ).order_by(Coupon.created_at.desc()).offset(offset).limit(limit)

        result = await self.db.execute(stmt)
        return list(result.scalars().all()), total_count

    # ========================================================================
    # VALIDATION
    # ========================================================================

    async def validate_coupon(
        self,
        code: str,
        order_subtotal: float,
        user_id: Optional[uuid.UUID] = None,
        cart_id: Optional[uuid.UUID] = None,
    ) -> Tuple[bool, Optional[Coupon], Optional[str]]:
        """
        Validate a coupon code for use.

        Returns:
            Tuple of (is_valid, coupon, error_message)
        """
        coupon = await self.get_by_code(code)
        if not coupon:
            return False, None, "Invalid or inactive coupon code"

        # Check if coupon is active and within valid date range
        if not coupon.is_active:
            return False, None, "Coupon is inactive"

        now = datetime.now(timezone.utc)
        if now < coupon.valid_from:
            return False, None, "Coupon is not yet valid"

        if coupon.valid_until and now > coupon.valid_until:
            return False, None, "Coupon has expired"

        # Check restrictions
        if coupon.restrictions:
            # Min order value
            if coupon.restrictions.min_order_value:
                if order_subtotal < float(coupon.restrictions.min_order_value):
                    return False, None, f"Minimum order value of {coupon.restrictions.min_order_value} required"

            # Global usage limit
            if coupon.restrictions.global_usage_limit:
                usage_count = await self._get_global_usage_count(coupon.id)
                if usage_count >= coupon.restrictions.global_usage_limit:
                    return False, None, "Coupon has reached its usage limit"

        # User-specific checks
        if user_id:
            # One time per user
            if coupon.restrictions and coupon.restrictions.one_time_per_user:
                has_used = await self._has_user_used_coupon(coupon.id, user_id)
                if has_used:
                    return False, None, "You have already used this coupon"

            # New users only
            if coupon.restrictions and coupon.restrictions.new_users_only:
                is_new_user = await self._is_new_user(user_id)
                if not is_new_user:
                    return False, None, "Coupon is for new customers only"

            # First purchase only
            if coupon.restrictions and coupon.restrictions.first_purchase_only:
                has_purchased = await self._has_user_purchased_before(user_id)
                if has_purchased:
                    return False, None, "Coupon is valid for first purchase only"

        # Check category/product scope restrictions if cart_id is provided
        if cart_id and coupon.discount_scope in ("specific_categories", "specific_products"):
            stmt = select(Cart).where(Cart.id == cart_id).options(
                selectinload(Cart.items).selectinload(CartItem.product)
            )
            result = await self.db.execute(stmt)
            cart = result.scalar_one_or_none()
            if not cart or not cart.items:
                return False, None, "Cart is empty"

            has_matching_item = False
            if coupon.discount_scope == "specific_categories":
                allowed_categories = {c.category for c in coupon.categories}
                for item in cart.items:
                    if item.product and item.product.category_id:
                        if str(item.product.category_id) in allowed_categories:
                            has_matching_item = True
                            break
                if not has_matching_item:
                    return False, None, "Coupon does not apply to any items in your cart (categories don't match)"
            
            elif coupon.discount_scope == "specific_products":
                allowed_products = {p.product_id for p in coupon.products}
                for item in cart.items:
                    if item.product_id in allowed_products:
                        has_matching_item = True
                        break
                if not has_matching_item:
                    return False, None, "Coupon does not apply to any items in your cart (products don't match)"

        # Check if already applied to cart (if cart_id provided)
        if cart_id:
            already_applied = await self._is_coupon_applied_to_cart(cart_id, coupon.code)
            if already_applied:
                return False, None, "Coupon is already applied to this cart"

        return True, coupon, None

    # ========================================================================
    # USAGE TRACKING
    # ========================================================================

    async def record_coupon_usage(
        self,
        coupon_id: uuid.UUID,
        user_id: uuid.UUID,
        order_id: uuid.UUID,
        discount_amount: Decimal,
        vendor_id: Optional[uuid.UUID] = None,
    ) -> CouponUsage:
        """Record a coupon usage for tracking."""
        usage = CouponUsage(
            coupon_id=coupon_id,
            user_id=user_id,
            order_id=order_id,
            vendor_id=vendor_id,
            discount_amount=discount_amount,
            used_at=datetime.now(timezone.utc),
            is_refunded=False
        )
        self.db.add(usage)
        await self.db.commit()
        await self.db.refresh(usage)
        return usage

    async def get_user_coupon_usage_count(self, coupon_id: uuid.UUID, user_id: uuid.UUID) -> int:
        """Get the number of times a user has used a coupon."""
        stmt = select(func.count()).select_from(
            select(CouponUsage).where(
                and_(
                    CouponUsage.coupon_id == coupon_id,
                    CouponUsage.user_id == user_id,
                    CouponUsage.is_refunded == False
                )
            ).subquery()
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def get_global_usage_count(self, coupon_id: uuid.UUID) -> int:
        """Get the total number of times a coupon has been used (excluding refunds)."""
        stmt = select(func.count()).select_from(
            select(CouponUsage).where(
                and_(
                    CouponUsage.coupon_id == coupon_id,
                    CouponUsage.is_refunded == False
                )
            ).subquery()
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def refund_coupon_usage(self, order_id: uuid.UUID) -> bool:
        """Mark coupon usage as refunded when an order is refunded."""
        stmt = select(CouponUsage).where(CouponUsage.order_id == order_id)
        result = await self.db.execute(stmt)
        usage = result.scalar_one_or_none()

        if usage:
            usage.is_refunded = True
            usage.refunded_at = datetime.now(timezone.utc)
            await self.db.commit()
            return True
        return False

    async def assign_coupon_to_user(
        self,
        coupon_id: uuid.UUID,
        user_id: uuid.UUID,
        expires_at: Optional[datetime] = None,
    ) -> UserCoupon:
        """Assign a coupon to a specific user (for private distribution)."""
        # Check if already assigned
        existing = await self.db.execute(
            select(UserCoupon).where(
                and_(
                    UserCoupon.coupon_id == coupon_id,
                    UserCoupon.user_id == user_id,
                    UserCoupon.is_used == False
                )
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("Coupon already assigned to this user")

        user_coupon = UserCoupon(
            coupon_id=coupon_id,
            user_id=user_id,
            assigned_at=datetime.now(timezone.utc),
            expires_at=expires_at,
            is_used=False
        )
        self.db.add(user_coupon)
        await self.db.commit()
        await self.db.refresh(user_coupon)
        return user_coupon

    async def get_user_assigned_coupons(self, user_id: uuid.UUID) -> List[UserCoupon]:
        """Get all coupons assigned to a user."""
        stmt = select(UserCoupon).options(
            selectinload(UserCoupon.coupon).selectinload(Coupon.restrictions)
        ).where(
            and_(
                UserCoupon.user_id == user_id,
                UserCoupon.is_used == False,
                (UserCoupon.expires_at.is_(None)) | (UserCoupon.expires_at > datetime.now(timezone.utc))
            )
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    # ========================================================================
    # PRIVATE HELPER METHODS
    # ========================================================================

    async def _get_global_usage_count(self, coupon_id: uuid.UUID) -> int:
        """Get global usage count for a coupon."""
        stmt = select(func.count(CouponUsage.id)).where(
            and_(
                CouponUsage.coupon_id == coupon_id,
                CouponUsage.is_refunded == False
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar() or 0

    async def _has_user_used_coupon(self, coupon_id: uuid.UUID, user_id: uuid.UUID) -> bool:
        """Check if user has already used this coupon."""
        stmt = select(func.count()).select_from(
            select(CouponUsage).where(
                and_(
                    CouponUsage.coupon_id == coupon_id,
                    CouponUsage.user_id == user_id,
                    CouponUsage.is_refunded == False
                )
            ).subquery()
        )
        result = await self.db.execute(stmt)
        count = result.scalar() or 0
        return count > 0

    async def _is_new_user(self, user_id: uuid.UUID) -> bool:
        """Check if user is new (has no completed orders)."""
        from app.domains.shopping.models.order import Order

        stmt = select(func.count(Order.id)).where(
            and_(
                Order.user_id == user_id,
                Order.status.in_(["completed", "delivered"])
            )
        )
        result = await self.db.execute(stmt)
        order_count = result.scalar() or 0
        return order_count == 0

    async def _has_user_purchased_before(self, user_id: uuid.UUID) -> bool:
        """Check if user has made any purchase before."""
        return not await self._is_new_user(user_id)

    async def _is_coupon_applied_to_cart(self, cart_id: uuid.UUID, coupon_code: str) -> bool:
        """Check if coupon is already applied to cart."""
        stmt = select(func.count()).select_from(
            select(CartDiscount).where(
                and_(
                    CartDiscount.cart_id == cart_id,
                    CartDiscount.coupon_code == coupon_code,
                    CartDiscount.is_applied == True
                )
            ).subquery()
        )
        result = await self.db.execute(stmt)
        count = result.scalar() or 0
        return count > 0
