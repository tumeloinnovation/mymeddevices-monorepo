"""
Mobile Money Payment Model

Stores manual mobile money payment records for orders.
Admins record that a customer has paid via mobile money (M-Pesa, Airtel Money, etc.)
by entering the transaction/reference ID from the payment confirmation.
"""

import enum
import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domains.shared.models import AuditMixin, IDMixin

if TYPE_CHECKING:
    from app.domains.auth.models.user import User
    from app.domains.shopping.models.order import Order


class MobileMoneyPaymentStatus(str, enum.Enum):
    """Status of a mobile money payment."""

    PENDING = "pending"  # Initial state when payment is recorded
    VERIFIED = "verified"  # Admin has verified the payment
    REVERSED = "reversed"  # Payment was reversed (e.g., wrong transaction)
    REFUNDED = "refunded"  # Payment was refunded to customer


class MobileMoneyPayment(Base, IDMixin, AuditMixin):
    """
    Mobile Money Payment record for manual payment tracking.

    When a customer pays via mobile money (M-Pesa, Airtel, MTN, etc.),
    the admin records the transaction ID and marks the order as paid.
    This creates an audit trail for reconciliation and refunds.
    """

    __tablename__ = "mobile_money_payments"

    # Core fields
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)

    # Payment details
    transaction_id: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        comment="Transaction/reference ID from mobile money provider (e.g., M-Pesa code)",
    )

    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, comment="Payment amount in KES")

    currency: Mapped[str] = mapped_column(String(3), default="KES", nullable=False)

    # Mobile money provider
    provider: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="Mobile money provider (mpesa, airtel, mtn, etc.)"
    )

    phone_number: Mapped[str] = mapped_column(
        String(20), nullable=True, comment="Phone number used for payment (optional)"
    )

    # Status tracking
    status: Mapped[MobileMoneyPaymentStatus] = mapped_column(
        SQLEnum(MobileMoneyPaymentStatus, native_enum=False, length=20),
        default=MobileMoneyPaymentStatus.VERIFIED,
        nullable=False,
        index=True,
    )

    # Refund fields (populated when payment is refunded)
    refund_transaction_id: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="Transaction ID of the refund sent to customer"
    )

    refund_amount: Mapped[Decimal | None] = mapped_column(
        Numeric(12, 2), nullable=True, comment="Amount refunded (may differ from original)"
    )

    refund_reason: Mapped[str | None] = mapped_column(Text, nullable=True, comment="Reason for refund")

    refunded_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, comment="When the refund was processed"
    )

    refunded_by_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, comment="Admin who processed the refund"
    )

    # Audit notes
    notes: Mapped[str | None] = mapped_column(Text, nullable=True, comment="Additional notes about this payment")

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="mobile_money_payments")
    refunded_by: Mapped["User"] = relationship("User", foreign_keys=[refunded_by_id])

    @property
    def is_refunded(self) -> bool:
        """Check if this payment has been refunded."""
        return self.status == MobileMoneyPaymentStatus.REFUNDED

    @property
    def has_refund(self) -> bool:
        """Check if a refund transaction exists."""
        return self.refund_transaction_id is not None

    def __repr__(self):
        return (
            f"<MobileMoneyPayment(id={self.id}, order_id={self.order_id}, "
            f"transaction_id={self.transaction_id}, amount={self.amount}, "
            f"status={self.status})>"
        )
