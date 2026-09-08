"""Routing schemas for delivery route calculation."""

import datetime as dt
from typing import Any

from pydantic import BaseModel


class RouteCalculationRequest(BaseModel):
    """Request for route calculation."""

    customer_coords: tuple[float, float]
    vendor_ids: list[str] | None = None
    logistics_settings: dict[str, Any] | None = None


class DeliveryRouteResult(BaseModel):
    """Result of delivery route calculation."""

    logistics_type: str
    amount: float
    distance: float
    route: list[list[float]]
    estimated_duration_minutes: int | None = None
    estimated_arrival: dt.datetime | None = None
    geometry: list[list[float]] | None = None
    provider: str | None = None
