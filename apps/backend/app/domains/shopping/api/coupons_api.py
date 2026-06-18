from typing import Optional, Annotated, List
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, and_, func, case
import logging

logger = logging.getLogger(__name__)

from app.core.database import get_db
from app.core.responses import success_response, ApiSuccessResponse
from app.core.dependencies import get_current_user
from app.domains.auth.models.user import User
from app.domains.shopping.api.dependencies import get_optional_current_user
from app.domains.shopping.schemas.coupon_schemas import (
    CouponValidationResponse,
    CouponResponse,
)
from app.domains.shopping.services.cart_service import CartService
from app.domains.shopping.services.coupon_service import CouponService
from app.domains.shopping.services.cart_calculation_service import CartCalculationService
from app.domains.shopping.models.cart_discount import CartDiscount
from app.domains.shopping.models.coupon import Coupon, CouponUsage
from app.domains.shopping.models.cart import Cart
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/cart/coupon", tags=["Cart Coupons"])


# ============================================================================
# CUSTOMER COUPON ENDPOINTS (Applying to cart)
# ============================================================================

@router.post("", response_model=ApiSuccessResponse[CouponValidationResponse])
async def apply_coupon_to_cart(
    code: str = Query(..., description="Coupon code to apply"),
    cart_id: uuid.UUID = Query(..., description="Cart ID to apply coupon to"),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """Apply a coupon code to a cart."""
    # 1. Get cart totals
    calc_service = CartCalculationService(db)
    try:
        totals = await calc_service.calculate_totals(cart_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

    # 2. Validate coupon
    user_id = current_user.id if current_user else None
    coupon_service = CouponService(db)
    is_valid, coupon, error = await coupon_service.validate_coupon(
        code=code,
        order_subtotal=totals["subtotal"],
        user_id=user_id,
        cart_id=cart_id
    )

    if not is_valid:
        return success_response({
            "is_valid": False,
            "code": code,
            "message": error or "Invalid coupon"
        })

    # 3. Check for existing discounts and handle stackability
    existing_discounts_stmt = select(CartDiscount).where(
        and_(
            CartDiscount.cart_id == cart_id,
            CartDiscount.is_applied == True
        )
    )
    existing_result = await db.execute(existing_discounts_stmt)
    existing_discounts = list(existing_result.scalars().all())

    # Remove existing discounts if coupon is not stackable
    if not coupon.is_stackable and existing_discounts:
        await db.execute(delete(CartDiscount).where(CartDiscount.cart_id == cart_id))

    # Check if this coupon is already applied
    already_applied = any(d.coupon_code == coupon.code for d in existing_discounts)
    if already_applied:
        return success_response({
            "is_valid": True,
            "coupon_id": coupon.id,
            "code": coupon.code,
            "message": "Coupon already applied to cart",
            "coupon_type": coupon.coupon_type,
            "discount_value": float(coupon.discount_value),
            "discount_amount": totals["discount_amount"]
        })

    # 4. Apply coupon (create CartDiscount)
    # Calculate the discount amount upfront
    discount_amount = Decimal("0")
    if coupon.coupon_type == "percentage":
        discount_amount = Decimal(str(round((totals["subtotal"] * float(coupon.discount_value)) / 100.0, 2)))
        # Apply max discount limit if exists
        if coupon.restrictions and coupon.restrictions.max_discount_amount:
            discount_amount = min(discount_amount, Decimal(str(coupon.restrictions.max_discount_amount)))
    elif coupon.coupon_type == "fixed_amount":
        discount_amount = coupon.discount_value
    elif coupon.coupon_type == "free_shipping":
        discount_amount = Decimal("0")  # Will be handled in shipping calculation

    logger.info(f"Creating discount: coupon_type={coupon.coupon_type}, discount_value={coupon.discount_value}, calculated_discount_amount={discount_amount}")

    discount = CartDiscount(
        cart_id=cart_id,
        coupon_code=coupon.code,
        discount_type=coupon.coupon_type,
        discount_value=coupon.discount_value,
        discount_amount=discount_amount,
        description=coupon.description,
        is_applied=True
    )
    db.add(discount)
    await db.commit()

    logger.info(f"After commit - discount.id={discount.id}, discount.discount_amount={discount.discount_amount}")

    # 5. Recalculate totals
    new_totals = await calc_service.calculate_totals(cart_id)

    logger.info(f"New totals: {new_totals}")

    return success_response({
        "is_valid": True,
        "coupon_id": coupon.id,
        "code": coupon.code,
        "message": "Coupon applied successfully",
        "coupon_type": coupon.coupon_type,
        "discount_value": float(coupon.discount_value),
        "discount_amount": new_totals["discount_amount"]
    })


@router.delete("", status_code=status.HTTP_200_OK)
async def remove_coupon_from_cart(
    cart_id: uuid.UUID = Query(..., description="Cart ID to remove coupon from"),
    coupon_code: Optional[str] = Query(None, description="Specific coupon code to remove (if not provided, removes all)"),
    db: AsyncSession = Depends(get_db)
):
    """Remove coupons/discounts from a cart."""
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

@router.get("/available", response_model=ApiSuccessResponse[List])
async def get_available_coupons(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get all available coupons for the customer."""
    now = datetime.now(timezone.utc)

    # Get active, non-expired coupons with restrictions
    result = await db.execute(
        select(Coupon).options(
            selectinload(Coupon.restrictions)
        ).where(
            and_(
                Coupon.is_active == True,
                Coupon.valid_from <= now,
                (Coupon.valid_until.is_(None)) | (Coupon.valid_until > now),
                Coupon.distribution_type == "public"  # Only show public coupons
            )
        ).order_by(Coupon.valid_from.desc())
    )
    coupons = result.scalars().all()

    # Format response
    available_coupons = []
    for coupon in coupons:
        coupon_data = {
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
                "min_order_value": float(coupon.restrictions.min_order_value) if coupon.restrictions.min_order_value else None,
                "max_discount_amount": float(coupon.restrictions.max_discount_amount) if coupon.restrictions.max_discount_amount else None,
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
    cart_id: Optional[uuid.UUID] = Query(None, description="Cart ID to validate against")
):
    """Validate a coupon code without applying it."""
    coupon_service = CouponService(db)

    # If cart_id provided, validate with cart totals
    subtotal = 0.0
    if cart_id:
        calc_service = CartCalculationService(db)
        try:
            totals = await calc_service.calculate_totals(cart_id)
            subtotal = totals["subtotal"]
        except ValueError:
            pass  # Cart not found or invalid, continue with 0 subtotal

    user_id = current_user.id if current_user else None
    is_valid, coupon, error = await coupon_service.validate_coupon(
        code=code,
        order_subtotal=subtotal,
        user_id=user_id,
        cart_id=cart_id
    )

    if is_valid and coupon:
        # Calculate potential discount
        discount_amount = 0.0
        if coupon.coupon_type == "percentage":
            discount_amount = round(subtotal * float(coupon.discount_value) / 100.0, 2)
            # Apply max discount limit if exists
            if coupon.restrictions and coupon.restrictions.max_discount_amount:
                discount_amount = min(discount_amount, float(coupon.restrictions.max_discount_amount))
        elif coupon.coupon_type == "fixed_amount":
            discount_amount = min(float(coupon.discount_value), subtotal)

        return success_response({
            "is_valid": True,
            "coupon_id": coupon.id,
            "code": coupon.code,
            "message": "Coupon is valid",
            "coupon_type": coupon.coupon_type,
            "discount_value": float(coupon.discount_value),
            "discount_amount": discount_amount
        })

    return success_response({
        "is_valid": False,
        "code": code,
        "message": error or "Invalid coupon code"
    })


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
        coupon_result = await db.execute(
            select(Coupon).where(Coupon.id == usage.coupon_id)
        )
        coupon = coupon_result.scalar_one_or_none()

        usage_history.append({
            "id": str(usage.id),
            "coupon_code": coupon.code if coupon else "Unknown",
            "coupon_description": coupon.description if coupon else None,
            "discount_type": coupon.coupon_type if coupon else "unknown",
            "discount_amount": float(usage.discount_amount),
            "used_at": usage.used_at.isoformat(),
            "order_id": str(usage.order_id) if usage.order_id else None,
            "is_refunded": usage.is_refunded,
        })

    return success_response({
        "items": usage_history,
        "total": len(usage_history),
    })
