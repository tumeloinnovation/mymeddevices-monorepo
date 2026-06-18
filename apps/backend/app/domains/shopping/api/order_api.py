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


# ============================================================================
# Order Status & Tracking Endpoints
# ============================================================================

@router.get("/{order_id}/status", response_model=ApiSuccessResponse[dict])
async def get_order_status(
    order_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Get the current status of an order."""
    service = OrderService(db)
    order = await service.get_order(order_id)

    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Get payment status if payment exists
    payment_status = "pending"
    if hasattr(order, 'payment') and order.payment:
        payment_status = order.payment.status

    return success_response({
        "order_id": str(order_id),
        "status": order.status,
        "payment_status": payment_status,
        "tracking_number": order.tracking_number if hasattr(order, 'tracking_number') else None,
        "estimated_delivery": order.estimated_delivery if hasattr(order, 'estimated_delivery') else None,
    })


@router.get("/{order_id}/tracking", response_model=ApiSuccessResponse[dict])
async def track_order(
    order_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Track an order with full history."""
    service = OrderService(db)
    order = await service.get_order(order_id)

    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Build tracking history (simplified - should be from a tracking_history table)
    history = [
        {
            "status": "pending",
            "timestamp": order.created_at.isoformat(),
            "description": "Order placed",
            "location": None,
        }
    ]

    if hasattr(order, 'updated_at') and order.status != "pending":
        history.append({
            "status": order.status,
            "timestamp": order.updated_at.isoformat(),
            "description": f"Order {order.status}",
            "location": None,
        })

    return success_response({
        "order_id": str(order_id),
        "order_number": order.order_number if hasattr(order, 'order_number') else str(order_id),
        "status": order.status,
        "tracking_number": order.tracking_number if hasattr(order, 'tracking_number') else None,
        "tracking_url": f"https://example.com/track/{order.tracking_number}" if hasattr(order, 'tracking_number') and order.tracking_number else None,
        "estimated_delivery": order.estimated_delivery if hasattr(order, 'estimated_delivery') else None,
        "history": history,
    })


@router.post("/{order_id}/cancel", response_model=ApiSuccessResponse[OrderResponse])
async def cancel_order(
    order_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    reason: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Cancel an order."""
    service = OrderService(db)
    order = await service.get_order(order_id)

    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Check if order can be cancelled
    if order.status not in ["pending", "processing"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel order with status '{order.status}'"
        )

    # Update order status
    order.status = "cancelled"
    if hasattr(order, 'cancellation_reason'):
        order.cancellation_reason = reason
    await db.commit()
    await db.refresh(order)

    return success_response(order)


@router.post("/{order_id}/refund", response_model=ApiSuccessResponse[dict])
async def request_refund(
    order_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    reason: str = None,
    db: AsyncSession = Depends(get_db)
):
    """Request a refund for an order."""
    service = OrderService(db)
    order = await service.get_order(order_id)

    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Check if order can be refunded
    if order.status not in ["delivered", "shipped"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot request refund for order with status '{order.status}'"
        )

    # Create refund request (simplified - should create a refund record)
    # For now, just update the order status
    order.status = "refund_requested"
    await db.commit()
    await db.refresh(order)

    return success_response({
        "refund_id": str(uuid.uuid4()),
        "order_id": str(order_id),
        "status": "pending",
        "amount": str(order.total_amount) if hasattr(order, 'total_amount') else "0",
    })
