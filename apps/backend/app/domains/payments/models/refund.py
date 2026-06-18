from typing import Optional
from datetime import datetime
from sqlalchemy import (
    String, Boolean, Integer, Numeric, Text, JSON, DateTime,
    Index, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from enum import Enum as PyEnum

from app.core.database import Base
from app.domains.shared.models import IDMixin, AuditMixin, SoftDeleteMixin


class RefundStatus(PyEnum):
    """Refund status"""
    PENDING = "pending"  # Initiated, awaiting processing
    PROCESSING = "processing"  # Being processed by M-Pesa
    COMPLETED = "completed"  # Refund successful
    FAILED = "failed"  # Refund failed
    CANCELLED = "cancelled"  # Refund cancelled
    REVERSED = "reversed"  # Refund was reversed


class RefundReason(PyEnum):
    """Common refund reasons"""
    CUSTOMER_REQUEST = "customer_request"
    PRODUCT_DEFECT = "product_defect"
    WRONG_ITEM = "wrong_item"
    ORDER_CANCELLED = "order_cancelled"
    DUPLICATE_PAYMENT = "duplicate_payment"
    PRICE_ADJUSTMENT = "price_adjustment"
    SERVICE_NOT_PROVIDED = "service_not_provided"
    OTHER = "other"


class Refund(Base, IDMixin, AuditMixin, SoftDeleteMixin):
    """
    Payment refund records.

    Refunds can be processed up to the M-Pesa limit (typically within 24 hours).
    Beyond that, refunds may need manual intervention.
    """
    __tablename__ = "refunds"
    __table_args__ = (
        Index("ix_refunds_status", "status"),
        Index("ix_refunds_transaction", "transaction_id"),
        Index("ix_refunds_order", "order_id"),
        Index("ix_refunds_completed_at", "completed_at"),
        Index("ix_refunds_status_deleted", "status", "is_deleted"),
    )

    # ===============================
    # REFERENCES
    # ===============================
    transaction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="RESTRICT"),
        nullable=False
    )
    order_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True
    )  # Link to order if applicable
    initiated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True,
        index=True
    )  # User/admin who initiated refund

    # ===============================
    # STATUS & REASON
    # ===============================
    status: Mapped[str] = mapped_column(
        String(20),
        default=RefundStatus.PENDING.value,
        nullable=False
    )
    reason: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )  # RefundReason enum value
    reason_details: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )  # Additional context

    # ===============================
    # AMOUNTS
    # ===============================
    amount: Mapped[float] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )
    currency: Mapped[str] = mapped_column(
        String(3),
        default="KES",
        nullable=False
    )
    refund_fee: Mapped[Optional[float]] = mapped_column(
        Numeric(12, 2),
        nullable=True
    )  # M-Pesa reversal fee
    net_refund: Mapped[Optional[float]] = mapped_column(
        Numeric(12, 2),
        nullable=True
    )  # amount - refund_fee

    # ===============================
    # M-PESA REVERSAL DETAILS
    # ===============================
    reversal_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        unique=True,
        index=True
    )  # M-Pesa reversal transaction ID
    mpesa_receipt: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True
    )  # Original payment receipt being reversed

    # Phone to receive refund
    phone_number: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    # ===============================
    # PROCESSING
    # ===============================
    initiated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=datetime.utcnow,
        nullable=False
    )
    processed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    response_description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    response_code: Mapped[Optional[str]] = mapped_column(
        String(10),
        nullable=True
    )

    # ===============================
    # APPROVAL WORKFLOW
    # ===============================
    approved_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        nullable=True
    )
    approved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    approval_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )

    # ===============================
    # METADATA
    # ===============================
    refund_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    internal_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )  # Admin-only notes

    # Failure tracking
    failure_reason: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    retry_count: Mapped[int] = mapped_column(
        default=0
    )

    # ===============================
    # RELATIONSHIPS
    # ===============================
    transaction: Mapped["Transaction"] = relationship(
        "Transaction",
        back_populates="refunds",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Refund {self.id} - {self.status} - {self.currency} {self.amount}>"
