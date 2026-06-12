from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid
from app.core.database import get_db
from app.core.responses import success_response, ApiSuccessResponse
from app.core.security import verify_access_token
from app.domains.auth.schemas.auth_schemas import (
    UserCreate, VendorUserCreate, UserResponse, Token, LoginRequest, RefreshRequest,
    OTPLoginRequest, GuestLoginRequest, ChangePasswordRequest, ChangeEmailRequest,
    ConfirmEmailChangeRequest, DeleteAccountRequest, ForgotPasswordRequest, ResetPasswordRequest,
    UserRegisterResponse, VendorRegisterResponse
)
from app.domains.auth.services.auth_service import AuthService
from app.domains.auth.models.user import User
from app.domains.auth.models.token_device import RefreshToken
from app.core.logging import logger
from app.core.rate_limiting import RateLimiterDependency
from app.core.dependencies import get_current_user

router = APIRouter(tags=["Authentication"])


@router.post("/register", response_model=ApiSuccessResponse[UserRegisterResponse], dependencies=[Depends(RateLimiterDependency("register"))])
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    user = await auth_service.register_user(user_in)
    return success_response({
        "id": str(user.id),
        "email": user.email,
        "role": user.role,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "phone": user.phone,
        "is_active": user.is_active,
        "is_verified": user.is_verified,
    })


@router.post("/register/vendor", response_model=ApiSuccessResponse[VendorRegisterResponse], status_code=status.HTTP_201_CREATED, dependencies=[Depends(RateLimiterDependency("register"))])
async def register_vendor(vendor_in: VendorUserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new vendor.

    Flow:
    1. Submit registration with company info
    2. OTP sent to email for verification
    3. Verify OTP to activate account
    4. Wait for admin approval
    5. Complete profile in settings
    6. Start selling
    """
    auth_service = AuthService(db)
    try:
        vendor = await auth_service.register_vendor(vendor_in)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    return success_response({
        "id": str(vendor.id),
        "email": vendor.email,
        "role": vendor.role,
        "company_name": vendor.company_name,
        "phone": vendor.phone,
        "is_verified": vendor.is_verified,
        "message": "Registration successful. Please check your email for verification code.",
        "next_steps": [
            "1. Verify your email with the OTP code sent",
            "2. Wait for admin approval (you'll receive an email)",
            "3. Complete your profile settings",
            "4. Start listing products"
        ]
    })

@router.post("/login", dependencies=[Depends(RateLimiterDependency("login"))])
async def login(login_data: LoginRequest, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    user, refresh_token = await auth_service.authenticate(login_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    return success_response(await auth_service.create_tokens(user, refresh_token))

@router.post("/login/otp", dependencies=[Depends(RateLimiterDependency("login"))])
async def login_otp(login_data: OTPLoginRequest, db: AsyncSession = Depends(get_db)):
    auth_service = AuthService(db)
    user, refresh_token = await auth_service.authenticate_otp(login_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or verification code",
        )
    return success_response(await auth_service.create_tokens(user, refresh_token))


@router.post("/guest", dependencies=[Depends(RateLimiterDependency("guest_login"))])
async def guest_login(guest_data: GuestLoginRequest, db: AsyncSession = Depends(get_db)):
    """
    Create or retrieve a guest user session.

    Guest users can browse the platform without registration.
    They receive temporary credentials and limited access.
    """
    auth_service = AuthService(db)
    user, refresh_token = await auth_service.guest_login(guest_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Device already registered to a regular user. Please log in with your credentials.",
        )
    return success_response(await auth_service.create_tokens(user, refresh_token))

@router.post("/refresh")
async def refresh(refresh_data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    """Refresh access token using refresh token"""
    auth_service = AuthService(db)

    # Verify refresh token exists and is not revoked
    result = await db.execute(
        select(RefreshToken, User).join(User, RefreshToken.user_id == User.id).where(
            RefreshToken.token == refresh_data.refresh_token,
            RefreshToken.revoked == False
        )
    )
    token_user = result.first()

    if not token_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    refresh_token_obj, user = token_user

    # Check if token is expired
    from datetime import datetime, timezone
    if refresh_token_obj.expires_at < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
        )

    # Create new tokens
    tokens = await auth_service.create_tokens(user, refresh_data.refresh_token)

    logger.info(f"Token refreshed for user: {user.email}")
    return success_response(tokens)

@router.post("/logout")
async def logout(
    refresh_data: RefreshRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Revoke refresh token and blacklist current access token JTI"""
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token == refresh_data.refresh_token)
    )
    refresh_token = result.scalar_one_or_none()

    if refresh_token:
        refresh_token.revoked = True
        await db.commit()
        logger.info(f"User logged out, token revoked")

    # Blacklist current access token if provided in request headers
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ")[1]
        payload = verify_access_token(token)
        if payload:
            jti = payload.get("jti")
            exp = payload.get("exp")
            if jti and exp:
                from app.core.blacklist import token_blacklist
                from datetime import datetime, timezone
                now = int(datetime.now(timezone.utc).timestamp())
                expires_in = exp - now
                if expires_in > 0:
                    await token_blacklist.blacklist_token(jti, expires_in)
                    logger.info(f"Blacklisted access token JTI on logout: {jti}")

    return success_response({"message": "Successfully logged out"})


@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Change user password.

    Requires current password for verification and new password must meet complexity requirements.
    """
    auth_service = AuthService(db)
    success = await auth_service.change_password(current_user, password_data)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )

    # 1. Revoke all refresh tokens for the user
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.user_id == current_user.id)
    )
    tokens = result.scalars().all()
    for token in tokens:
        token.revoked = True
    await db.commit()

    # 2. Blacklist current access token if provided in request headers
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ")[1]
        payload = verify_access_token(token)
        if payload:
            jti = payload.get("jti")
            exp = payload.get("exp")
            if jti and exp:
                from app.core.blacklist import token_blacklist
                from datetime import datetime, timezone
                now = int(datetime.now(timezone.utc).timestamp())
                expires_in = exp - now
                if expires_in > 0:
                    await token_blacklist.blacklist_token(jti, expires_in)
                    logger.info(f"Blacklisted access token JTI on password change: {jti}")

    return success_response({"message": "Password changed successfully"})


@router.post("/change-email")
async def change_email(
    email_data: ChangeEmailRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Initiate email change process.

    Requires current password for verification.
    An OTP code will be sent to the new email address for confirmation.
    """
    auth_service = AuthService(db)
    success, message = await auth_service.initiate_email_change(current_user, email_data)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    return success_response({
        "message": message,
        "next_step": "Enter the OTP code sent to your new email address"
    })


@router.post("/confirm-email-change")
async def confirm_email_change(
    confirm_data: ConfirmEmailChangeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Confirm email change with OTP code.

    The OTP code was sent to the new email address when initiating the change.
    """
    auth_service = AuthService(db)
    success, message = await auth_service.confirm_email_change(
        current_user, confirm_data.new_email, confirm_data.otp_code
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    return success_response({
        "message": message,
        "new_email": confirm_data.new_email
    })


@router.delete("/account", status_code=status.HTTP_202_ACCEPTED)
async def delete_account(
    delete_data: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete user account (GDPR compliance).

    This action is irreversible. All data will be anonymized and the account deactivated.
    Requires password verification and explicit confirmation.
    """
    auth_service = AuthService(db)
    success, message = await auth_service.delete_account(current_user, delete_data)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message
        )

    return success_response({
        "message": message
    })


@router.post("/forgot-password", dependencies=[Depends(RateLimiterDependency("password_reset"))])
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Initiate password reset process.
    Sends a 6-digit OTP code to the user's email if it exists.
    """
    from app.domains.auth.services.otp_service import OTPService
    # Find user by email
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user:
        # For security, don't reveal if email exists
        logger.info(f"Password reset attempted for non-existent email: {request.email}")
        return success_response({
            "message": "If the email exists, a password reset code has been sent.",
            "expires_in_minutes": 15
        })

    # Generate OTP and send email
    otp_service = OTPService(db)
    code = await otp_service.generate_otp(str(user.id), purpose="reset_password")
    await otp_service.send_otp_email(user.email, code, purpose="reset_password")

    return success_response({
        "message": "Password reset code generated. Please check your email inbox.",
        "expires_in_minutes": 15
    })


@router.post("/reset-password", dependencies=[Depends(RateLimiterDependency("password_reset"))])
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Complete password reset with OTP code and new password.
    """
    # Find user by email
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    auth_service = AuthService(db)
    success = await auth_service.reset_password(user, request.code, request.new_password)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code"
        )

    return success_response({
        "message": "Password has been reset successfully"
    })

