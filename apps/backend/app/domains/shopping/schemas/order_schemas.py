from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime
import uuid

class OrderItemBase(BaseModel):
    product_id: uuid.UUID
    vendor_id: uuid.UUID
    quantity: float
    unit_price: float
    subtotal: float

class OrderItemResponse(OrderItemBase):
    id: uuid.UUID
    product_name: str
    fulfillment_status: str = "pending"
    tracking_number: Optional[str] = None
    tracking_url: Optional[str] = None

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    status: str = "pending"
    total_amount: float
    currency: str = "KES"
    shipping_address: Optional[dict] = None
    notes: Optional[str] = None

class OrderCreate(BaseModel):
    cart_id: uuid.UUID
    shipping_address: dict
    notes: Optional[str] = None
    idempotency_key: Optional[str] = None
    guest_token: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str

class OrderResponse(OrderBase):
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    guest_token: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime]
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True

class OrderListResponse(BaseModel):
    orders: List[OrderResponse]
    total: int
