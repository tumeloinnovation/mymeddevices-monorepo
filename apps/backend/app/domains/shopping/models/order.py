from sqlalchemy import String, ForeignKey, JSON, Enum as SQLEnum, Numeric, Float, Integer, DateTime
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import List, Optional
from decimal import Decimal
import uuid
import enum
from datetime import datetime

from app.core.database import Base
from app.domains.shared.models import IDMixin, AuditMixin

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

class Order(Base, IDMixin, AuditMixin):
    __tablename__ = "orders"

    order_number: Mapped[Optional[int]] = mapped_column(Integer, unique=True, index=True, nullable=True)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    guest_token: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    status: Mapped[OrderStatus] = mapped_column(SQLEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False, index=True)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="KES", nullable=False)
    shipping_address: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    idempotency_key: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True, index=True)

    # Relationships
    user: Mapped["User"] = relationship("User", backref="orders")
    items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    timeline_events: Mapped[List["OrderTimelineEvent"]] = relationship(
        "OrderTimelineEvent",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderTimelineEvent.created_at.asc()"
    )

    def __repr__(self):
        return f"<Order(id={self.id}, status={self.status}, total={self.total_amount})>"

class OrderTimelineEvent(Base, IDMixin):
    __tablename__ = "order_timeline_events"

    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, nullable=False)
    created_by: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="timeline_events")


class OrderItemFulfillmentStatus(str, enum.Enum):
    """Status of an individual order item fulfillment."""
    PENDING = "pending"
    PROCESSING = "processing"
    PACKED = "packed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class OrderItem(Base, IDMixin):
    __tablename__ = "order_items"

    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    vendor_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("vendor_profiles.id"), nullable=False, index=True)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    # Fulfillment fields for per-item tracking
    fulfillment_status: Mapped[str] = mapped_column(String(20), default=OrderItemFulfillmentStatus.PENDING.value, nullable=False, index=True)
    tracking_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tracking_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="items")
    product: Mapped["Product"] = relationship("Product")
    vendor: Mapped["VendorProfile"] = relationship("VendorProfile")

    @property
    def product_name(self) -> str:
        return self.product.name if self.product else "Unknown Product"

    @property
    def total_price(self) -> float:
        return float(round(self.subtotal))

    @property
    def sku(self) -> str:
        return self.product.sku if self.product else "N/A"

    @property
    def total(self) -> float:
        return float(round(self.subtotal))

    @property
    def status(self) -> str:
        return self.fulfillment_status

    def __repr__(self):
        return f"<OrderItem(id={self.id}, order_id={self.order_id}, product_id={self.product_id})>"
