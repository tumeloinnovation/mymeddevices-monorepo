import uuid
from typing import Annotated, Any

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import verify_access_token
from app.domains.auth.models.user import User

# HTTP Bearer scheme for extracting the token from Authorization header
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """
    Dependency to get the current authenticated user from the JWT token.

    Args:
        credentials: The HTTP Authorization credentials (Bearer token)
        db: Database session

    Returns:
        The authenticated User object

    Raises:
        HTTPException: If token is invalid or user not found
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # Verify and decode the token
    payload = verify_access_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if access token is blacklisted
    from app.core.blacklist import token_blacklist

    jti = payload.get("jti")
    if jti and await token_blacklist.is_blacklisted(jti):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract user ID from token
    user_id_raw: Any | None = payload.get("sub")
    if user_id_raw is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user identifier",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = str(user_id_raw)

    # Query the user from database
    try:
        user_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user identifier in token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")

    return user


async def get_current_user_optional(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User | None:
    """
    Dependency to optionally get current authenticated user if valid token present, else None.
    """
    if credentials is None:
        return None

    token = credentials.credentials
    payload = verify_access_token(token)
    if payload is None:
        return None

    from app.core.blacklist import token_blacklist

    jti = payload.get("jti")
    if jti and await token_blacklist.is_blacklisted(jti):
        return None

    user_id_raw: Any | None = payload.get("sub")
    if user_id_raw is None:
        return None

    try:
        user_uuid = uuid.UUID(str(user_id_raw))
    except ValueError:
        return None

    result = await db.execute(select(User).where(User.id == user_uuid))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        return None

    return user


async def get_current_active_user(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """
    Dependency to get the current active user.
    This is an additional check that can be used for endpoints requiring active users.

    Args:
        current_user: The current authenticated user

    Returns:
        The User if active

    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")
    return current_user


async def get_current_admin_user(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """
    Dependency to get the current authenticated admin user.
    Verifies the user has admin role.

    Args:
        current_user: The current authenticated user

    Returns:
        The User if they have admin role

    Raises:
        HTTPException: If user is not an admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required."
        )
    return current_user


def require_role(*roles: str):
    """
    Factory function to create a role-checking dependency.

    Usage:
        @router.get("/admin-only")
        async def admin_only(
            user: Annotated[User, Depends(require_role("admin", "worker"))]
        ):
            return {"message": f"Welcome {user.email}"}

    Args:
        *roles: Allowed role names

    Returns:
        A dependency function that checks user roles
    """

    async def role_checker(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        # Admin has superuser access to everything
        if current_user.role == "admin":
            return current_user

        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail=f"Access denied. Required role: {', '.join(roles)}"
            )
        return current_user

    return role_checker


# Standardized dependency type aliases for clean route parameter declarations
DbDep = Annotated[AsyncSession, Depends(get_db)]
CurrentUserDep = Annotated[User, Depends(get_current_user)]
OptionalUserDep = Annotated[User | None, Depends(get_current_user_optional)]

