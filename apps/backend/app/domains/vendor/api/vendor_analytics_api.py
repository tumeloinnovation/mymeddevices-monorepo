import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.responses import success_response
from app.domains.auth.models.user import User
from app.domains.vendor.models.vendor_profile import VendorProfile

router = APIRouter(prefix="/vendor/analytics", tags=["Vendor Analytics"])


async def get_vendor_profile(db: AsyncSession, user_id: uuid.UUID) -> VendorProfile:
    stmt = select(VendorProfile).where(VendorProfile.user_id == user_id)
    result = await db.execute(stmt)
    profile = result.scalar_one_or_none()
    if profile is None:
        from fastapi import HTTPException

        raise HTTPException(status_code=404, detail="Vendor profile not found")
    return profile


@router.get("/dashboard")
async def get_vendor_dashboard_stats(
    current_user: Annotated[User, Depends(get_current_user)],
    period: str = Query("30d"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get vendor dashboard metrics.
    Skeleton implementation to avoid 404s.
    """
    profile = await get_vendor_profile(db, current_user.id)
    if not profile:
        return success_response(
            {
                "total_sales": 0,
                "total_orders": 0,
                "total_products": 0,
                "low_stock_count": 0,
                "pending_fulfillments": 0,
                "sales_trend": [],
            }
        )

    # Return some mock/basic data for now
    return success_response(
        {
            "total_sales": 0,
            "total_orders": 0,
            "total_products": 0,
            "low_stock_count": 0,
            "pending_fulfillments": 0,
            "sales_trend": [],
        }
    )


@router.get("/sales")
async def get_vendor_sales(
    current_user: Annotated[User, Depends(get_current_user)],
    period: str = Query("30d"),
    db: AsyncSession = Depends(get_db),
):
    return success_response({"items": [], "total": 0})


@router.get("/performance")
async def get_vendor_performance(
    current_user: Annotated[User, Depends(get_current_user)], db: AsyncSession = Depends(get_db)
):
    return success_response({"rating": 0, "response_rate": 0, "fulfillment_rate": 0})


@router.get("/earnings")
async def get_vendor_earnings(
    current_user: Annotated[User, Depends(get_current_user)], db: AsyncSession = Depends(get_db)
):
    return success_response({"total_earned": 0, "pending_payout": 0, "history": []})
