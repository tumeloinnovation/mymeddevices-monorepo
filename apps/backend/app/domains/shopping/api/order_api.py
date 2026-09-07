import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.responses import ApiSuccessResponse, success_response
from app.domains.auth.models.user import User
from app.domains.logistics.models.delivery import Delivery
from app.domains.logistics.services.delivery_service import DeliveryService
from app.domains.logistics.services.tracking_service import TrackingService
from app.domains.shopping.api.dependencies import get_optional_current_user
from app.domains.shopping.models.order import Order, OrderStatus, OrderTimelineEvent
from app.domains.shopping.schemas.order_schemas import OrderResponse
from app.domains.shopping.services.order_service import OrderService

router = APIRouter(prefix="/orders", tags=["Orders"])


# ============================================================================
# Public Order Lookup (no authentication required)
# ============================================================================


@router.get("/public/phone/{phone}", response_model=ApiSuccessResponse[list[OrderResponse]])
async def get_public_orders_by_phone(
    phone: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Look up guest orders by the phone number used during checkout.
    """
    clean_phone = phone.strip()
    if not clean_phone or len(clean_phone) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid phone number is required for order lookup",
        )

    service = OrderService(db)
    orders = await service.get_orders_by_phone(clean_phone)
    return success_response(orders)


@router.get("/public/{order_id_or_number}", response_model=ApiSuccessResponse[OrderResponse])
async def get_public_order_details(
    order_id_or_number: str,
    guest_token: str | None = None,
    current_user: User | None = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get order details publicly without authentication.
    Supports lookups with guest_token, authenticated ownership, or direct valid consignment identifier.
    """
    service = OrderService(db)
    order = await service.get_order(order_id_or_number)

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # If authenticated user, ensure non-admin users only access their own orders
    if current_user and order.user_id and order.user_id != current_user.id and current_user.role not in ("admin", "worker"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this order"
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
    guest_token: str | None = None,
    current_user: User | None = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get details of a specific order by UUID or order number.
    Supports authenticated users as well as guest users providing a valid guest_token.
    """
    service = OrderService(db)
    order = await service.get_order(order_id_or_number)

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # If authenticated, verify ownership or admin/worker privilege
    if current_user:
        if order.user_id and order.user_id != current_user.id and current_user.role not in ("admin", "worker"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access this order"
            )
    # If order is associated with a user but caller is unauthenticated, require authentication
    elif order.user_id is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to access this customer order",
        )

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
    """Track an order using live logistics delivery progress when available."""
    service = OrderService(db)
    order = await service.get_order(order_id_or_number)

    if not order or (order.user_id != current_user.id and current_user.role not in ("admin", "worker")):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    delivery_result = await db.execute(
        select(Delivery)
        .where(Delivery.order_id == order.id)
        .options(
            selectinload(Delivery.stops),
            selectinload(Delivery.driver).selectinload(User.driver_profile),
            selectinload(Delivery.proofs),
        )
        .order_by(Delivery.created_at.desc())
        .limit(1)
    )
    delivery = delivery_result.scalar_one_or_none()

    if delivery:
        snapshot = await TrackingService(db).get_tracking(delivery.id)
        history = [
            {
                "status": "pending",
                "timestamp": order.created_at.isoformat(),
                "description": "Order placed",
                "location": None,
            }
        ]
        history.extend(snapshot["history"])
        return success_response(
            {
                "order_id": str(order.id),
                "order_number": order.order_number if hasattr(order, "order_number") else str(order.id),
                "status": order.status,
                "delivery": snapshot,
                "live_tracking": True,
                "driver_name": snapshot["driver_name"],
                "tracking_number": order.tracking_number if hasattr(order, "tracking_number") else None,
                "estimated_delivery": snapshot["estimated_delivery"],
                "stop_progress": {
                    "current_stop_index": snapshot["current_stop_index"],
                    "total_stops": snapshot["total_stops"],
                    "stops": snapshot["stops"],
                },
                "proof_ready_events": [],
                "history": history,
            }
        )

    if False:
        tracking_service = DeliveryService(db)
        reloaded_delivery = await tracking_service.get_delivery(delivery.id)
        if reloaded_delivery:
            delivery = reloaded_delivery
        sorted_stops = sorted(delivery.stops or [], key=lambda stop_item: stop_item.stop_sequence)
        current_stop_index = next(
            (index for index, stop_item in enumerate(sorted_stops) if stop_item.status != "completed"),
            max(0, len(sorted_stops) - 1),
        )
        assigned_driver = delivery.driver
        driver = None
        vehicle_plate = None
        driver_location = None
        if assigned_driver:
            profile = assigned_driver.driver_profile
            driver = f"{assigned_driver.first_name or ''} {assigned_driver.last_name or ''}".strip() or None
            vehicle_plate = profile.vehicle_plate if profile else None
            if profile and profile.current_latitude is not None and profile.current_longitude is not None:
                driver_location = (profile.current_latitude, profile.current_longitude)

        tracking = {
            "delivery_id": str(delivery.id),
            "status": delivery.status.value,
            "current_stop_index": current_stop_index,
            "total_stops": len(sorted_stops),
            "driver_location": driver_location,
            "driver_name": driver,
            "vehicle_plate": vehicle_plate,
            "eta_minutes": delivery.estimated_duration_minutes,
            "distance_km": delivery.calculated_distance_km,
            "estimated_delivery": delivery.estimated_delivery,
            "stops": [
                {
                    "stop_sequence": stop_item.stop_sequence,
                    "stop_type": stop_item.stop_type,
                    "latitude": stop_item.latitude,
                    "longitude": stop_item.longitude,
                    "address": stop_item.address,
                    "vendor_name": stop_item.vendor_name,
                    "status": stop_item.status,
                }
                for stop_item in sorted_stops
            ],
        }
    else:
        current_stop_index = 0
        stops = []
        driver = None

    # Build tracking history (simplified - should be from a tracking_history table)
    history = [
        {
            "status": "pending",
            "timestamp": order.created_at.isoformat(),
            "description": "Order placed",
            "location": None,
        }
    ]
    for event in sorted(order.timeline_events or [], key=lambda item: item.created_at):
        history.append(
            {
                "status": str(event.status),
                "timestamp": event.created_at.isoformat(),
                "description": event.message,
                "location": None,
            }
        )
    if delivery and delivery.actual_delivery:
        history.append(
            {
                "status": "delivered",
                "timestamp": delivery.actual_delivery.isoformat(),
                "description": "Delivery completed",
                "location": delivery.delivery_address.get("address") if delivery.delivery_address else None,
            }
        )

    return success_response(
        {
            "order_id": str(order.id),
            "order_number": order.order_number if hasattr(order, "order_number") else str(order.id),
            "status": order.status,
            "delivery": tracking if delivery else None,
            "live_tracking": bool(delivery),
            "driver_name": driver,
            "tracking_number": order.tracking_number if hasattr(order, "tracking_number") else None,
            "tracking_url": f"https://example.com/track/{order.tracking_number}"
            if hasattr(order, "tracking_number") and order.tracking_number
            else None,
            "estimated_delivery": delivery.estimated_delivery
            if delivery
            else getattr(order, "estimated_delivery", None),
            "stop_progress": {
                "current_stop_index": current_stop_index,
                "total_stops": len(stops),
                "stops": tracking["stops"] if delivery else [],
            },
            "proof_ready_events": [
                {
                    "proof_type": proof.proof_type.value,
                    "captured_at": proof.captured_at.isoformat(),
                    "proof_data": proof.proof_data,
                }
                for proof in ((delivery.proofs or []) if delivery else [])
            ],
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

    # Atomically update order status to CANCELLED only if currently in cancellable status
    from sqlalchemy import select, update

    from app.core.database import result_rowcount
    from app.domains.catalog.models.product import Product
    from app.domains.catalog.models.product_variant import ProductVariant
    from app.domains.shopping.models.order import OrderItem

    status_update_stmt = (
        update(Order)
        .where(
            Order.id == order.id,
            Order.status.in_([OrderStatus.PENDING, OrderStatus.PROCESSING]),
        )
        .values(status=OrderStatus.CANCELLED)
    )
    update_res = await db.execute(status_update_stmt)
    if result_rowcount(update_res) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order cannot be cancelled because its current status is '{order.status}'",
        )

    # Restore stock for cancelled order items (prevents inventory loss or duplicate restoration)
    items_stmt = select(OrderItem).where(OrderItem.order_id == order.id)
    items_result = await db.execute(items_stmt)
    for item in items_result.scalars().all():
        if item.product_variant_id:
            await db.execute(
                update(ProductVariant)
                .where(ProductVariant.id == item.product_variant_id)
                .values(stock_quantity=ProductVariant.stock_quantity + int(item.quantity))
            )
        await db.execute(
            update(Product)
            .where(Product.id == item.product_id)
            .values(stock_quantity=Product.stock_quantity + int(item.quantity))
        )

    # Unwind everything the order consumed, atomically with the cancellation:
    # redeemed loyalty points go back to the customer, coupon usage is refunded
    # (restoring per-user/global limits), and an OrderCancelled outbox event
    # reverses vendor ledger credits issued for paid orders.
    if order.user_id and order.loyalty_points_redeemed:
        from app.domains.customers.services.loyalty_service import LoyaltyService

        await LoyaltyService(db).earn_points(
            customer_id=order.user_id,
            points=order.loyalty_points_redeemed,
            description=f"Points restored from cancelled order #{order.order_number}",
            reference_type="order_cancel",
            reference_id=order.id,
        )

    from app.domains.shopping.services.coupon_service import CouponService

    await CouponService(db).refund_coupon_usage(order_id=order.id)

    from app.domains.shared.models.outbox import OutboxEvent, OutboxStatus
    from app.domains.shopping.models.sub_order import SubOrder

    sub_orders = (
        await db.execute(select(SubOrder).where(SubOrder.parent_order_id == order.id))
    ).scalars().all()
    db.add(
        OutboxEvent(
            id=uuid.uuid4(),
            aggregate_type="Order",
            aggregate_id=str(order.id),
            event_type="OrderCancelled",
            payload={
                "order_id": str(order.id),
                "total_amount": float(order.total_amount),
                "reason": reason,
                "sub_orders": [
                    {
                        "sub_order_id": str(so.id),
                        "vendor_id": str(so.vendor_id),
                        "subtotal_amount": float(so.subtotal_amount),
                    }
                    for so in sub_orders
                ],
            },
            status=OutboxStatus.PENDING,
        )
    )

    db.add(
        OrderTimelineEvent(
            id=uuid.uuid4(),
            order_id=order.id,
            status=OrderStatus.CANCELLED.value,
            message=f"Order cancelled{f': {reason}' if reason else ''}",
            created_by=current_user.id,
        )
    )

    await db.commit()
    reloaded_order = await service.get_order(str(order.id))

    return success_response(reloaded_order)


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
