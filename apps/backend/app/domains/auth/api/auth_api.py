from datetime import UTC
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, security
from app.core.exceptions import BusinessRuleError
from app.core.logging import logger
from app.core.rate_limiting import RateLimiterDependency
from app.core.responses import ApiSuccessResponse, success_response
from app.core.security import verify_access_token
from app.domains.auth.dependencies import AuthServiceDep
from app.domains.auth.models.token_device import RefreshToken
from app.domains.auth.models.user import User
from app.domains.auth.schemas.auth_schemas import (
    ChangeEmailRequest,
    ChangePasswordRequest,
    ConfirmEmailChangeRequest,
    DeleteAccountRequest,
    DeleteAllDevicesRequest,
    ForgotPasswordRequest,
    GuestLoginRequest,
    LoginRequest,
    LoginResponse,
    OTPLoginRequest,
    RefreshRequest,
    RegisterCompleteRequest,
    RegisterInitiateRequest,
    ResetPasswordRequest,
    SendOTPRequest,
    Token,
    UserCreate,
    UserRegisterResponse,
    UserResponse,
    VendorRegisterResponse,
    VendorUserCreate,
    VerifyOTPRequest,
)
from app.domains.auth.services.auth_service import AuthFailure, AuthService

router = APIRouter(tags=["Authentication"])


@router.post("/register/initiate", response_model=ApiSuccessResponse[UserRegisterResponse])
async def register_initiate(data: RegisterInitiateRequest, auth_service: AuthServiceDep):
    """
    Step 1: Initiate registration by providing email and role.
    Creates a pending user and sends OTP.
    """
    try:
        user = await auth_service.initiate_registration(data)
        return success_response(
            {
                "id": str(user.id),
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active,
                "is_verified": user.is_verified,
                "message": "Verification code sent to your email!",
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/register/complete", response_model=ApiSuccessResponse[UserResponse])
async def register_complete(data: RegisterCompleteRequest, auth_service: AuthServiceDep):
    """
    Step 3: Complete registration after OTP verification.
    Sets profile details and final password.
    """
    try:
        user = await auth_service.complete_registration(data)
        return success_response(
            {
                "id": str(user.id),
                "email": user.email,
                "role": user.role,
                "message": "Account created successfully!"
                if user.role == "customer"
                else "Application submitted! Our team will review it.",
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/register",
    response_model=ApiSuccessResponse[UserRegisterResponse],
    dependencies=[Depends(RateLimiterDependency("register"))],
)
async def register(user_in: UserCreate, auth_service: AuthServiceDep):
    user = await auth_service.register_user(user_in)
    return success_response(
        {
            "id": str(user.id),
            "email": user.email,
            "role": user.role,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "is_active": user.is_active,
            "is_verified": user.is_verified,
            "message": "Registration successful!",
        }
    )


@router.post(
    "/register/vendor",
    response_model=ApiSuccessResponse[VendorRegisterResponse],
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(RateLimiterDependency("register"))],
)
async def register_vendor(vendor_in: VendorUserCreate, auth_service: AuthServiceDep):
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
    try:
        vendor = await auth_service.register_vendor(vendor_in)
        return success_response(
            {
                "id": str(vendor.id),
                "email": vendor.email,
                "role": vendor.role,
                "company_name": vendor.company_name,
                "phone": vendor.phone,
                "is_verified": vendor.is_verified,
                "message": "Vendor application submitted successfully!",
                "next_steps": [
                    "1. Verify your email with the OTP code sent",
                    "2. Wait for admin approval (you'll receive an email)",
                    "3. Complete your profile settings",
                    "4. Start listing products",
                ],
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post(
    "/login", response_model=ApiSuccessResponse[LoginResponse], dependencies=[Depends(RateLimiterDependency("login"))]
)
async def login(login_data: LoginRequest, request: Request, auth_service: AuthServiceDep):
    # Extract request context for security logging
    from app.core.security_logging import extract_request_context

    request_id, ip_address, user_agent = extract_request_context(request)

    result = await auth_service.authenticate(
        login_data, request_id=request_id, ip_address=ip_address, user_agent=user_agent
    )

    if isinstance(result, AuthFailure):
        if result.reason == "vendor_pending_approval":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your vendor account is pending admin approval. You will receive an email once approved.",
            )
        elif result.reason == "account_locked":
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Account temporarily locked due to multiple failed login attempts. Please try again later or contact support.",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )

    user = result.user
    token_obj = await auth_service.create_tokens(
        user,
        device_id=result.device_id,
        remember_me=result.remember_me,
        request_id=request_id,
        ip_address=ip_address,
        user_agent=user_agent,
    )
    response_data = LoginResponse(**token_obj.model_dump(), message=f"Welcome back, {user.first_name or user.email}!")
    return success_response(response_data)


@router.post(
    "/login/otp", response_model=ApiSuccessResponse[Token], dependencies=[Depends(RateLimiterDependency("login"))]
)
async def login_otp(login_data: OTPLoginRequest, auth_service: AuthServiceDep):
    user = await auth_service.authenticate_otp(login_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or verification code",
        )
    return success_response(await auth_service.create_tokens(user, device_id=login_data.device_id, remember_me=False))


@router.post(
    "/guest", response_model=ApiSuccessResponse[Token], dependencies=[Depends(RateLimiterDependency("guest_login"))]
)
async def guest_login(guest_data: GuestLoginRequest, auth_service: AuthServiceDep):
    """
    Create or retrieve a guest user session.

    Guest users can browse the platform without registration.
    They receive temporary credentials and limited access.
    """
    user = await auth_service.guest_login(guest_data)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Device already registered to a regular user. Please log in with your credentials.",
        )
    return success_response(await auth_service.create_tokens(user, device_id=guest_data.device_id, remember_me=False))


@router.post("/refresh", response_model=ApiSuccessResponse[Token])
async def refresh(refresh_data: RefreshRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Refresh access token using refresh token with token rotation"""
    auth_service = AuthService(db)

    # Extract request context for security logging
    from app.core.security_logging import extract_request_context, log_token_refreshed, log_token_revoked

    request_id, ip_address, user_agent = extract_request_context(request)

    # Verify refresh token exists and is not revoked
    result = await db.execute(
        select(RefreshToken, User)
        .join(User, RefreshToken.user_id == User.id)
        .where(RefreshToken.token == refresh_data.refresh_token, RefreshToken.revoked == False)
    )
    token_user = result.first()

    if not token_user:
        # Grace period check: If token was revoked within last 15 seconds (due to client race condition during rotation)
        from datetime import datetime, timedelta

        revoked_result = await db.execute(
            select(RefreshToken, User)
            .join(User, RefreshToken.user_id == User.id)
            .where(RefreshToken.token == refresh_data.refresh_token, RefreshToken.revoked == True)
        )
        revoked_token_user = revoked_result.first()
        now = datetime.now(UTC)
        if revoked_token_user:
            rev_obj, user = revoked_token_user
            if rev_obj.updated_at and (now - rev_obj.updated_at) < timedelta(seconds=15) and rev_obj.expires_at > now:
                logger.info(f"Refresh token grace period hit for user {user.email}")
                tokens = await auth_service.create_tokens(user, device_id=rev_obj.device_id, remember_me=False)
                log_token_refreshed(
                    user_id=str(user.id),
                    email=user.email,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    request_id=request_id,
                )
                return success_response(tokens)

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    refresh_token_obj, user = token_user

    # Check if token is expired
    from datetime import datetime

    if refresh_token_obj.expires_at < datetime.now(UTC):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
        )

    # Revoke old refresh token (token rotation)
    refresh_token_obj.revoked = True
    await db.commit()

    # Log token revocation (old token)
    log_token_revoked(
        user_id=str(user.id), email=user.email, reason="rotation", ip_address=ip_address, request_id=request_id
    )

    # Create new tokens with a new refresh token
    tokens = await auth_service.create_tokens(
        user,
        device_id=refresh_token_obj.device_id,
        remember_me=False,
        request_id=request_id,
        ip_address=ip_address,
        user_agent=user_agent,
    )

    # Log token refresh
    log_token_refreshed(
        user_id=str(user.id), email=user.email, ip_address=ip_address, user_agent=user_agent, request_id=request_id
    )

    logger.info(f"Token refreshed with rotation for user: {user.email}")
    return success_response(tokens)


@router.post("/logout", response_model=ApiSuccessResponse[dict[str, str]])
async def logout(refresh_data: RefreshRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Revoke refresh token and blacklist current access token JTI"""
    result = await db.execute(select(RefreshToken).where(RefreshToken.token == refresh_data.refresh_token))
    refresh_token = result.scalar_one_or_none()

    if refresh_token:
        refresh_token.revoked = True
        await db.commit()
        logger.info("User logged out, token revoked")

    # Blacklist current access token if provided in request headers
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        token = auth_header.split(" ")[1]
        payload = verify_access_token(token)
        if payload:
            jti = payload.get("jti")
            exp = payload.get("exp")
            if jti and exp:
                from datetime import datetime

                from app.core.blacklist import token_blacklist

                now = int(datetime.now(UTC).timestamp())
                expires_in = exp - now
                if expires_in > 0:
                    await token_blacklist.blacklist_token(jti, expires_in)
                    logger.info(f"Blacklisted access token JTI on logout: {jti}")

    return success_response({"message": "Successfully logged out"})


@router.post("/change-password", response_model=ApiSuccessResponse[dict[str, str]])
async def change_password(
    password_data: ChangePasswordRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Change user password.

    Requires current password for verification and new password must meet complexity requirements.
    """
    auth_service = AuthService(db)
    success = await auth_service.change_password(current_user, password_data)

    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    # 1. Revoke all refresh tokens for the user
    result = await db.execute(select(RefreshToken).where(RefreshToken.user_id == current_user.id))
    tokens = result.scalars().all()
    for token in tokens:
        token.revoked = True
    await db.commit()

    # 2. Blacklist current access token if provided in request headers
    auth_header = request.headers.get("authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        access_token = auth_header.split(" ")[1]
        payload = verify_access_token(access_token)
        if payload:
            jti = payload.get("jti")
            exp = payload.get("exp")
            if jti and exp:
                from datetime import datetime

                from app.core.blacklist import token_blacklist

                now = int(datetime.now(UTC).timestamp())
                expires_in = exp - now
                if expires_in > 0:
                    await token_blacklist.blacklist_token(jti, expires_in)
                    logger.info(f"Blacklisted access token JTI on password change: {jti}")

    return success_response({"message": "Password changed successfully"})


@router.post("/change-email", response_model=ApiSuccessResponse[dict[str, str]])
async def change_email(
    email_data: ChangeEmailRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
):
    """
    Initiate email change process.

    Requires current password for verification.
    An OTP code will be sent to the new email address for confirmation.
    """
    auth_service = AuthService(db)
    success, message = await auth_service.initiate_email_change(current_user, email_data)

    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    return success_response({"message": message, "next_step": "Enter the OTP code sent to your new email address"})


@router.post("/confirm-email-change", response_model=ApiSuccessResponse[dict[str, str]])
async def confirm_email_change(
    confirm_data: ConfirmEmailChangeRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    return success_response({"message": message, "new_email": confirm_data.new_email})


@router.delete("/account", response_model=ApiSuccessResponse[dict[str, str]], status_code=status.HTTP_202_ACCEPTED)
async def delete_account(
    delete_data: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete user account (GDPR compliance).

    This action is irreversible. All data will be anonymized and the account deactivated.
    Requires password verification and explicit confirmation.
    """
    auth_service = AuthService(db)
    success, message = await auth_service.delete_account(current_user, delete_data)

    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    return success_response({"message": message})


@router.post(
    "/forgot-password",
    response_model=ApiSuccessResponse[dict[str, Any]],
    dependencies=[Depends(RateLimiterDependency("password_reset"))],
)
async def forgot_password(request: ForgotPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Initiate password reset process.
    Sends a 6-digit OTP code to the user's email if it exists.
    """
    from app.domains.auth.services.otp_service import OTPService

    # Find user by email (case-insensitive & trimmed)
    email_clean = request.email.strip().lower()
    result = await db.execute(select(User).where(func.lower(User.email) == email_clean))
    user = result.scalar_one_or_none()

    if not user:
        # For security, don't reveal if email exists
        logger.info(f"Password reset attempted for non-existent email: {request.email}")
        return success_response(
            {"message": "If the email exists, a password reset code has been sent.", "expires_in_minutes": 15}
        )

    # Generate OTP and send email
    otp_service = OTPService(db)
    code = await otp_service.generate_otp(str(user.id), purpose="reset_password")
    await otp_service.send_otp_email(user.email, code, purpose="reset_password")

    return success_response({"message": "Verification code sent to your email!", "expires_in_minutes": 15})


@router.post(
    "/verify-otp",
    response_model=ApiSuccessResponse[dict[str, Any]],
    dependencies=[Depends(RateLimiterDependency("otp"))],
)
async def verify_otp(request: VerifyOTPRequest, db: AsyncSession = Depends(get_db)):
    """
    Verify OTP code under /api/v1/auth/verify-otp.
    For reset_password, confirms code is valid without prematurely consuming it.
    """
    from app.domains.auth.services.otp_service import OTPService

    email_clean = request.email.strip().lower()
    result = await db.execute(select(User).where(func.lower(User.email) == email_clean))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification code")

    otp_service = OTPService(db)
    consume = request.purpose != "reset_password"
    is_valid = await otp_service.verify_otp(str(user.id), request.code, request.purpose, consume=consume)

    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification code")

    if request.purpose == "verification":
        user.is_verified = True
        await db.commit()
        logger.info(f"User {user.email} verified successfully")

    message = "Email verified successfully!" if request.purpose == "verification" else "Verification code is valid"
    return success_response({"message": message, "is_verified": user.is_verified})


@router.post(
    "/reset-password",
    response_model=ApiSuccessResponse[dict[str, str]],
    dependencies=[Depends(RateLimiterDependency("password_reset"))],
)
async def reset_password(request: ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Complete password reset with OTP code and new password.
    """
    # Find user by email (case-insensitive & trimmed)
    email_clean = request.email.strip().lower()
    result = await db.execute(select(User).where(func.lower(User.email) == email_clean))
    user = result.scalar_one_or_none()

    if not user:
        # Same response as an invalid code: revealing whether the email exists
        # would let attackers enumerate registered accounts.
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification code")

    auth_service = AuthService(db)
    try:
        success = await auth_service.reset_password(user, request.code, request.new_password)
    except (ValueError, BusinessRuleError) as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired verification code")

    return success_response({"message": "Password reset successful! You can now log in with your new password."})


@router.get("/devices", response_model=ApiSuccessResponse[list[dict[str, Any]]])
async def get_user_devices(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Get all active devices for the current user.
    """
    auth_service = AuthService(db)
    devices = await auth_service.get_devices(current_user)

    current_device_id = None
    if credentials:
        payload = verify_access_token(credentials.credentials)
        if payload:
            current_device_id = payload.get("device_id")

    return success_response(
        [
            {
                "id": device.device_id,
                "name": device.device_name,
                "last_active": device.updated_at.isoformat() if device.updated_at else None,
                "is_current": device.device_id == current_device_id if current_device_id else False,
            }
            for device in devices
        ]
    )


@router.delete("/devices/{device_id}", response_model=ApiSuccessResponse[dict[str, str]])
async def delete_user_device(
    device_id: str, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Remove a device session.
    """
    auth_service = AuthService(db)
    success = await auth_service.delete_device(current_user, device_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Device not found")
    return success_response({"message": "Device removed successfully"})


@router.post("/devices/delete-all", response_model=ApiSuccessResponse[dict[str, str]])
async def delete_all_other_devices(
    request: DeleteAllDevicesRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """
    Remove all device sessions except the current one.
    """
    device_id = request.current_device_id
    auth_service = AuthService(db)
    success = await auth_service.delete_all_other_devices(current_user, device_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to remove devices")
    return success_response({"message": "All other devices removed successfully"})
