"""
Mobile Money Payment Schemas

Request and response schemas for mobile money payment operations.
"""

import re
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MobileMoneyPaymentBase(BaseModel):
    """Base fields for mobile money payment."""

    transaction_id: str = Field(
        ..., min_length=8, max_length=50, description="Transaction ID from mobile money provider"
    )
    provider: str = Field(
        ..., min_length=2, max_length=50, description="Mobile money provider (mpesa, airtel, mtn, etc.)"
    )
    phone_number: str | None = Field(None, max_length=20, description="Phone number used for payment")
    notes: str | None = Field(None, max_length=1000, description="Additional notes about this payment")

    @field_validator("transaction_id")
    @classmethod
    def validate_transaction_id(cls, v: str) -> str:
        """Validate transaction ID format (alphanumeric, 8-20 characters)."""
        # Remove any spaces or hyphens for validation
        cleaned = re.sub(r"[\s\-]", "", v.upper())

        # Check if it's alphanumeric only
        if not re.match(r"^[A-Z0-9]{8,50}$", cleaned):
            raise ValueError("Transaction ID must be 8-50 alphanumeric characters (letters and numbers only)")
        return cleaned


class MobileMoneyPaymentRecord(MobileMoneyPaymentBase):
    """Schema for recording a mobile money payment."""

    order_id: uuid.UUID = Field(..., description="Order ID to mark as paid")


class MobileMoneyPaymentResponse(BaseModel):
    """Response schema for mobile money payment."""

    id: uuid.UUID
    order_id: uuid.UUID
    transaction_id: str
    amount: float
    currency: str
    provider: str
    phone_number: str | None = None
    status: str
    notes: str | None = None
    created_at: datetime
    refund_transaction_id: str | None = None
    refund_amount: float | None = None
    refund_reason: str | None = None
    refunded_at: datetime | None = None
    refunded_by: str | None = None  # Admin name or ID

    @field_validator("refunded_by", mode="before")
    @classmethod
    def serialize_refunded_by(cls, v):
        if v is None:
            return None
        if hasattr(v, "first_name"):
            full = f"{getattr(v, 'first_name', '') or ''} {getattr(v, 'last_name', '') or ''}".strip()
            return full or getattr(v, "email", "Admin")
        if isinstance(v, uuid.UUID):
            return str(v)
        return str(v)

    model_config = ConfigDict(from_attributes=True)


class MobileMoneyRefundCreate(BaseModel):
    """Schema for creating a refund."""

    refund_transaction_id: str = Field(
        ..., min_length=8, max_length=50, description="Transaction ID of the refund sent to customer"
    )
    refund_amount: float | None = Field(
        None, ge=0, description="Amount to refund (defaults to original payment amount)"
    )
    refund_reason: str = Field(..., min_length=1, max_length=1000, description="Reason for the refund")

    @field_validator("refund_transaction_id")
    @classmethod
    def validate_refund_transaction_id(cls, v: str) -> str:
        """Validate refund transaction ID format."""
        cleaned = re.sub(r"[\s\-]", "", v.upper())

        if not re.match(r"^[A-Z0-9]{8,50}$", cleaned):
            raise ValueError("Refund transaction ID must be 8-50 alphanumeric characters (letters and numbers only)")
        return cleaned


class MobileMoneyPaymentListResponse(BaseModel):
    """Response schema for listing mobile money payments."""

    payments: list[MobileMoneyPaymentResponse]
    total: int
    page: int
    limit: int
