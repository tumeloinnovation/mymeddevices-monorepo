from datetime import UTC, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import DbDep, require_role
from app.core.logging import logger
from app.core.responses import ApiSuccessResponse, success_response
from app.domains.auth.models.user import User
from app.domains.vendor.dependencies import VendorServiceDep
from app.domains.vendor.schemas.vendor_schemas import (
    AdminCreateVendorRequest,
    VendorApprovalRequest,
    VendorListResponse,
    VendorProfileResponse,
    VendorProfileUpdate,
    VendorStatusResponse,
)
from app.domains.vendor.services.vendor_service import VendorService

router = APIRouter(prefix="/vendors", tags=["Vendor"])


def format_vendor_profile_response(profile, user) -> VendorProfileResponse:
    """Helper to format vendor profile response with user data"""
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


# ============================================================================
# Vendor Self-Service
# ============================================================================


@router.get("/me/status", response_model=ApiSuccessResponse[VendorStatusResponse])
async def get_vendor_status(current_user: Annotated[User, Depends(require_role("vendor"))], service: VendorServiceDep):
    """Get current user's vendor approval status"""
    profile = await service.get_vendor_profile(str(current_user.id))

    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor profile not found")

    return success_response(
        VendorStatusResponse(
            id=str(profile.id),
            approval_status=profile.approval_status,
            company_name=profile.company_name,
            store_name=profile.store_name,
            email=current_user.email,
            phone=current_user.phone,
            is_verified=current_user.is_verified,
            created_at=profile.created_at,
            rejection_reason=profile.rejection_reason,
        )
    )


@router.get("/me/profile", response_model=ApiSuccessResponse[VendorProfileResponse])
async def get_my_vendor_profile(
    current_user: Annotated[User, Depends(require_role("vendor"))], service: VendorServiceDep
):
    """Get full vendor profile for the current user"""
    profile = await service.get_vendor_profile(str(current_user.id))

    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor profile not found")

    return success_response(format_vendor_profile_response(profile, current_user))


@router.patch("/me/profile", response_model=ApiSuccessResponse[dict])
async def update_my_vendor_profile(
    update_data: VendorProfileUpdate,
    current_user: Annotated[User, Depends(require_role("vendor"))],
    service: VendorServiceDep,
):
    """Update current user's vendor profile"""
    profile = await service.get_vendor_profile(str(current_user.id))

    if profile and profile.approval_status == "rejected":
        # Allow updating rejected profiles to re-submit
        pass
    elif not profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Vendor profile not found. Please create a profile first."
        )
    elif profile.approval_status == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your vendor application is pending approval. Profile updates are not allowed until approved.",
        )
    elif profile.approval_status == "rejected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your vendor application was rejected: {profile.rejection_reason or 'No reason provided'}. Please contact support.",
        )

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
        document_urls=update_data.document_urls,
    )

    return success_response({"message": "Profile updated successfully", "approval_status": profile.approval_status})


# ============================================================================
# Admin Vendor Management
# ============================================================================


@router.get("/admin/list", response_model=ApiSuccessResponse[VendorListResponse])
async def list_vendors_admin(
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    status: str | None = Query(None, description="Filter by approval status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List all vendors (admin only)"""
    service = VendorService(db)
    vendors, total = await service.list_vendors(status=status, page=page, page_size=page_size)

    # Build response with user info
    vendor_responses = []
    for vendor in vendors:
        user = vendor.user
        vendor_responses.append(
            VendorStatusResponse(
                id=str(vendor.id),
                approval_status=vendor.approval_status,
                company_name=vendor.company_name,
                store_name=vendor.store_name,
                email=user.email if user else "",
                phone=user.phone if user else None,
                is_verified=user.is_verified if user else False,
                rejection_reason=vendor.rejection_reason,
                created_at=vendor.created_at,
            )
        )

    return success_response(VendorListResponse(vendors=vendor_responses, total=total, page=page, page_size=page_size))


@router.post("/admin/{vendor_id}/approve", response_model=ApiSuccessResponse[VendorProfileResponse])
async def approve_vendor_admin(
    vendor_id: str,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: DbDep,
    service: VendorServiceDep,
):
    """Approve a vendor application (admin only)"""

    profile = await service.approve_vendor(user_id=vendor_id, approved_by=str(current_user.id))
    logger.info(f"Vendor {vendor_id} approved by {current_user.email}")

    # Load user
    stmt = select(User).where(User.id == profile.user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    return success_response(format_vendor_profile_response(profile, user))


@router.post("/admin/{vendor_id}/reject", response_model=ApiSuccessResponse[VendorProfileResponse])
async def reject_vendor_admin(
    vendor_id: str,
    rejection_data: VendorApprovalRequest,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: DbDep,
    service: VendorServiceDep,
):
    """Reject a vendor application (admin only)"""
    if not rejection_data.reason:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rejection reason is required")

    profile = await service.reject_vendor(
        user_id=vendor_id, approved_by=str(current_user.id), reason=rejection_data.reason
    )
    logger.info(f"Vendor {vendor_id} rejected by {current_user.email}, reason: {rejection_data.reason}")

    # Load user
    stmt = select(User).where(User.id == profile.user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    return success_response(format_vendor_profile_response(profile, user))


@router.post("/admin/{vendor_id}/suspend", response_model=ApiSuccessResponse[VendorProfileResponse])
async def suspend_vendor_admin(
    vendor_id: str,
    suspension_data: VendorApprovalRequest,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: DbDep,
    service: VendorServiceDep,
):
    """Suspend an approved vendor (admin only)"""
    if not suspension_data.reason:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Suspension reason is required")

    profile = await service.suspend_vendor(
        user_id=vendor_id, suspended_by=str(current_user.id), reason=suspension_data.reason
    )
    logger.info(f"Vendor {vendor_id} suspended by {current_user.email}, reason: {suspension_data.reason}")

    # Load user
    stmt = select(User).where(User.id == profile.user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    return success_response(format_vendor_profile_response(profile, user))


@router.post("/admin/{vendor_id}/reactivate", response_model=ApiSuccessResponse[VendorProfileResponse])
async def reactivate_vendor_admin(
    vendor_id: str,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: DbDep,
    service: VendorServiceDep,
):
    """Reactivate a suspended vendor (admin only)"""

    profile = await service.approve_vendor(user_id=vendor_id, approved_by=str(current_user.id))
    logger.info(f"Vendor {vendor_id} reactivated by {current_user.email}")

    # Load user
    stmt = select(User).where(User.id == profile.user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    return success_response(format_vendor_profile_response(profile, user))


@router.get("/admin/{vendor_id}/profile", response_model=ApiSuccessResponse[VendorProfileResponse])
async def get_vendor_profile_admin(
    vendor_id: str,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: DbDep,
    service: VendorServiceDep,
):
    """Get full vendor profile details (admin only)"""

    profile = await service.get_vendor_profile(vendor_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vendor profile not found")

    # Load user
    stmt = select(User).where(User.id == profile.user_id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    return success_response(format_vendor_profile_response(profile, user))


@router.post("/admin/create", response_model=ApiSuccessResponse[VendorProfileResponse])
async def create_vendor_admin(
    vendor_data: AdminCreateVendorRequest,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: DbDep,
):
    """Create a new vendor (admin only)"""
    from app.core.security import get_password_hash_async
    from app.domains.auth.repositories.auth_repository import UserRepository

    # Check if user already exists
    user_repo = UserRepository(db)
    existing_user = await user_repo.get_by_email(vendor_data.email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with this email already exists")

    try:
        # Create the user with vendor role
        from app.domains.auth.models.user import User

        new_user = User(
            email=vendor_data.email,
            password_hash=await get_password_hash_async(vendor_data.password),
            role="vendor",
            phone=vendor_data.phone,
            is_active=True,
            is_verified=True,  # Auto-verify admin-created accounts
        )
        new_user = await user_repo.create(new_user)
        logger.info(f"Created vendor user {new_user.email} by admin {current_user.email}")

        # Create vendor profile
        service = VendorService(db)

        # Determine approval status
        final_status = "approved" if vendor_data.auto_approve else vendor_data.approval_status
        approved_at = datetime.now(UTC) if final_status == "approved" else None

        # Create vendor profile with all details
        from app.domains.vendor.models.vendor_profile import VendorProfile

        profile = VendorProfile(
            user_id=new_user.id,
            store_name=vendor_data.store_name,
            store_description=vendor_data.store_description,
            business_email=vendor_data.business_email,
            business_phone=vendor_data.business_phone,
            address_street=vendor_data.address_street,
            address_city=vendor_data.address_city,
            address_region=vendor_data.address_region,
            address_country=vendor_data.address_country,
            mpesa_phone=vendor_data.mpesa_phone,
            mpesa_business_name=vendor_data.mpesa_business_name,
            mpesa_till_number=vendor_data.mpesa_till_number,
            mpesa_paybill_number=vendor_data.mpesa_paybill_number,
            approval_status=final_status,
            company_name=vendor_data.company_name,
            vat_number=vendor_data.vat_number,
            approved_at=approved_at,
            approved_by=str(current_user.id) if final_status == "approved" else None,
        )
        profile = await service.vendor_repo.create(profile)
        logger.info(f"Created vendor profile for user {new_user.id} with status {final_status}")

        return success_response(format_vendor_profile_response(profile, new_user))

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create vendor: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create vendor: {str(e)}"
        )
