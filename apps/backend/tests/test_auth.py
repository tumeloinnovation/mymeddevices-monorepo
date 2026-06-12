import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domains.auth.models.otp import OTP
from app.domains.auth.models.user import User

@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    # 1. Register
    register_data = {
        "email": "test@example.com",
        "password": "Test123!",
        "first_name": "Test",
        "last_name": "User"
    }
    response = await client.post("/api/v1/auth/register", json=register_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["data"]["email"] == "test@example.com"

    # 2. Login
    login_data = {
        "email": "test@example.com",
        "password": "Test123!",
        "device_id": "test_device_001",
        "device_name": "Test Browser"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]
    assert data["data"]["token_type"] == "bearer"

@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    login_data = {
        "email": "wrong@example.com",
        "password": "Wrong123!",
        "device_id": "test_device_001"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient):
    # First register and login to get tokens
    register_data = {
        "email": "refresh@example.com",
        "password": "Test123!",
        "first_name": "Refresh",
        "last_name": "User"
    }
    await client.post("/api/v1/auth/register", json=register_data)

    login_data = {
        "email": "refresh@example.com",
        "password": "Test123!",
        "device_id": "test_device_002",
        "device_name": "Test Browser"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    tokens = response.json()["data"]
    refresh_token = tokens["refresh_token"]

    # Now test refresh
    refresh_data = {"refresh_token": refresh_token}
    response = await client.post("/api/v1/auth/refresh", json=refresh_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "access_token" in data["data"]

@pytest.mark.asyncio
async def test_logout(client: AsyncClient):
    # First register and login to get tokens
    register_data = {
        "email": "logout@example.com",
        "password": "Test123!",
        "first_name": "Logout",
        "last_name": "User"
    }
    await client.post("/api/v1/auth/register", json=register_data)

    login_data = {
        "email": "logout@example.com",
        "password": "Test123!",
        "device_id": "test_device_003",
        "device_name": "Test Browser"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    tokens = response.json()["data"]
    refresh_token = tokens["refresh_token"]

    # Now test logout
    logout_data = {"refresh_token": refresh_token}
    response = await client.post("/api/v1/auth/logout", json=logout_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True


@pytest.mark.asyncio
async def test_vendor_registration(client: AsyncClient, db):
    """Test vendor registration flow"""
    vendor_data = {
        "email": "vendor@example.com",
        "password": "Test123!",
        "company_name": "Test Medical Supplies Ltd",
        "phone": "+254712345678",
        "vat_number": "VAT123456",
        "first_name": "John",
        "last_name": "Doe"
    }
    response = await client.post("/api/v1/auth/register/vendor", json=vendor_data)
    assert response.status_code == 201
    data = response.json()
    assert data["success"] == True
    assert data["data"]["email"] == "vendor@example.com"
    assert data["data"]["company_name"] == "Test Medical Supplies Ltd"
    assert data["data"]["role"] == "vendor"
    assert data["data"]["is_verified"] == False  # Vendor requires verification
    assert "next_steps" in data["data"]


@pytest.mark.asyncio
async def test_vendor_registration_duplicate_email(client: AsyncClient):
    """Test that duplicate vendor registration is rejected"""
    vendor_data = {
        "email": "duplicate@example.com",
        "password": "Test123!",
        "company_name": "Test Medical Supplies Ltd",
        "phone": "+254712345678"
    }
    # First registration should succeed
    response = await client.post("/api/v1/auth/register/vendor", json=vendor_data)
    assert response.status_code == 201

    # Duplicate registration should fail
    response = await client.post("/api/v1/auth/register/vendor", json=vendor_data)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_otp_send_and_verify(client: AsyncClient, db):
    """Test complete OTP verification flow"""
    # First register a user
    register_data = {
        "email": "otpverify@example.com",
        "password": "Test123!",
        "first_name": "OTP",
        "last_name": "User"
    }
    await client.post("/api/v1/auth/register", json=register_data)

    # Send OTP for email verification
    send_data = {
        "email": "otpverify@example.com",
        "purpose": "verification"
    }
    response = await client.post("/api/v1/otp/send", json=send_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "expires_in_minutes" in data["data"]

    # Get the generated OTP from database
    result = await db.execute(select(User).where(User.email == "otpverify@example.com"))
    user = result.scalar_one_or_none()
    assert user is not None
    assert user.is_verified == False

    result = await db.execute(
        select(OTP).where(
            OTP.user_id == user.id,
            OTP.purpose == "verification",
            OTP.is_used == False
        )
    )
    otp = result.scalar_one_or_none()
    assert otp is not None
    code = otp.code

    # Verify the OTP
    verify_data = {
        "email": "otpverify@example.com",
        "code": code,
        "purpose": "verification"
    }
    response = await client.post("/api/v1/otp/verify", json=verify_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert data["data"]["is_verified"] == True

    # Verify user is now marked as verified in database
    await db.refresh(user)
    assert user.is_verified == True


@pytest.mark.asyncio
async def test_otp_resend(client: AsyncClient, db):
    """Test OTP resend functionality"""
    # Register a user
    register_data = {
        "email": "resend@example.com",
        "password": "Test123!",
        "first_name": "Resend",
        "last_name": "User"
    }
    await client.post("/api/v1/auth/register", json=register_data)

    # Send first OTP
    send_data = {
        "email": "resend@example.com",
        "purpose": "verification"
    }
    await client.post("/api/v1/otp/send", json=send_data)

    # Get the first OTP
    result = await db.execute(select(User).where(User.email == "resend@example.com"))
    user = result.scalar_one_or_none()

    result = await db.execute(
        select(OTP).where(
            OTP.user_id == user.id,
            OTP.purpose == "verification",
            OTP.is_used == False
        )
    )
    first_otp = result.scalar_one_or_none()
    first_code = first_otp.code

    # Resend OTP
    response = await client.post("/api/v1/otp/resend", json=send_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True

    # Get the new OTP
    result = await db.execute(
        select(OTP).where(
            OTP.user_id == user.id,
            OTP.purpose == "verification",
            OTP.is_used == False
        )
    )
    new_otp = result.scalar_one_or_none()

    # The old OTP should be marked as used, and a new one created
    assert first_otp.id != new_otp.id
    assert first_code != new_otp.code


@pytest.mark.asyncio
async def test_otp_verify_invalid_code(client: AsyncClient):
    """Test OTP verification with invalid code"""
    # Register a user
    register_data = {
        "email": "invalid@example.com",
        "password": "Test123!",
        "first_name": "Invalid",
        "last_name": "User"
    }
    await client.post("/api/v1/auth/register", json=register_data)

    # Try to verify with wrong code
    verify_data = {
        "email": "invalid@example.com",
        "code": "000000",  # Wrong code
        "purpose": "verification"
    }
    response = await client.post("/api/v1/otp/verify", json=verify_data)
    assert response.status_code == 400
    data = response.json()
    assert "Invalid or expired verification code" in data["detail"]


@pytest.mark.asyncio
async def test_otp_send_nonexistent_email(client: AsyncClient):
    """Test OTP send with non-existent email (should not reveal if email exists)"""
    send_data = {
        "email": "nonexistent@example.com",
        "purpose": "verification"
    }
    response = await client.post("/api/v1/otp/send", json=send_data)
    # Should return 200 for security (don't reveal if email exists)
    assert response.status_code == 200
    data = response.json()
    assert "If the email exists" in data["data"]["message"]


@pytest.mark.asyncio
async def test_vendor_registration_with_otp_verification(client: AsyncClient, db):
    """Test complete vendor registration and OTP verification flow"""
    # 1. Register vendor
    vendor_data = {
        "email": "vendorflow@example.com",
        "password": "Test123!",
        "company_name": "Complete Flow Vendor",
        "phone": "+254712345679"
    }
    response = await client.post("/api/v1/auth/register/vendor", json=vendor_data)
    assert response.status_code == 201
    data = response.json()
    assert data["data"]["is_verified"] == False

    # 2. Send OTP
    send_data = {
        "email": "vendorflow@example.com",
        "purpose": "verification"
    }
    response = await client.post("/api/v1/otp/send", json=send_data)
    assert response.status_code == 200

    # 3. Get OTP from database
    result = await db.execute(select(User).where(User.email == "vendorflow@example.com"))
    vendor = result.scalar_one_or_none()

    result = await db.execute(
        select(OTP).where(
            OTP.user_id == vendor.id,
            OTP.purpose == "verification",
            OTP.is_used == False
        )
    )
    otp = result.scalar_one_or_none()

    # 4. Verify OTP
    verify_data = {
        "email": "vendorflow@example.com",
        "code": otp.code,
        "purpose": "verification"
    }
    response = await client.post("/api/v1/otp/verify", json=verify_data)
    assert response.status_code == 200
    data = response.json()
    assert data["data"]["is_verified"] == True

    # 5. Login with verified vendor
    login_data = {
        "email": "vendorflow@example.com",
        "password": "Test123!",
        "device_id": "test_device_vendor",
        "device_name": "Test Browser"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "access_token" in data["data"]

@pytest.mark.asyncio
async def test_login_otp(client: AsyncClient, db: AsyncSession):
    # 1. Register a test user
    register_data = {
        "email": "otplogin@example.com",
        "password": "Test123!",
        "first_name": "OTP",
        "last_name": "Login"
    }
    await client.post("/api/v1/auth/register", json=register_data)

    # 2. Request OTP code
    otp_request = {
        "email": "otplogin@example.com",
        "purpose": "login"
    }
    response = await client.post("/api/v1/otp/send", json=otp_request)
    assert response.status_code == 200

    # 3. Retrieve the generated OTP from DB
    result = await db.execute(select(OTP).where(OTP.purpose == "login"))
    otp_record = result.scalars().first()
    assert otp_record is not None
    code = otp_record.code

    # 4. Login using the retrieved OTP code
    login_data = {
        "email": "otplogin@example.com",
        "code": code,
        "device_id": "test_device_otp",
        "device_name": "Test Browser"
    }
    response = await client.post("/api/v1/auth/login/otp", json=login_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]
    assert data["data"]["user"]["email"] == "otplogin@example.com"


@pytest.mark.asyncio
async def test_guest_login_new_session(client: AsyncClient):
    """Test creating a new guest session"""
    guest_data = {
        "device_id": "guest_device_001",
        "device_name": "Guest Browser"
    }
    response = await client.post("/api/v1/auth/guest", json=guest_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]
    assert data["data"]["token_type"] == "bearer"
    assert data["data"]["user"]["role"] == "guest"
    assert data["data"]["user"]["is_verified"] == True
    assert data["data"]["user"]["email"].startswith("guest_")


@pytest.mark.asyncio
async def test_guest_login_existing_session(client: AsyncClient):
    """Test that guest login reuses existing guest session for same device"""
    guest_data = {
        "device_id": "guest_device_002",
        "device_name": "Guest Browser"
    }

    # First guest login
    response1 = await client.post("/api/v1/auth/guest", json=guest_data)
    data1 = response1.json()
    first_email = data1["data"]["user"]["email"]
    first_user_id = data1["data"]["user"]["id"]

    # Second guest login with same device
    response2 = await client.post("/api/v1/auth/guest", json=guest_data)
    data2 = response2.json()

    # Should reuse the same guest user
    assert data2["data"]["user"]["email"] == first_email
    assert data2["data"]["user"]["id"] == first_user_id


@pytest.mark.asyncio
async def test_guest_login_device_with_registered_user(client: AsyncClient):
    """Test that guest login fails if device is already registered to a regular user"""
    # First register a regular user and login
    register_data = {
        "email": "regular@example.com",
        "password": "Test123!",
        "first_name": "Regular",
        "last_name": "User"
    }
    await client.post("/api/v1/auth/register", json=register_data)

    login_data = {
        "email": "regular@example.com",
        "password": "Test123!",
        "device_id": "registered_device_001",
        "device_name": "Regular Browser"
    }
    await client.post("/api/v1/auth/login", json=login_data)

    # Now try guest login with the same device
    guest_data = {
        "device_id": "registered_device_001",
        "device_name": "Guest Browser"
    }
    response = await client.post("/api/v1/auth/guest", json=guest_data)
    assert response.status_code == 400
    data = response.json()
    assert "Device already registered" in data["detail"]


@pytest.mark.asyncio
async def test_guest_token_refresh(client: AsyncClient):
    """Test that guest users can refresh their tokens"""
    guest_data = {
        "device_id": "guest_device_003",
        "device_name": "Guest Browser"
    }
    response = await client.post("/api/v1/auth/guest", json=guest_data)
    tokens = response.json()["data"]
    refresh_token = tokens["refresh_token"]

    # Refresh the token
    refresh_data = {"refresh_token": refresh_token}
    response = await client.post("/api/v1/auth/refresh", json=refresh_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["role"] == "guest"


@pytest.mark.asyncio
async def test_guest_logout(client: AsyncClient):
    """Test that guest users can logout"""
    guest_data = {
        "device_id": "guest_device_004",
        "device_name": "Guest Browser"
    }
    response = await client.post("/api/v1/auth/guest", json=guest_data)
    tokens = response.json()["data"]
    refresh_token = tokens["refresh_token"]

    # Logout
    logout_data = {"refresh_token": refresh_token}
    response = await client.post("/api/v1/auth/logout", json=logout_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True


@pytest.mark.asyncio
async def test_change_password_success(client: AsyncClient):
    """Test successful password change"""
    # Register and login
    register_data = {
        "email": "changepass@example.com",
        "password": "Test123!",
        "first_name": "Change",
        "last_name": "Password"
    }
    await client.post("/api/v1/auth/register", json=register_data)

    login_data = {
        "email": "changepass@example.com",
        "password": "Test123!",
        "device_id": "device_changepass",
        "device_name": "Test Browser"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    tokens = response.json()["data"]
    access_token = tokens["access_token"]

    # Change password
    change_data = {
        "old_password": "Test123!",
        "new_password": "NewPass456!"
    }
    response = await client.post(
        "/api/v1/auth/change-password",
        json=change_data,
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "Password changed successfully" in data["data"]["message"]

    # Verify old password no longer works
    login_old = {
        "email": "changepass@example.com",
        "password": "Test123!",
        "device_id": "device_changepass"
    }
    response = await client.post("/api/v1/auth/login", json=login_old)
    assert response.status_code == 401

    # Verify new password works
    login_new = {
        "email": "changepass@example.com",
        "password": "NewPass456!",
        "device_id": "device_changepass2"
    }
    response = await client.post("/api/v1/auth/login", json=login_new)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_change_password_wrong_old_password(client: AsyncClient):
    """Test password change fails with incorrect old password"""
    register_data = {
        "email": "wrongpass@example.com",
        "password": "Test123!",
        "first_name": "Wrong",
        "last_name": "Password"
    }
    await client.post("/api/v1/auth/register", json=register_data)

    login_data = {
        "email": "wrongpass@example.com",
        "password": "Test123!",
        "device_id": "device_wrongpass",
        "device_name": "Test Browser"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    tokens = response.json()["data"]
    access_token = tokens["access_token"]

    # Try to change with wrong old password
    change_data = {
        "old_password": "Wrong123!",
        "new_password": "NewPass456!"
    }
    response = await client.post(
        "/api/v1/auth/change-password",
        json=change_data,
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 400
    data = response.json()
    assert "Current password is incorrect" in data["detail"]


@pytest.mark.asyncio
async def test_password_complexity_validation(client: AsyncClient):
    """Test that password complexity is enforced"""
    from app.core.rate_limiting import rate_limiter
    rate_limiter.clear()

    # Test missing uppercase
    register_data = {
        "email": "noupper@example.com",
        "password": "test123!",  # No uppercase
        "first_name": "No",
        "last_name": "Uppercase"
    }
    response = await client.post("/api/v1/auth/register", json=register_data)
    assert response.status_code == 422
    rate_limiter.clear()

    # Test missing lowercase
    register_data = {
        "email": "nolower@example.com",
        "password": "TEST123!",  # No lowercase
        "first_name": "No",
        "last_name": "Lowercase"
    }
    response = await client.post("/api/v1/auth/register", json=register_data)
    assert response.status_code == 422
    rate_limiter.clear()

    # Test missing digit
    register_data = {
        "email": "nodigit@example.com",
        "password": "TestTest!",  # No digit
        "first_name": "No",
        "last_name": "Digit"
    }
    response = await client.post("/api/v1/auth/register", json=register_data)
    assert response.status_code == 422
    rate_limiter.clear()

    # Test missing special character
    register_data = {
        "email": "nospecial@example.com",
        "password": "Test1234",  # No special character
        "first_name": "No",
        "last_name": "Special"
    }
    response = await client.post("/api/v1/auth/register", json=register_data)
    assert response.status_code == 422
    rate_limiter.clear()

    # Test too short
    register_data = {
        "email": "tooshort@example.com",
        "password": "Tt1!",  # Too short
        "first_name": "Too",
        "last_name": "Short"
    }
    response = await client.post("/api/v1/auth/register", json=register_data)
    assert response.status_code == 422
    rate_limiter.clear()



@pytest.mark.asyncio
async def test_remember_me_extended_session(client: AsyncClient, db):
    """Test remember_me feature extends token expiry"""
    from datetime import datetime, timezone, timedelta
    from app.domains.auth.models.token_device import RefreshToken

    register_data = {
        "email": "remember@example.com",
        "password": "Test123!",
        "first_name": "Remember",
        "last_name": "Me"
    }
    await client.post("/api/v1/auth/register", json=register_data)

    # Login with remember_me = True
    login_data = {
        "email": "remember@example.com",
        "password": "Test123!",
        "device_id": "device_remember",
        "device_name": "Test Browser",
        "remember_me": True
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 200
    tokens = response.json()["data"]
    refresh_token = tokens["refresh_token"]

    # Check token expiry in database (should be ~30 days)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token == refresh_token)
    )
    token_obj = result.scalar_one_or_none()
    assert token_obj is not None

    # Should be approximately 30 days from now
    expected_min_expiry = datetime.now(timezone.utc) + timedelta(days=29)
    expected_max_expiry = datetime.now(timezone.utc) + timedelta(days=31)
    assert expected_min_expiry < token_obj.expires_at < expected_max_expiry

    # Login without remember_me should have shorter expiry (~7 days default)
    login_data2 = {
        "email": "remember@example.com",
        "password": "Test123!",
        "device_id": "device_remember2",
        "device_name": "Test Browser",
        "remember_me": False
    }
    response2 = await client.post("/api/v1/auth/login", json=login_data2)
    tokens2 = response2.json()["data"]
    refresh_token2 = tokens2["refresh_token"]

    result2 = await db.execute(
        select(RefreshToken).where(RefreshToken.token == refresh_token2)
    )
    token_obj2 = result2.scalar_one_or_none()

    # Should be approximately 7 days from now
    expected_min_expiry2 = datetime.now(timezone.utc) + timedelta(days=6)
    expected_max_expiry2 = datetime.now(timezone.utc) + timedelta(days=8)
    assert expected_min_expiry2 < token_obj2.expires_at < expected_max_expiry2


@pytest.mark.asyncio
async def test_guest_token_extended_expiry(client: AsyncClient, db):
    """Test that guest tokens now expire in 7 days instead of 1"""
    from datetime import datetime, timezone, timedelta
    from app.domains.auth.models.token_device import RefreshToken

    guest_data = {
        "device_id": "guest_extended",
        "device_name": "Guest Browser"
    }
    response = await client.post("/api/v1/auth/guest", json=guest_data)
    tokens = response.json()["data"]
    refresh_token = tokens["refresh_token"]

    # Check token expiry in database (should be ~7 days)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token == refresh_token)
    )
    token_obj = result.scalar_one_or_none()
    assert token_obj is not None

    # Should be approximately 7 days from now
    expected_min_expiry = datetime.now(timezone.utc) + timedelta(days=6)
    expected_max_expiry = datetime.now(timezone.utc) + timedelta(days=8)
    assert expected_min_expiry < token_obj.expires_at < expected_max_expiry


@pytest.mark.asyncio
async def test_change_email_flow(client: AsyncClient, db):
    """Test complete email change flow with OTP verification"""
    register_data = {
        "email": "oldemail@example.com",
        "password": "Test123!",
        "first_name": "Change",
        "last_name": "Email"
    }
    await client.post("/api/v1/auth/register", json=register_data)

    login_data = {
        "email": "oldemail@example.com",
        "password": "Test123!",
        "device_id": "device_changeemail",
        "device_name": "Test Browser"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    tokens = response.json()["data"]
    access_token = tokens["access_token"]

    # Initiate email change
    change_email_data = {
        "new_email": "newemail@example.com",
        "password": "Test123!"
    }
    response = await client.post(
        "/api/v1/auth/change-email",
        json=change_email_data,
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "Verification code generated" in data["data"]["message"]

    # Get OTP from database (stored with purpose="email_change")
    result = await db.execute(select(User).where(User.email == "oldemail@example.com"))
    user = result.scalar_one_or_none()

    result = await db.execute(
        select(OTP).where(
            OTP.user_id == user.id,
            OTP.purpose == "email_change",
            OTP.is_used == False
        )
    )
    otp = result.scalar_one_or_none()
    assert otp is not None

    # Confirm email change with OTP
    confirm_data = {
        "new_email": "newemail@example.com",
        "otp_code": otp.code
    }
    response = await client.post(
        "/api/v1/auth/confirm-email-change",
        json=confirm_data,
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "Email updated successfully" in data["data"]["message"]

    # Verify email was changed in database
    await db.refresh(user)
    assert user.email == "newemail@example.com"


@pytest.mark.asyncio
async def test_change_email_wrong_password(client: AsyncClient):
    """Test email change fails with wrong password"""
    register_data = {
        "email": "wrongemail@example.com",
        "password": "Test123!",
        "first_name": "Wrong",
        "last_name": "Email"
    }
    await client.post("/api/v1/auth/register", json=register_data)

    login_data = {
        "email": "wrongemail@example.com",
        "password": "Test123!",
        "device_id": "device_wrongemail",
        "device_name": "Test Browser"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    tokens = response.json()["data"]
    access_token = tokens["access_token"]

    # Try to change email with wrong password
    change_email_data = {
        "new_email": "newemail@example.com",
        "password": "Wrong123!"
    }
    response = await client.post(
        "/api/v1/auth/change-email",
        json=change_email_data,
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 400
    data = response.json()
    assert "Invalid password" in data["detail"]


@pytest.mark.asyncio
async def test_account_deletion(client: AsyncClient, db):
    """Test account deletion (GDPR compliance)"""
    register_data = {
        "email": "delete@example.com",
        "password": "Test123!",
        "first_name": "Delete",
        "last_name": "Me"
    }
    await client.post("/api/v1/auth/register", json=register_data)

    login_data = {
        "email": "delete@example.com",
        "password": "Test123!",
        "device_id": "device_delete",
        "device_name": "Test Browser"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    tokens = response.json()["data"]
    access_token = tokens["access_token"]
    user_id = tokens["user"]["id"]

    # Delete account
    delete_data = {
        "password": "Test123!",
        "confirm": True
    }
    response = await client.request(
        "DELETE",
        "/api/v1/auth/account",
        json=delete_data,
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 202
    data = response.json()
    assert data["success"] == True
    assert "deleted successfully" in data["data"]["message"]

    # Verify account is deactivated
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    assert user is not None
    assert user.is_active == False
    assert user.email.startswith("deleted_")


@pytest.mark.asyncio
async def test_account_deletion_requires_confirmation(client: AsyncClient):
    """Test account deletion requires explicit confirmation"""
    register_data = {
        "email": "noconfirm@example.com",
        "password": "Test123!",
        "first_name": "No",
        "last_name": "Confirm"
    }
    await client.post("/api/v1/auth/register", json=register_data)

    login_data = {
        "email": "noconfirm@example.com",
        "password": "Test123!",
        "device_id": "device_noconfirm",
        "device_name": "Test Browser"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    tokens = response.json()["data"]
    access_token = tokens["access_token"]

    # Try to delete without confirmation
    delete_data = {
        "password": "Test123!",
        "confirm": False
    }
    response = await client.request(
        "DELETE",
        "/api/v1/auth/account",
        json=delete_data,
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 400
    data = response.json()
    assert "confirm" in data["detail"].lower()


@pytest.mark.asyncio
async def test_account_deletion_wrong_password(client: AsyncClient):
    """Test account deletion fails with wrong password"""
    register_data = {
        "email": "wrongdelete@example.com",
        "password": "Test123!",
        "first_name": "Wrong",
        "last_name": "Delete"
    }
    await client.post("/api/v1/auth/register", json=register_data)

    login_data = {
        "email": "wrongdelete@example.com",
        "password": "Test123!",
        "device_id": "device_wrongdelete",
        "device_name": "Test Browser"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    tokens = response.json()["data"]
    access_token = tokens["access_token"]

    # Try to delete with wrong password
    delete_data = {
        "password": "Wrong123!",
        "confirm": True
    }
    response = await client.request(
        "DELETE",
        "/api/v1/auth/account",
        json=delete_data,
        headers={"Authorization": f"Bearer {access_token}"}
    )
    assert response.status_code == 400
    data = response.json()
    assert "Invalid password" in data["detail"]


@pytest.mark.asyncio
async def test_unauthorized_access_to_protected_endpoints(client: AsyncClient):
    """Test that protected endpoints require authentication"""
    # Try to change password without auth
    change_data = {
        "old_password": "Test123!",
        "new_password": "NewPass456!"
    }
    response = await client.post("/api/v1/auth/change-password", json=change_data)
    assert response.status_code == 401

    # Try to change email without auth
    email_data = {
        "new_email": "test@example.com",
        "password": "Test123!"
    }
    response = await client.post("/api/v1/auth/change-email", json=email_data)
    assert response.status_code == 401

    # Try to delete account without auth
    delete_data = {
        "password": "Test123!",
        "confirm": True
    }
    response = await client.request("DELETE", "/api/v1/auth/account", json=delete_data)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_forgot_password_and_reset_flow(client: AsyncClient, db):
    """Test the complete forgot password and reset password flow"""
    # 1. Register a user
    register_data = {
        "email": "forgotpass@example.com",
        "password": "Test123!",
        "first_name": "Forgot",
        "last_name": "Pass"
    }
    await client.post("/api/v1/auth/register", json=register_data)

    # 2. Trigger forgot password
    forgot_data = {"email": "forgotpass@example.com"}
    response = await client.post("/api/v1/auth/forgot-password", json=forgot_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "Password reset code generated" in data["data"]["message"]

    # 3. Get OTP from database
    result = await db.execute(select(User).where(User.email == "forgotpass@example.com"))
    user = result.scalar_one_or_none()
    assert user is not None

    result = await db.execute(
        select(OTP).where(
            OTP.user_id == user.id,
            OTP.purpose == "reset_password",
            OTP.is_used == False
        )
    )
    otp = result.scalar_one_or_none()
    assert otp is not None

    # 4. Reset password with correct OTP
    reset_data = {
        "email": "forgotpass@example.com",
        "code": otp.code,
        "new_password": "NewSecurePass123!"
    }
    response = await client.post("/api/v1/auth/reset-password", json=reset_data)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "Password has been reset successfully" in data["data"]["message"]

    # 5. Login with new password
    login_data = {
        "email": "forgotpass@example.com",
        "password": "NewSecurePass123!",
        "device_id": "device_resetpass",
        "device_name": "Test Browser"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_forgot_password_nonexistent_email(client: AsyncClient):
    """Test forgot password request for nonexistent email doesn't reveal presence"""
    forgot_data = {"email": "nonexistent_forgot@example.com"}
    response = await client.post("/api/v1/auth/forgot-password", json=forgot_data)
    # Should return 200 and success for security obfuscation
    assert response.status_code == 200
    data = response.json()
    assert data["success"] == True
    assert "If the email exists" in data["data"]["message"]


@pytest.mark.asyncio
async def test_rate_limiting(client: AsyncClient):
    """Test that rate limiting is successfully applied to endpoints"""
    from app.core.rate_limiting import rate_limiter
    rate_limiter.clear()

    # The login limit is 5 requests per 5 minutes.
    # Send 5 requests (invalid credentials)
    login_data = {
        "email": "ratelimit@example.com",
        "password": "WrongPassword!",
        "device_id": "test_device_ratelimit"
    }
    for _ in range(5):
        response = await client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 401

    # 6th request should fail with 429 Too Many Requests
    response = await client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 429
    data = response.json()
    assert "Rate limit exceeded" in data["detail"]["error"]

    # Clear rate limiter state so as not to affect subsequent test runs
    rate_limiter.clear()

