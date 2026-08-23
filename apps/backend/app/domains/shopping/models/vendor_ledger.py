"""
Vendor Ledger models for tracking vendor earnings and payouts.

The ledger system tracks:
- Credits: When orders are paid, vendors earn their net amount (gross - platform fee)
- Debits: When vendors request payouts, funds are deducted
- All transactions are recorded for audit and reconciliation
"""

import enum
import uuid
from datetime import UTC, datetime
from decimal import Decimal
from typing import TYPE_CHECKING, Optional

if TYPE_CHECKING:
    from app.domains.auth.models.user import User
    from app.domains.shopping.models.sub_order import SubOrder
    from app.domains.vendor.models.vendor_profile import VendorProfile

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domains.shared.models import IDMixin


class LedgerTransactionType(str, enum.Enum):
    """Type of ledger transaction."""

    CREDIT = "credit"  # Order payment credited to vendor
    DEBIT_PAYOUT = "debit_payout"  # Vendor payout requested
    DEBIT_REFUND = "debit_refund"  # Customer refund deducted from vendor
    ADJUSTMENT = "adjustment"  # Manual adjustment by admin


class VendorLedger(Base, IDMixin):
    """
    VendorLedger tracks the current balance for each vendor.

    This is the authoritative source for vendor available funds.
    Balance is updated when:
    - Order is paid: balance += net_amount (gross - platform_fee)
    - Payout is processed: balance -= payout_amount
    - Refund is processed: balance -= refund_amount
    """

    __tablename__ = "vendor_ledgers"
    __table_args__ = (
        Index("ix_vendor_ledgers_vendor_id", "vendor_id"),
        CheckConstraint("balance >= 0", name="chk_vendor_ledger_balance_non_negative"),
    )

    # Foreign Key to vendor_profiles
    vendor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vendor_profiles.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # Current available balance (can be negative for overdrafts in some cases)
    balance: Mapped[Decimal] = mapped_column(Numeric(15, 2), default=Decimal("0.00"), nullable=False)

    # Timestamps
    last_updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    # Relationships
    vendor: Mapped["VendorProfile"] = relationship("VendorProfile", backref="ledger")
    transactions: Mapped[list["LedgerTransaction"]] = relationship(
        "LedgerTransaction",
        back_populates="vendor_ledger",
        primaryjoin="VendorLedger.vendor_id == foreign(LedgerTransaction.vendor_id)",
        cascade="all, delete-orphan",
    )

    @property
    def is_withdrawable(self) -> bool:
        """Check if balance can be withdrawn (minimum payout threshold)."""
        return self.balance >= Decimal("5000.00")  # KES 5,000 minimum

    def __repr__(self):
        return f"<VendorLedger(vendor_id={self.vendor_id}, balance={self.balance})>"


class LedgerTransaction(Base, IDMixin):
    """
    LedgerTransaction records all changes to vendor balances.

    Every credit/debit to a vendor's ledger must be recorded.
    This provides audit trail and reconciliation capabilities.
    """

    __tablename__ = "ledger_transactions"
    __table_args__ = (
        Index("ix_ledger_transactions_vendor_id", "vendor_id"),
        Index("ix_ledger_transactions_sub_order_id", "sub_order_id"),
        Index("ix_ledger_transactions_type", "transaction_type"),
        Index("ix_ledger_transactions_reference_id", "reference_id"),
        UniqueConstraint("sub_order_id", "transaction_type", name="uq_ledger_transactions_sub_order_type"),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), default=lambda: datetime.now(UTC), nullable=False
    )

    # Foreign Keys
    vendor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vendor_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )
    sub_order_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("sub_orders.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Financial details
    gross_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)  # Total amount before fees

    platform_fee_rate: Mapped[Decimal] = mapped_column(
        Numeric(5, 4), default=Decimal("0.1000"), nullable=False
    )  # e.g., 0.10 = 10%

    platform_fee_amount: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True
    )  # Calculated: gross_amount * platform_fee_rate

    net_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False
    )  # Amount credited to vendor (gross - platform_fee)

    # Transaction type
    transaction_type: Mapped[LedgerTransactionType] = mapped_column(
        String(20),
        default=LedgerTransactionType.CREDIT,
        nullable=False,
    )

    # Reference to external entity
    reference_id: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )  # e.g., order_id, refund_id, payout_id

    reference_type: Mapped[str | None] = mapped_column(String(50), nullable=True)  # e.g., "order", "refund", "payout"

    # Additional notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Processing metadata
    processed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )  # User who processed the transaction (for adjustments)

    # Relationships
    vendor_ledger: Mapped["VendorLedger"] = relationship(
        "VendorLedger",
        back_populates="transactions",
        primaryjoin="LedgerTransaction.vendor_id == VendorLedger.vendor_id",
        foreign_keys=[vendor_id],
    )
    vendor: Mapped["VendorProfile"] = relationship(
        "VendorProfile", overlaps="vendor_ledger,transactions,ledger_transactions", foreign_keys=[vendor_id]
    )
    sub_order: Mapped[Optional["SubOrder"]] = relationship("SubOrder", back_populates="ledger_transactions")
    processed_by_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[processed_by])

    @property
    def is_credit(self) -> bool:
        return self.transaction_type == LedgerTransactionType.CREDIT

    @property
    def is_debit(self) -> bool:
        return self.transaction_type in {LedgerTransactionType.DEBIT_PAYOUT, LedgerTransactionType.DEBIT_REFUND}

    def __repr__(self):
        return f"<LedgerTransaction(id={self.id}, vendor_id={self.vendor_id}, type={self.transaction_type}, net={self.net_amount})>"
