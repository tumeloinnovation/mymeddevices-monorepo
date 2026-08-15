import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import require_role
from app.core.responses import ApiSuccessResponse, success_response
from app.domains.auth.models.user import User
from app.domains.shopping.schemas.order_schemas import (
    OrderInternalNotesUpdate,
    OrderListResponse,
    OrderResponse,
    OrderStatusUpdate,
)
from app.domains.shopping.services.order_service import OrderService

router = APIRouter(prefix="/admin/shopping/orders", tags=["Admin Order Management"])


@router.get("", response_model=ApiSuccessResponse[OrderListResponse])
async def admin_list_orders(
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    status: str | None = Query(None),
    user_id: uuid.UUID | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Admin lists all orders with filters."""
    service = OrderService(db)
    orders, total = await service.list_orders(
        user_id=user_id, status=status, offset=(page - 1) * page_size, limit=page_size
    )
    return success_response({"orders": orders, "total": total})


from app.domains.shopping.services.order_state_machine import InvalidStateTransitionError


@router.patch("/{order_id}/status", response_model=ApiSuccessResponse[OrderResponse])
async def admin_update_order_status(
    order_id: uuid.UUID,
    data: OrderStatusUpdate,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db),
):
    """Admin updates order status (e.g., from pending to paid) with state machine validation."""
    try:
        service = OrderService(db)
        order = await service.update_order_status(order_id, data.status)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        return success_response(order)
    except InvalidStateTransitionError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid status transition: {str(e)}")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/{order_id}/internal-notes", response_model=ApiSuccessResponse[OrderResponse])
async def admin_update_internal_notes(
    order_id: uuid.UUID,
    data: OrderInternalNotesUpdate,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db),
):
    """Admin updates internal notes for an order (admin-only communication)."""
    from sqlalchemy import select

    from app.domains.shopping.models.order import Order

    # Get the order
    stmt = select(Order).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Update internal notes
    order.internal_notes = data.internal_notes
    await db.commit()

    service = OrderService(db)
    order_loaded = await service.get_order(str(order_id))
    return success_response(order_loaded)


@router.get("/vendor", response_model=ApiSuccessResponse[OrderListResponse])
async def vendor_list_orders(
    current_user: Annotated[User, Depends(require_role("vendor", "admin"))],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Vendor lists orders containing their products."""
    # We need the vendor profile ID for this user
    from sqlalchemy import select

    from app.domains.vendor.models.vendor_profile import VendorProfile

    stmt = select(VendorProfile).where(VendorProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    vendor_profile = result.scalar_one_or_none()

    if not vendor_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vendor profile not found")

    service = OrderService(db)
    orders, total = await service.list_orders(
        vendor_id=vendor_profile.id, offset=(page - 1) * page_size, limit=page_size
    )

    # Secure data: filter order items and recalculate totals for the vendor
    secured_orders = []
    for order in orders:
        # Convert to Pydantic to avoid mutating SQLAlchemy model side-effects
        order_dto = OrderResponse.model_validate(order)
        vendor_items = [item for item in order_dto.items if item.vendor_id == vendor_profile.id]
        if vendor_items:
            # Overwrite items and total for the response view
            order_dto.items = vendor_items
            order_dto.total_amount = sum(item.subtotal for item in vendor_items)
            secured_orders.append(order_dto)

    return success_response({"orders": secured_orders, "total": total})


@router.get("/{order_id}", response_model=ApiSuccessResponse[OrderResponse])
async def admin_get_order_details(
    order_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db),
):
    """Admin gets full order details including internal notes."""
    service = OrderService(db)
    order = await service.get_order(order_id)

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    return success_response(order)
