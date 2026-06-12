import pytest
import jwt
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.config import settings
from app.domains.auth.models.user import User
from app.domains.auth.models.token_device import RefreshToken
from app.domains.auth.repositories.auth_repository import UserRepository, RefreshTokenRepository
from app.core.blacklist import token_blacklist

@pytest.fixture(autouse=True)
def clean_blacklist():
    token_blacklist.clear()
    yield
    token_blacklist.clear()

@pytest.mark.asyncio
async def test_jwt_rs256_algorithm_signing(client: AsyncClient):
    """Verify generated access tokens use RS256 algorithm and contain jti & iat claims"""
    # 1. Register and login to get tokens
    register_data = {
        "email": "rs256-test@example.com",
        "password": "TestPassword123!",
        "first_name": "RS256",
        "last_name": "Test"
    }
    await client.post("/api/v1/auth/register", json=register_data)

    login_data = {
        "email": "rs256-test@example.com",
        "password": "TestPassword123!",
        "device_id": "test_device_rs256"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    assert response.status_code == 200
    data = response.json()
    access_token = data["data"]["access_token"]

    # 2. Decode the header and payload directly without signature verification to inspect claims
    header = jwt.get_unverified_header(access_token)
    payload = jwt.decode(access_token, options={"verify_signature": False})

    # Assert that RS256 algorithm is specified in the header
    assert header["alg"] == "RS256"
    # Assert standard claims are present in payload
    assert "jti" in payload
    assert "iat" in payload
    assert payload["sub"] is not None

@pytest.mark.asyncio
async def test_token_blacklist_on_logout(client: AsyncClient):
    """Verify that calling logout invalidates the access token immediately"""
    # 1. Register & login
    email = "logout-blacklist@example.com"
    register_data = {
        "email": email,
        "password": "TestPassword123!",
        "first_name": "Logout",
        "last_name": "Blacklist"
    }
    await client.post("/api/v1/auth/register", json=register_data)

    login_data = {
        "email": email,
        "password": "TestPassword123!",
        "device_id": "device_logout_test"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    tokens = response.json()["data"]
    access_token = tokens["access_token"]
    refresh_token = tokens["refresh_token"]

    # 2. Confirm the access token is valid before logging out
    headers = {"Authorization": f"Bearer {access_token}"}
    me_resp = await client.get("/api/v1/users/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["data"]["email"] == email

    # 3. Log out (revokes refresh token and blacklists access token)
    logout_data = {"refresh_token": refresh_token}
    logout_resp = await client.post("/api/v1/auth/logout", json=logout_data, headers=headers)
    assert logout_resp.status_code == 200

    # 4. Attempt to access protected endpoint with now-blacklisted token
    me_resp2 = await client.get("/api/v1/users/me", headers=headers)
    assert me_resp2.status_code == 401
    assert "revoked" in me_resp2.json()["detail"].lower()

@pytest.mark.asyncio
async def test_token_blacklist_and_refresh_revocation_on_password_change(client: AsyncClient, db: AsyncSession):
    """Verify password change blacklists caller access token and revokes all refresh tokens"""
    # 1. Register & login
    email = "passchange-test@example.com"
    register_data = {
        "email": email,
        "password": "OldPassword123!",
        "first_name": "Pass",
        "last_name": "Change"
    }
    await client.post("/api/v1/auth/register", json=register_data)

    login_data = {
        "email": email,
        "password": "OldPassword123!",
        "device_id": "device_pass_change"
    }
    response = await client.post("/api/v1/auth/login", json=login_data)
    tokens = response.json()["data"]
    access_token = tokens["access_token"]

    # 2. Call change-password (authenticates with old access token)
    change_data = {
        "old_password": "OldPassword123!",
        "new_password": "NewPassword123!"
    }
    headers = {"Authorization": f"Bearer {access_token}"}
    change_resp = await client.post("/api/v1/auth/change-password", json=change_data, headers=headers)
    assert change_resp.status_code == 200

    # 3. Assert access token is immediately revoked (blacklisted)
    me_resp = await client.get("/api/v1/users/me", headers=headers)
    assert me_resp.status_code == 401
    assert "revoked" in me_resp.json()["detail"].lower()

    # 4. Assert all refresh tokens in DB for this user are now marked as revoked
    user_repo = UserRepository(db)
    user = await user_repo.get_by_email(email)
    
    token_repo = RefreshTokenRepository(db)
    tokens_list = await token_repo.list(user_id=user.id)
    assert len(tokens_list) > 0
    for t in tokens_list:
        assert t.revoked == True

@pytest.mark.asyncio
async def test_database_integrity_error_handler(client: AsyncClient):
    """Verify that registering a duplicate email returns 409 Conflict instead of 500"""
    email = "unique-integrity-test@example.com"
    user_data = {
        "email": email,
        "password": "TestPassword123!",
        "first_name": "Dup",
        "last_name": "One"
    }
    # First registration
    resp1 = await client.post("/api/v1/auth/register", json=user_data)
    assert resp1.status_code == 200

    # Duplicate registration
    resp2 = await client.post("/api/v1/auth/register", json=user_data)
    assert resp2.status_code == 409
    data = resp2.json()
    assert data["success"] == False
    assert "already exists" in data["detail"].lower()

@pytest.mark.asyncio
async def test_repositories_query_operations(db: AsyncSession):
    """Verify base repository CRUD operations function properly"""
    user_repo = UserRepository(db)
    
    # 1. Create
    email = "repo-test@example.com"
    user = User(
        email=email,
        password_hash="argon2_mock_hash",
        role="customer",
        first_name="Repo",
        last_name="Test"
    )
    created_user = await user_repo.create(user)
    assert created_user.id is not None
    assert created_user.email == email

    # 2. Get By
    fetched_user = await user_repo.get_by_email(email)
    assert fetched_user is not None
    assert fetched_user.id == created_user.id

    # 3. Update
    updated_user = await user_repo.update(fetched_user, {"first_name": "UpdatedName"})
    assert updated_user.first_name == "UpdatedName"

    # 4. Delete
    delete_result = await user_repo.delete(updated_user.id)
    assert delete_result is True

    # 5. Get (Confirm deletion)
    confirm_del = await user_repo.get(updated_user.id)
    assert confirm_del is None
