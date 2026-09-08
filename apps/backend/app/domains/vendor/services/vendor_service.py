import uuid
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.exceptions import BusinessRuleError, NotFoundError
from app.core.logging import logger
from app.core.mail import send_email
from app.domains.auth.models.user import User
from app.domains.vendor.models.vendor_profile import VendorProfile
from app.domains.vendor.repositories.vendor_repository import VendorProfileRepository


class VendorService:
    """Service for managing vendor profiles and approvals"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.vendor_repo = VendorProfileRepository(db)

    @asynccontextmanager
    async def _transaction(self):
        """Use begin_nested (SAVEPOINT) when already in a transaction."""
        if self.db.in_transaction():
            async with self.db.begin_nested():
                yield
        else:
            async with self.db.begin():
                yield

    async def get_vendor_profile(self, identifier: str | uuid.UUID) -> VendorProfile | None:
        """Get vendor profile by user ID or profile ID"""
        val_uuid = uuid.UUID(str(identifier)) if isinstance(identifier, str) else identifier

        # Try finding by user ID first
        profile = await self.vendor_repo.get_by_user_id(val_uuid)
        if profile:
            return profile

        # Fall back to finding by profile ID
        return await self.vendor_repo.get(val_uuid)

    async def create_vendor_profile(
        self,
        user_id: str | uuid.UUID,
        company_name: str | None = None,
        vat_number: str | None = None,
        address_street: str | None = None,
        latitude: float | None = None,
        longitude: float | None = None,
        place_id: str | None = None,
    ) -> VendorProfile:
        """Create initial vendor profile (called after registration)"""
        val_uuid = uuid.UUID(str(user_id)) if isinstance(user_id, str) else user_id
        async with self._transaction():
            # Check if profile exists
            existing = await self.get_vendor_profile(val_uuid)
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
                id=uuid.uuid4(),
                user_id=val_uuid,
                store_name=company_name or "New Store",
                approval_status="pending",
                company_name=company_name,
                vat_number=vat_number,
                address_street=address_street,
                latitude=latitude,
                longitude=longitude,
                place_id=place_id,
            )
            profile = await self.vendor_repo.create(profile)
            await self.db.commit()
            logger.info(f"Created vendor profile for user {val_uuid}")
            return profile

    async def update_vendor_profile(
        self,
        user_id: str,
        store_name: str | None = None,
        store_description: str | None = None,
        store_logo_url: str | None = None,
        business_email: str | None = None,
        business_phone: str | None = None,
        address_street: str | None = None,
        address_city: str | None = None,
        address_region: str | None = None,
        address_country: str | None = None,
        latitude: float | None = None,
        longitude: float | None = None,
        place_id: str | None = None,
        mpesa_phone: str | None = None,
        mpesa_business_name: str | None = None,
        mpesa_till_number: str | None = None,
        mpesa_paybill_number: str | None = None,
        bank_account_name: str | None = None,
        bank_account_number: str | None = None,
        bank_name: str | None = None,
        bank_branch: str | None = None,
        bank_swift_code: str | None = None,
        bank_iban: str | None = None,
        business_hours: dict | None = None,
        document_urls: list[str] | None = None,
    ) -> VendorProfile:
        """Update vendor profile"""
        profile = await self.get_vendor_profile(user_id)
        if not profile:
            raise NotFoundError("VendorProfile", user_id)

        update_data: dict[str, Any] = {}
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
        self, user_id: str | uuid.UUID, approved_by: str | uuid.UUID, reject_reason: str | None = None
    ) -> VendorProfile:
        """Approve a vendor application"""
        profile = await self.get_vendor_profile(user_id)
        if not profile:
            raise NotFoundError("VendorProfile", user_id)

        val_approved_by = uuid.UUID(str(approved_by)) if approved_by else None
        profile = await self.vendor_repo.update(
            profile,
            {
                "approval_status": "approved",
                "approved_at": datetime.now(UTC),
                "approved_by": val_approved_by,
                "rejection_reason": None,
            },
        )

        logger.info(f"Vendor {user_id} approved by {approved_by}")

        # Send email notification
        result = await self.db.execute(select(User).where(User.id == profile.user_id))
        user = result.scalar_one_or_none()
        if user:
            from app.core.email_templates import vendor_approved_html

            html = vendor_approved_html(
                company_name=profile.company_name or profile.store_name or "Your Store",
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

    async def reject_vendor(self, user_id: str | uuid.UUID, approved_by: str | uuid.UUID, reason: str) -> VendorProfile:
        """Reject a vendor application"""
        profile = await self.get_vendor_profile(user_id)
        if not profile:
            raise NotFoundError("VendorProfile", user_id)

        val_approved_by = uuid.UUID(str(approved_by)) if approved_by else None
        profile = await self.vendor_repo.update(
            profile, {"approval_status": "rejected", "approved_by": val_approved_by, "rejection_reason": reason}
        )

        logger.info(f"Vendor {user_id} rejected by {approved_by}, reason: {reason}")

        # Send email notification
        result = await self.db.execute(select(User).where(User.id == profile.user_id))
        user = result.scalar_one_or_none()
        if user:
            from app.core.email_templates import vendor_rejected_html

            user_name = (
                f"{user.first_name} {user.last_name}".strip()
                if (user.first_name or user.last_name)
                else "Vendor Partner"
            )
            company = profile.company_name or profile.store_name or "your company"
            html = vendor_rejected_html(
                company_name=company,
                rejection_reason=reason,
                user_name=user_name,
                resubmit_url=f"{settings.SITE_URL}/vendor/onboarding",
                support_email="compliance@mymeddevices.com",
            )
            await send_email(
                user.email,
                f"Action Required: Vendor Account Application Update for {company}",
                f"Your vendor account application for {company} was not approved. Reason: {reason}",
                html,
            )
        else:
            logger.warning(f"Could not send rejection notification: User {user_id} not found")

        return profile

    async def suspend_vendor(
        self, user_id: str | uuid.UUID, suspended_by: str | uuid.UUID, reason: str
    ) -> VendorProfile:
        """Suspend a vendor (for approved vendors only)"""
        profile = await self.get_vendor_profile(user_id)
        if not profile:
            raise NotFoundError("VendorProfile", user_id)

        if profile.approval_status != "approved":
            raise BusinessRuleError("Only approved vendors can be suspended")

        val_suspended_by = uuid.UUID(str(suspended_by)) if suspended_by else None
        profile = await self.vendor_repo.update(
            profile,
            {
                "approval_status": "suspended",
                "approved_by": val_suspended_by,
                "rejection_reason": reason,  # Using rejection_reason for suspension reason
            },
        )

        logger.info(f"Vendor {user_id} suspended by {suspended_by}, reason: {reason}")

        # Send email notification
        result = await self.db.execute(select(User).where(User.id == profile.user_id))
        user = result.scalar_one_or_none()
        if user:
            from app.core.email_templates import vendor_suspended_html

            user_name = (
                f"{user.first_name} {user.last_name}".strip()
                if (user.first_name or user.last_name)
                else "Vendor Partner"
            )
            company = profile.company_name or profile.store_name or "your company"
            html = vendor_suspended_html(
                company_name=company,
                suspension_reason=reason,
                user_name=user_name,
                support_url=f"{settings.SITE_URL}/vendor/support",
                support_email="compliance@mymeddevices.com",
            )
            await send_email(
                user.email,
                f"Urgent: Vendor Account Suspension Notice for {company}",
                f"Your vendor account for {company} has been suspended. Reason: {reason}",
                html,
            )
        else:
            logger.warning(f"Could not send suspension notification: User {user_id} not found")

        return profile

    async def list_vendors(
        self, status: str | None = None, page: int = 1, page_size: int = 20
    ) -> tuple[list[VendorProfile], int]:
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
            raise NotFoundError("User", user_id)

        user, profile = row

        return {
            "id": str(user.id),
            "email": user.email,
            "approval_status": profile.approval_status if profile else "pending",
            "company_name": profile.company_name if profile else user.company_name,
            "store_name": profile.store_name if profile else None,
            "phone": user.phone,
            "is_verified": user.is_verified,
            "created_at": profile.created_at if profile else user.created_at,
        }
