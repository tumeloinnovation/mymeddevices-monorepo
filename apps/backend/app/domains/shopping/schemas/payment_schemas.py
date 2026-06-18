from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
import uuid

class PaymentBase(BaseModel):
    order_id: uuid.UUID
    amount: float
    currency: str = "KES"
    payment_method: str
    status: str = "pending"
    transaction_id: Optional[str] = None
    provider_response: Optional[dict] = None

class PaymentCreate(BaseModel):
    order_id: uuid.UUID
    payment_method: str
    transaction_id: Optional[str] = None

class PaymentResponse(PaymentBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class MockPaymentProcess(BaseModel):
    order_id: uuid.UUID
    payment_method: str = "card"
    card_number: str = "4111111111111111"
    cvv: str = "123"
    expiry: str = "12/25"
