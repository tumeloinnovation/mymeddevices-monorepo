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
    internal_notes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    idempotency_key: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True, index=True)
    loyalty_discount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True, default=None)
    loyalty_points_redeemed: Mapped[Optional[int]] = mapped_column(nullable=True, default=None)

    # Relationships
    user: Mapped["User"] = relationship("User", backref="orders")
    items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    sub_orders: Mapped[List["SubOrder"]] = relationship(
        "SubOrder",
        back_populates="parent_order",
        cascade="all, delete-orphan",
        order_by="SubOrder.created_at.asc()"
    )
    timeline_events: Mapped[List["OrderTimelineEvent"]] = relationship(
        "OrderTimelineEvent",
        back_populates="order",
        cascade="all, delete-orphan",
        order_by="OrderTimelineEvent.created_at.asc()"
    )

    @property
    def shipping_amount(self) -> float:
        if self.shipping_address and isinstance(self.shipping_address, dict):
            return float(self.shipping_address.get("shipping_amount", 0.0))
        return 0.0

    @property
    def packaging_fee(self) -> float:
        if self.shipping_address and isinstance(self.shipping_address, dict):
            return float(self.shipping_address.get("packaging_fee", 100.0))
        return 100.0

    @property
    def services_fee(self) -> float:
        if self.shipping_address and isinstance(self.shipping_address, dict):
            return float(self.shipping_address.get("services_fee", 50.0))
        return 50.0

    @property
    def discount_amount(self) -> float:
        if self.shipping_address and isinstance(self.shipping_address, dict):
            return float(self.shipping_address.get("discount_amount", 0.0))
        return 0.0

    @property
    def subtotal(self) -> float:
        if self.items:
            return float(sum(float(item.subtotal) for item in self.items))
        if self.shipping_address and isinstance(self.shipping_address, dict):
            return float(self.shipping_address.get("subtotal", 0.0))
        return 0.0

    @property
    def payment_method(self) -> str:
        if self.shipping_address and isinstance(self.shipping_address, dict):
            return self.shipping_address.get("payment_method", "cod")
        return "cod"

    @property
    def payment_method_title(self) -> str:
        if self.shipping_address and isinstance(self.shipping_address, dict):
            pm_title = self.shipping_address.get("payment_method_title")
            if pm_title:
                return pm_title
            pm = self.shipping_address.get("payment_method", "cod")
            return "M-Pesa Express" if pm == "mpesa" else "Cash on Delivery"
        return "Cash on Delivery"

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
    sub_order_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("sub_orders.id", ondelete="CASCADE"), nullable=True, index=True)
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
    sub_order: Mapped[Optional["SubOrder"]] = relationship("SubOrder", back_populates="items")
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
