"""
StockLog model for tracking inventory changes.

Every stock change must be logged for audit purposes and
reconciliation with physical inventory counts.
"""
import uuid
import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import String, ForeignKey, Integer, DateTime, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base
from app.domains.shared.models import IDMixin


class StockChangeReason(str, enum.Enum):
    """Reason for stock quantity change."""
    ORDER_SALE = "order_sale"  # Stock deducted due to customer order
    RESTOCK = "restock"  # Stock added via vendor restock
    ADJUSTMENT = "adjustment"  # Manual inventory adjustment
    RETURN = "return"  # Stock added via customer return
    DAMAGE = "damage"  # Stock removed due to damage/loss
    TRANSFER = "transfer"  # Stock transferred between locations


class StockLog(Base, IDMixin):
    """
    StockLog records all changes to product inventory.

    This provides:
    - Audit trail for all stock movements
    - Historical analysis for demand forecasting
    - Reconciliation with physical counts
    - Debugging for stock discrepancies
    """
    __tablename__ = "stock_logs"
    __table_args__ = (
        Index("ix_stock_logs_product_id", "product_id"),
        Index("ix_stock_logs_vendor_id", "vendor_id"),
        Index("ix_stock_logs_reason", "reason"),
        Index("ix_stock_logs_reference_id", "reference_id"),
    )

    # Foreign Keys
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
    )
    vendor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vendor_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Quantity change (negative for deductions, positive for additions)
    quantity_change: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    # State before and after
    previous_quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )
    new_quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    # Reason for change
    reason: Mapped[StockChangeReason] = mapped_column(
        String(20),
        nullable=False,
    )

    # Reference to related entity
    reference_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
    )  # e.g., order_id, return_id, adjustment_id

    reference_type: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )  # e.g., "order", "return", "adjustment"

    # Additional notes
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Processing metadata
    processed_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    # Relationships
    product: Mapped["Product"] = relationship(
        "Product",
        backref="stock_logs"
    )
    vendor: Mapped["VendorProfile"] = relationship(
        "VendorProfile",
        backref="stock_logs"
    )
    processed_by_user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[processed_by]
    )

    @property
    def is_deduction(self) -> bool:
        """Check if this was a stock deduction."""
        return self.quantity_change < 0

    @property
    def is_addition(self) -> bool:
        """Check if this was a stock addition."""
        return self.quantity_change > 0

    def __repr__(self):
        return f"<StockLog(id={self.id}, product_id={self.product_id}, change={self.quantity_change}, reason={self.reason})>"
