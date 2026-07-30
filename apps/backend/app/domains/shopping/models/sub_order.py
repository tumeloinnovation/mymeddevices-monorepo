"""
SubOrder model for multi-vendor order processing.

A SubOrder represents a vendor's portion of a parent Order.
When a customer checks out with items from multiple vendors,
one parent Order is created with multiple child SubOrders.
"""
import uuid
import enum
from datetime import datetime
from decimal import Decimal
from typing import Optional, List

from sqlalchemy import String, ForeignKey, Numeric, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base
from app.domains.shared.models import IDMixin, AuditMixin


class SubOrderStatus(str, enum.Enum):
    """Status of a vendor's sub-order."""
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class SubOrder(Base, IDMixin, AuditMixin):
    """
    SubOrder represents a vendor's portion of a customer order.

    When a customer purchases items from multiple vendors in one checkout:
    - One parent Order is created (customer-facing)
    - Multiple SubOrders are created (one per vendor)
    - OrderItems are linked to their respective SubOrders

    Lifecycle:
    - PENDING: Created on checkout, awaiting payment
    - PROCESSING: Payment confirmed, vendor preparing shipment
    - SHIPPED: Vendor has shipped the items
    - DELIVERED: Items delivered to customer
    - CANCELLED: SubOrder cancelled (full or partial)
    - REFUNDED: Refund processed
    """
    __tablename__ = "sub_orders"
    __table_args__ = (
        Index("ix_sub_orders_parent_order", "parent_order_id"),
        Index("ix_sub_orders_vendor", "vendor_id"),
        Index("ix_sub_orders_status", "status"),
        Index("ix_sub_orders_parent_vendor", "parent_order_id", "vendor_id"),
    )

    # Foreign Keys
    parent_order_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
    )
    vendor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vendor_profiles.id", ondelete="CASCADE"),
        nullable=False,
    )

    # Financial
    subtotal_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False
    )

    # Status
    status: Mapped[SubOrderStatus] = mapped_column(
        String(20),
        default=SubOrderStatus.PENDING,
        nullable=False,
    )

    # Tracking (optional, for vendor shipments)
    tracking_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tracking_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    shipped_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    delivered_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Vendor notes (internal)
    vendor_notes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # Relationships
    parent_order: Mapped["Order"] = relationship(
        "Order",
        back_populates="sub_orders",
        foreign_keys=[parent_order_id]
    )
    vendor: Mapped["VendorProfile"] = relationship(
        "VendorProfile",
        backref="sub_orders"
    )
    items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="sub_order",
        cascade="all, delete-orphan"
    )
    ledger_transactions: Mapped[List["LedgerTransaction"]] = relationship(
        "LedgerTransaction",
        back_populates="sub_order",
        cascade="all, delete-orphan"
    )

    @property
    def item_count(self) -> int:
        """Get the number of items in this sub-order."""
        return len(self.items) if self.items else 0

    @property
    def total_quantity(self) -> int:
        """Get total quantity of all items."""
        return sum(int(item.quantity) for item in self.items) if self.items else 0

    def __repr__(self):
        return f"<SubOrder(id={self.id}, vendor_id={self.vendor_id}, status={self.status}, amount={self.subtotal_amount})>"
