import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ReturnItemCreate(BaseModel):
    order_item_id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    quantity: int = Field(..., gt=0)
    reason: str | None = None
    condition: str = "new"
    images: list[str] | None = None


class ReturnRequestCreate(BaseModel):
    order_id: uuid.UUID
    reason: str
    description: str | None = None
    items: list[ReturnItemCreate]
    refund_method: str = "original"


class ReturnRequestUpdate(BaseModel):
    description: str | None = None
    refund_method: str | None = None


class ReturnItemResponse(BaseModel):
    id: uuid.UUID
    order_item_id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    quantity: int
    reason: str | None = None
    condition: str
    images: list[str] | None = None

    model_config = ConfigDict(from_attributes=True)


class ReturnRequestResponse(BaseModel):
    id: uuid.UUID
    return_number: str
    customer_id: uuid.UUID
    order_id: uuid.UUID
    status: str
    reason: str
    description: str | None = None
    items: list[ReturnItemResponse] = []
    refund_method: str
    refund_amount: Decimal | None = None
    refund_transaction_id: uuid.UUID | None = None
    shipping_label: str | None = None
    tracking_number: str | None = None
    resolved_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReturnRequestListResponse(BaseModel):
    items: list[ReturnRequestResponse]
    total: int
    page: int
    limit: int
