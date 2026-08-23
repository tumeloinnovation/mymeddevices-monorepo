import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.domains.shopping.models.order import Order

from sqlalchemy import JSON, DateTime, ForeignKey, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domains.shared.models import AuditMixin, IDMixin


class ShipmentStatus(str, enum.Enum):
    CREATED = "created"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    EXCEPTION = "exception"


class Shipment(Base, IDMixin, AuditMixin):
    __tablename__ = "shipments"

    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    tracking_number: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    carrier: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[ShipmentStatus] = mapped_column(
        SQLEnum(ShipmentStatus, name="shipmentstatus", values_callable=lambda obj: [e.value for e in obj]),
        server_default="created",
        default=ShipmentStatus.CREATED,
        nullable=False,
        index=True,
    )
    estimated_delivery: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    shipping_details: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Relationships
    order: Mapped["Order"] = relationship("Order", backref="shipments")

    def __repr__(self):
        return f"<Shipment(id={self.id}, order_id={self.order_id}, status={self.status})>"
