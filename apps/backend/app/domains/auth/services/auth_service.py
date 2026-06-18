import secrets
from datetime import datetime, timedelta, timezone
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.security import get_password_hash, verify_password, create_access_token, settings as security_settings
from app.domains.auth.models.user import User
from app.domains.auth.models.token_device import RefreshToken, UserDevice
from app.domains.auth.schemas.auth_schemas import (
    UserCreate, VendorUserCreate, LoginRequest, OTPLoginRequest, GuestLoginRequest,
    ChangePasswordRequest, ChangeEmailRequest, DeleteAccountRequest,
    RegisterInitiateRequest, RegisterCompleteRequest
)
from app.core.logging import logger
from app.domains.auth.services.otp_service import OTPService
from app.domains.auth.repositories.auth_repository import UserRepository, RefreshTokenRepository, UserDeviceRepository
from app.domains.vendor.services.vendor_service import VendorService

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.token_repo = RefreshTokenRepository(db)
        self.device_repo = UserDeviceRepository(db)

    async def initiate_registration(self, data: RegisterInitiateRequest) -> User:
        # Check if user already exists
        existing = await self.user_repo.get_by_email(data.email)
        if existing:
            if existing.is_verified:
                raise ValueError("A verified user with this email already exists")
            # If exists but not verified, reuse it
            user = existing
        else:
            # Create a "pending" user
            user = User(
                email=data.email,
                password_hash="!pending_registration_" + secrets.token_hex(16),
                role=data.role,
                is_active=True,
                is_verified=False
            )
            user = await self.user_repo.create(user)
            
        # Send OTP
        otp_service = OTPService(self.db)
        await otp_service.initiate_verification(user, method="email")
        
        return user

    async def complete_registration(self, data: RegisterCompleteRequest) -> User:
        user = await self.user_repo.get_by_email(data.email)
        if not user:
            raise ValueError("User not found")
        if not user.is_verified:
            raise ValueError("Email must be verified first")
            
        # Update user profile and password
        updates = {
            "password_hash": get_password_hash(data.password),
            "first_name": data.first_name,
            "last_name": data.last_name,
            "phone": data.phone,
            "company_name": data.company_name
        }
        user = await self.user_repo.update(user, updates)
        
        # If vendor, ensure profile is created if not already
        if user.role == "vendor":
            from app.domains.vendor.services.vendor_service import VendorService
            vendor_service = VendorService(self.db)
            profile = await vendor_service.get_vendor_profile(str(user.id))
            if not profile:
                await vendor_service.create_vendor_profile(
                    user_id=str(user.id),
                    company_name=data.company_name or "Pending Store Name"
                )
                
        logger.info(f"Registration completed for user: {user.email}")
        return user

    async def register_user(self, user_in: UserCreate) -> User:
        user = User(
            email=user_in.email,
            password_hash=get_password_hash(user_in.password),
            role=user_in.role,
            phone=user_in.phone,
            first_name=user_in.firstName,
            last_name=user_in.lastName
        )
        user = await self.user_repo.create(user)
        logger.info(f"User registered: {user.email}")

        # Send welcome email
        try:
            from app.domains.shopping.services.email_notification_service import EmailNotificationService
            email_service = EmailNotificationService()
            user_name = f"{user.first_name} {user.last_name}".strip() or user.email.split('@')[0]
            await email_service.send_account_welcome(user.email, user_name, str(user.id))
        except Exception as e:
            logger.error(f"Failed to send welcome email: {e}")

        return user

    async def register_vendor(self, vendor_in: VendorUserCreate) -> User:
        """
        Register a new vendor with initial fields.
        Vendor requires OTP verification and admin approval before accessing dashboard.
        """
        # Check if vendor already exists
        existing = await self.user_repo.get_by_email(vendor_in.email)
        if existing:
            raise ValueError("A user with this email already exists")

        # Create vendor user
        vendor = User(
            email=vendor_in.email,
            password_hash=get_password_hash(vendor_in.password),
            role="vendor",
            phone=vendor_in.phone,
            first_name=vendor_in.first_name,
            last_name=vendor_in.last_name,
            company_name=vendor_in.company_name,
            vat_number=vendor_in.vat_number,
            is_active=True,
            is_verified=False  # Requires OTP verification
        )
        vendor = await self.user_repo.create(vendor)

        logger.info(f"Vendor registered: {vendor.email}, company: {vendor_in.company_name}")

        # Create vendor profile
        vendor_service = VendorService(self.db)
        await vendor_service.create_vendor_profile(
            user_id=str(vendor.id),
            company_name=vendor_in.company_name,
            vat_number=vendor_in.vat_number
        )

        # Send OTP for email verification
        otp_service = OTPService(self.db)
        await otp_service.initiate_verification(vendor, method="email")

        return vendor

    async def authenticate(self, login_data: LoginRequest) -> tuple[User, str]:
        user = await self.user_repo.get_by_email(login_data.email)

        if not user:
            await self.log_failed_login(login_data.email, login_data.device_id, "user_not_found")
            return None, None

        if not verify_password(login_data.password, user.password_hash):
            await self.log_failed_login(login_data.email, login_data.device_id, "invalid_password")
            return None, None

        # Check if user is active
        if not user.is_active:
            await self.log_failed_login(login_data.email, login_data.device_id, "account_disabled")
            return None, None

        # Check vendor approval status
        if user.role == "vendor":
            from app.domains.vendor.models.vendor_profile import VendorProfile
            result = await self.db.execute(
                select(VendorProfile).where(VendorProfile.user_id == user.id)
            )
            profile = result.scalar_one_or_none()
            if not profile or profile.approval_status != "approved":
                await self.log_failed_login(login_data.email, login_data.device_id, "vendor_not_approved")
                # We return a specific message for this in the API layer or handle it here
                # For now, let's return None and we'll handle the specific error message in the API
                return "vendor_pending_approval", None

        # Create or update device record
        device = await self.device_repo.get_by_user_and_device(user.id, login_data.device_id)
        if not device:
            device = UserDevice(user_id=user.id, device_id=login_data.device_id, device_name=login_data.device_name)
            await self.device_repo.create(device)
        else:
            await self.device_repo.update(device, {
                "last_login": datetime.now(timezone.utc),
                "device_name": login_data.device_name
            })

        # Determine token expiry based on remember_me preference
        token_expiry_days = 30 if login_data.remember_me else security_settings.REFRESH_TOKEN_EXPIRE_DAYS

        # Create Refresh Token
        refresh_token_str = secrets.token_urlsafe(32)
        refresh_token = RefreshToken(
            token=refresh_token_str,
            user_id=user.id,
            device_id=login_data.device_id,
            expires_at=datetime.now(timezone.utc) + timedelta(days=token_expiry_days)
        )
        await self.token_repo.create(refresh_token)

        logger.info(f"User authenticated: {user.email} on device {login_data.device_id}, remember_me={login_data.remember_me}")
        return user, refresh_token_str

    async def create_tokens(self, user: User, refresh_token: str) -> dict:
        # Ensure vendor_profile is loaded for is_vendor_verified property
        if user.role == "vendor":
            from sqlalchemy import select
            from sqlalchemy.orm import selectinload
            from app.domains.vendor.models.vendor_profile import VendorProfile
            result = await self.db.execute(
                select(User).options(selectinload(User.vendor_profile)).where(User.id == user.id)
            )
            user = result.scalar_one()

        # Resolve device_id from refresh token if available to track current session
        device_id = None
        if refresh_token:
            token_obj = await self.token_repo.get_by_token(refresh_token)
            if token_obj:
                device_id = token_obj.device_id

        access_token_data = {"sub": str(user.id), "email": user.email, "role": user.role}
        if device_id:
            access_token_data["device_id"] = device_id
        access_token = create_access_token(data=access_token_data)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": security_settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "role": user.role,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone": user.phone,
                "is_active": user.is_active,
                "is_verified": user.is_verified,
                "is_vendor_verified": user.is_vendor_verified,
            }
        }

    async def authenticate_otp(self, login_data: OTPLoginRequest) -> tuple[User, str]:
        user = await self.user_repo.get_by_email(login_data.email)
        
        if not user:
            return None, None

        # Verify OTP code
        otp_service = OTPService(self.db)
        is_valid = await otp_service.verify_otp(str(user.id), login_data.code, purpose="login")
        if not is_valid:
            return None, None

        # Mark user verified
        if not user.is_verified:
            await self.user_repo.update(user, {"is_verified": True})

        # Create or update device record
        device = await self.device_repo.get_by_user_and_device(user.id, login_data.device_id)
        if not device:
            device = UserDevice(user_id=user.id, device_id=login_data.device_id, device_name=login_data.device_name)
            await self.device_repo.create(device)
        else:
            await self.device_repo.update(device, {
                "last_login": datetime.now(timezone.utc),
                "device_name": login_data.device_name
            })
        
        # Create Refresh Token
        refresh_token_str = secrets.token_urlsafe(32)
        refresh_token = RefreshToken(
            token=refresh_token_str,
            user_id=user.id,
            device_id=login_data.device_id,
            expires_at=datetime.now(timezone.utc) + timedelta(days=security_settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        await self.token_repo.create(refresh_token)
        
        logger.info(f"User authenticated via OTP: {user.email} on device {login_data.device_id}")
        return user, refresh_token_str

    async def guest_login(self, guest_data: GuestLoginRequest) -> tuple[User, str]:
        """
        Create or retrieve a guest user session.
        For guest users, we create a temporary user with a generated email.
        Guest users have limited permissions and should be prompted to register.
        """
        # Check if guest session already exists for this device
        result = await self.db.execute(
            select(UserDevice)
            .options(selectinload(UserDevice.user))
            .where(UserDevice.device_id == guest_data.device_id)
        )
        device = result.scalar_one_or_none()

        # If device exists and belongs to a guest user, reuse it
        if device and device.user:
            user = device.user
            if user.role == "guest":
                logger.info(f"Existing guest session found: {user.email}")
            else:
                # Device belongs to a registered user, don't create guest
                return None, None
        else:
            # Create new guest user with temporary email
            guest_id = secrets.token_hex(8)
            temp_email = f"guest_{guest_id}@temp.local"

            # Create guest user (no password)
            guest = User(
                email=temp_email,
                password_hash="!guest_no_password",  # No password for guest
                role="guest",
                is_active=True,
                is_verified=True,  # Guest doesn't need verification
                first_name="Guest",
                last_name=f"User({guest_id[:4]})"
            )
            guest = await self.user_repo.create(guest)

            # Create device record
            device = UserDevice(
                user_id=guest.id,
                device_id=guest_data.device_id,
                device_name=guest_data.device_name or "Guest Device"
            )
            await self.device_repo.create(device)
            user = guest
            logger.info(f"New guest user created: {user.email}")

        # Create refresh token for guest
        refresh_token_str = secrets.token_urlsafe(32)
        # Guest tokens expire in 7 days (configurable)
        refresh_token = RefreshToken(
            token=refresh_token_str,
            user_id=user.id,
            device_id=guest_data.device_id,
            expires_at=datetime.now(timezone.utc) + timedelta(days=7)
        )
        await self.token_repo.create(refresh_token)

        return user, refresh_token_str

    async def log_failed_login(self, email: str, device_id: str, reason: str = "invalid_credentials") -> None:
        """
        Log failed login attempts for security monitoring.
        """
        logger.warning(
            f"Failed login attempt - Email: {email}, Device: {device_id}, Reason: {reason}, "
            f"Timestamp: {datetime.now(timezone.utc).isoformat()}"
        )

    async def change_password(
        self,
        user: User,
        password_data: ChangePasswordRequest
    ) -> bool:
        """
        Change user password.
        """
        # Verify old password
        if not verify_password(password_data.old_password, user.password_hash):
            logger.warning(f"Password change failed - invalid old password for user: {user.email}")
            return False

        # Update password
        await self.user_repo.update(user, {"password_hash": get_password_hash(password_data.new_password)})

        logger.info(f"Password changed successfully for user: {user.email}")
        return True

    async def initiate_email_change(
        self,
        user: User,
        email_data: ChangeEmailRequest
    ) -> tuple[bool, str]:
        """
        Initiate email change process.
        """
        # Verify current password
        if not verify_password(email_data.password, user.password_hash):
            logger.warning(f"Email change failed - invalid password for user: {user.email}")
            return False, "Invalid password"

        # Check if new email already exists
        existing = await self.user_repo.get_by_email(email_data.new_email)
        if existing:
            return False, "Email already in use"

        # Send OTP to new email for verification
        otp_service = OTPService(self.db)

        # Generate OTP and send email
        otp = await otp_service.generate_otp(str(user.id), purpose="email_change")
        await otp_service.send_otp_email(email_data.new_email, otp, purpose="email_change")

        logger.info(f"Email change initiated for user {user.email} -> {email_data.new_email}")
        return True, "Verification code generated for new email. Please check your inbox."

    async def confirm_email_change(
        self,
        user: User,
        new_email: str,
        otp_code: str
    ) -> tuple[bool, str]:
        """
        Confirm email change with OTP code.
        """
        # Verify OTP with email_change purpose
        otp_service = OTPService(self.db)
        is_valid = await otp_service.verify_otp(str(user.id), otp_code, purpose="email_change")

        if not is_valid:
            return False, "Invalid or expired verification code"

        # Double check email is still available
        existing = await self.db.execute(
            select(User).where(User.email == new_email, User.id != user.id)
        )
        if existing.scalar_one_or_none():
            return False, "Email already in use"

        # Update email
        old_email = user.email
        await self.user_repo.update(user, {"email": new_email})

        logger.info(f"Email changed successfully for user: {old_email} -> {new_email}")
        return True, "Email updated successfully"

    async def delete_account(
        self,
        user: User,
        delete_data: DeleteAccountRequest
    ) -> tuple[bool, str]:
        """
        Delete user account (GDPR compliance).
        """
        # Verify password
        if not verify_password(delete_data.password, user.password_hash):
            logger.warning(f"Account deletion failed - invalid password for user: {user.email}")
            return False, "Invalid password"

        # Verify confirmation
        if not delete_data.confirm:
            return False, "You must confirm account deletion"

        # Send confirmation email before anonymizing
        from app.core.mail import send_email
        try:
            await send_email(
                to_email=user.email,
                subject="Account Deleted - MyMedDevices",
                body=f"Hello {user.first_name},\n\nYour account at MyMedDevices has been successfully deleted as per your request. All your personal data has been anonymized.\n\nThank you for being with us.",
                html_content=f"<h1>Account Deleted</h1><p>Hello {user.first_name},</p><p>Your account at MyMedDevices has been successfully deleted as per your request. All your personal data has been anonymized.</p><p>Thank you for being with us.</p>"
            )
        except Exception as e:
            logger.error(f"Failed to send account deletion confirmation email to {user.email}: {e}")

        # Soft delete - deactivate and anonymize
        await self.user_repo.update(user, {
            "is_active": False,
            "email": f"deleted_{user.id}@deleted.local",
            "password_hash": "!deleted_no_password",
            "first_name": "Deleted",
            "last_name": "User",
            "phone": None
        })

        # Anonymize linked vendor profile and archive products if user is a vendor
        if user.role == "vendor":
            from app.domains.vendor.models.vendor_profile import VendorProfile
            result = await self.db.execute(
                select(VendorProfile).where(VendorProfile.user_id == user.id)
            )
            profile = result.scalar_one_or_none()
            if profile:
                profile.store_name = "Deleted Vendor"
                profile.store_description = "This vendor account has been deleted."
                profile.business_email = None
                profile.business_phone = None
                profile.address_street = None
                profile.address_city = None
                profile.address_region = None
                profile.place_id = None
                profile.mpesa_phone = None
                profile.mpesa_business_name = None
                profile.mpesa_till_number = None
                profile.mpesa_paybill_number = None
                profile.bank_account_name = None
                profile.bank_account_number = None
                profile.bank_name = None
                profile.bank_branch = None
                profile.bank_swift_code = None
                profile.bank_iban = None
                profile.company_name = "Deleted Company"
                profile.vat_number = None
                profile.approval_status = "suspended"
                profile.document_urls = None

                # Archive and soft-delete all products of this vendor
                from app.domains.catalog.models.product import Product
                from sqlalchemy import update, func
                await self.db.execute(
                    update(Product)
                    .where(Product.vendor_id == profile.id)
                    .values(status="archived", is_deleted=True, deleted_at=func.now())
                )

        # Revoke all refresh tokens
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.user_id == user.id)
        )
        tokens = result.scalars().all()
        for token in tokens:
            token.revoked = True

        await self.db.commit()

        logger.warning(f"Account deleted for user: {user.email} (original email anonymized)")
        return True, "Account deleted successfully"

    async def reset_password(
        self,
        user: User,
        otp_code: str,
        new_password: str
    ) -> bool:
        """
        Reset user password using OTP.
        """
        otp_service = OTPService(self.db)
        is_valid = await otp_service.verify_otp(str(user.id), otp_code, purpose="reset_password")
        if not is_valid:
            logger.warning(f"Password reset failed - invalid OTP for user: {user.email}")
            return False

        # Update password
        await self.user_repo.update(user, {"password_hash": get_password_hash(new_password)})

        logger.info(f"Password reset successfully for user: {user.email}")
        return True

    async def get_devices(self, user: User) -> list[UserDevice]:
        """
        Get all devices for a user.
        """
        result = await self.db.execute(
            select(UserDevice).where(UserDevice.user_id == user.id)
        )
        return result.scalars().all()

    async def delete_device(self, user: User, device_id: str) -> bool:
        """
        Delete a user device and revoke its refresh token.
        """
        # Find device
        device = await self.device_repo.get_by_user_and_device(user.id, device_id)
        if not device:
            return False
            
        # Delete device
        await self.device_repo.delete(device.id)
        
        # Revoke associated refresh token
        from sqlalchemy import update
        await self.db.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user.id, RefreshToken.device_id == device_id)
            .values(revoked=True)
        )
        await self.db.commit()
        return True

    async def delete_all_other_devices(self, user: User, current_device_id: str) -> bool:
        """
        Delete all user devices except the current one and revoke their refresh tokens.
        """
        from sqlalchemy import delete
        
        # Delete other devices
        await self.db.execute(
            delete(UserDevice)
            .where(UserDevice.user_id == user.id, UserDevice.device_id != current_device_id)
        )
        
        # Revoke other refresh tokens
        from sqlalchemy import update
        await self.db.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user.id, RefreshToken.device_id != current_device_id)
            .values(revoked=True)
        )
        await self.db.commit()
        return True
