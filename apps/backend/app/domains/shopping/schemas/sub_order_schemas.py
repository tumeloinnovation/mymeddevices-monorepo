"""
Pydantic schemas for SubOrder operations.
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

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

    status: SubOrderStatus | None = None
    tracking_number: str | None = None
    tracking_url: str | None = None
    vendor_notes: str | None = None


class SubOrderItemSummary(BaseModel):
    """Summary of an order item within a sub-order."""

    id: UUID
    product_id: UUID
    product_name: str | None = None
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
    tracking_number: str | None = None
    tracking_url: str | None = None
    shipped_at: datetime | None = None
    delivered_at: datetime | None = None
    vendor_notes: str | None = None
    created_at: datetime
    updated_at: datetime
    items: list[SubOrderItemSummary] = []

    # Computed properties
    item_count: int = 0
    total_quantity: int = 0

    model_config = ConfigDict(from_attributes=True)


class SubOrderListResponse(BaseModel):
    """Schema for a list of SubOrders."""

    sub_orders: list[SubOrderResponse]
    total: int
    page: int
    page_size: int


class SubOrderStatusUpdate(BaseModel):
    """Schema for updating SubOrder status."""

    status: SubOrderStatus
    notes: str | None = None
