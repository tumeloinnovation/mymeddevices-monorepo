from typing import Annotated

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import DbDep, get_current_user, security
from app.domains.auth.models.user import User
from app.domains.shopping.services.cart_service import CartService
from app.domains.shopping.services.coupon_service import CouponService
from app.domains.shopping.services.order_service import OrderService


async def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security), db: AsyncSession = Depends(get_db)
) -> User | None:
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


async def get_cart_service(db: DbDep) -> CartService:
    """Dependency provider for CartService."""
    return CartService(db)


async def get_order_service(db: DbDep) -> OrderService:
    """Dependency provider for OrderService."""
    return OrderService(db)


async def get_coupon_service(db: DbDep) -> CouponService:
    """Dependency provider for CouponService."""
    return CouponService(db)


CartServiceDep = Annotated[CartService, Depends(get_cart_service)]
OrderServiceDep = Annotated[OrderService, Depends(get_order_service)]
CouponServiceDep = Annotated[CouponService, Depends(get_coupon_service)]
