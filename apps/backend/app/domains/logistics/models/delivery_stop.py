"""DeliveryStop model for multi-stop route waypoints."""

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domains.shared.models import AuditMixin, IDMixin

if TYPE_CHECKING:
    from app.domains.logistics.models.delivery import Delivery
    from app.domains.vendor.models.vendor_profile import VendorProfile


class DeliveryStop(Base, IDMixin, AuditMixin):
    """Individual stop in a multi-vendor delivery route.

    Represents each waypoint in the delivery route:
    Office → Vendor 1 → Vendor 2 → Customer
    """

    __tablename__ = "delivery_stops"

    delivery_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("deliveries.id", ondelete="CASCADE"), nullable=False, index=True
    )

    stop_sequence: Mapped[int] = mapped_column(nullable=False)  # 1=Office, 2=Vendor1, etc.
    stop_type: Mapped[str] = mapped_column(String(50), nullable=False)  # office, vendor, customer

    # Location
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # For vendor stops
    vendor_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("vendor_profiles.id", ondelete="SET NULL"), nullable=True
    )
    vendor_name: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Stop status
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, completed, skipped
    arrived_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    departed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    delivery: Mapped["Delivery"] = relationship("Delivery", back_populates="stops")
    vendor: Mapped["VendorProfile"] = relationship("VendorProfile")

    def __repr__(self) -> str:
        return f"<DeliveryStop(id={self.id}, sequence={self.stop_sequence}, type={self.stop_type})>"
