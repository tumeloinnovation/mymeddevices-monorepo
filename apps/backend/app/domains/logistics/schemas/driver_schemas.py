"""Driver schemas for driver management."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.domains.logistics.models.driver_profile import DriverStatus


class DriverProfileResponse(BaseModel):
    """Schema for driver profile response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    status: DriverStatus
    vehicle_type: str | None = None
    vehicle_plate: str | None = None
    vehicle_color: str | None = None
    current_latitude: float | None = None
    current_longitude: float | None = None
    total_deliveries: int
    successful_deliveries: int
    average_rating: float | None = None
    created_at: datetime
    updated_at: datetime


class DriverStatusUpdate(BaseModel):
    """Schema for updating driver status."""

    status: DriverStatus
