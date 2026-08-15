import asyncio
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from argon2 import PasswordHasher
from jwt import PyJWTError

from app.core.config import settings

ph = PasswordHasher()


def create_access_token(data: dict, expires_delta: timedelta | None = None, auth_time: int | None = None) -> str:
    """
    Create a JWT access token with enhanced security claims.

    Standard claims included:
    - sub: Subject (user ID)
    - iat: Issued At (timestamp)
    - exp: Expiration (timestamp)
    - jti: JWT ID (unique identifier for revocation)
    - auth_time: When authentication occurred (optional, for re-auth checks)
    - nbf: Not Before (optional)

    Args:
        data: Custom claims to include in the token (e.g., email, role)
        expires_delta: Custom expiration time (default from settings)
        auth_time: Authentication timestamp (defaults to now)

    Returns:
        Encoded JWT string
    """
    to_encode = data.copy()
    now = datetime.now(UTC)
    expire = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))

    # Standard JWT claims
    if "jti" not in to_encode:
        to_encode["jti"] = str(uuid.uuid4())
    if "iat" not in to_encode:
        to_encode["iat"] = int(now.timestamp())
    to_encode["exp"] = int(expire.timestamp())
    to_encode["nbf"] = int(now.timestamp())  # Not valid before now

    # Security claims
    if "auth_time" not in to_encode:
        to_encode["auth_time"] = auth_time or int(now.timestamp())

    private_key = settings.JWT_PRIVATE_KEY
    if not private_key:
        raise RuntimeError("JWT_PRIVATE_KEY is not configured")
    return jwt.encode(to_encode, private_key, algorithm=settings.ALGORITHM)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password or not plain_password:
        return False
    # Enforce standard Argon2 prefix. Reject placeholders/disabled flags immediately
    if not hashed_password.startswith("$argon2"):
        return False
    try:
        return ph.verify(hashed_password, plain_password)
    except Exception:
        return False


def get_password_hash(password: str) -> str:
    return ph.hash(password)


async def verify_password_async(plain_password: str, hashed_password: str) -> bool:
    return await asyncio.to_thread(verify_password, plain_password, hashed_password)


async def get_password_hash_async(password: str) -> str:
    return await asyncio.to_thread(get_password_hash, password)


def verify_access_token(token: str) -> dict[str, Any] | None:
    """
    Verify and decode a JWT access token.

    Args:
        token: The JWT token to verify

    Returns:
        The decoded token payload if valid, None otherwise
    """
    try:
        public_key = settings.JWT_PUBLIC_KEY
        if not public_key:
            raise RuntimeError("JWT_PUBLIC_KEY is not configured")
        payload = jwt.decode(token, public_key, algorithms=[settings.ALGORITHM])
        return payload
    except PyJWTError:
        return None
