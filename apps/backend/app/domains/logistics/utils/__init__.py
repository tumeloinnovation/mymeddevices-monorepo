"""Logistics utility functions."""

from app.domains.logistics.utils.geometry import calculate_haversine_distance
from app.domains.logistics.utils.matching import (
    DeliveryRequirements,
    EligibleDriver,
    VehicleTypeConfig,
    get_compatible_vehicle_types,
    get_traffic_coefficient_for_time,
    get_vehicle_config,
    get_zone_center,
)
from app.domains.logistics.utils.traffic import (
    TravelTimeEstimate,
    estimate_travel_time,
    get_time_slot,
    get_traffic_coefficient,
    get_vehicle_base_speed,
)

__all__ = [
    "calculate_haversine_distance",
    "DeliveryRequirements",
    "EligibleDriver",
    "VehicleTypeConfig",
    "get_compatible_vehicle_types",
    "get_traffic_coefficient_for_time",
    "get_vehicle_config",
    "get_zone_center",
    # Traffic utilities
    "TravelTimeEstimate",
    "estimate_travel_time",
    "get_time_slot",
    "get_traffic_coefficient",
    "get_vehicle_base_speed",
]
