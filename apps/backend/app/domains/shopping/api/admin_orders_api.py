from typing import Annotated, List, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import success_response, ApiSuccessResponse
from app.core.dependencies import require_role
from app.domains.auth.models.user import User
from app.domains.shopping.schemas.order_schemas import OrderResponse, OrderStatusUpdate
from app.domains.shopping.services.order_service import OrderService

router = APIRouter(prefix="/admin/shopping/orders", tags=["Admin Order Management"])

@router.get("", response_model=ApiSuccessResponse[List[OrderResponse]])
async def admin_list_orders(
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    status: Optional[str] = Query(None),
    user_id: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Admin lists all orders with filters."""
    service = OrderService(db)
    orders, total = await service.list_orders(
        user_id=user_id,
        status=status,
        offset=(page - 1) * page_size,
        limit=page_size
    )
    return success_response(orders)

@router.patch("/{order_id}/status", response_model=ApiSuccessResponse[OrderResponse])
async def admin_update_order_status(
    order_id: uuid.UUID,
    data: OrderStatusUpdate,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Admin updates order status (e.g., from pending to paid)."""
    service = OrderService(db)
    order = await service.update_order_status(order_id, data.status)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return success_response(order)

@router.get("/vendor", response_model=ApiSuccessResponse[List[OrderResponse]])
async def vendor_list_orders(
    current_user: Annotated[User, Depends(require_role("vendor", "admin"))],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Vendor lists orders containing their products."""
    # We need the vendor profile ID for this user
    from app.domains.vendor.models.vendor_profile import VendorProfile
    from sqlalchemy import select
    
    stmt = select(VendorProfile).where(VendorProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    vendor_profile = result.scalar_one_or_none()
    
    if not vendor_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vendor profile not found")

    service = OrderService(db)
    orders, total = await service.list_orders(
        vendor_id=vendor_profile.id,
        offset=(page - 1) * page_size,
        limit=page_size
    )

    # Secure data: filter order items and recalculate totals for the vendor
    secured_orders = []
    for order in orders:
        vendor_items = [item for item in order.items if item.vendor_id == vendor_profile.id]
        if vendor_items:
            # Overwrite items and total for the response view
            order.items = vendor_items
            order.total_amount = sum(item.subtotal for item in vendor_items)
            secured_orders.append(order)

    return success_response(secured_orders)
