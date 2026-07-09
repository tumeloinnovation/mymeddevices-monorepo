from datetime import datetime, timezone
from typing import Optional, List
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.domains.vendor.models.vendor_profile import VendorProfile
from app.domains.auth.models.user import User
from app.core.logging import logger
from app.domains.vendor.repositories.vendor_repository import VendorProfileRepository
from app.core.mail import send_email

class VendorService:
    """Service for managing vendor profiles and approvals"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.vendor_repo = VendorProfileRepository(db)

    async def get_vendor_profile(self, identifier: str | uuid.UUID) -> Optional[VendorProfile]:
        """Get vendor profile by user ID or profile ID"""
        val_uuid = uuid.UUID(identifier) if isinstance(identifier, str) else identifier
        
        # Try finding by user ID first
        profile = await self.vendor_repo.get_by_user_id(val_uuid)
        if profile:
            return profile
            
        # Fall back to finding by profile ID
        return await self.vendor_repo.get(val_uuid)

    async def create_vendor_profile(
        self,
        user_id: str,
        company_name: Optional[str] = None,
        vat_number: Optional[str] = None,
        address_street: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        place_id: Optional[str] = None
    ) -> VendorProfile:
        """Create initial vendor profile (called after registration)"""
        # Check if profile exists
        existing = await self.get_vendor_profile(user_id)
        if existing:
            if address_street:
                existing.address_street = address_street
            if latitude is not None:
                existing.latitude = latitude
            if longitude is not None:
                existing.longitude = longitude
            if place_id:
                existing.place_id = place_id
            await self.db.commit()
            return existing

        profile = VendorProfile(
            user_id=user_id,
            store_name=company_name or "New Store",
            approval_status="pending",
            company_name=company_name,
            vat_number=vat_number,
            address_street=address_street,
            latitude=latitude,
            longitude=longitude,
            place_id=place_id
        )
        profile = await self.vendor_repo.create(profile)
        logger.info(f"Created vendor profile for user {user_id}")
        return profile

    async def update_vendor_profile(
        self,
        user_id: str,
        store_name: Optional[str] = None,
        store_description: Optional[str] = None,
        store_logo_url: Optional[str] = None,
        business_email: Optional[str] = None,
        business_phone: Optional[str] = None,
        address_street: Optional[str] = None,
        address_city: Optional[str] = None,
        address_region: Optional[str] = None,
        address_country: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        place_id: Optional[str] = None,
        mpesa_phone: Optional[str] = None,
        mpesa_business_name: Optional[str] = None,
        mpesa_till_number: Optional[str] = None,
        mpesa_paybill_number: Optional[str] = None,
        bank_account_name: Optional[str] = None,
        bank_account_number: Optional[str] = None,
        bank_name: Optional[str] = None,
        bank_branch: Optional[str] = None,
        bank_swift_code: Optional[str] = None,
        bank_iban: Optional[str] = None,
        business_hours: Optional[dict] = None,
        document_urls: Optional[List[str]] = None
    ) -> VendorProfile:
        """Update vendor profile"""
        profile = await self.get_vendor_profile(user_id)
        if not profile:
            raise ValueError("Vendor profile not found")

        update_data = {}
        # Store Info
        if store_name is not None:
            update_data["store_name"] = store_name
        if store_description is not None:
            update_data["store_description"] = store_description
        if store_logo_url is not None:
            update_data["store_logo_url"] = store_logo_url
        if business_email is not None:
            update_data["business_email"] = business_email
        if business_phone is not None:
            update_data["business_phone"] = business_phone

        # Address
        if address_street is not None:
            update_data["address_street"] = address_street
        if address_city is not None:
            update_data["address_city"] = address_city
        if address_region is not None:
            update_data["address_region"] = address_region
        if address_country is not None:
            update_data["address_country"] = address_country
        if latitude is not None:
            update_data["latitude"] = latitude
        if longitude is not None:
            update_data["longitude"] = longitude
        if place_id is not None:
            update_data["place_id"] = place_id

        # Payment Details
        if mpesa_phone is not None:
            update_data["mpesa_phone"] = mpesa_phone
        if mpesa_business_name is not None:
            update_data["mpesa_business_name"] = mpesa_business_name
        if mpesa_till_number is not None:
            update_data["mpesa_till_number"] = mpesa_till_number
        if mpesa_paybill_number is not None:
            update_data["mpesa_paybill_number"] = mpesa_paybill_number
        if bank_account_name is not None:
            update_data["bank_account_name"] = bank_account_name
        if bank_account_number is not None:
            update_data["bank_account_number"] = bank_account_number
        if bank_name is not None:
            update_data["bank_name"] = bank_name
        if bank_branch is not None:
            update_data["bank_branch"] = bank_branch
        if bank_swift_code is not None:
            update_data["bank_swift_code"] = bank_swift_code
        if bank_iban is not None:
            update_data["bank_iban"] = bank_iban

        # Operational
        if business_hours is not None:
            update_data["business_hours"] = business_hours

        # Documents
        if document_urls is not None:
            update_data["document_urls"] = document_urls

        profile = await self.vendor_repo.update(profile, update_data)
        logger.info(f"Updated vendor profile for user {user_id}")
        return profile

    async def approve_vendor(
        self,
        user_id: str,
        approved_by: str,
        reject_reason: Optional[str] = None
    ) -> VendorProfile:
        """Approve a vendor application"""
        profile = await self.get_vendor_profile(user_id)
        if not profile:
            raise ValueError("Vendor profile not found")

        profile = await self.vendor_repo.update(profile, {
            "approval_status": "approved",
            "approved_at": datetime.now(timezone.utc),
            "approved_by": approved_by,
            "rejection_reason": None
        })

        logger.info(f"Vendor {user_id} approved by {approved_by}")

        # Send email notification
        result = await self.db.execute(select(User).where(User.id == profile.user_id))
        user = result.scalar_one_or_none()
        if user:
            from app.core.email_templates import vendor_approved_html
            html = vendor_approved_html(
                company_name=profile.company_name,
            )
            await send_email(
                user.email,
                "Your Vendor Account has been Approved",
                f"Congratulations, your vendor account for {profile.company_name} has been approved.",
                html,
            )
        else:
            logger.warning(f"Could not send approval notification: User {user_id} not found")

        return profile

    async def reject_vendor(
        self,
        user_id: str,
        approved_by: str,
        reason: str
    ) -> VendorProfile:
        """Reject a vendor application"""
        profile = await self.get_vendor_profile(user_id)
        if not profile:
            raise ValueError("Vendor profile not found")

        profile = await self.vendor_repo.update(profile, {
            "approval_status": "rejected",
            "approved_by": approved_by,
            "rejection_reason": reason
        })

        logger.info(f"Vendor {user_id} rejected by {approved_by}, reason: {reason}")

        # Send email notification
        result = await self.db.execute(select(User).where(User.id == profile.user_id))
        user = result.scalar_one_or_none()
        if user:
            from app.core.email_templates import vendor_notification_html
            html = vendor_notification_html(
                "Vendor Account Rejected",
                f"Your vendor account application for <strong>{profile.company_name}</strong> was not approved.",
                detail=f"Reason: {reason}",
            )
            await send_email(
                user.email,
                "Your Vendor Account has been Rejected",
                f"Your vendor account application for {profile.company_name} was rejected. Reason: {reason}",
                html,
            )
        else:
            logger.warning(f"Could not send rejection notification: User {user_id} not found")

        return profile

    async def suspend_vendor(
        self,
        user_id: str,
        suspended_by: str,
        reason: str
    ) -> VendorProfile:
        """Suspend a vendor (for approved vendors only)"""
        profile = await self.get_vendor_profile(user_id)
        if not profile:
            raise ValueError("Vendor profile not found")

        if profile.approval_status != "approved":
            raise ValueError("Only approved vendors can be suspended")

        profile = await self.vendor_repo.update(profile, {
            "approval_status": "suspended",
            "approved_by": suspended_by,
            "rejection_reason": reason  # Using rejection_reason for suspension reason
        })

        logger.info(f"Vendor {user_id} suspended by {suspended_by}, reason: {reason}")

        # Send email notification
        result = await self.db.execute(select(User).where(User.id == profile.user_id))
        user = result.scalar_one_or_none()
        if user:
            from app.core.email_templates import vendor_notification_html
            html = vendor_notification_html(
                "Vendor Account Suspended",
                f"Your vendor account for <strong>{profile.company_name}</strong> has been suspended.",
                detail=f"Reason: {reason}",
            )
            await send_email(
                user.email,
                "Your Vendor Account has been Suspended",
                f"Your vendor account for {profile.company_name} has been suspended. Reason: {reason}",
                html,
            )
        else:
            logger.warning(f"Could not send suspension notification: User {user_id} not found")

        return profile

    async def list_vendors(
        self,
        status: Optional[str] = None,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[List[VendorProfile], int]:
        """List vendors with optional status filter"""
        query = select(VendorProfile).options(selectinload(VendorProfile.user))

        if status:
            query = query.where(VendorProfile.approval_status == status)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Paginate
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        vendors = result.scalars().all()

        return list(vendors), total

    async def get_vendor_status(self, user_id: str) -> dict:
        """Get vendor status with user info"""
        result = await self.db.execute(
            select(User, VendorProfile)
            .outerjoin(VendorProfile, User.id == VendorProfile.user_id)
            .where(User.id == user_id)
        )
        row = result.first()
        if not row:
            raise ValueError("User not found")

        user, profile = row

        return {
            "id": str(user.id),
            "email": user.email,
            "approval_status": profile.approval_status if profile else "pending",
            "company_name": profile.company_name if profile else user.company_name,
            "store_name": profile.store_name if profile else None,
            "phone": user.phone,
            "is_verified": user.is_verified,
            "created_at": profile.created_at if profile else user.created_at
        }
