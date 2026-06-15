from sqlalchemy import Column, String, Float, ForeignKey, JSON, DateTime, UniqueConstraint, Enum as SQLEnum
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import List, Optional
import uuid
import enum

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

    user_id = Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False, index=True)
    total_amount = Column(Float, nullable=False)
    currency = Column(String(3), default="KES", nullable=False)
    shipping_address = Column(JSON, nullable=True)
    notes = Column(String(500), nullable=True)
    idempotency_key = Column(String(100), unique=True, nullable=True, index=True)

    # Relationships
    user = relationship("User", backref="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Order(id={self.id}, status={self.status}, total={self.total_amount})>"

class OrderItem(Base, IDMixin):
    __tablename__ = "order_items"

    order_id = Column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(ForeignKey("products.id"), nullable=False, index=True)
    vendor_id = Column(ForeignKey("vendor_profiles.id"), nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    # Relationships
    order = relationship("Order", back_populates="items")
    product = relationship("Product")
    vendor = relationship("VendorProfile")

    def __repr__(self):
        return f"<OrderItem(id={self.id}, order_id={self.order_id}, product_id={self.product_id})>"
