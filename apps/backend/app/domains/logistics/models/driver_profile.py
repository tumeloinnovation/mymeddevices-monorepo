"""DriverProfile model for driver-specific data."""

import datetime as dt
import enum
import uuid
from typing import Any

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domains.shared.models import AuditMixin, IDMixin


class DriverStatus(str, enum.Enum):
    """Driver availability status."""

    AVAILABLE = "available"
    BUSY = "busy"
    OFFLINE = "offline"
    ON_BREAK = "on_break"


class DriverProfile(Base, IDMixin, AuditMixin):
    """Extended profile for driver users.

    Contains driver-specific data including vehicle information,
    current location for live tracking, capacity management for multi-drop
    deliveries, and performance metrics.
    """

    __tablename__ = "driver_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )

    # Driver Status
    status: Mapped[DriverStatus] = mapped_column(
        SQLEnum(DriverStatus, name="driverstatus", values_callable=lambda obj: [e.value for e in obj]),
        server_default="offline",
        default=DriverStatus.OFFLINE,
        nullable=False,
        index=True,
    )

    # Vehicle Info
    vehicle_type: Mapped[str | None] = mapped_column(String(50), nullable=True)  # motorcycle, bicycle, car
    vehicle_plate: Mapped[str | None] = mapped_column(String(20), nullable=True)
    vehicle_color: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Capacity Management for Multi-Drop Deliveries
    max_concurrent_deliveries: Mapped[int] = mapped_column(Integer, default=3, nullable=False, index=True)
    current_deliveries_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Location Data
    # Current Location (for live tracking)
    current_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    current_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Home Base Location (fallback when GPS unavailable)
    home_base_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    home_base_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Last Known GPS Location
    last_known_latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_known_longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    last_location_update_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Vehicle Capacity Limits
    vehicle_capacity_weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    vehicle_capacity_volume_m3: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Zone and Verification
    preferred_zone: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    verified_vehicle: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Performance
    total_deliveries: Mapped[int] = mapped_column(default=0, nullable=False)
    successful_deliveries: Mapped[int] = mapped_column(default=0, nullable=False)
    average_rating: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Relationships
    user: Mapped[Any] = relationship("User", back_populates="driver_profile")

    @property
    def is_at_capacity(self) -> bool:
        """Check if driver has reached maximum concurrent deliveries.

        Returns:
            True if current deliveries >= max concurrent deliveries
        """
        return self.current_deliveries_count >= self.max_concurrent_deliveries

    @property
    def available_capacity(self) -> int:
        """Get number of additional deliveries driver can accept.

        Returns:
            Number of delivery slots remaining (0 if at capacity)
        """
        return max(0, self.max_concurrent_deliveries - self.current_deliveries_count)

    def increment_delivery_count(self, amount: int = 1) -> None:
        """Increment current delivery count.

        Args:
            amount: Number to increment by (default 1)

        Raises:
            ValueError: If increment would exceed max capacity
        """
        if self.current_deliveries_count + amount > self.max_concurrent_deliveries:
            raise ValueError(
                f"Cannot increment: would exceed max_concurrent_deliveries ({self.max_concurrent_deliveries})"
            )
        self.current_deliveries_count += amount

    def decrement_delivery_count(self, amount: int = 1) -> None:
        """Decrement current delivery count.

        Args:
            amount: Number to decrement by (default 1)

        Raises:
            ValueError: If decrement would go below zero
        """
        if self.current_deliveries_count - amount < 0:
            raise ValueError("Cannot decrement: current_deliveries_count would go below zero")
        self.current_deliveries_count -= amount

    def update_location(
        self,
        latitude: float | None = None,
        longitude: float | None = None,
    ) -> None:
        """Update driver's current GPS location.

        Args:
            latitude: New latitude
            longitude: New longitude

        Note:
            Updates current_latitude/longitude and last_known_latitude/longitude
            along with the timestamp. Pass None for either to skip updating.
        """
        if latitude is not None and longitude is not None:
            self.current_latitude = latitude
            self.current_longitude = longitude
            self.last_known_latitude = latitude
            self.last_known_longitude = longitude
            self.last_location_update_at = dt.datetime.now(dt.UTC)

    def set_home_base(self, latitude: float, longitude: float) -> None:
        """Set driver's home base location.

        Args:
            latitude: Home base latitude
            longitude: Home base longitude
        """
        self.home_base_latitude = latitude
        self.home_base_longitude = longitude

    def can_accept_delivery(
        self,
        weight_kg: float | None = None,
        volume_m3: float | None = None,
        zone: str | None = None,
    ) -> bool:
        """Check if driver can accept a delivery based on capacity and constraints.

        Args:
            weight_kg: Delivery weight in kg
            volume_m3: Delivery volume in cubic meters
            zone: Delivery zone code

        Returns:
            True if driver can accept the delivery
        """
        # Check delivery count capacity
        if self.is_at_capacity:
            return False

        # Check weight capacity
        if weight_kg is not None and self.vehicle_capacity_weight_kg is not None:
            if weight_kg > self.vehicle_capacity_weight_kg:
                return False

        # Check volume capacity
        if volume_m3 is not None and self.vehicle_capacity_volume_m3 is not None:
            if volume_m3 > self.vehicle_capacity_volume_m3:
                return False

        # Zone preference check (soft constraint - doesn't block if not matched)
        # Uncomment below if zone preference should be a hard constraint
        # if zone and self.preferred_zone and zone != self.preferred_zone:
        #     return False

        return True

    def __repr__(self) -> str:
        return (
            f"<DriverProfile(id={self.id}, user_id={self.user_id}, status={self.status}, "
            f"deliveries={self.current_deliveries_count}/{self.max_concurrent_deliveries})>"
        )
