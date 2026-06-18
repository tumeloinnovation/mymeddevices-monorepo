import secrets
import httpx
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domains.auth.models.user import User
from app.domains.auth.models.otp import OTP
from app.core.logging import logger
from app.core.security import settings


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

    async def generate_otp(
        self,
        user_id: str,
        purpose: str = "verification"
    ) -> str:
        """
        Generate a new OTP code for the user.

        Args:
            user_id: The user's UUID
            purpose: Purpose of OTP (verification, reset_password)

        Returns:
            The generated OTP code
        """
        if purpose not in self.PURPOSES:
            raise ValueError(f"Invalid purpose. Must be one of: {self.PURPOSES}")

        # Generate random 6-digit code
        code = ''.join([str(secrets.choice(range(10))) for _ in range(self.OTP_LENGTH)])

        # Invalidate any existing OTPs for this user and purpose
        await self.db.execute(
            select(OTP).where(
                OTP.user_id == user_id,
                OTP.purpose == purpose
            )
        )
        # Mark existing OTPs as used (soft delete)
        existing_otps = await self.db.execute(
            select(OTP).where(
                OTP.user_id == user_id,
                OTP.purpose == purpose,
                OTP.is_used == False
            )
        )
        for otp in existing_otps.scalars():
            otp.is_used = True

        # Create new OTP
        otp = OTP(
            user_id=user_id,
            code=code,
            expires_at=datetime.now(timezone.utc) + timedelta(minutes=self.OTP_EXPIRY_MINUTES),
            purpose=purpose
        )
        self.db.add(otp)
        await self.db.commit()

        logger.info(f"OTP generated for user {user_id}, purpose: {purpose}")

        return code

    async def verify_otp(
        self,
        user_id: str,
        code: str,
        purpose: str = "verification"
    ) -> bool:
        """
        Verify an OTP code for the user.

        Args:
            user_id: The user's UUID
            code: The OTP code to verify
            purpose: Purpose of OTP (verification, reset_password)

        Returns:
            True if OTP is valid, False otherwise
        """
        if purpose not in self.PURPOSES:
            raise ValueError(f"Invalid purpose. Must be one of: {self.PURPOSES}")

        # Find valid OTP
        result = await self.db.execute(
            select(OTP).where(
                OTP.user_id == user_id,
                OTP.code == code,
                OTP.purpose == purpose,
                OTP.is_used == False
            )
        )
        otp = result.scalar_one_or_none()

        if not otp:
            logger.warning(f"Invalid OTP attempt for user {user_id}")
            return False

        # Check expiry
        if otp.expires_at < datetime.now(timezone.utc):
            logger.warning(f"Expired OTP attempt for user {user_id}")
            return False

        # Mark OTP as used
        otp.is_used = True
        await self.db.commit()

        logger.info(f"OTP verified for user {user_id}, purpose: {purpose}")

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
            logger.info(f"HOSTPINNACLE SMS credentials not configured. SMS (simulated): To={phone}, Code={code}")
            return True

        payload = {
            "apikey": settings.HOSTPINNACLE_API_KEY,
            "partnerID": settings.HOSTPINNACLE_PARTNER_ID,
            "message": f"Your MyMedDevices code is: {code}. Valid for {self.OTP_EXPIRY_MINUTES} min.",
            "shortcode": settings.HOSTPINNACLE_SENDER_ID,
            "mobile": cleaned_phone
        }

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://sms.textsms.co.ke/api/services/sendsms/",
                    json=payload,
                    timeout=10.0
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

    async def initiate_verification(
        self,
        user: User,
        method: str = "sms"
    ) -> str:
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
