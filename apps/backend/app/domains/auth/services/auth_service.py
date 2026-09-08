import secrets
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Literal, Union

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings as security_settings
from app.core.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.core.logging import logger
from app.core.password_placeholder import can_authenticate_with_password, create_guest_password, create_pending_password
from app.core.password_security import validate_password
from app.core.security import (
    create_access_token,
    get_password_hash_async,
    verify_password_async,
)
from app.core.security_logging import (
    log_account_lockout,
    log_auth_failure,
    log_auth_success,
    log_token_issued,
)
from app.domains.auth.models.token_device import RefreshToken, UserDevice
from app.domains.auth.models.user import User
from app.domains.auth.repositories.auth_repository import RefreshTokenRepository, UserDeviceRepository, UserRepository
from app.domains.auth.schemas.auth_schemas import (
    ChangeEmailRequest,
    ChangePasswordRequest,
    DeleteAccountRequest,
    GuestLoginRequest,
    LoginRequest,
    OTPLoginRequest,
    RegisterCompleteRequest,
    RegisterInitiateRequest,
    Token,
    UserCreate,
    UserResponse,
    VendorUserCreate,
)
from app.domains.auth.services.account_lockout_service import AccountLockoutService
from app.domains.auth.services.otp_service import OTPService
from app.domains.vendor.services.vendor_service import VendorService


@dataclass
class AuthSuccess:
    user: User
    device_id: str
    remember_me: bool


@dataclass
class AuthFailure:
    reason: Literal[
        "user_not_found", "invalid_password", "account_disabled", "vendor_pending_approval", "account_locked"
    ]


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        self.token_repo = RefreshTokenRepository(db)
        self.device_repo = UserDeviceRepository(db)

    async def _ensure_driver_profile(self, user: User) -> None:
        """Create a DriverProfile for driver users if one doesn't exist.

        Driver profiles are required by logistics services (capacity tracking,
        matching, ETA estimation). Auto-provisioning here guarantees every
        driver who logs in gets a profile, regardless of how they were created.
        """
        if user.role != "driver":
            return

        from app.domains.logistics.models.driver_profile import DriverProfile, DriverStatus

        result = await self.db.execute(select(DriverProfile).where(DriverProfile.user_id == user.id))
        if not result.scalar_one_or_none():
            # Use .value to get the string value ("offline") instead of the enum name
            self.db.add(DriverProfile(user_id=user.id, status=DriverStatus.OFFLINE.value))
            await self.db.commit()

    async def initiate_registration(self, data: RegisterInitiateRequest) -> User:
        # Server-side validation: enforce allowed registration roles
        allowed_roles = {"customer", "vendor", "guest"}
        if data.role not in allowed_roles:
            raise BusinessRuleError(
                f"Role '{data.role}' is not allowed for public registration. Allowed roles: {', '.join(sorted(allowed_roles))}"
            )

        # Check if user already exists
        existing = await self.user_repo.get_by_email(data.email)
        if existing:
            if existing.is_verified:
                raise ConflictError("A verified user with this email already exists")
            # If exists but not verified, reuse it
            user = existing
        else:
            # Create a "pending" user with placeholder password
            user = User(
                email=data.email,
                password_hash=create_pending_password(),
                role=data.role,
                is_active=True,
                is_verified=False,
            )
            user = await self.user_repo.create(user)

        # Send OTP
        otp_service = OTPService(self.db)
        await otp_service.initiate_verification(user, method="email")

        return user

    async def complete_registration(self, data: RegisterCompleteRequest) -> User:
        user = await self.user_repo.get_by_email(data.email)
        if not user:
            raise NotFoundError("User", data.email)
        if not user.is_verified:
            raise BusinessRuleError("Email must be verified first")

        # Validate password strength
        user_info = {
            "email": data.email,
            "first_name": data.first_name,
            "last_name": data.last_name,
            "company_name": data.company_name,
        }
        is_valid, errors = validate_password(data.password, user_info)
        if not is_valid:
            raise BusinessRuleError(f"Password requirements not met: {'; '.join(errors)}")

        # Update user profile and password
        updates = {
            "password_hash": await get_password_hash_async(data.password),
            "first_name": data.first_name,
            "last_name": data.last_name,
            "phone": data.phone,
            "company_name": data.company_name,
        }
        user = await self.user_repo.update(user, updates)

        if user.role == "vendor":
            if not data.address_street or data.latitude is None or data.longitude is None:
                raise BusinessRuleError("Address street, latitude, and longitude are required for vendor registration.")

            from app.domains.vendor.services.vendor_service import VendorService

            vendor_service = VendorService(self.db)
            profile = await vendor_service.get_vendor_profile(str(user.id))
            if not profile:
                await vendor_service.create_vendor_profile(
                    user_id=str(user.id),
                    company_name=data.company_name or "Pending Store Name",
                    address_street=data.address_street,
                    latitude=data.latitude,
                    longitude=data.longitude,
                    place_id=data.place_id,
                )

        await self.db.commit()
        logger.info(f"Registration completed for user: {user.email}")
        return user

    async def register_user(self, user_in: UserCreate) -> User:
        # Server-side validation: enforce allowed registration roles
        allowed_roles = {"customer", "vendor", "guest"}
        if user_in.role not in allowed_roles:
            raise BusinessRuleError(
                f"Role '{user_in.role}' is not allowed for public registration. Allowed roles: {', '.join(sorted(allowed_roles))}"
            )

        # Check if user already exists
        existing = await self.user_repo.get_by_email(user_in.email)
        if existing:
            raise ConflictError("A user with this email already exists")

        # Validate password strength
        user_info = {"email": user_in.email, "first_name": user_in.firstName, "last_name": user_in.lastName}
        is_valid, errors = validate_password(user_in.password, user_info)
        if not is_valid:
            raise BusinessRuleError(f"Password requirements not met: {'; '.join(errors)}")

        user = User(
            email=user_in.email,
            password_hash=await get_password_hash_async(user_in.password),
            role=user_in.role,
            phone=user_in.phone,
            first_name=user_in.firstName,
            last_name=user_in.lastName,
        )
        user = await self.user_repo.create(user)
        await self.db.commit()
        logger.info(f"User registered: {user.email}")


        # Send welcome email
        try:
            from app.domains.shopping.services.email_notification_service import EmailNotificationService

            email_service = EmailNotificationService()
            user_name = f"{user.first_name} {user.last_name}".strip() or user.email.split("@")[0]
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
            raise ConflictError("A user with this email already exists")

        # Validate password strength
        user_info = {
            "email": vendor_in.email,
            "first_name": vendor_in.first_name,
            "last_name": vendor_in.last_name,
            "company_name": vendor_in.company_name,
        }
        is_valid, errors = validate_password(vendor_in.password, user_info)
        if not is_valid:
            raise BusinessRuleError(f"Password requirements not met: {'; '.join(errors)}")

        # Create vendor user
        vendor = User(
            email=vendor_in.email,
            password_hash=await get_password_hash_async(vendor_in.password),
            role="vendor",
            phone=vendor_in.phone,
            first_name=vendor_in.first_name,
            last_name=vendor_in.last_name,
            company_name=vendor_in.company_name,
            vat_number=vendor_in.vat_number,
            is_active=True,
            is_verified=False,  # Requires OTP verification
        )
        vendor = await self.user_repo.create(vendor)

        logger.info(f"Vendor registered: {vendor.email}, company: {vendor_in.company_name}")

        # Create vendor profile
        vendor_service = VendorService(self.db)
        await vendor_service.create_vendor_profile(
            user_id=str(vendor.id),
            company_name=vendor_in.company_name,
            vat_number=vendor_in.vat_number,
            address_street=vendor_in.address_street,
            latitude=vendor_in.latitude,
            longitude=vendor_in.longitude,
            place_id=vendor_in.place_id,
        )

        # Send OTP for email verification
        otp_service = OTPService(self.db)
        await otp_service.initiate_verification(vendor, method="email")

        return vendor

    async def authenticate(
        self,
        login_data: LoginRequest,
        request_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Union[AuthSuccess, AuthFailure]:
        """
        Authenticate user with email and password.

        Args:
            login_data: Login credentials
            request_id: Optional request ID for tracing
            ip_address: Optional client IP address
            user_agent: Optional client user agent

        Returns:
            AuthSuccess if authenticated, AuthFailure otherwise
        """
        # Initialize lockout service
        lockout_service = AccountLockoutService(self.db)

        # Check if account is locked before proceeding
        lockout_status = await lockout_service.get_lockout_status(login_data.email)
        if lockout_status.is_locked:
            log_account_lockout(
                email=login_data.email,
                failed_attempts=lockout_status.attempt_count,
                lockout_duration_minutes=max(1, lockout_status.remaining_seconds // 60),
                ip_address=ip_address,
                request_id=request_id,
            )
            logger.warning(f"Login attempt on locked account: {login_data.email}")
            return AuthFailure(reason="account_locked")

        user = await self.user_repo.get_by_email(login_data.email)

        if not user:
            log_auth_failure(
                email=login_data.email,
                reason="user_not_found",
                ip_address=ip_address,
                user_agent=user_agent,
                request_id=request_id,
            )
            await self.log_failed_login(login_data.email, login_data.device_id, "user_not_found")
            await lockout_service.record_failed_attempt(login_data.email, login_data.email)
            return AuthFailure(reason="user_not_found")

        # Explicitly reject placeholder passwords (pending, guest accounts)
        if not can_authenticate_with_password(user.password_hash):
            log_auth_failure(
                email=login_data.email,
                reason="placeholder_password",
                ip_address=ip_address,
                user_agent=user_agent,
                request_id=request_id,
            )
            logger.warning(f"Password login attempt on account with placeholder password: {login_data.email}")
            await self.log_failed_login(login_data.email, login_data.device_id, "placeholder_password")
            await lockout_service.record_failed_attempt(login_data.email, user.email)
            return AuthFailure(reason="invalid_password")

        if not await verify_password_async(login_data.password, user.password_hash):
            log_auth_failure(
                email=login_data.email,
                reason="invalid_password",
                ip_address=ip_address,
                user_agent=user_agent,
                request_id=request_id,
            )
            await self.log_failed_login(login_data.email, login_data.device_id, "invalid_password")
            # Record failed attempt with lockout service
            await lockout_service.record_failed_attempt(login_data.email, user.email)
            return AuthFailure(reason="invalid_password")

        # Check if user is active
        if not user.is_active:
            log_auth_failure(
                email=user.email,
                reason="account_disabled",
                ip_address=ip_address,
                user_agent=user_agent,
                request_id=request_id,
            )
            await self.log_failed_login(login_data.email, login_data.device_id, "account_disabled")
            return AuthFailure(reason="account_disabled")

        # Check vendor approval status
        if user.role == "vendor":
            from app.domains.vendor.models.vendor_profile import VendorProfile

            result = await self.db.execute(select(VendorProfile).where(VendorProfile.user_id == user.id))
            profile = result.scalar_one_or_none()
            if not profile or profile.approval_status != "approved":
                log_auth_failure(
                    email=user.email,
                    reason="vendor_pending_approval",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    request_id=request_id,
                )
                await self.log_failed_login(login_data.email, login_data.device_id, "vendor_not_approved")
                return AuthFailure(reason="vendor_pending_approval")

        # Successful login - reset failed attempt counter
        await lockout_service.reset_attempts(login_data.email)

        # Ensure driver users have a DriverProfile for logistics operations
        await self._ensure_driver_profile(user)

        # Create or update device record
        device = await self.device_repo.get_by_user_and_device(user.id, login_data.device_id)
        if not device:
            device = UserDevice(user_id=user.id, device_id=login_data.device_id, device_name=login_data.device_name)
            await self.device_repo.create(device)
        else:
            await self.device_repo.update(
                device, {"last_login": datetime.now(UTC), "device_name": login_data.device_name}
            )

        # Log successful authentication
        log_auth_success(
            user_id=str(user.id),
            email=user.email,
            method="password",
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id,
        )

        logger.info(
            f"User authenticated: {user.email} on device {login_data.device_id}, remember_me={login_data.remember_me}"
        )
        return AuthSuccess(
            user=user,
            device_id=login_data.device_id or "",
            remember_me=bool(login_data.remember_me),
        )

    async def create_tokens(
        self,
        user: User,
        device_id: str | None = None,
        remember_me: bool = False,
        request_id: str | None = None,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> Token:
        """
        Create access and refresh tokens for a user.

        Args:
            user: The user to create tokens for
            device_id: Optional device ID for session tracking
            remember_me: If True, refresh token expires in 30 days; otherwise 7 days
            request_id: Optional request ID for security logging
            ip_address: Optional IP address for security logging
            user_agent: Optional user agent for security logging

        Returns:
            Token object with new access_token and refresh_token
        """
        # Ensure vendor_profile is loaded for is_vendor_verified property
        if user.role == "vendor":
            from sqlalchemy import select
            from sqlalchemy.orm import selectinload

            result = await self.db.execute(
                select(User).options(selectinload(User.vendor_profile)).where(User.id == user.id)
            )
            user = result.scalar_one()

        # Determine token expiry based on remember_me preference or dynamic SystemSetting
        if remember_me:
            token_expiry_days = 30
        else:
            from app.domains.admin.services import SystemSettingService

            auth_settings = await SystemSettingService.get_setting(self.db, "auth_settings")
            if auth_settings and isinstance(auth_settings, dict) and "refresh_token_expire_days" in auth_settings:
                token_expiry_days = int(auth_settings["refresh_token_expire_days"])
            else:
                token_expiry_days = security_settings.REFRESH_TOKEN_EXPIRE_DAYS

        # Create new Refresh Token (token rotation)
        refresh_token_str = secrets.token_urlsafe(32)
        refresh_token = RefreshToken(
            token=refresh_token_str,
            user_id=user.id,
            device_id=device_id,
            expires_at=datetime.now(UTC) + timedelta(days=token_expiry_days),
        )
        await self.token_repo.create(refresh_token)

        # Create access token with enhanced claims
        access_token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
            "auth_time": int(datetime.now(UTC).timestamp()),  # When user authenticated
        }
        if device_id:
            access_token_data["device_id"] = device_id
        access_token = create_access_token(data=access_token_data)

        # Log token issuance
        log_token_issued(
            user_id=str(user.id),
            email=user.email,
            token_type="access",
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id,
        )
        log_token_issued(
            user_id=str(user.id),
            email=user.email,
            token_type="refresh",
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id,
        )

        return Token(
            access_token=access_token,
            refresh_token=refresh_token_str,
            token_type="bearer",
            expires_in=security_settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=UserResponse.model_validate(user),
        )

    async def authenticate_otp(self, login_data: OTPLoginRequest) -> Union[User, None]:
        """
        Authenticate user via OTP code.

        Returns:
            User if authentication successful, None otherwise
        """
        # Initialize lockout service
        lockout_service = AccountLockoutService(self.db)

        # Check if account is locked before proceeding
        lockout_status = await lockout_service.get_lockout_status(login_data.email)
        if lockout_status.is_locked:
            logger.warning(f"OTP login attempt on locked account: {login_data.email}")
            return None

        user = await self.user_repo.get_by_email(login_data.email)

        if not user:
            await lockout_service.record_failed_attempt(login_data.email, login_data.email)
            return None

        # Verify OTP code
        otp_service = OTPService(self.db)
        is_valid = await otp_service.verify_otp(str(user.id), login_data.code, purpose="login")
        if not is_valid:
            await lockout_service.record_failed_attempt(login_data.email, user.email)
            return None

        # Successful login - reset failed attempt counter
        await lockout_service.reset_attempts(login_data.email)

        # Mark user verified
        if not user.is_verified:
            await self.user_repo.update(user, {"is_verified": True})

        # Ensure driver users have a DriverProfile for logistics operations
        await self._ensure_driver_profile(user)

        # Create or update device record
        device = await self.device_repo.get_by_user_and_device(user.id, login_data.device_id)
        if not device:
            device = UserDevice(user_id=user.id, device_id=login_data.device_id, device_name=login_data.device_name)
            await self.device_repo.create(device)
        else:
            await self.device_repo.update(
                device, {"last_login": datetime.now(UTC), "device_name": login_data.device_name}
            )

        logger.info(f"User authenticated via OTP: {user.email} on device {login_data.device_id}")
        return user

    async def guest_login(self, guest_data: GuestLoginRequest) -> Union[User, None]:
        """
        Create or retrieve a guest user session.

        Guest users have limited permissions and should be prompted to register.
        Uses UUID-only identifier for better privacy (no email-like format).

        Returns:
            User if successful, None if device belongs to a registered user
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
                return user
            else:
                # Device belongs to a registered user, don't create guest
                return None

        # Create new guest user with UUID-only identifier (better privacy)
        guest_uuid = str(uuid.uuid4())
        temp_email = f"guest-{guest_uuid}@guest.mymeddevices.co.ke"

        # Create guest user with placeholder password (no password login)
        guest = User(
            email=temp_email,
            password_hash=create_guest_password(),
            role="guest",
            is_active=True,
            is_verified=True,  # Guest doesn't need verification
            first_name="Guest",
            last_name="User",
        )
        guest = await self.user_repo.create(guest)

        # Create device record
        device = UserDevice(
            user_id=guest.id, device_id=guest_data.device_id, device_name=guest_data.device_name or "Guest Device"
        )
        await self.device_repo.create(device)
        logger.info(f"New guest user created: {guest.email}")

        return guest

    async def log_failed_login(self, email: str, device_id: str, reason: str = "invalid_credentials") -> None:
        """
        Log failed login attempts for security monitoring.
        """
        logger.warning(
            f"Failed login attempt - Email: {email}, Device: {device_id}, Reason: {reason}, "
            f"Timestamp: {datetime.now(UTC).isoformat()}"
        )

    async def change_password(self, user: User, password_data: ChangePasswordRequest) -> bool:
        """
        Change user password.
        """
        # Verify old password
        if not await verify_password_async(password_data.old_password, user.password_hash):
            logger.warning(f"Password change failed - invalid old password for user: {user.email}")
            return False

        # Validate new password strength
        user_info = {
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "company_name": user.company_name,
        }
        is_valid, errors = validate_password(password_data.new_password, user_info)
        if not is_valid:
            logger.warning(f"Password change failed - weak password for user: {user.email}")
            raise BusinessRuleError(f"Password requirements not met: {'; '.join(errors)}")

        # Update password
        await self.user_repo.update(user, {"password_hash": await get_password_hash_async(password_data.new_password)})
        await self.db.commit()

        logger.info(f"Password changed successfully for user: {user.email}")
        return True

    async def initiate_email_change(self, user: User, email_data: ChangeEmailRequest) -> tuple[bool, str]:
        """
        Initiate email change process.
        """
        # Verify current password
        if not await verify_password_async(email_data.password, user.password_hash):
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

    async def confirm_email_change(self, user: User, new_email: str, otp_code: str) -> tuple[bool, str]:
        """
        Confirm email change with OTP code.
        """
        # Verify OTP with email_change purpose
        otp_service = OTPService(self.db)
        is_valid = await otp_service.verify_otp(str(user.id), otp_code, purpose="email_change")

        if not is_valid:
            return False, "Invalid or expired verification code"

        # Double check email is still available
        existing = await self.db.execute(select(User).where(User.email == new_email, User.id != user.id))
        if existing.scalar_one_or_none():
            return False, "Email already in use"

        # Update email
        old_email = user.email
        await self.user_repo.update(user, {"email": new_email})

        logger.info(f"Email changed successfully for user: {old_email} -> {new_email}")
        return True, "Email updated successfully"

    async def delete_account(self, user: User, delete_data: DeleteAccountRequest) -> tuple[bool, str]:
        """
        Delete user account (GDPR compliance).
        """
        # Verify password
        if not await verify_password_async(delete_data.password, user.password_hash):
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
                html_content=f"<h1>Account Deleted</h1><p>Hello {user.first_name},</p><p>Your account at MyMedDevices has been successfully deleted as per your request. All your personal data has been anonymized.</p><p>Thank you for being with us.</p>",
            )
        except Exception as e:
            logger.error(f"Failed to send account deletion confirmation email to {user.email}: {e}")

        # Soft delete - deactivate and anonymize
        await self.user_repo.update(
            user,
            {
                "is_active": False,
                "email": f"deleted_{user.id}@deleted.local",
                "password_hash": "!deleted_no_password",
                "first_name": "Deleted",
                "last_name": "User",
                "phone": None,
            },
        )

        # Anonymize linked vendor profile and archive products if user is a vendor
        if user.role == "vendor":
            from app.domains.vendor.models.vendor_profile import VendorProfile

            result = await self.db.execute(select(VendorProfile).where(VendorProfile.user_id == user.id))
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
                from sqlalchemy import func, update

                from app.domains.catalog.models.product import Product

                await self.db.execute(
                    update(Product)
                    .where(Product.vendor_id == profile.id)
                    .values(status="archived", is_deleted=True, deleted_at=func.now())
                )

        # Revoke all refresh tokens
        token_result = await self.db.execute(select(RefreshToken).where(RefreshToken.user_id == user.id))
        tokens = token_result.scalars().all()
        for token in tokens:
            token.revoked = True

        await self.db.commit()
        logger.warning(f"Account deleted for user: {user.email} (original email anonymized)")
        return True, "Account deleted successfully"

    async def reset_password(self, user: User, otp_code: str, new_password: str) -> bool:
        """
        Reset user password using OTP.
        """
        # Validate new password strength FIRST before consuming OTP
        user_info = {
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "company_name": user.company_name,
        }
        is_valid, errors = validate_password(new_password, user_info)
        if not is_valid:
            logger.warning(f"Password reset failed - weak password for user: {user.email}")
            raise BusinessRuleError(f"Password requirements not met: {'; '.join(errors)}")

        # Verify OTP and mark as used only after password validation passes
        otp_service = OTPService(self.db)
        is_valid = await otp_service.verify_otp(str(user.id), otp_code, purpose="reset_password")
        if not is_valid:
            logger.warning(f"Password reset failed - invalid OTP for user: {user.email}")
            return False

        # Update password
        await self.user_repo.update(user, {"password_hash": await get_password_hash_async(new_password)})

        # Revoke existing refresh tokens
        from sqlalchemy import update
        await self.db.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user.id)
            .values(revoked=True)
        )

        # Commit password update and token revocation
        await self.db.commit()

        # Clear any failed login attempts and lockout state for this user
        lockout_service = AccountLockoutService(self.db)
        await lockout_service.reset_attempts(user.email)

        logger.info(f"Password reset successfully for user: {user.email}")
        return True

    async def get_devices(self, user: User) -> list[UserDevice]:
        """
        Get all devices for a user.
        """
        result = await self.db.execute(select(UserDevice).where(UserDevice.user_id == user.id))
        return list(result.scalars().all())

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
        from sqlalchemy import delete, update

        # Delete other devices
        await self.db.execute(
            delete(UserDevice).where(UserDevice.user_id == user.id, UserDevice.device_id != current_device_id)
        )

        # Revoke other refresh tokens
        await self.db.execute(
            update(RefreshToken)
            .where(RefreshToken.user_id == user.id, RefreshToken.device_id != current_device_id)
            .values(revoked=True)
        )
        await self.db.commit()
        return True
