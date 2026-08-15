"""
Event payload models for the multi-vendor order processing system.

These Pydantic models structure the sub-order payloads stored in outbox
events and dispatched by the outbox relay for asynchronous processing.
"""

from decimal import Decimal
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
    items: list[OrderItemEvent]