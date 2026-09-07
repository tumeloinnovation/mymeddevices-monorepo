import secrets
import time
from datetime import UTC, datetime, timedelta

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.exceptions import BusinessRuleError
from app.core.logging import logger
from app.domains.auth.models.otp import OTP
from app.domains.auth.models.user import User

_in_memory_attempts: dict[str, int] = {}
_in_memory_expiry: dict[str, float] = {}


class OTPService:
    """
    Service for generating, storing, and verifying OTP codes.
    Supports SMS verification.
    """

    OTP_LENGTH = 6
    OTP_EXPIRY_MINUTES = 15
    PURPOSES = ["verification", "reset_password", "login", "email_change"]

    def __init__(self, db: AsyncSession):
        self.db = db
        self.redis_client = None
        import sys

        is_testing = "pytest" in sys.modules or "unittest" in sys.modules
        if not is_testing and settings.REDIS_URL:
            try:
                import redis.asyncio as aioredis

                self.redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
            except Exception:
                pass

    def _increment_in_memory_attempts(self, key: str) -> int:
        now = time.time()
        # Clean up expired in-memory keys
        for k, exp in list(_in_memory_expiry.items()):
            if exp < now:
                _in_memory_attempts.pop(k, None)
                _in_memory_expiry.pop(k, None)

        _in_memory_attempts[key] = _in_memory_attempts.get(key, 0) + 1
        if key not in _in_memory_expiry:
            _in_memory_expiry[key] = now + 900  # 15 minutes
        return _in_memory_attempts[key]

    async def generate_otp(self, user_id: str, purpose: str = "verification") -> str:
        """
        Generate a new OTP code for the user.

        Args:
            user_id: The user's UUID
            purpose: Purpose of OTP (verification, reset_password)

        Returns:
            The generated OTP code
        """
        if purpose not in self.PURPOSES:
            raise BusinessRuleError(f"Invalid purpose. Must be one of: {self.PURPOSES}")

        # Generate random 6-digit code
        code = "".join([str(secrets.choice(range(10))) for _ in range(self.OTP_LENGTH)])

        # Invalidate any existing OTPs for this user and purpose
        await self.db.execute(select(OTP).where(OTP.user_id == user_id, OTP.purpose == purpose))
        # Mark existing OTPs as used (soft delete)
        existing_otps = await self.db.execute(
            select(OTP).where(OTP.user_id == user_id, OTP.purpose == purpose, OTP.is_used == False)
        )
        for otp in existing_otps.scalars():
            otp.is_used = True

        # Create new OTP
        otp = OTP(
            user_id=user_id,
            code=code,
            expires_at=datetime.now(UTC) + timedelta(minutes=self.OTP_EXPIRY_MINUTES),
            purpose=purpose,
        )
        self.db.add(otp)
        await self.db.commit()

        logger.info(f"OTP generated for user {user_id}, purpose: {purpose}")

        return code

    async def verify_otp(
        self, user_id: str, code: str, purpose: str = "verification", consume: bool = True
    ) -> bool:
        """
        Verify an OTP code for the user.

        Args:
            user_id: The user's UUID
            code: The OTP code to verify
            purpose: Purpose of OTP (verification, reset_password)
            consume: Whether to mark OTP as used upon successful verification (default True)

        Returns:
            True if OTP is valid, False otherwise
        """
        if purpose not in self.PURPOSES:
            raise BusinessRuleError(f"Invalid purpose. Must be one of: {self.PURPOSES}")

        # Find active OTP for this user and purpose
        result = await self.db.execute(
            select(OTP)
            .where(OTP.user_id == user_id, OTP.purpose == purpose, OTP.is_used == False)
            .order_by(OTP.created_at.desc())
        )
        otp = result.scalars().first()

        if not otp:
            logger.warning(f"No active OTP found for user {user_id}, purpose: {purpose}")
            return False

        # Check expiry
        if otp.expires_at < datetime.now(UTC):
            logger.warning(f"Expired OTP attempt for user {user_id}")
            return False

        # Verify code (constant-time comparison to avoid timing oracles)
        key = f"otp_attempts:{user_id}:{purpose}"
        if not secrets.compare_digest(otp.code, code):
            # Increment failed attempts
            attempts = 0
            if self.redis_client:
                try:
                    attempts = await self.redis_client.incr(key)
                    if attempts == 1:
                        await self.redis_client.expire(key, 900)
                except Exception:
                    attempts = self._increment_in_memory_attempts(key)
            else:
                attempts = self._increment_in_memory_attempts(key)

            logger.warning(f"Invalid OTP attempt {attempts}/5 for user {user_id}, purpose: {purpose}")

            if attempts >= 5:
                # Lockout/invalidate the OTP
                otp.is_used = True
                await self.db.commit()
                # Clear attempts
                if self.redis_client:
                    try:
                        await self.redis_client.delete(key)
                    except Exception:
                        pass
                _in_memory_attempts.pop(key, None)
                _in_memory_expiry.pop(key, None)
                logger.error(f"OTP invalidated due to excessive failed attempts for user {user_id}, purpose: {purpose}")
            return False

        # Success - mark OTP as used if consume=True
        if consume:
            otp.is_used = True
            await self.db.commit()

        # Clear attempts on success
        if self.redis_client:
            try:
                await self.redis_client.delete(key)
            except Exception:
                pass
        _in_memory_attempts.pop(key, None)
        _in_memory_expiry.pop(key, None)

        logger.info(f"OTP verified for user {user_id}, purpose: {purpose} (consume={consume})")
        return True

    async def send_otp_sms(self, phone: str, code: str, purpose: str = "verification"):
        """
        Send OTP code via HostPinnacle SMS (textsms.co.ke API).
        Falls back to logging if API credentials are not configured.

        Args:
            phone: Recipient phone number
            code: OTP code
            purpose: Purpose of OTP
        """
        cleaned_phone = phone.replace("+", "").strip()

        if not settings.HOSTPINNACLE_API_KEY or not settings.HOSTPINNACLE_PARTNER_ID:
            # Never log OTP codes outside local development environments —
            # a login-purpose OTP is a live credential.
            if settings.ENVIRONMENT.lower() in ("development", "dev", "local"):
                logger.info(f"HOSTPINNACLE SMS credentials not configured. SMS (simulated): To={phone}, Code={code}")
            else:
                logger.warning(
                    f"HOSTPINNACLE SMS credentials not configured in {settings.ENVIRONMENT} environment. "
                    f"OTP SMS to {phone} was NOT delivered."
                )
            return True

        payload = {
            "apikey": settings.HOSTPINNACLE_API_KEY,
            "partnerID": settings.HOSTPINNACLE_PARTNER_ID,
            "message": f"Your MyMedDevices code is: {code}. Valid for {self.OTP_EXPIRY_MINUTES} min.",
            "shortcode": settings.HOSTPINNACLE_SENDER_ID,
            "mobile": cleaned_phone,
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://sms.textsms.co.ke/api/services/sendsms/", json=payload, timeout=10.0
                )
                response_data = response.json()
                logger.info(f"HostPinnacle SMS response: {response_data}")
                return response.status_code == 200
        except Exception as e:
            logger.error(f"Failed to send SMS via HostPinnacle to {phone}: {e}")
            return False

    async def send_otp_email(self, email: str, code: str, purpose: str = "verification"):
        """
        Send OTP code via SMTP using the branded HTML template.
        """
        from app.domains.shopping.services.email_notification_service import EmailNotificationService

        email_service = EmailNotificationService()
        await email_service.send_otp(email, code, purpose)

    async def initiate_verification(self, user: User, method: str = "sms") -> str:
        """
        Initiate verification process for a user.

        Args:
            user: The user to verify
            method: Verification method (sms)

        Returns:
            The generated OTP code (for testing)
        """
        code = await self.generate_otp(str(user.id), purpose="verification")

        if method == "sms" and user.phone:
            await self.send_otp_sms(user.phone, code)
        else:
            await self.send_otp_email(user.email, code, purpose="verification")

        return code  # Return for testing purposes
