import logging
import uuid
from datetime import UTC, datetime
from decimal import Decimal
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, delete, select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.responses import ApiSuccessResponse, success_response
from app.domains.auth.models.user import User
from app.domains.shopping.api.dependencies import get_optional_current_user
from app.domains.shopping.models.cart import Cart, CartItem
from app.domains.shopping.models.cart_discount import CartDiscount
from app.domains.shopping.models.coupon import Coupon, CouponUsage
from app.domains.shopping.schemas.coupon_schemas import (
    CouponValidationResponse,
)
from app.domains.shopping.services.cart_calculation_service import CartCalculationService
from app.domains.shopping.services.coupon_service import CouponService

router = APIRouter(prefix="/cart/coupon", tags=["Cart Coupons"])


async def _verify_cart_ownership(
    db: AsyncSession,
    cart_id: uuid.UUID,
    current_user: User | None,
    cart_token: str | None,
):
    """Verify that the caller owns the cart, or raise 403/404."""
    stmt = select(Cart).where(Cart.id == cart_id)
    result = await db.execute(stmt)
    cart = result.scalar_one_or_none()

    if not cart:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart not found")

    is_owner = False
    if cart.user_id:
        is_owner = current_user is not None and cart.user_id == current_user.id
    else:
        is_owner = cart_token is not None and cart.cart_token == cart_token

    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this cart"
        )


# ============================================================================
# CUSTOMER COUPON ENDPOINTS (Applying to cart)
# ============================================================================


@router.post("", response_model=ApiSuccessResponse[CouponValidationResponse])
async def apply_coupon_to_cart(
    code: str = Query(..., description="Coupon code to apply"),
    cart_id: uuid.UUID = Query(..., description="Cart ID to apply coupon to"),
    cart_token: str | None = Query(None, description="Cart token for guest carts"),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    """Apply a coupon code to a cart."""
    # 1. Verify cart ownership
    await _verify_cart_ownership(db, cart_id, current_user, cart_token)

    # 2. Get cart totals
    calc_service = CartCalculationService(db)
    try:
        totals = await calc_service.calculate_totals(cart_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    # 3. Validate coupon
    user_id = current_user.id if current_user else None
    coupon_service = CouponService(db)
    is_valid, coupon, error = await coupon_service.validate_coupon(
        code=code, order_subtotal=totals["subtotal"], user_id=user_id, cart_id=cart_id
    )

    if not is_valid:
        return success_response({"is_valid": False, "code": code, "message": error or "Invalid coupon"})

    if coupon is None:
        return success_response({"is_valid": False, "code": code, "message": "Coupon not found"})

    # 3. Check for existing discounts and handle stackability
    existing_discounts_stmt = select(CartDiscount).where(
        and_(CartDiscount.cart_id == cart_id, CartDiscount.is_applied == True)
    )
    existing_result = await db.execute(existing_discounts_stmt)
    existing_discounts = list(existing_result.scalars().all())

    # Remove existing discounts if coupon is not stackable
    if not coupon.is_stackable and existing_discounts:
        await db.execute(delete(CartDiscount).where(CartDiscount.cart_id == cart_id))

    # Check if this coupon is already applied
    already_applied = any(d.coupon_code == coupon.code for d in existing_discounts)
    if already_applied:
        return success_response(
            {
                "is_valid": True,
                "coupon_id": coupon.id,
                "code": coupon.code,
                "message": "Coupon already applied to cart",
                "coupon_type": coupon.coupon_type,
                "discount_value": float(coupon.discount_value),
                "discount_amount": totals["discount_amount"],
            }
        )

    # 4. Apply coupon (create CartDiscount)
    # Calculate the discount amount upfront
    applicable_subtotal = totals["subtotal"]
    if coupon.discount_scope == "specific_categories":
        allowed_categories = {c.category for c in coupon.categories}
        stmt = select(Cart).where(Cart.id == cart_id).options(selectinload(Cart.items).selectinload(CartItem.product))
        cart_res = await db.execute(stmt)
        cart = cart_res.scalar_one_or_none()
        if cart:
            applicable_subtotal = 0.0
            for item in cart.items:
                if item.product and item.product.category_id and str(item.product.category_id) in allowed_categories:
                    price = float(item.unit_price) if item.unit_price is not None else float(item.product.price or 0.0)
                    applicable_subtotal += price * item.quantity
    elif coupon.discount_scope == "specific_products":
        allowed_products = {p.product_id for p in coupon.products}
        stmt = select(Cart).where(Cart.id == cart_id).options(selectinload(Cart.items).selectinload(CartItem.product))
        cart_res = await db.execute(stmt)
        cart = cart_res.scalar_one_or_none()
        if cart:
            applicable_subtotal = 0.0
            for item in cart.items:
                if item.product_id in allowed_products:
                    price = float(item.unit_price) if item.unit_price is not None else float(item.product.price or 0.0)
                    applicable_subtotal += price * item.quantity

    discount_amount = Decimal("0")
    if coupon.coupon_type == "percentage":
        discount_amount = Decimal(str(round((applicable_subtotal * float(coupon.discount_value)) / 100.0, 2)))
        # Apply max discount limit if exists
        if coupon.restrictions and coupon.restrictions.max_discount_amount:
            discount_amount = min(discount_amount, Decimal(str(coupon.restrictions.max_discount_amount)))
    elif coupon.coupon_type == "fixed_amount":
        discount_amount = Decimal(str(min(float(coupon.discount_value), applicable_subtotal)))
    elif coupon.coupon_type == "free_shipping":
        discount_amount = Decimal("0")  # Will be handled in shipping calculation

    logger.info(
        f"Creating discount: coupon_type={coupon.coupon_type}, discount_value={coupon.discount_value}, calculated_discount_amount={discount_amount}"
    )

    discount = CartDiscount(
        cart_id=cart_id,
        coupon_code=coupon.code,
        discount_type=coupon.coupon_type,
        discount_value=coupon.discount_value,
        discount_amount=discount_amount,
        description=coupon.description,
        is_applied=True,
    )
    db.add(discount)
    await db.commit()

    logger.info(f"After commit - discount.id={discount.id}, discount.discount_amount={discount.discount_amount}")

    # 5. Recalculate totals
    new_totals = await calc_service.calculate_totals(cart_id)

    logger.info(f"New totals: {new_totals}")

    return success_response(
        {
            "is_valid": True,
            "coupon_id": coupon.id,
            "code": coupon.code,
            "message": "Coupon applied successfully",
            "coupon_type": coupon.coupon_type,
            "discount_value": float(coupon.discount_value),
            "discount_amount": new_totals["discount_amount"],
        }
    )


@router.delete("", status_code=status.HTTP_200_OK)
async def remove_coupon_from_cart(
    cart_id: uuid.UUID = Query(..., description="Cart ID to remove coupon from"),
    coupon_code: str | None = Query(None, description="Specific coupon code to remove (if not provided, removes all)"),
    cart_token: str | None = Query(None, description="Cart token for guest carts"),
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    """Remove coupons/discounts from a cart."""
    # Verify cart ownership before mutating
    await _verify_cart_ownership(db, cart_id, current_user, cart_token)

    stmt = delete(CartDiscount).where(CartDiscount.cart_id == cart_id)
    if coupon_code:
        stmt = stmt.where(CartDiscount.coupon_code == coupon_code)
    await db.execute(stmt)
    await db.commit()

    if coupon_code:
        return success_response({"message": f"Coupon {coupon_code} removed from cart"})
    return success_response({"message": "All coupons removed from cart"})


# ============================================================================
# COUPON DISCOVERY ENDPOINTS
# ============================================================================


@router.get("/available", response_model=ApiSuccessResponse[list])
async def get_available_coupons(
    db: AsyncSession = Depends(get_db), current_user: User | None = Depends(get_optional_current_user)
):
    """Get all available coupons for the customer."""
    now = datetime.now(UTC)

    # Get active, non-expired coupons with restrictions
    result = await db.execute(
        select(Coupon)
        .options(selectinload(Coupon.restrictions))
        .where(
            and_(
                Coupon.is_active == True,
                Coupon.valid_from <= now,
                (Coupon.valid_until.is_(None)) | (Coupon.valid_until > now),
                Coupon.distribution_type == "public",  # Only show public coupons
            )
        )
        .order_by(Coupon.valid_from.desc())
    )
    coupons = result.scalars().all()

    # Format response
    available_coupons = []
    for coupon in coupons:
        coupon_data: dict[str, Any] = {
            "id": str(coupon.id),
            "code": coupon.code,
            "description": coupon.description,
            "coupon_type": coupon.coupon_type,
            "discount_value": float(coupon.discount_value),
            "discount_scope": coupon.discount_scope,
            "is_stackable": coupon.is_stackable,
            "valid_from": coupon.valid_from.isoformat(),
            "valid_until": coupon.valid_until.isoformat() if coupon.valid_until else None,
        }

        # Add restriction info if available
        if coupon.restrictions:
            coupon_data["restrictions"] = {
                "min_order_value": float(coupon.restrictions.min_order_value)
                if coupon.restrictions.min_order_value
                else None,
                "max_discount_amount": float(coupon.restrictions.max_discount_amount)
                if coupon.restrictions.max_discount_amount
                else None,
                "new_users_only": coupon.restrictions.new_users_only,
                "first_purchase_only": coupon.restrictions.first_purchase_only,
                "one_time_per_user": coupon.restrictions.one_time_per_user,
            }

        available_coupons.append(coupon_data)

    return success_response(available_coupons)


@router.get("/validate", response_model=ApiSuccessResponse[CouponValidationResponse])
async def validate_coupon_code(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
    code: str = Query(..., description="Coupon code to validate"),
    cart_id: uuid.UUID | None = Query(None, description="Cart ID to validate against"),
):
    """Validate a coupon code without applying it."""
    coupon_service = CouponService(db)

    # If cart_id provided, verify ownership and validate with cart totals
    subtotal = 0.0
    if cart_id:
        await _verify_cart_ownership(db, cart_id, current_user, None)
        calc_service = CartCalculationService(db)
        try:
            totals = await calc_service.calculate_totals(cart_id)
            subtotal = totals["subtotal"]
        except ValueError:
            pass  # Cart not found or invalid, continue with 0 subtotal

    user_id = current_user.id if current_user else None
    is_valid, coupon, error = await coupon_service.validate_coupon(
        code=code, order_subtotal=subtotal, user_id=user_id, cart_id=cart_id
    )

    if not is_valid or coupon is None:
        return success_response({"is_valid": False, "code": code, "message": error or "Invalid coupon code"})

    # Calculate potential discount
    applicable_subtotal = subtotal
    if cart_id and coupon.discount_scope in ("specific_categories", "specific_products"):
        stmt = select(Cart).where(Cart.id == cart_id).options(selectinload(Cart.items).selectinload(CartItem.product))
        cart_res = await db.execute(stmt)
        cart = cart_res.scalar_one_or_none()
        if cart:
            applicable_subtotal = 0.0
            if coupon.discount_scope == "specific_categories":
                allowed_categories = {c.category for c in coupon.categories}
                for item in cart.items:
                    if (
                        item.product
                        and item.product.category_id
                        and str(item.product.category_id) in allowed_categories
                    ):
                        price = (
                            float(item.unit_price) if item.unit_price is not None else float(item.product.price or 0.0)
                        )
                        applicable_subtotal += price * item.quantity
            elif coupon.discount_scope == "specific_products":
                allowed_products = {p.product_id for p in coupon.products}
                for item in cart.items:
                    if item.product_id in allowed_products:
                        price = (
                            float(item.unit_price) if item.unit_price is not None else float(item.product.price or 0.0)
                        )
                        applicable_subtotal += price * item.quantity

    discount_amount = 0.0
    if coupon.coupon_type == "percentage":
        discount_amount = round(applicable_subtotal * float(coupon.discount_value) / 100.0, 2)
        # Apply max discount limit if exists
        if coupon.restrictions and coupon.restrictions.max_discount_amount:
            discount_amount = min(discount_amount, float(coupon.restrictions.max_discount_amount))
    elif coupon.coupon_type == "fixed_amount":
        discount_amount = min(float(coupon.discount_value), applicable_subtotal)

    return success_response(
        {
            "is_valid": True,
            "coupon_id": coupon.id,
            "code": coupon.code,
            "message": "Coupon is valid",
            "coupon_type": coupon.coupon_type,
            "discount_value": float(coupon.discount_value),
            "discount_amount": discount_amount,
        }
    )


@router.get("/my-coupons", response_model=ApiSuccessResponse[dict])
async def get_my_coupon_usage(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
):
    """Get customer's coupon usage history."""
    from sqlalchemy import desc

    result = await db.execute(
        select(CouponUsage)
        .where(CouponUsage.user_id == current_user.id)
        .order_by(desc(CouponUsage.used_at))
        .limit(limit)
    )

    usages = result.scalars().all()

    usage_history = []
    for usage in usages:
        # Get coupon details
        coupon_result = await db.execute(select(Coupon).where(Coupon.id == usage.coupon_id))
        coupon = coupon_result.scalar_one_or_none()

        usage_history.append(
            {
                "id": str(usage.id),
                "coupon_code": coupon.code if coupon else "Unknown",
                "coupon_description": coupon.description if coupon else None,
                "discount_type": coupon.coupon_type if coupon else "unknown",
                "discount_amount": float(usage.discount_amount),
                "used_at": usage.used_at.isoformat(),
                "order_id": str(usage.order_id) if usage.order_id else None,
                "is_refunded": usage.is_refunded,
            }
        )

    return success_response(
        {
            "items": usage_history,
            "total": len(usage_history),
        }
    )
