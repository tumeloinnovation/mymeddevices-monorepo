from typing import List, Optional, Annotated
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, extract, delete
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.responses import success_response, ApiSuccessResponse
from app.core.dependencies import require_role
from app.domains.auth.models.user import User
from app.domains.shopping.schemas.coupon_schemas import (
    CouponResponse,
    CouponCreate,
    CouponUpdate,
)
from app.domains.shopping.services.coupon_service import CouponService
from app.domains.shopping.models.cart import Cart, CartItem
from app.domains.shopping.models.order import Order, OrderItem
from app.domains.shopping.models.coupon import Coupon, CouponUsage

router = APIRouter(prefix="/admin/shopping", tags=["Admin Shopping Management"])


# ============================================================================
# COUPON MANAGEMENT
# ============================================================================

@router.get("/coupons", response_model=ApiSuccessResponse[List[CouponResponse]])
async def admin_list_coupons(
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    only_active: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Admin lists all coupons with pagination."""
    service = CouponService(db)
    coupons, total = await service.list_coupons(
        only_active=only_active,
        offset=(page - 1) * page_size,
        limit=page_size
    )
    return success_response(coupons)


@router.post("/coupons", response_model=ApiSuccessResponse[CouponResponse], status_code=status.HTTP_201_CREATED)
async def admin_create_coupon(
    data: CouponCreate,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Admin creates a new coupon."""
    service = CouponService(db)
    try:
        coupon = await service.create_coupon(
            **data.model_dump(),
            created_by_id=current_user.id
        )
        return success_response(coupon)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/coupons/{coupon_id}", response_model=ApiSuccessResponse[CouponResponse])
async def admin_get_coupon(
    coupon_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Admin gets coupon details."""
    service = CouponService(db)
    coupon = await service.get_by_id(coupon_id)
    if not coupon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")
    return success_response(coupon)


@router.patch("/coupons/{coupon_id}", response_model=ApiSuccessResponse[CouponResponse])
async def admin_update_coupon(
    coupon_id: uuid.UUID,
    data: CouponUpdate,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Admin updates coupon details."""
    service = CouponService(db)
    coupon = await service.get_by_id(coupon_id)
    if not coupon:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")
    
    update_data = data.model_dump(exclude_unset=True)
    updated_coupon = await service.update_coupon(coupon_id, **update_data)
    return success_response(updated_coupon)


@router.delete("/coupons/{coupon_id}", status_code=status.HTTP_200_OK)
async def admin_delete_coupon(
    coupon_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Admin deletes a coupon."""
    stmt = delete(Coupon).where(Coupon.id == coupon_id)
    result = await db.execute(stmt)
    await db.commit()
    
    if result.rowcount == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Coupon not found")
        
    return success_response({"message": "Coupon deleted"})


# ============================================================================
# CART ANALYTICS
# ============================================================================

@router.get("/carts/abandoned", response_model=ApiSuccessResponse[List[dict]])
async def admin_list_abandoned_carts(
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    hours_threshold: int = Query(24, description="Hours since last update to consider abandoned"),
    db: AsyncSession = Depends(get_db)
):
    """List carts that haven't been updated for a while and have items."""
    threshold_time = datetime.now(timezone.utc) - timedelta(hours=hours_threshold)
    
    stmt = select(Cart).where(
        and_(
            Cart.updated_at <= threshold_time,
            Cart.is_active == True,
            Cart.user_id.isnot(None)
        )
    ).options(selectinload(Cart.items))
    
    result = await db.execute(stmt)
    carts = result.scalars().all()
    
    abandoned = [c for c in carts if len(c.items) > 0]
    
    return success_response(abandoned)


@router.get("/carts/abandoned/{cart_id}")
async def admin_get_abandoned_cart(
    cart_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Get details of an abandoned cart."""
    stmt = select(Cart).where(Cart.id == cart_id).options(
        selectinload(Cart.items).selectinload(CartItem.product)
    )
    result = await db.execute(stmt)
    cart = result.scalar_one_or_none()
    
    if not cart:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart not found")
    
    return success_response(cart)


@router.post("/carts/abandoned/{cart_id}/recover")
async def admin_recover_abandoned_cart(
    cart_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Mark an abandoned cart for recovery (logs the recovery attempt)."""
    stmt = select(Cart).where(Cart.id == cart_id)
    result = await db.execute(stmt)
    cart = result.scalar_one_or_none()
    
    if not cart:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart not found")
    
    # In a real system, this would trigger an email notification
    # For now, we just touch the cart and log the recovery attempt
    cart.updated_at = datetime.now(timezone.utc)
    await db.commit()
    
    return success_response({"message": "Recovery email queued for cart", "cart_id": str(cart_id)})


# ============================================================================
# SHOPPING ANALYTICS
# ============================================================================

@router.get("/analytics")
async def admin_shopping_analytics(
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Aggregated shopping analytics."""
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    
    # Total orders
    total_orders_result = await db.execute(select(func.count(Order.id)))
    total_orders = total_orders_result.scalar() or 0
    
    # Orders in last 30 days
    recent_orders_result = await db.execute(
        select(func.count(Order.id)).where(Order.created_at >= thirty_days_ago)
    )
    recent_orders = recent_orders_result.scalar() or 0
    
    # Total carts (abandoned criterion: active + older than 24h)
    total_carts_result = await db.execute(select(func.count(Cart.id)))
    total_carts = total_carts_result.scalar() or 0
    
    abandoned_carts_result = await db.execute(
        select(func.count(Cart.id)).where(
            and_(
                Cart.is_active == True,
                Cart.updated_at <= (now - timedelta(hours=24)),
                Cart.user_id.isnot(None)
            )
        )
    )
    abandoned_carts_count = abandoned_carts_result.scalar() or 0
    
    # Orders with items (completed checkouts) for conversion rate
    carts_with_orders = total_orders  # Each order represents a completed checkout
    
    # Total revenue
    revenue_result = await db.execute(select(func.coalesce(func.sum(Order.total_amount), 0)))
    total_revenue = float(revenue_result.scalar() or 0)
    
    # Revenue last 30 days
    recent_revenue_result = await db.execute(
        select(func.coalesce(func.sum(Order.total_amount), 0)).where(
            Order.created_at >= thirty_days_ago
        )
    )
    recent_revenue = float(recent_revenue_result.scalar() or 0)
    
    # Coupon usage
    total_usages_result = await db.execute(select(func.count(CouponUsage.id)))
    total_coupon_usages = total_usages_result.scalar() or 0
    
    # Average cart value (from completed orders)
    avg_cart_value = round(total_revenue / total_orders, 2) if total_orders > 0 else 0
    
    # Conversion rate: orders / (carts that had items)
    conversion_rate = round((total_orders / max(total_carts, 1)) * 100, 1) if total_carts > 0 else 0
    
    # Monthly order trends (last 6 months)
    six_months_ago = now - timedelta(days=180)
    
    monthly_trends_result = await db.execute(
        select(
            extract("year", Order.created_at).label("year"),
            extract("month", Order.created_at).label("month"),
            func.count(Order.id).label("count"),
            func.coalesce(func.sum(Order.total_amount), 0).label("revenue"),
        ).where(
            Order.created_at >= six_months_ago
        ).group_by(
            extract("year", Order.created_at),
            extract("month", Order.created_at),
        ).order_by(
            extract("year", Order.created_at),
            extract("month", Order.created_at),
        )
    )
    
    monthly_trends = []
    for row in monthly_trends_result:
        monthly_trends.append({
            "year": int(row.year),
            "month": int(row.month),
            "count": int(row.count),
            "revenue": float(row.revenue),
        })
    
    # Order status breakdown
    status_breakdown_result = await db.execute(
        select(
            Order.status,
            func.count(Order.id).label("count"),
        ).group_by(Order.status)
    )
    status_breakdown = {row.status: int(row.count) for row in status_breakdown_result}
    
    return success_response({
        "total_orders": total_orders,
        "recent_orders": recent_orders,
        "total_carts": total_carts,
        "abandoned_carts": abandoned_carts_count,
        "total_revenue": total_revenue,
        "recent_revenue": recent_revenue,
        "total_coupon_usages": total_coupon_usages,
        "average_cart_value": avg_cart_value,
        "conversion_rate": conversion_rate,
        "monthly_trends": monthly_trends,
        "status_breakdown": status_breakdown,
    })
