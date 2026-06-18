from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid
from decimal import Decimal


class ReturnItemCreate(BaseModel):
    order_item_id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    quantity: int = Field(..., gt=0)
    reason: Optional[str] = None
    condition: str = "new"
    images: Optional[List[str]] = None


class ReturnRequestCreate(BaseModel):
    order_id: uuid.UUID
    reason: str
    description: Optional[str] = None
    items: List[ReturnItemCreate]
    refund_method: str = "original"


class ReturnRequestUpdate(BaseModel):
    description: Optional[str] = None
    refund_method: Optional[str] = None


class ReturnItemResponse(BaseModel):
    id: uuid.UUID
    order_item_id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    quantity: int
    reason: Optional[str] = None
    condition: str
    images: Optional[List[str]] = None

    class Config:
        from_attributes = True


class ReturnRequestResponse(BaseModel):
    id: uuid.UUID
    return_number: str
    customer_id: uuid.UUID
    order_id: uuid.UUID
    status: str
    reason: str
    description: Optional[str] = None
    items: List[ReturnItemResponse] = []
    refund_method: str
    refund_amount: Optional[Decimal] = None
    refund_transaction_id: Optional[uuid.UUID] = None
    shipping_label: Optional[str] = None
    tracking_number: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReturnRequestListResponse(BaseModel):
    items: List[ReturnRequestResponse]
    total: int
    page: int
    limit: int
