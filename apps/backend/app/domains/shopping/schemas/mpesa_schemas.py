"""
M-Pesa Daraja Pydantic Schemas
"""

import uuid
from decimal import Decimal

from pydantic import BaseModel, Field


class MpesaStkPushRequest(BaseModel):
    order_id: uuid.UUID
    phone_number: str = Field(..., description="Customer phone number (e.g., 0712345678, +254712345678, 254712345678)")
    amount: Decimal | None = Field(None, description="Optional custom amount in KES (defaults to order total)")


class MpesaStkPushResponse(BaseModel):
    merchant_request_id: str | None = None
    checkout_request_id: str | None = None
    response_code: str | None = None
    response_description: str | None = None
    customer_message: str | None = None


class MpesaStatusResponse(BaseModel):
    checkout_request_id: str
    status: str
    amount: Decimal | None = None
    phone_number: str | None = None
    notes: str | None = None
