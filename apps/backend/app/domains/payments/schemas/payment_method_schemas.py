from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid


class MpesaPaymentMethodCreate(BaseModel):
    phone_number: str = Field(..., description="M-Pesa phone number")
    is_default: bool = False
    display_name: Optional[str] = None


class CardPaymentMethodCreate(BaseModel):
    card_token: str = Field(..., description="Payment processor token")
    card_last4: str = Field(..., description="Last 4 digits of card")
    card_brand: str = Field(..., description="Card brand (visa, mastercard, etc.)")
    card_expiry_month: str = Field(..., description="Expiry month (MM)")
    card_expiry_year: str = Field(..., description="Expiry year (YYYY)")
    cardholder_name: str = Field(..., description="Cardholder name")
    is_default: bool = False
    display_name: Optional[str] = None


class BankPaymentMethodCreate(BaseModel):
    bank_name: str = Field(..., description="Bank name")
    bank_account_number: str = Field(..., description="Bank account number")
    bank_account_name: str = Field(..., description="Account holder name")
    is_default: bool = False
    display_name: Optional[str] = None


class PaymentMethodUpdate(BaseModel):
    is_default: Optional[bool] = None
    display_name: Optional[str] = None
    is_active: Optional[bool] = None


class PaymentMethodResponse(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    payment_type: str
    is_default: bool
    is_active: bool
    display_name: Optional[str] = None

    # M-Pesa fields
    phone_number: Optional[str] = None

    # Card fields
    card_last4: Optional[str] = None
    card_brand: Optional[str] = None
    card_expiry_month: Optional[str] = None
    card_expiry_year: Optional[str] = None
    cardholder_name: Optional[str] = None

    # Bank fields
    bank_name: Optional[str] = None
    bank_account_number: Optional[str] = None  # Masked
    bank_account_name: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaymentMethodListResponse(BaseModel):
    items: list[PaymentMethodResponse]
    total: int
