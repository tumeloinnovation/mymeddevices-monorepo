"""Driver location models for live delivery tracking."""

import enum
import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.domains.shared.models import IDMixin


class LocationSource(str, enum.Enum):
    GPS = "gps"
    NETWORK = "network"
    PASSIVE = "passive"
    MANUAL = "manual"


class DriverLocationPoint(Base, IDMixin):
    """A timestamped driver location sample."""

    __tablename__ = "driver_location_history"

    driver_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    delivery_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("deliveries.id", ondelete="SET NULL"), nullable=True, index=True
    )
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    accuracy_m: Mapped[float | None] = mapped_column(Float, nullable=True)
    speed_kmh: Mapped[float | None] = mapped_column(Float, nullable=True)
    heading_degrees: Mapped[float | None] = mapped_column(Float, nullable=True)
    source: Mapped[str] = mapped_column(String(20), default=LocationSource.GPS.value, nullable=False)
    client_timestamp: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False, index=True
    )
    batch_id: Mapped[uuid.UUID | None] = mapped_column(index=True)
    point_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    def __repr__(self) -> str:
        return f"<DriverLocationPoint(driver_id={self.driver_id}, recorded_at={self.recorded_at})>"
