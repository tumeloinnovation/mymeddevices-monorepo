"""Tracking schemas for real-time delivery tracking."""

from datetime import datetime

from pydantic import BaseModel, Field


class LocationUpdate(BaseModel):
    """Schema for driver location updates."""

    latitude: float
    longitude: float


class LocationPoint(BaseModel):
    """A single GPS sample in a batched update."""

    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    accuracy_m: float | None = Field(default=None, ge=0)
    speed_kmh: float | None = Field(default=None, ge=0)
    heading_degrees: float | None = Field(default=None, ge=0, le=360)
    source: str = "gps"
    client_timestamp: datetime | None = None


class DriverLocationBatch(BaseModel):
    """Batched driver-location update for efficient persistence."""

    delivery_id: str | None = None
    points: list[LocationPoint] = Field(min_length=1, max_length=50)
    batch_id: str | None = None


class TrackingStop(BaseModel):
    """Schema for a single stop in delivery progress."""

    stop_sequence: int
    stop_type: str
    latitude: float
    longitude: float
    address: str | None = None
    vendor_name: str | None = None
    status: str = "pending"


class DeliveryProgress(BaseModel):
    """Schema for delivery progress tracking."""

    delivery_id: str
    status: str
    current_stop_index: int
    total_stops: int
    driver_location: tuple[float, float] | None = None
    driver_name: str | None = None
    vehicle_plate: str | None = None
    eta_minutes: int | None = None
    distance_km: float | None = None
    estimated_delivery: object | None = None
    stops: list[TrackingStop] = []
