"""
Pydantic schemas for SubOrder operations.
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.domains.shopping.models.sub_order import SubOrderStatus


class SubOrderBase(BaseModel):
    """Base SubOrder schema."""
    vendor_id: UUID
    subtotal_amount: Decimal = Field(..., ge=0, decimal_places=2)


class SubOrderCreate(SubOrderBase):
    """Schema for creating a SubOrder."""
    parent_order_id: UUID


class SubOrderUpdate(BaseModel):
    """Schema for updating a SubOrder."""
    status: Optional[SubOrderStatus] = None
    tracking_number: Optional[str] = None
    tracking_url: Optional[str] = None
    vendor_notes: Optional[str] = None


class SubOrderItemSummary(BaseModel):
    """Summary of an order item within a sub-order."""
    id: UUID
    product_id: UUID
    product_name: Optional[str] = None
    vendor_id: UUID
    quantity: int
    unit_price: Decimal
    subtotal: Decimal
    fulfillment_status: str


class SubOrderResponse(SubOrderBase):
    """Schema for SubOrder response."""
    id: UUID
    parent_order_id: UUID
    status: SubOrderStatus
    tracking_number: Optional[str] = None
    tracking_url: Optional[str] = None
    shipped_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    vendor_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[SubOrderItemSummary] = []

    # Computed properties
    item_count: int = 0
    total_quantity: int = 0

    class Config:
        from_attributes = True


class SubOrderListResponse(BaseModel):
    """Schema for a list of SubOrders."""
    sub_orders: List[SubOrderResponse]
    total: int
    page: int
    page_size: int


class SubOrderStatusUpdate(BaseModel):
    """Schema for updating SubOrder status."""
    status: SubOrderStatus
    notes: Optional[str] = None
