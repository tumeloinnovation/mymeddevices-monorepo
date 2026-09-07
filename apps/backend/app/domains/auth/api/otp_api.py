from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.core.dependencies import DbDep
from app.core.logging import logger
from app.core.rate_limiting import RateLimiterDependency
from app.core.responses import success_response
from app.domains.auth.dependencies import OTPServiceDep
from app.domains.auth.models.user import User
from app.domains.auth.schemas.auth_schemas import SendOTPRequest, VerifyOTPRequest

router = APIRouter(prefix="/otp", tags=["OTP Verification"])


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
        # Same response as an invalid code: revealing whether the email exists
        # would let attackers enumerate registered accounts.
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification code")
    
    # For reset_password, do not consume the OTP yet so that /auth/reset-password can consume it upon setting password
    consume = request.purpose != "reset_password"
    is_valid = await otp_service.verify_otp(str(user.id), request.code, request.purpose, consume=consume)

    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification code")

    # If email verification, mark user as verified
    if request.purpose == "verification":
        user.is_verified = True
        await db.commit()
        logger.info(f"User {user.email} verified successfully")

    message = "Email verified successfully!" if request.purpose == "verification" else "Verification code is valid"
    return success_response({"message": message, "is_verified": user.is_verified})


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
