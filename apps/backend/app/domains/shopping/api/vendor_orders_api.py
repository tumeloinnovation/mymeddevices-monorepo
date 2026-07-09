"""Vendor Order Management API

This API allows vendors to manage their orders:
- List orders containing their products
- Update fulfillment status for their items
- Add tracking information for their items

All endpoints enforce vendor data isolation - vendors can only see and modify
their own order items.
"""
from typing import Annotated, List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.responses import success_response, ApiSuccessResponse
from app.core.dependencies import require_role
from app.domains.auth.models.user import User
from app.domains.vendor.models.vendor_profile import VendorProfile
from app.domains.shopping.schemas.order_schemas import (
    VendorOrderListResponse,
    VendorOrderResponse,
    VendorOrderDetailResponse,
    VendorOrderItemResponse,
    OrderTimelineEventResponse
)
from app.domains.shopping.services.order_service import OrderService
from app.domains.shopping.models.order import OrderItem, OrderTimelineEvent
from app.domains.shopping.models.payment import Payment

from pydantic import BaseModel, Field


# ============================================================================
# SCHEMAS
# ============================================================================

class OrderItemStatusUpdate(BaseModel):
    """Schema for updating order item fulfillment status."""
    status: str = Field(..., description="New fulfillment status (pending, processing, packed, shipped, delivered, cancelled, refunded)")

class OrderItemTrackingUpdate(BaseModel):
    """Schema for adding tracking information to an order item."""
    tracking_number: str = Field(..., description="Tracking number from shipping carrier")
    tracking_url: str = Field(None, description="URL to track the shipment")
    carrier: Optional[str] = Field(None, description="Shipping carrier name")


# ============================================================================
# ROUTER
# ============================================================================

import uuid

router = APIRouter(prefix="/vendor/orders", tags=["Vendor Orders"])


# ============================================================================
# HELPERS
# ============================================================================

def build_vendor_order_response(order, vendor_profile_id) -> VendorOrderResponse:
    # 1. Determine Customer Name & Email
    customer_name = "Guest User"
    customer_email = "guest@mymeddevices.com"
    
    if order.user:
        first = order.user.first_name or ""
        last = order.user.last_name or ""
        customer_name = f"{first} {last}".strip() or order.user.email
        customer_email = order.user.email
    elif order.shipping_address:
        if "full_name" in order.shipping_address:
            customer_name = order.shipping_address["full_name"]
        elif "first_name" in order.shipping_address or "last_name" in order.shipping_address:
            first = order.shipping_address.get("first_name") or ""
            last = order.shipping_address.get("last_name") or ""
            customer_name = f"{first} {last}".strip()
            
        if order.guest_token:
            customer_email = f"guest-{order.guest_token[:8]}@mymeddevices.com"
            
    # 2. Get Vendor Items
    vendor_items = [item for item in order.items if item.vendor_id == vendor_profile_id]
    vendor_amount = sum(item.subtotal for item in vendor_items)
    item_count = sum(item.quantity for item in vendor_items)
    
    return VendorOrderResponse(
        id=order.id,
        order_number=order.order_number,
        customer_name=customer_name,
        customer_email=customer_email,
        status=order.status.value if hasattr(order.status, "value") else str(order.status),
        total_amount=round(order.total_amount),
        vendor_amount=round(vendor_amount),
        item_count=int(item_count),
        created_at=order.created_at,
        items=[VendorOrderItemResponse.model_validate(item) for item in vendor_items]
    )


async def build_vendor_order_detail_response(order, vendor_profile_id, db: AsyncSession) -> VendorOrderDetailResponse:
    base = build_vendor_order_response(order, vendor_profile_id)
    
    # Get payments for this order
    stmt = select(Payment).where(Payment.order_id == order.id)
    result = await db.execute(stmt)
    payment = result.scalars().first()
    
    payment_method = payment.payment_method if payment else "M-Pesa"
    payment_status = payment.status if payment else "Paid"
    
    vendor_items = [item for item in order.items if item.vendor_id == vendor_profile_id]
    
    # Construct items response
    items_response = []
    for item in vendor_items:
        items_response.append(VendorOrderItemResponse.model_validate(item))
        
    # Construct timeline response
    timeline_response = []
    for evt in order.timeline_events:
        timeline_response.append(OrderTimelineEventResponse.model_validate(evt))
        
    return VendorOrderDetailResponse(
        id=base.id,
        order_number=base.order_number,
        customer_name=base.customer_name,
        customer_email=base.customer_email,
        status=base.status,
        total_amount=base.total_amount,
        vendor_amount=base.vendor_amount,
        item_count=base.item_count,
        created_at=base.created_at,
        shipping_address=order.shipping_address,
        billing_address=order.shipping_address,  # treated as one entity, no billing system
        items=items_response,
        payment_method=payment_method,
        payment_status=payment_status,
        timeline=timeline_response
    )


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("", response_model=ApiSuccessResponse[VendorOrderListResponse])
async def vendor_list_orders(
    current_user: Annotated[User, Depends(require_role("vendor"))],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    List orders containing products from this vendor.

    Returns only the order items that belong to this vendor, with totals
    recalculated to reflect only the vendor's portion.
    """
    # Get vendor profile for this user
    stmt = select(VendorProfile).where(VendorProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    vendor_profile = result.scalar_one_or_none()

    if not vendor_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vendor profile not found"
        )

    # Get orders containing this vendor's items
    service = OrderService(db)
    orders, total = await service.list_orders(
        vendor_id=vendor_profile.id,
        offset=(page - 1) * page_size,
        limit=page_size
    )

    secured_orders = []
    for order in orders:
        try:
            secured_order = build_vendor_order_response(order, vendor_profile.id)
            secured_orders.append(secured_order)
        except Exception:
            continue

    import math
    pages = math.ceil(total / page_size) if page_size > 0 else 1

    return success_response({
        "items": secured_orders,
        "total": total,
        "page": page,
        "limit": page_size,
        "pages": pages
    })


@router.get("/{order_id}", response_model=ApiSuccessResponse[VendorOrderDetailResponse])
async def vendor_get_order(
    order_id: UUID,
    current_user: Annotated[User, Depends(require_role("vendor"))],
    db: AsyncSession = Depends(get_db)
):
    """
    Get details of a specific order.

    Returns only the items that belong to this vendor.
    """
    # Get vendor profile for this user
    stmt = select(VendorProfile).where(VendorProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    vendor_profile = result.scalar_one_or_none()

    if not vendor_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vendor profile not found"
        )

    # Get the order
    service = OrderService(db)
    order = await service.get_order(order_id)

    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Check if there are any items belonging to this vendor
    vendor_items = [item for item in order.items if item.vendor_id == vendor_profile.id]
    if not vendor_items:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No items from this vendor found in this order"
        )

    response_dto = await build_vendor_order_detail_response(order, vendor_profile.id, db)
    return success_response(response_dto)


@router.patch("/{order_id}/items/{item_id}/status", response_model=ApiSuccessResponse[VendorOrderDetailResponse])
async def vendor_update_item_status(
    order_id: UUID,
    item_id: UUID,
    data: OrderItemStatusUpdate,
    current_user: Annotated[User, Depends(require_role("vendor"))],
    db: AsyncSession = Depends(get_db)
):
    """
    Update fulfillment status for a specific order item.

    Vendors can only update the status of their own items.
    """
    # Get vendor profile for this user
    stmt = select(VendorProfile).where(VendorProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    vendor_profile = result.scalar_one_or_none()

    if not vendor_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vendor profile not found"
        )

    # Get the order to confirm and log transition
    service = OrderService(db)
    order = await service.get_order(order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Find the specific order item in order.items
    order_item = next((item for item in order.items if item.id == item_id and item.vendor_id == vendor_profile.id), None)
    if not order_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order item not found or does not belong to this vendor"
        )

    # Update the status
    order_item.fulfillment_status = data.status
    
    # Write timeline event
    timeline_event = OrderTimelineEvent(
        id=uuid.uuid4(),
        order_id=order_id,
        status=order.status.value if hasattr(order.status, "value") else str(order.status),
        message=f"Fulfillment status of '{order_item.product.name}' updated to {data.status}",
        created_by=current_user.id
    )
    db.add(timeline_event)
    
    await db.commit()
    order = await service.get_order(order_id)

    response_dto = await build_vendor_order_detail_response(order, vendor_profile.id, db)
    return success_response(response_dto)


@router.post("/{order_id}/items/{item_id}/tracking", response_model=ApiSuccessResponse[VendorOrderDetailResponse])
async def vendor_add_tracking_info(
    order_id: UUID,
    item_id: UUID,
    data: OrderItemTrackingUpdate,
    current_user: Annotated[User, Depends(require_role("vendor"))],
    db: AsyncSession = Depends(get_db)
):
    """
    Add tracking information for a specific order item.

    Vendors can only add tracking for their own items.
    """
    # Get vendor profile for this user
    stmt = select(VendorProfile).where(VendorProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    vendor_profile = result.scalar_one_or_none()

    if not vendor_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vendor profile not found"
        )

    # Get the order to confirm and log transition
    service = OrderService(db)
    order = await service.get_order(order_id)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )

    # Find the specific order item in order.items
    order_item = next((item for item in order.items if item.id == item_id and item.vendor_id == vendor_profile.id), None)
    if not order_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order item not found or does not belong to this vendor"
        )

    # Update tracking information
    order_item.tracking_number = data.tracking_number
    if data.tracking_url:
        order_item.tracking_url = data.tracking_url
        
    # Write timeline event
    carrier_name = data.carrier or "Courier"
    timeline_event = OrderTimelineEvent(
        id=uuid.uuid4(),
        order_id=order_id,
        status=order.status.value if hasattr(order.status, "value") else str(order.status),
        message=f"Tracking details added for '{order_item.product.name}': Shipped via {carrier_name}, Tracking #{data.tracking_number}",
        created_by=current_user.id
    )
    db.add(timeline_event)
    
    await db.commit()
    order = await service.get_order(order_id)

    response_dto = await build_vendor_order_detail_response(order, vendor_profile.id, db)
    return success_response(response_dto)
