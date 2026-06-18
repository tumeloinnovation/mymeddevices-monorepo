from typing import Optional
from datetime import datetime
from sqlalchemy import (
    String, Boolean, Text, JSON, DateTime, Index,
    ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from enum import Enum as PyEnum

from app.core.database import Base
from app.domains.shared.models import IDMixin, AuditMixin


class CallbackStatus(PyEnum):
    """Callback status"""
    SUCCESS = "success"
    FAILED = "failed"
    PENDING = "pending"


class PaymentCallback(Base, IDMixin, AuditMixin):
    """
    Records payment callbacks from M-Pesa Daraja API.

    Stores all callback data for reconciliation and audit purposes.
    """
    __tablename__ = "payment_callbacks"
    __table_args__ = (
        Index("ix_payment_callbacks_transaction", "transaction_id"),
        Index("ix_payment_callbacks_status", "status"),
        Index("ix_payment_callbacks_merchant", "merchant_request_id"),
    )

    # ===============================
    # REFERENCES
    # ===============================
    transaction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="CASCADE"),
        nullable=False
    )

    # ===============================
    # CALLBACK IDENTIFIERS
    # ===============================
    merchant_request_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    checkout_request_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )

    # ===============================
    # CALLBACK STATUS
    # ===============================
    status: Mapped[str] = mapped_column(
        String(20),
        default=CallbackStatus.PENDING.value,
        nullable=False
    )  # success, failed, pending

    result_code: Mapped[Optional[int]] = mapped_column(
        nullable=True
    )  # 0 = success, others = error codes
    result_description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )

    # ===============================
    # RAW CALLBACK DATA
    # ===============================
    raw_callback: Mapped[Optional[dict]] = mapped_column(
        JSON,
        nullable=True
    )  # Complete raw callback from Daraja

    # STK Callback specific fields
    response_description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    callback_metadata: Mapped[Optional[dict]] = mapped_column(
        JSON,
        nullable=True
    )  # Contains Amount, M-Pesa Receipt, Transaction Date, etc.

    # ===============================
    # VERIFICATION
    # ===============================
    verified: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )  # Whether callback signature was verified
    verification_error: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )

    # ===============================
    # PROCESSING
    # ===============================
    processed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    processing_error: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    retry_count: Mapped[int] = mapped_column(
        default=0
    )

    # ===============================
    # METADATA
    # ===============================
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )  # IP that sent the callback
    headers: Mapped[Optional[dict]] = mapped_column(
        JSON,
        nullable=True
    )  # Request headers for debugging

    # ===============================
    # RELATIONSHIPS
    # ===============================
    transaction: Mapped["Transaction"] = relationship(
        "Transaction",
        back_populates="callbacks",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<PaymentCallback {self.checkout_request_id} - {self.status}>"
