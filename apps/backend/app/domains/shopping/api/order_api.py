from typing import Annotated, List
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import success_response, ApiSuccessResponse
from app.core.dependencies import get_current_user
from app.domains.auth.models.user import User
from app.domains.shopping.schemas.order_schemas import OrderResponse, OrderListResponse
from app.domains.shopping.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.get("", response_model=ApiSuccessResponse[OrderListResponse])
async def list_my_orders(
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List orders for the current customer."""
    service = OrderService(db)
    orders, total = await service.list_orders(
        user_id=current_user.id,
        offset=(page - 1) * page_size,
        limit=page_size
    )
    return success_response({"orders": orders, "total": total})

@router.get("/{order_id}", response_model=ApiSuccessResponse[OrderResponse])
async def get_order_details(
    order_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get details of a specific order."""
    service = OrderService(db)
    order = await service.get_order(order_id)
    
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        
    return success_response(order)
