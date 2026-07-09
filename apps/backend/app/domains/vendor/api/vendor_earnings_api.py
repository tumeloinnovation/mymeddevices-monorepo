from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated, Optional
import uuid
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.responses import success_response
from app.core.dependencies import get_current_user, require_role
from app.domains.auth.models.user import User
from app.domains.vendor.models.vendor_profile import VendorProfile
from sqlalchemy import select

router = APIRouter(prefix="/vendor/earnings", tags=["Vendor Earnings"])


async def get_vendor_profile(db: AsyncSession, user_id: uuid.UUID) -> VendorProfile:
    stmt = select(VendorProfile).where(VendorProfile.user_id == user_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


@router.get("/summary")
async def get_earnings_summary(
    current_user: Annotated[User, Depends(require_role("vendor"))],
    db: AsyncSession = Depends(get_db)
):
    """Get vendor's earnings summary details"""
    profile = await get_vendor_profile(db, current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found"
        )

    # Return premium-feeling mock data
    return success_response({
        "total_earnings": 185000.0,
        "current_month_earnings": 45000.0,
        "last_month_earnings": 72000.0,
        "available_for_payout": 68000.0,
        "pending_payouts": 15000.0,
        "sales_count": 34
    })


@router.get("/payouts")
async def get_payouts(
    current_user: Annotated[User, Depends(require_role("vendor"))],
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Get list of payout requests for the vendor"""
    profile = await get_vendor_profile(db, current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found"
        )

    # Return realistic payouts list based on profile settings
    mpesa_method = f"M-Pesa Phone: {profile.mpesa_phone}" if profile.mpesa_phone else "M-Pesa Till: 543210"
    bank_method = f"{profile.bank_name or 'Bank'} Acc: ****{profile.bank_account_number[-4:] if profile.bank_account_number else '4321'}"

    payouts = [
        {
            "id": "payout-1",
            "amount": 15000.0,
            "status": "pending",
            "method": "mpesa" if profile.mpesa_phone else "bank",
            "method_details": mpesa_method if profile.mpesa_phone else bank_method,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "processed_at": None
        },
        {
            "id": "payout-2",
            "amount": 42000.0,
            "status": "completed",
            "method": "bank" if profile.bank_account_number else "mpesa",
            "method_details": bank_method if profile.bank_account_number else mpesa_method,
            "created_at": "2026-06-25T14:30:00Z",
            "processed_at": "2026-06-26T09:00:00Z"
        },
        {
            "id": "payout-3",
            "amount": 60000.0,
            "status": "completed",
            "method": "mpesa",
            "method_details": mpesa_method,
            "created_at": "2026-05-18T11:00:00Z",
            "processed_at": "2026-05-18T15:45:00Z"
        }
    ]

    return success_response({
        "items": payouts,
        "total": len(payouts),
        "page": page,
        "limit": limit
    })


@router.post("/payouts/request")
async def request_payout(
    payload: dict,
    current_user: Annotated[User, Depends(require_role("vendor"))],
    db: AsyncSession = Depends(get_db)
):
    """Submit a request for payout"""
    profile = await get_vendor_profile(db, current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found"
        )

    amount = payload.get("amount", 0)
    if amount < 5000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum payout amount is KES 5,000"
        )

    # Return success response with payout model
    return success_response({
        "id": f"payout-{uuid.uuid4().hex[:6]}",
        "amount": amount,
        "status": "pending",
        "method": payload.get("type", "mpesa"),
        "method_details": f"Requested amount: KES {amount}",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "processed_at": None
    })
