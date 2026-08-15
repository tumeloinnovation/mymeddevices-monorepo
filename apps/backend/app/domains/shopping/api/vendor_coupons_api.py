import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_role
from app.core.responses import ApiSuccessResponse, success_response
from app.domains.auth.models.user import User
from app.domains.shopping.schemas.coupon_schemas import (
    CouponCreate,
    CouponResponse,
    CouponUpdate,
)
from app.domains.shopping.services.coupon_service import CouponService
from app.domains.vendor.models.vendor_profile import VendorProfile

router = APIRouter(prefix="/vendor/coupons", tags=["Vendor Coupons"])


async def get_vendor_profile(user: User, db: AsyncSession) -> VendorProfile | None:
    """Get the vendor profile for a user."""
    stmt = select(VendorProfile).where(VendorProfile.user_id == user.id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


# ============================================================================
# VENDOR COUPON MANAGEMENT
# ============================================================================


@router.get("", response_model=ApiSuccessResponse[list[CouponResponse]])
async def vendor_list_coupons(
    current_user: Annotated[User, Depends(require_role("vendor"))],
    only_active: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Vendor lists their own coupons."""
    # Get vendor profile
    vendor = await get_vendor_profile(current_user, db)
    if not vendor:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vendor profile not found")

    service = CouponService(db)
    coupons, total = await service.list_coupons(
        only_active=only_active, vendor_id=vendor.id, offset=(page - 1) * page_size, limit=page_size
    )

    return success_response(coupons)


@router.post("", response_model=ApiSuccessResponse[CouponResponse], status_code=status.HTTP_201_CREATED)
async def vendor_create_coupon(
    data: CouponCreate,
    current_user: Annotated[User, Depends(require_role("vendor"))],
    db: AsyncSession = Depends(get_db),
):
    """Vendor creates a new coupon for their store."""
    # Get vendor profile
    vendor = await get_vendor_profile(current_user, db)
    if not vendor:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vendor profile not found")

    # Set vendor-specific defaults
    service = CouponService(db)
    try:
        coupon = await service.create_coupon(
            code=data.code,
            coupon_type=data.coupon_type,
            discount_value=data.discount_value,
            description=data.description,
            min_order_value=data.min_order_value,
            max_discount_amount=data.max_discount_amount,
            global_usage_limit=data.global_usage_limit,
            valid_from=data.valid_from,
            valid_until=data.valid_until,
            vendor_id=vendor.id,
            created_by_id=current_user.id,
            discount_scope=data.discount_scope,
            is_stackable=data.is_stackable,
            distribution_type="public",  # Vendor coupons are always public
            first_purchase_only=data.first_purchase_only,
            one_time_per_user=data.one_time_per_user,
            category_ids=data.category_ids,
            product_ids=data.product_ids,
        )
        return success_response(coupon)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{coupon_id}", response_model=ApiSuccessResponse[CouponResponse])
async def vendor_get_coupon(
    coupon_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role("vendor"))],
    db: AsyncSession = Depends(get_db),
):
    """Vendor gets details of one of their coupons."""
    # Get vendor profile
    vendor = await get_vendor_profile(current_user, db)
    if not vendor:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vendor profile not found")

    service = CouponService(db)
    coupon = await service.get_by_id(coupon_id)

    if not coupon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")

    # Ensure coupon belongs to this vendor
    if coupon.vendor_id != vendor.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only view your own coupons")

    return success_response(coupon)


@router.patch("/{coupon_id}", response_model=ApiSuccessResponse[CouponResponse])
async def vendor_update_coupon(
    coupon_id: uuid.UUID,
    data: CouponUpdate,
    current_user: Annotated[User, Depends(require_role("vendor"))],
    db: AsyncSession = Depends(get_db),
):
    """Vendor updates one of their coupons."""
    # Get vendor profile
    vendor = await get_vendor_profile(current_user, db)
    if not vendor:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vendor profile not found")

    service = CouponService(db)
    coupon = await service.get_by_id(coupon_id)

    if not coupon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")

    # Ensure coupon belongs to this vendor
    if coupon.vendor_id != vendor.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only update your own coupons")

    update_data = data.model_dump(exclude_unset=True)
    updated_coupon = await service.update_coupon(coupon_id, **update_data)

    return success_response(updated_coupon)


@router.delete("/{coupon_id}", status_code=status.HTTP_200_OK)
async def vendor_delete_coupon(
    coupon_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role("vendor"))],
    db: AsyncSession = Depends(get_db),
):
    """Vendor deactivates one of their coupons (soft delete)."""
    # Get vendor profile
    vendor = await get_vendor_profile(current_user, db)
    if not vendor:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vendor profile not found")

    service = CouponService(db)
    coupon = await service.get_by_id(coupon_id, include_restrictions=False)

    if not coupon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")

    # Ensure coupon belongs to this vendor
    if coupon.vendor_id != vendor.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own coupons")

    success = await service.delete_coupon(coupon_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")

    return success_response({"message": "Coupon deactivated"})


@router.get("/{coupon_id}/stats", response_model=ApiSuccessResponse[dict])
async def vendor_get_coupon_stats(
    coupon_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role("vendor"))],
    db: AsyncSession = Depends(get_db),
):
    """Vendor gets usage statistics for one of their coupons."""
    # Get vendor profile
    vendor = await get_vendor_profile(current_user, db)
    if not vendor:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vendor profile not found")

    service = CouponService(db)
    coupon = await service.get_by_id(coupon_id)

    if not coupon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")

    # Ensure coupon belongs to this vendor
    if coupon.vendor_id != vendor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You can only view stats for your own coupons"
        )

    # Get usage stats
    from app.domains.shopping.models.coupon import CouponUsage

    # Total uses
    total_uses_stmt = select(func.count()).select_from(
        select(CouponUsage.id)
        .where(and_(CouponUsage.coupon_id == coupon_id, CouponUsage.vendor_id == vendor.id))
        .subquery()
    )
    total_uses_result = await db.execute(total_uses_stmt)
    total_uses = total_uses_result.scalar() or 0

    # Total discount amount
    total_discount_stmt = select(func.coalesce(func.sum(CouponUsage.discount_amount), 0)).where(
        and_(CouponUsage.coupon_id == coupon_id, CouponUsage.vendor_id == vendor.id)
    )
    total_discount_result = await db.execute(total_discount_stmt)
    total_discount = float(total_discount_result.scalar() or 0)

    # Unique users
    unique_users_stmt = select(func.count(func.distinct(CouponUsage.user_id))).where(
        and_(CouponUsage.coupon_id == coupon_id, CouponUsage.vendor_id == vendor.id)
    )
    unique_users_result = await db.execute(unique_users_stmt)
    unique_users = unique_users_result.scalar() or 0

    return success_response(
        {
            "coupon_id": str(coupon_id),
            "code": coupon.code,
            "total_uses": total_uses,
            "total_discount_amount": total_discount,
            "unique_users": unique_users,
            "is_active": coupon.is_active,
            "valid_until": coupon.valid_until.isoformat() if coupon.valid_until else None,
        }
    )
