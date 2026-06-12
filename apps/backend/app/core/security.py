from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import uuid
import jwt
from jwt import PyJWTError
from argon2 import PasswordHasher
from app.core.config import settings
ph = PasswordHasher()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    # Standard security claims: JTI for revocation tracking, IAT for token issuance time
    if "jti" not in to_encode:
        to_encode["jti"] = str(uuid.uuid4())
    if "iat" not in to_encode:
        to_encode["iat"] = int(datetime.now(timezone.utc).timestamp())
    to_encode.update({"exp": int(expire.timestamp())})
    return jwt.encode(to_encode, settings.JWT_PRIVATE_KEY, algorithm=settings.ALGORITHM)

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

def verify_access_token(token: str) -> Dict[str, Any] | None:
    """
    Verify and decode a JWT access token.

    Args:
        token: The JWT token to verify

    Returns:
        The decoded token payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_PUBLIC_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except PyJWTError:
        return None



