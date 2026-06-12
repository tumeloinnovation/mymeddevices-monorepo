from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Annotated, Optional

from app.core.database import get_db
from app.core.responses import success_response
from app.core.dependencies import get_current_user, require_role
from app.domains.vendor.schemas.vendor_schemas import (
    VendorProfileResponse,
    VendorProfileUpdate,
    VendorApprovalRequest,
    VendorStatusResponse,
    VendorListResponse,
    StoreInfoSchema,
    AddressSchema,
    PaymentDetailsSchema,
    OperationalDetailsSchema,
)
from app.domains.vendor.services.vendor_service import VendorService
from app.domains.auth.models.user import User
from app.core.logging import logger


router = APIRouter(prefix="/vendors", tags=["Vendors"])


# ============================================================================
# Vendor Profile Management (for logged-in vendors)
# ============================================================================

@router.get("/me/status", response_model=VendorStatusResponse)
async def get_my_vendor_status(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get current vendor's approval status"""
    if current_user.role != "vendor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only vendors can access this endpoint"
        )

    service = VendorService(db)
    status_info = await service.get_vendor_status(str(current_user.id))

    return VendorStatusResponse(**status_info)


@router.get("/me/profile", response_model=VendorProfileResponse)
async def get_my_vendor_profile(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get current vendor's complete profile"""
    if current_user.role != "vendor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only vendors can access this endpoint"
        )

    service = VendorService(db)
    profile = await service.get_vendor_profile(str(current_user.id))

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found. Please complete registration first."
        )

    return VendorProfileResponse(
        id=str(profile.id),
        user_id=str(profile.user_id),
        store_name=profile.store_name,
        store_description=profile.store_description,
        store_logo_url=profile.store_logo_url,
        business_email=profile.business_email,
        business_phone=profile.business_phone,
        address_street=profile.address_street,
        address_city=profile.address_city,
        address_region=profile.address_region,
        address_country=profile.address_country,
        latitude=profile.latitude,
        longitude=profile.longitude,
        place_id=profile.place_id,
        mpesa_phone=profile.mpesa_phone,
        mpesa_business_name=profile.mpesa_business_name,
        mpesa_till_number=profile.mpesa_till_number,
        mpesa_paybill_number=profile.mpesa_paybill_number,
        bank_account_name=profile.bank_account_name,
        bank_account_number=profile.bank_account_number,
        bank_name=profile.bank_name,
        bank_branch=profile.bank_branch,
        bank_swift_code=profile.bank_swift_code,
        bank_iban=profile.bank_iban,
        business_hours=profile.business_hours,
        approval_status=profile.approval_status,
        document_urls=profile.document_urls,
        company_name=profile.company_name,
        vat_number=profile.vat_number,
        rejection_reason=profile.rejection_reason,
        approved_at=profile.approved_at,
        user_email=current_user.email,
        user_phone=current_user.phone,
        is_verified=current_user.is_verified,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


@router.patch("/me/profile")
async def update_my_vendor_profile(
    update_data: VendorProfileUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Update current vendor's profile (accessible after approval)"""
    if current_user.role != "vendor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only vendors can access this endpoint"
        )

    service = VendorService(db)

    # Extract data from schemas
    store_info = update_data.store_info
    address = update_data.address
    payment = update_data.payment_details
    operational = update_data.operational_details

    profile = await service.update_vendor_profile(
        user_id=str(current_user.id),
        store_name=store_info.store_name if store_info else None,
        store_description=store_info.store_description if store_info else None,
        store_logo_url=store_info.store_logo_url if store_info else None,
        business_email=store_info.business_email if store_info else None,
        business_phone=store_info.business_phone if store_info else None,
        address_street=address.street if address else None,
        address_city=address.city if address else None,
        address_region=address.region if address else None,
        address_country=address.country if address else None,
        latitude=address.latitude if address else None,
        longitude=address.longitude if address else None,
        place_id=address.place_id if address else None,
        mpesa_phone=payment.mpesa_phone if payment else None,
        mpesa_business_name=payment.mpesa_business_name if payment else None,
        mpesa_till_number=payment.mpesa_till_number if payment else None,
        mpesa_paybill_number=payment.mpesa_paybill_number if payment else None,
        bank_account_name=payment.bank_account_name if payment else None,
        bank_account_number=payment.bank_account_number if payment else None,
        bank_name=payment.bank_name if payment else None,
        bank_branch=payment.bank_branch if payment else None,
        bank_swift_code=payment.bank_swift_code if payment else None,
        bank_iban=payment.bank_iban if payment else None,
        business_hours=operational.business_hours if operational else None,
        document_urls=update_data.document_urls
    )

    return success_response({
        "message": "Profile updated successfully",
        "approval_status": profile.approval_status
    })


# ============================================================================
# Admin Vendor Management
# ============================================================================

@router.get("/admin/list", response_model=VendorListResponse)
async def list_vendors_admin(
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    status_filter: Optional[str] = Query(None, description="Filter by approval status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List all vendors (admin only)"""
    service = VendorService(db)
    vendors, total = await service.list_vendors(status=status_filter, page=page, page_size=page_size)

    # Build response with user info
    vendor_responses = []
    for vendor in vendors:
        user = vendor.user
        vendor_responses.append(VendorStatusResponse(
            id=str(vendor.id),
            approval_status=vendor.approval_status,
            company_name=vendor.company_name,
            store_name=vendor.store_name,
            email=user.email if user else "",
            phone=user.phone if user else None,
            is_verified=user.is_verified if user else False,
            rejection_reason=vendor.rejection_reason,
            created_at=vendor.created_at
        ))

    return VendorListResponse(
        vendors=vendor_responses,
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("/admin/{vendor_id}/approve")
async def approve_vendor_admin(
    vendor_id: str,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Approve a vendor application (admin only)"""
    service = VendorService(db)

    try:
        profile = await service.approve_vendor(
            user_id=vendor_id,
            approved_by=str(current_user.id)
        )
        logger.info(f"Vendor {vendor_id} approved by {current_user.email}")

        return success_response({
            "message": "Vendor approved successfully",
            "approval_status": profile.approval_status
        })
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/admin/{vendor_id}/reject")
async def reject_vendor_admin(
    vendor_id: str,
    rejection_data: VendorApprovalRequest,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Reject a vendor application (admin only)"""
    if not rejection_data.reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rejection reason is required"
        )

    service = VendorService(db)

    try:
        profile = await service.reject_vendor(
            user_id=vendor_id,
            approved_by=str(current_user.id),
            reason=rejection_data.reason
        )
        logger.info(f"Vendor {vendor_id} rejected by {current_user.email}, reason: {rejection_data.reason}")

        return success_response({
            "message": "Vendor application rejected",
            "approval_status": profile.approval_status,
            "rejection_reason": profile.rejection_reason
        })
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/admin/{vendor_id}/suspend")
async def suspend_vendor_admin(
    vendor_id: str,
    suspension_data: VendorApprovalRequest,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Suspend an approved vendor (admin only)"""
    if not suspension_data.reason:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Suspension reason is required"
        )

    service = VendorService(db)

    try:
        profile = await service.suspend_vendor(
            user_id=vendor_id,
            suspended_by=str(current_user.id),
            reason=suspension_data.reason
        )
        logger.info(f"Vendor {vendor_id} suspended by {current_user.email}, reason: {suspension_data.reason}")

        return success_response({
            "message": "Vendor suspended successfully",
            "approval_status": profile.approval_status
        })
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/admin/{vendor_id}/reactivate")
async def reactivate_vendor_admin(
    vendor_id: str,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Reactivate a suspended vendor (admin only)"""
    service = VendorService(db)

    try:
        profile = await service.approve_vendor(
            user_id=vendor_id,
            approved_by=str(current_user.id)
        )
        logger.info(f"Vendor {vendor_id} reactivated by {current_user.email}")

        return success_response({
            "message": "Vendor reactivated successfully",
            "approval_status": profile.approval_status
        })
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/admin/{vendor_id}/profile", response_model=VendorProfileResponse)
async def get_vendor_profile_admin(
    vendor_id: str,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Get detailed vendor profile (admin only)"""
    service = VendorService(db)
    profile = await service.get_vendor_profile(vendor_id)

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found"
        )

    # Get user info
    user_result = await db.execute(select(User).where(User.id == profile.user_id))
    user = user_result.scalar_one_or_none()

    return VendorProfileResponse(
        id=str(profile.id),
        user_id=str(profile.user_id),
        store_name=profile.store_name,
        store_description=profile.store_description,
        store_logo_url=profile.store_logo_url,
        business_email=profile.business_email,
        business_phone=profile.business_phone,
        address_street=profile.address_street,
        address_city=profile.address_city,
        address_region=profile.address_region,
        address_country=profile.address_country,
        latitude=profile.latitude,
        longitude=profile.longitude,
        place_id=profile.place_id,
        mpesa_phone=profile.mpesa_phone,
        mpesa_business_name=profile.mpesa_business_name,
        mpesa_till_number=profile.mpesa_till_number,
        mpesa_paybill_number=profile.mpesa_paybill_number,
        bank_account_name=profile.bank_account_name,
        bank_account_number=profile.bank_account_number,
        bank_name=profile.bank_name,
        bank_branch=profile.bank_branch,
        bank_swift_code=profile.bank_swift_code,
        bank_iban=profile.bank_iban,
        business_hours=profile.business_hours,
        approval_status=profile.approval_status,
        document_urls=profile.document_urls,
        company_name=profile.company_name,
        vat_number=profile.vat_number,
        rejection_reason=profile.rejection_reason,
        approved_at=profile.approved_at,
        user_email=user.email if user else "",
        user_phone=user.phone if user else None,
        is_verified=user.is_verified if user else False,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )
