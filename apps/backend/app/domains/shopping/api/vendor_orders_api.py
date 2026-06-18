"""Vendor Order Management API

This API allows vendors to manage their orders:
- List orders containing their products
- Update fulfillment status for their items
- Add tracking information for their items

All endpoints enforce vendor data isolation - vendors can only see and modify
their own order items.
"""
from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.responses import success_response, ApiSuccessResponse
from app.core.dependencies import require_role
from app.domains.auth.models.user import User
from app.domains.vendor.models.vendor_profile import VendorProfile
from app.domains.shopping.schemas.order_schemas import OrderListResponse, OrderResponse
from app.domains.shopping.services.order_service import OrderService
from app.domains.shopping.models.order import OrderItem

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


# ============================================================================
# ROUTER
# ============================================================================

router = APIRouter(prefix="/vendor/orders", tags=["Vendor Orders"])


# ============================================================================
# ENDPOINTS
# ============================================================================

@router.get("", response_model=ApiSuccessResponse[OrderListResponse])
async def vendor_list_orders(
    current_user: Annotated[User, Depends(require_role("vendor"))],
    page: int = 1,
    page_size: int = 20,
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

    # Filter order items to show only this vendor's items
    secured_orders = []
    for order in orders:
        order_dto = OrderResponse.model_validate(order)
        vendor_items = [item for item in order_dto.items if item.vendor_id == vendor_profile.id]

        if vendor_items:
            # Overwrite items and total for the response view
            order_dto.items = vendor_items
            order_dto.total_amount = sum(item.subtotal for item in vendor_items)
            secured_orders.append(order_dto)

    return success_response({"orders": secured_orders, "total": total})


@router.get("/{order_id}", response_model=ApiSuccessResponse[OrderResponse])
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

    # Filter to show only this vendor's items
    order_dto = OrderResponse.model_validate(order)
    vendor_items = [item for item in order_dto.items if item.vendor_id == vendor_profile.id]

    if not vendor_items:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No items from this vendor found in this order"
        )

    # Overwrite items and total for the response view
    order_dto.items = vendor_items
    order_dto.total_amount = sum(item.subtotal for item in vendor_items)

    return success_response(order_dto)


@router.patch("/{order_id}/items/{item_id}/status", response_model=ApiSuccessResponse[OrderResponse])
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

    # Get the order item
    stmt = select(OrderItem).where(
        OrderItem.id == item_id,
        OrderItem.order_id == order_id,
        OrderItem.vendor_id == vendor_profile.id
    )
    result = await db.execute(stmt)
    order_item = result.scalar_one_or_none()

    if not order_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order item not found or does not belong to this vendor"
        )

    # Update the status
    order_item.fulfillment_status = data.status
    await db.commit()
    await db.refresh(order_item)

    # Get the full order for response
    service = OrderService(db)
    order = await service.get_order(order_id)
    order_dto = OrderResponse.model_validate(order)
    vendor_items = [item for item in order_dto.items if item.vendor_id == vendor_profile.id]
    order_dto.items = vendor_items
    order_dto.total_amount = sum(item.subtotal for item in vendor_items)

    return success_response(order_dto)


@router.post("/{order_id}/items/{item_id}/tracking", response_model=ApiSuccessResponse[OrderResponse])
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

    # Get the order item
    stmt = select(OrderItem).where(
        OrderItem.id == item_id,
        OrderItem.order_id == order_id,
        OrderItem.vendor_id == vendor_profile.id
    )
    result = await db.execute(stmt)
    order_item = result.scalar_one_or_none()

    if not order_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order item not found or does not belong to this vendor"
        )

    # Update tracking information
    order_item.tracking_number = data.tracking_number
    if data.tracking_url:
        order_item.tracking_url = data.tracking_url
    await db.commit()
    await db.refresh(order_item)

    # Get the full order for response
    service = OrderService(db)
    order = await service.get_order(order_id)
    order_dto = OrderResponse.model_validate(order)
    vendor_items = [item for item in order_dto.items if item.vendor_id == vendor_profile.id]
    order_dto.items = vendor_items
    order_dto.total_amount = sum(item.subtotal for item in vendor_items)

    return success_response(order_dto)
