from typing import Annotated

from fastapi import Depends

from app.core.dependencies import DbDep
from app.domains.auth.services.auth_service import AuthService
from app.domains.auth.services.otp_service import OTPService


async def get_auth_service(db: DbDep) -> AuthService:
    """Dependency provider for AuthService."""
    return AuthService(db)


async def get_otp_service(db: DbDep) -> OTPService:
    """Dependency provider for OTPService."""
    return OTPService(db)


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
OTPServiceDep = Annotated[OTPService, Depends(get_otp_service)]
