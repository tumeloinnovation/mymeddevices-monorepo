from sqlalchemy import Column, String, ForeignKey, DateTime, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
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

    order_id = Column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    tracking_number = Column(String(100), unique=True, nullable=True)
    carrier = Column(String(50), nullable=True)
    status = Column(SQLEnum(ShipmentStatus), default=ShipmentStatus.CREATED, nullable=False, index=True)
    estimated_delivery = Column(DateTime, nullable=True)
    shipping_details = Column(JSON, nullable=True)

    # Relationships
    order = relationship("Order", backref="shipments")

    def __repr__(self):
        return f"<Shipment(id={self.id}, order_id={self.order_id}, status={self.status})>"
