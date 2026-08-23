"""Delivery entity model with enhanced logistics lifecycle."""

import enum
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from app.domains.shopping.models.order import Order

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Numeric, String, Text
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domains.shared.models import AuditMixin, IDMixin, SoftDeleteMixin


class LogisticsType(str, enum.Enum):
    """Type of logistics delivery method."""

    COMPANY_RIDER = "company_rider"  # Internal rider within max_radius_km
    COURIER = "courier"  # External courier service
    SELF_PICKUP = "self_pickup"  # Customer pickup


class DeliveryStatus(str, enum.Enum):
    """Delivery lifecycle status."""

    # Pre-delivery states
    CREATED = "created"
    ASSIGNED = "assigned"
    ROUTED = "routed"

    # In-progress states
    AT_VENDOR = "at_vendor"  # Picking up from vendor
    IN_TRANSIT = "in_transit"  # En route to customer
    NEARBY = "nearby"  # Near customer location

    # Completion states
    DELIVERED = "delivered"  # Successfully delivered
    FAILED_ATTEMPT = "failed_attempt"  # Delivery failed
    CANCELLED = "cancelled"
    EXCEPTION = "exception"


class Delivery(Base, IDMixin, AuditMixin, SoftDeleteMixin):
    """Enhanced delivery entity with full logistics lifecycle.

    Replaces the limited Shipment model with comprehensive delivery tracking.
    """

    __tablename__ = "deliveries"

    # Links to order
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)

    dispatch_idempotency_key: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)

    # Logistics Classification
    logistics_type: Mapped[LogisticsType] = mapped_column(
        SQLEnum(LogisticsType, name="logisticstype", values_callable=lambda obj: [e.value for e in obj]),
        server_default="courier",
        default=LogisticsType.COURIER,
        nullable=False,
        index=True,
    )

    # Status tracking
    status: Mapped[DeliveryStatus] = mapped_column(
        SQLEnum(DeliveryStatus, name="deliverystatus", values_callable=lambda obj: [e.value for e in obj]),
        server_default="created",
        default=DeliveryStatus.CREATED,
        nullable=False,
        index=True,
    )

    # Driver Assignment
    assigned_driver_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Route Information
    route_coordinates: Mapped[list[list[float]] | None] = mapped_column(JSON, nullable=True)
    calculated_distance_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    estimated_duration_minutes: Mapped[int | None] = mapped_column(nullable=True)

    # Live route metrics
    route_geometry: Mapped[list[list[float]] | None] = mapped_column(JSON, nullable=True)
    remaining_distance_km: Mapped[float | None] = mapped_column(Float, nullable=True)
    traveled_distance_km: Mapped[float | None] = mapped_column(Float, default=0.0, nullable=False)
    route_provider: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Delivery Address
    delivery_address: Mapped[dict | None] = mapped_column(JSON, nullable=True)

    # Tracking
    tracking_number: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    tracking_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    carrier: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Timing
    estimated_delivery: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_delivery: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Fees
    shipping_amount: Mapped[Numeric | None] = mapped_column(Numeric(12, 2), nullable=True)

    # Additional Details
    delivery_notes: Mapped[str | None] = mapped_column(String(500), nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    assignment_status: Mapped[str | None] = mapped_column(String(30), default="pending", nullable=False)
    assignment_responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    failure_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    order: Mapped["Order"] = relationship("Order", back_populates="deliveries")
    stops: Mapped[list["DeliveryStop"]] = relationship(
        "DeliveryStop", back_populates="delivery", cascade="all, delete-orphan"
    )
    proofs: Mapped[list["DeliveryProof"]] = relationship(
        "DeliveryProof", back_populates="delivery", cascade="all, delete-orphan"
    )
    driver: Mapped[Any] = relationship("User", foreign_keys=[assigned_driver_id])
    location_history: Mapped[list["DriverLocationPoint"]] = relationship(
        "DriverLocationPoint",
        primaryjoin="Delivery.id == foreign(DriverLocationPoint.delivery_id)",
        viewonly=True,
    )

    def __repr__(self) -> str:
        return f"<Delivery(id={self.id}, order_id={self.order_id}, status={self.status})>"
