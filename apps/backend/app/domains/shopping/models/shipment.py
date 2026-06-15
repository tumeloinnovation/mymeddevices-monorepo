from sqlalchemy import String, ForeignKey, DateTime, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship, Mapped, mapped_column
from typing import Optional
import uuid
import enum
from datetime import datetime

from app.core.database import Base
from app.domains.shared.models import IDMixin, AuditMixin

class ShipmentStatus(str, enum.Enum):
    CREATED = "created"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    EXCEPTION = "exception"

class Shipment(Base, IDMixin, AuditMixin):
    __tablename__ = "shipments"

    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    tracking_number: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    carrier: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[ShipmentStatus] = mapped_column(SQLEnum(ShipmentStatus), default=ShipmentStatus.CREATED, nullable=False, index=True)
    estimated_delivery: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    shipping_details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    order: Mapped["Order"] = relationship("Order", backref="shipments")

    def __repr__(self):
        return f"<Shipment(id={self.id}, order_id={self.order_id}, status={self.status})>"
