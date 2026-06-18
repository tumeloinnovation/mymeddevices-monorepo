from typing import Optional
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, security
from app.domains.auth.models.user import User


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """
    Dependency to get the current authenticated user if a valid token is provided.
    If no token is provided or the token is invalid, returns None instead of raising an error.
    """
    if not credentials or not credentials.credentials:
        return None
    
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None
