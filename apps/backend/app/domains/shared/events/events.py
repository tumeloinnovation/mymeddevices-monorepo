"""
Event models for the multi-vendor order processing system.

These Pydantic models define the structure of events published
to RabbitMQ for asynchronous processing by consumers.
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel


class OrderItemEvent(BaseModel):
    """Item within a sub-order event."""
    product_id: UUID
    vendor_id: UUID
    quantity: int
    unit_price: Decimal


class SubOrderEvent(BaseModel):
    """Sub-order event (vendor's portion of an order)."""
    sub_order_id: UUID
    vendor_id: UUID
    subtotal_amount: Decimal
    items: List[OrderItemEvent]


class OrderPaidEvent(BaseModel):
    """
    Event published when an order is successfully paid.

    This event triggers:
    - Inventory deduction (StockLog creation)
    - Vendor ledger credits
    - Vendor notifications
    """
    order_id: UUID
    customer_id: Optional[UUID]
    total_amount: Decimal
    mpesa_receipt: Optional[str]
    sub_orders: List[SubOrderEvent]
    created_at: datetime


class OrderCreatedEvent(BaseModel):
    """Event published when a new order is created."""
    order_id: UUID
    customer_id: Optional[UUID]
    total_amount: Decimal
    sub_orders: List[SubOrderEvent]
    created_at: datetime


class OrderShippedEvent(BaseModel):
    """Event published when a sub-order is shipped."""
    sub_order_id: UUID
    order_id: UUID
    vendor_id: UUID
    tracking_number: Optional[str]
    shipped_at: datetime


class OrderDeliveredEvent(BaseModel):
    """Event published when a sub-order is delivered."""
    sub_order_id: UUID
    order_id: UUID
    vendor_id: UUID
    delivered_at: datetime
