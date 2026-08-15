from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.responses import ApiSuccessResponse, success_response
from app.domains.auth.models.user import User
from app.domains.shopping.api.dependencies import get_optional_current_user
from app.domains.shopping.models.order import OrderStatus
from app.domains.shopping.schemas.order_schemas import OrderResponse
from app.domains.shopping.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["Orders"])


# ============================================================================
# Public Order Lookup (no authentication required)
# ============================================================================


@router.get("/public/{order_id_or_number}", response_model=ApiSuccessResponse[OrderResponse])
async def get_public_order_details(
    order_id_or_number: str,
    guest_token: str | None = None,
    current_user: User | None = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get order details publicly without authentication.

    SECURITY: Requires either:
    - Valid authentication (current_user is not None) AND ownership verification
    - Valid guest token matching the order's stored guest_token

    This prevents unauthorized access to customer PII via sequential order number enumeration.
    """
    service = OrderService(db)
    order = await service.get_order(order_id_or_number)

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # SECURITY: Ownership verification required
    # Case 1: Authenticated user - must own the order or be admin/worker
    if current_user:
        if order.user_id != current_user.id and current_user.role not in ("admin", "worker"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this order"
            )
    # Case 2: Guest access - must provide valid guest token
    elif guest_token:
        if order.guest_token != guest_token:
            # Invalid token - don't reveal order existence
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    # Case 3: No auth and no token - deny access
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication or valid guest token required to access this order",
        )

    return success_response(order)


@router.get("")
async def list_my_orders(
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """List orders for the current customer."""
    service = OrderService(db)
    orders, total = await service.list_orders(user_id=current_user.id, offset=(page - 1) * page_size, limit=page_size)
    # Return in format expected by frontend: items instead of orders
    return success_response({"items": orders, "total": total, "page": page, "limit": page_size})


@router.get("/{order_id_or_number}", response_model=ApiSuccessResponse[OrderResponse])
async def get_order_details(
    order_id_or_number: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Get details of a specific order by UUID or order number."""
    service = OrderService(db)
    order = await service.get_order(order_id_or_number)

    if not order or (order.user_id != current_user.id and current_user.role not in ("admin", "worker")):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    return success_response(order)


# ============================================================================
# Order Status & Tracking Endpoints
# ============================================================================


@router.get("/{order_id_or_number}/status", response_model=ApiSuccessResponse[dict])
async def get_order_status(
    order_id_or_number: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Get the current status of an order."""
    service = OrderService(db)
    order = await service.get_order(order_id_or_number)

    if not order or (order.user_id != current_user.id and current_user.role not in ("admin", "worker")):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Get payment status if payment exists
    payment_status = "pending"
    if hasattr(order, "payment") and order.payment:
        payment_status = order.payment.status

    return success_response(
        {
            "order_id": str(order.id),
            "status": order.status,
            "payment_status": payment_status,
            "tracking_number": order.tracking_number if hasattr(order, "tracking_number") else None,
            "estimated_delivery": order.estimated_delivery if hasattr(order, "estimated_delivery") else None,
        }
    )


@router.get("/{order_id_or_number}/tracking", response_model=ApiSuccessResponse[dict])
async def track_order(
    order_id_or_number: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Track an order with full history."""
    service = OrderService(db)
    order = await service.get_order(order_id_or_number)

    if not order or (order.user_id != current_user.id and current_user.role not in ("admin", "worker")):
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

    if hasattr(order, "updated_at") and order.status != "pending":
        history.append(
            {
                "status": order.status,
                "timestamp": order.updated_at.isoformat(),
                "description": f"Order {order.status}",
                "location": None,
            }
        )

    return success_response(
        {
            "order_id": str(order.id),
            "order_number": order.order_number if hasattr(order, "order_number") else str(order.id),
            "status": order.status,
            "tracking_number": order.tracking_number if hasattr(order, "tracking_number") else None,
            "tracking_url": f"https://example.com/track/{order.tracking_number}"
            if hasattr(order, "tracking_number") and order.tracking_number
            else None,
            "estimated_delivery": order.estimated_delivery if hasattr(order, "estimated_delivery") else None,
            "history": history,
        }
    )


@router.post("/{order_id_or_number}/cancel", response_model=ApiSuccessResponse[OrderResponse])
async def cancel_order(
    order_id_or_number: str,
    current_user: Annotated[User, Depends(get_current_user)],
    reason: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Cancel an order."""
    service = OrderService(db)
    order = await service.get_order(order_id_or_number)

    if not order or (order.user_id != current_user.id and current_user.role not in ("admin", "worker")):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Check if order can be cancelled
    if order.status not in ["pending", "processing"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot cancel order with status '{order.status}'"
        )

    # Update order status
    order.status = OrderStatus.CANCELLED
    if hasattr(order, "cancellation_reason"):
        order.cancellation_reason = reason

    # Restore stock for cancelled order items (prevents inventory loss on cancellation)
    from sqlalchemy import select, update

    from app.domains.catalog.models.product import Product
    from app.domains.shopping.models.order import OrderItem

    items_stmt = select(OrderItem).where(OrderItem.order_id == order.id)
    items_result = await db.execute(items_stmt)
    for item in items_result.scalars().all():
        await db.execute(
            update(Product)
            .where(Product.id == item.product_id)
            .values(stock_quantity=Product.stock_quantity + item.quantity)
        )

    await db.commit()
    await db.refresh(order)

    return success_response(order)


@router.post("/{order_id_or_number}/refund", response_model=ApiSuccessResponse[dict])
async def request_refund(
    order_id_or_number: str,
    current_user: Annotated[User, Depends(get_current_user)],
    reason: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Request a refund for an order."""
    from app.domains.returns.schemas.return_schemas import ReturnItemCreate, ReturnRequestCreate
    from app.domains.returns.services.return_service import ReturnService

    service = OrderService(db)
    order = await service.get_order(order_id_or_number)

    if not order or (order.user_id != current_user.id and current_user.role not in ("admin", "worker")):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Check if order can be refunded
    if order.status not in [OrderStatus.DELIVERED.value, OrderStatus.SHIPPED.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot request refund for order with status '{order.status}'",
        )

    # Create a real return request so admins can review and process the refund
    return_items = []
    for item in order.items or []:
        return_items.append(
            ReturnItemCreate(
                order_item_id=item.id,
                product_id=item.product_id,
                product_name=item.product.name if item.product else f"Product {item.product_id}",
                quantity=item.quantity,
                reason=reason,
            )
        )

    return_service = ReturnService(db)
    return_request = await return_service.create_return(
        customer_id=current_user.id,
        return_in=ReturnRequestCreate(
            order_id=order.id,
            reason=reason or "Customer requested refund",
            description="Refund requested from order details",
            items=return_items,
            refund_method="original",
        ),
    )

    return success_response(
        {
            "refund_id": str(return_request.id),
            "return_number": return_request.return_number,
            "order_id": str(order.id),
            "status": return_request.status,
            "message": "Refund request received. Admin will review and process.",
            "amount": str(order.total_amount) if hasattr(order, "total_amount") else "0",
        }
    )
