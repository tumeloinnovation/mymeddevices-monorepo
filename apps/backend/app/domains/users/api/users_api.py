from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Annotated

from app.core.database import get_db
from app.core.responses import success_response
from app.core.dependencies import get_current_user, get_current_active_user, require_role
from app.domains.auth.models.user import User
from app.core.logging import logger

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me")
async def get_current_user_profile(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Get the current authenticated user's profile.
    This endpoint requires a valid JWT access token.
    """
    return success_response({
        "id": str(current_user.id),
        "email": current_user.email,
        "role": current_user.role,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone": current_user.phone,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    })


@router.get("/me/active")
async def get_active_user_profile(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """
    Get the current active user's profile.
    This endpoint requires a valid JWT and the user must be active.
    """
    return success_response({
        "id": str(current_user.id),
        "email": current_user.email,
        "role": current_user.role,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "phone": current_user.phone,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
    })


@router.get("/admin-only")
async def admin_only_endpoint(
    current_user: Annotated[User, Depends(require_role("admin", "worker"))]
):
    """
    Admin-only endpoint.
    Only users with 'admin' or 'worker' roles can access this.
    """
    logger.info(f"Admin access: {current_user.email}")
    return success_response({
        "message": f"Welcome, Admin {current_user.email}!",
        "role": current_user.role
    })


@router.get("/vendor-only")
async def vendor_only_endpoint(
    current_user: Annotated[User, Depends(require_role("vendor"))]
):
    """
    Vendor-only endpoint.
    Only users with 'vendor' role can access this.
    """
    logger.info(f"Vendor access: {current_user.email}")
    return success_response({
        "message": f"Welcome, Vendor {current_user.email}!",
        "role": current_user.role
    })


@router.get("/customer-only")
async def customer_only_endpoint(
    current_user: Annotated[User, Depends(require_role("customer"))]
):
    """
    Customer-only endpoint.
    Only users with 'customer' role can access this.
    """
    logger.info(f"Customer access: {current_user.email}")
    return success_response({
        "message": f"Welcome, Customer {current_user.email}!",
        "role": current_user.role
    })
