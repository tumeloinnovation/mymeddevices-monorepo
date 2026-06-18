from typing import Optional
from datetime import datetime
from sqlalchemy import (
    String, Boolean, Integer, Text, JSON, DateTime, Index,
    ForeignKey, Enum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from enum import Enum as PyEnum

from app.core.database import Base
from app.domains.shared.models import IDMixin, AuditMixin, SoftDeleteMixin


class PaymentProvider(PyEnum):
    """Payment providers supported by the platform"""
    MPESA = "mpesa"
    CARD = "card"
    BANK_TRANSFER = "bank_transfer"
    CASH_ON_DELIVERY = "cash_on_delivery"


class PaymentMethodStatus(PyEnum):
    """Payment method status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"


class PaymentMethod(Base, IDMixin, AuditMixin, SoftDeleteMixin):
    """
    Payment methods available on the platform.

    M-Pesa is the primary mobile money provider in Kenya.
    This model stores configuration for each payment method.
    """
    __tablename__ = "payment_methods"
    __table_args__ = (
        Index("ix_payment_methods_provider_status", "provider", "status"),
        Index("ix_payment_methods_status_deleted", "status", "is_deleted"),
    )

    # ===============================
    # PROVIDER & TYPE
    # ===============================
    provider: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        default=PaymentProvider.MPESA.value
    )
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )  # e.g., "M-Pesa Express", "Card Payment"

    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ===============================
    # CONFIGURATION
    # ===============================
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[str] = mapped_column(
        String(20),
        default=PaymentMethodStatus.ACTIVE.value,
        nullable=False,
        index=True
    )

    # M-Pesa specific configuration
    mpesa_shortcode: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True
    )  # Till number or short code
    mpesa_business_name: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    mpesa_environment: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        default="simulation"
    )  # simulation, sandbox, production

    # Fees configuration
    fee_type: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        default="percentage"
    )  # percentage, fixed, tiered
    fee_value: Mapped[Optional[float]] = mapped_column(
        nullable=True,
        default=0.0
    )  # Percentage (0-100) or fixed amount
    fee_min: Mapped[Optional[float]] = mapped_column(
        nullable=True,
        default=0.0
    )  # Minimum fee
    fee_max: Mapped[Optional[float]] = mapped_column(
        nullable=True,
        default=None
    )  # Maximum fee (None = no cap)

    # Transaction limits
    min_amount: Mapped[Optional[float]] = mapped_column(
        nullable=True,
        default=1.0
    )
    max_amount: Mapped[Optional[float]] = mapped_column(
        nullable=True,
        default=150000.0
    )  # M-Pesa limit

    # Processing configuration
    processing_time_seconds: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        default=30
    )  # Expected processing time
    retry_count: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True,
        default=3
    )

    # Display configuration
    display_order: Mapped[int] = mapped_column(
        Integer,
        default=0
    )
    icon_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True
    )
    display_label: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )  # Short label for UI, e.g., "Pay with M-Pesa"

    # Additional provider metadata
    provider_metadata: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # ===============================
    # RELATIONSHIPS
    # ===============================
    transactions: Mapped[list["Transaction"]] = relationship(
        "Transaction",
        back_populates="payment_method",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<PaymentMethod {self.name} ({self.provider})>"
