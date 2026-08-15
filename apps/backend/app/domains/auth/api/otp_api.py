from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select

from app.core.dependencies import DbDep
from app.core.logging import logger
from app.core.rate_limiting import RateLimiterDependency
from app.core.responses import success_response
from app.domains.auth.dependencies import OTPServiceDep
from app.domains.auth.models.user import User

router = APIRouter(prefix="/otp", tags=["OTP Verification"])


class SendOTPRequest(BaseModel):
    """Request to send OTP code"""

    email: EmailStr
    purpose: Literal["verification", "reset_password", "login", "email_change"] = "verification"


class VerifyOTPRequest(BaseModel):
    """Request to verify OTP code"""

    email: EmailStr
    code: str
    purpose: Literal["verification", "reset_password", "login", "email_change"] = "verification"


@router.post("/send", dependencies=[Depends(RateLimiterDependency("otp"))])
async def send_otp(request: SendOTPRequest, db: DbDep, otp_service: OTPServiceDep):
    """
    Generate OTP code for user. (Email sending is disabled)

    Purposes:
    - verification: Email verification for new accounts
    - reset_password: Password reset confirmation
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user:
        # For security, don't reveal if email exists
        logger.info(f"OTP generation attempted for non-existent email: {request.email}")
        return success_response(
            {"message": "If the email exists, a verification code has been generated.", "expires_in_minutes": 15}
        )

    # Generate OTP and send email
    code = await otp_service.generate_otp(str(user.id), request.purpose)
    await otp_service.send_otp_email(user.email, code, request.purpose)

    return success_response({"message": "Verification code sent to your email!", "expires_in_minutes": 15})


@router.post("/verify", dependencies=[Depends(RateLimiterDependency("otp"))])
async def verify_otp(request: VerifyOTPRequest, db: DbDep, otp_service: OTPServiceDep):
    """
    Verify OTP code.

    For verification purpose, this will mark the user as verified.
    For reset_password purpose, this confirms the user can proceed with password reset.
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Verify OTP
    is_valid = await otp_service.verify_otp(str(user.id), request.code, request.purpose)

    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification code")

    # If email verification, mark user as verified
    if request.purpose == "verification":
        user.is_verified = True
        await db.commit()
        logger.info(f"User {user.email} verified successfully")

    return success_response({"message": "Email verified successfully!", "is_verified": user.is_verified})


@router.post("/resend", dependencies=[Depends(RateLimiterDependency("otp"))])
async def resend_otp(request: SendOTPRequest, db: DbDep, otp_service: OTPServiceDep):
    """
    Resend OTP code.
    This invalidates any previously sent codes.
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user:
        # For security, don't reveal if email exists
        return success_response(
            {"message": "If the email exists, a new verification code has been generated.", "expires_in_minutes": 15}
        )

    # Generate new OTP and send email
    code = await otp_service.generate_otp(str(user.id), request.purpose)
    await otp_service.send_otp_email(user.email, code, request.purpose)

    return success_response(
        {"message": "New verification code generated. Please check your email inbox.", "expires_in_minutes": 15}
    )
