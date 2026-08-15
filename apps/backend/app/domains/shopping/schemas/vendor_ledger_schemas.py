"""
Pydantic schemas for Vendor Ledger operations.
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.domains.shopping.models.vendor_ledger import LedgerTransactionType


class VendorLedgerResponse(BaseModel):
    """Schema for Vendor Ledger response."""

    vendor_id: UUID
    balance: Decimal = Field(..., ge=0, decimal_places=2)
    last_updated_at: datetime
    is_withdrawable: bool = False

    model_config = ConfigDict(from_attributes=True)


class LedgerTransactionResponse(BaseModel):
    """Schema for Ledger Transaction response."""

    id: UUID
    vendor_id: UUID
    sub_order_id: UUID | None = None
    gross_amount: Decimal = Field(..., ge=0, decimal_places=2)
    platform_fee_rate: Decimal = Field(..., ge=0, le=1, decimal_places=4)
    platform_fee_amount: Decimal | None = Field(None, ge=0, decimal_places=2)
    net_amount: Decimal
    transaction_type: LedgerTransactionType
    reference_id: str | None = None
    reference_type: str | None = None
    notes: str | None = None
    processed_by: UUID | None = None
    created_at: datetime

    @property
    def is_credit(self) -> bool:
        return self.transaction_type == LedgerTransactionType.CREDIT

    @property
    def is_debit(self) -> bool:
        return self.transaction_type in {LedgerTransactionType.DEBIT_PAYOUT, LedgerTransactionType.DEBIT_REFUND}

    model_config = ConfigDict(from_attributes=True)


class LedgerTransactionListResponse(BaseModel):
    """Schema for a list of ledger transactions."""

    transactions: list[LedgerTransactionResponse]
    total: int
    page: int
    page_size: int


class VendorEarningsSummary(BaseModel):
    """Schema for vendor earnings summary."""

    total_earnings: Decimal = Field(..., ge=0, decimal_places=2)
    current_month_earnings: Decimal = Field(..., ge=0, decimal_places=2)
    last_month_earnings: Decimal = Field(..., ge=0, decimal_places=2)
    available_for_payout: Decimal = Field(..., ge=0, decimal_places=2)
    pending_payouts: Decimal = Field(..., ge=0, decimal_places=2)
    sales_count: int = Field(..., ge=0)
    platform_fee_total: Decimal = Field(..., ge=0, decimal_places=2)


class PayoutRequest(BaseModel):
    """Schema for requesting a payout."""

    amount: Decimal = Field(..., ge=5000, decimal_places=2, description="Minimum KES 5,000")
    method: str = Field(..., pattern="^(mpesa|bank)$", description="Payment method: mpesa or bank")
    notes: str | None = None


class PayoutResponse(BaseModel):
    """Schema for payout response."""

    id: str
    amount: Decimal
    status: str
    method: str
    method_details: str
    created_at: datetime
    processed_at: datetime | None = None
