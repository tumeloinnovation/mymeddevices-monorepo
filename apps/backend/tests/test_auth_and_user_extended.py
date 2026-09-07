import uuid
from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.core.security import get_password_hash
from app.domains.auth.models.token_device import RefreshToken, UserDevice
from app.domains.auth.models.user import User
from app.domains.auth.services.auth_service import AuthService
from app.domains.auth.services.otp_service import OTPService


@pytest.fixture
async def sample_user(db_session):
    """Fixture to create a verified active customer user."""
    auth_service = AuthService(db_session)
    user = User(
        id=uuid.uuid4(),
        email="test_auth_user@mymeddevices.co.ke",
        password_hash=get_password_hash("ValidPassword123!"),
        first_name="John",
        last_name="Tester",
        phone="+254700000001",
        role="customer",
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()
    tokens = await auth_service.create_tokens(user, device_id="device-001")
    return {"user": user, "tokens": tokens}


@pytest.fixture
async def sample_admin(db_session):
    """Fixture to create an admin user."""
    auth_service = AuthService(db_session)
    user = User(
        id=uuid.uuid4(),
        email="admin_auth_user@mymeddevices.co.ke",
        password_hash=get_password_hash("AdminPass123!"),
        first_name="Admin",
        last_name="Super",
        phone="+254700000002",
        role="admin",
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()
    tokens = await auth_service.create_tokens(user, device_id="admin-device-001")
    return {"user": user, "tokens": tokens}


@pytest.fixture
async def sample_vendor_user(db_session):
    """Fixture to create a vendor user."""
    auth_service = AuthService(db_session)
    user = User(
        id=uuid.uuid4(),
        email="vendor_auth_user@mymeddevices.co.ke",
        password_hash=get_password_hash("VendorPass123!"),
        first_name="Vendor",
        last_name="Seller",
        phone="+254700000003",
        role="vendor",
        is_active=True,
        is_verified=True,
    )
    db_session.add(user)
    await db_session.commit()
    tokens = await auth_service.create_tokens(user, device_id="vendor-device-001")
    return {"user": user, "tokens": tokens}


@pytest.mark.asyncio
async def test_users_me_and_role_guards(client: AsyncClient, sample_user, sample_admin, sample_vendor_user):
    """AUTH-001: Validate /users/me, /users/me/active, and role-based endpoints."""
    headers_cust = {"Authorization": f"Bearer {sample_user['tokens'].access_token}"}
    headers_admin = {"Authorization": f"Bearer {sample_admin['tokens'].access_token}"}
    headers_vendor = {"Authorization": f"Bearer {sample_vendor_user['tokens'].access_token}"}

    # 1. /users/me for customer
    me_res = await client.get("/api/v1/users/me", headers=headers_cust)
    assert me_res.status_code == 200
    assert me_res.json()["data"]["email"] == sample_user["user"].email

    # 2. /users/me/active for customer
    active_res = await client.get("/api/v1/users/me/active", headers=headers_cust)
    assert active_res.status_code == 200
    assert active_res.json()["data"]["is_active"] is True

    # 3. Customer role guard
    cust_res = await client.get("/api/v1/users/customer-only", headers=headers_cust)
    assert cust_res.status_code == 200

    # 4. Customer attempting admin-only -> 403
    adm_forbidden = await client.get("/api/v1/users/admin-only", headers=headers_cust)
    assert adm_forbidden.status_code == 403

    # 5. Customer attempting vendor-only -> 403
    ven_forbidden = await client.get("/api/v1/users/vendor-only", headers=headers_cust)
    assert ven_forbidden.status_code == 403

    # 6. Admin accessing admin-only -> 200
    adm_res = await client.get("/api/v1/users/admin-only", headers=headers_admin)
    assert adm_res.status_code == 200

    # 7. Vendor accessing vendor-only -> 200
    ven_res = await client.get("/api/v1/users/vendor-only", headers=headers_vendor)
    assert ven_res.status_code == 200

    # 8. Unauthenticated request to /users/me -> 401
    unauth_res = await client.get("/api/v1/users/me")
    assert unauth_res.status_code == 401


@pytest.mark.asyncio
async def test_otp_send_and_verify_lifecycle(client: AsyncClient, db_session, sample_user):
    """AUTH-002: Test full OTP generation and verification flow."""
    email = sample_user["user"].email

    # 1. Send OTP
    send_res = await client.post("/api/v1/otp/send", json={"email": email, "purpose": "verification"})
    assert send_res.status_code == 200

    # Retrieve generated OTP from database
    otp_service = OTPService(db_session)
    # Generate direct known OTP code to test verification
    code = await otp_service.generate_otp(str(sample_user["user"].id), purpose="verification")

    # 2. Verify invalid OTP code -> 400
    invalid_verify = await client.post(
        "/api/v1/otp/verify",
        json={"email": email, "code": "000000", "purpose": "verification"},
    )
    assert invalid_verify.status_code == 400

    # 3. Verify valid OTP code -> 200
    valid_verify = await client.post(
        "/api/v1/otp/verify",
        json={"email": email, "code": code, "purpose": "verification"},
    )
    assert valid_verify.status_code == 200
    assert valid_verify.json()["data"]["is_verified"] is True

    # 4. Resend OTP
    resend_res = await client.post("/api/v1/otp/resend", json={"email": email, "purpose": "verification"})
    assert resend_res.status_code == 200


@pytest.mark.asyncio
async def test_password_reset_flow(client: AsyncClient, db_session, sample_user):
    """AUTH-003: Test forgot password and reset password with OTP."""
    user = sample_user["user"]
    email = user.email

    # 1. Forgot password request
    forgot_res = await client.post("/api/v1/auth/forgot-password", json={"email": email})
    assert forgot_res.status_code == 200

    # 2. Generate OTP for reset_password
    otp_service = OTPService(db_session)
    code = await otp_service.generate_otp(str(user.id), purpose="reset_password")

    # 3. Reset password with valid OTP
    new_password = "BrandNewPassword2026!"
    reset_res = await client.post(
        "/api/v1/auth/reset-password",
        json={"email": email, "code": code, "new_password": new_password},
    )
    assert reset_res.status_code == 200

    # 4. Login with old password -> 401
    old_login = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "ValidPassword123!", "device_id": "test-device"},
    )
    assert old_login.status_code == 401

    # 5. Login with new password -> 200
    new_login = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": new_password, "device_id": "test-device"},
    )
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()["data"]


@pytest.mark.asyncio
async def test_two_step_password_reset_with_otp_verify(client: AsyncClient, db_session, sample_user):
    """AUTH-003B: Test 2-step password reset flow (OTP verify then reset-password)."""
    user = sample_user["user"]
    email = user.email

    # 1. Forgot password request
    forgot_res = await client.post("/api/v1/auth/forgot-password", json={"email": email})
    assert forgot_res.status_code == 200

    # 2. Generate OTP for reset_password
    otp_service = OTPService(db_session)
    code = await otp_service.generate_otp(str(user.id), purpose="reset_password")

    # 3. Step 1: Pre-verify OTP without consuming it
    verify_res = await client.post(
        "/api/v1/auth/verify-otp",
        json={"email": email, "code": code, "purpose": "reset_password"},
    )
    assert verify_res.status_code == 200
    assert verify_res.json()["data"]["message"] == "Verification code is valid"

    # Also verify that /api/v1/otp/verify works
    verify_otp_res = await client.post(
        "/api/v1/otp/verify",
        json={"email": email, "code": code, "purpose": "reset_password"},
    )
    assert verify_otp_res.status_code == 200

    # 4. Step 2: Reset password using the verified code
    new_password = "TwoStepResetPassword2026!"
    reset_res = await client.post(
        "/api/v1/auth/reset-password",
        json={"email": email, "code": code, "new_password": new_password},
    )
    assert reset_res.status_code == 200

    # 5. Trying to reset password again with same consumed OTP -> 400
    duplicate_reset = await client.post(
        "/api/v1/auth/reset-password",
        json={"email": email, "code": code, "new_password": "AnotherPassword2026!"},
    )
    assert duplicate_reset.status_code == 400

    # 6. Login with new password -> 200
    new_login = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": new_password, "device_id": "test-device"},
    )
    assert new_login.status_code == 200


@pytest.mark.asyncio
async def test_change_password_and_token_invalidation(client: AsyncClient, db_session, sample_user):
    """AUTH-004: Test changing password when authenticated and token revocation."""
    headers = {"Authorization": f"Bearer {sample_user['tokens'].access_token}"}

    # 1. Change password with wrong current password -> 400
    wrong_change = await client.post(
        "/api/v1/auth/change-password",
        json={"old_password": "WrongCurrentPassword!", "new_password": "NewUpdatedPassword123!"},
        headers=headers,
    )
    assert wrong_change.status_code == 400

    # 2. Change password with correct current password -> 200
    valid_change = await client.post(
        "/api/v1/auth/change-password",
        json={"old_password": "ValidPassword123!", "new_password": "NewUpdatedPassword123!"},
        headers=headers,
    )
    assert valid_change.status_code == 200

    # 3. Verify in DB that old refresh tokens are marked revoked
    tokens_res = await db_session.execute(
        select(RefreshToken).where(RefreshToken.user_id == sample_user["user"].id)
    )
    all_tokens = tokens_res.scalars().all()
    assert all(t.revoked for t in all_tokens)


@pytest.mark.asyncio
async def test_devices_management_lifecycle(client: AsyncClient, db_session, sample_user):
    """AUTH-005: Test listing user devices, deleting single device, deleting all other devices."""
    user = sample_user["user"]
    headers = {"Authorization": f"Bearer {sample_user['tokens'].access_token}"}

    # Add extra device sessions in DB
    device2 = UserDevice(
        user_id=user.id,
        device_id="laptop-work-002",
        device_name="Work Laptop",
        last_login=datetime.now(UTC),
    )
    device3 = UserDevice(
        user_id=user.id,
        device_id="tablet-mobile-003",
        device_name="iPad Pro",
        last_login=datetime.now(UTC),
    )
    db_session.add_all([device2, device3])
    await db_session.commit()

    # 1. List user devices
    dev_res = await client.get("/api/v1/auth/devices", headers=headers)
    assert dev_res.status_code == 200
    devices = dev_res.json()["data"]
    assert len(devices) >= 2

    # 2. Delete single device
    del_res = await client.delete("/api/v1/auth/devices/laptop-work-002", headers=headers)
    assert del_res.status_code == 200

    # 3. Delete non-existent device -> 404
    del_404 = await client.delete("/api/v1/auth/devices/non-existent-device-xyz", headers=headers)
    assert del_404.status_code == 404

    # 4. Delete all other devices
    del_all = await client.post(
        "/api/v1/auth/devices/delete-all",
        json={"current_device_id": "device-001"},
        headers=headers,
    )
    assert del_all.status_code == 200


@pytest.mark.asyncio
async def test_token_refresh_and_logout_lifecycle(client: AsyncClient, sample_user):
    """AUTH-006: Test refresh token rotation and logout endpoint."""
    refresh_token = sample_user["tokens"].refresh_token

    # 1. Refresh token

    ref_res = await client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert ref_res.status_code == 200
    new_tokens = ref_res.json()["data"]
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens
    new_refresh = new_tokens["refresh_token"]

    # 2. Logout with new refresh token
    logout_res = await client.post(
        "/api/v1/auth/logout",
        json={"refresh_token": new_refresh},
        headers={"Authorization": f"Bearer {new_tokens['access_token']}"},
    )
    assert logout_res.status_code == 200

    # 3. Attempting to refresh with revoked token after grace period or non-existent token -> 401
    invalid_ref = await client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": "totally_invalid_nonexistent_token_123"},
    )
    assert invalid_ref.status_code == 401
