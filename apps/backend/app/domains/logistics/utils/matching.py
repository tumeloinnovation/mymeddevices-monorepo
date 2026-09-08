"""Driver matching utilities with vehicle compatibility and scoring."""

import dataclasses
import datetime as dt
import uuid


@dataclasses.dataclass(frozen=True)
class VehicleTypeConfig:
    """Configuration for a vehicle type."""

    vehicle_type: str
    """Vehicle type identifier (motorcycle, bicycle, car, van, truck)."""

    display_name: str
    """Human-readable vehicle name."""

    max_weight_kg: float
    """Maximum cargo weight in kilograms."""

    max_volume_m3: float
    """Maximum cargo volume in cubic meters."""

    base_speed_kmh: float
    """Average speed in km/h for ETA calculations."""

    max_distance_km: float | None = None
    """Maximum delivery distance in km (None for unlimited)."""

    max_concurrent_deliveries: int = 3
    """Default maximum concurrent deliveries for this vehicle type."""

    supports_multi_drop: bool = True
    """Whether this vehicle type supports multi-drop deliveries."""

    supports_fragile: bool = True
    """Whether this vehicle type can transport fragile items."""

    supports_pharma: bool = True
    """Whether this vehicle type meets pharma transport requirements."""

    suitable_for_urgent: bool = True
    """Whether this vehicle type is suitable for urgent deliveries."""


@dataclasses.dataclass(frozen=True)
class DeliveryRequirements:
    """Requirements for a delivery that influence vehicle matching."""

    weight_kg: float
    """Total weight of the delivery in kg."""

    volume_m3: float
    """Total volume of the delivery in cubic meters."""

    is_urgent: bool = False
    """Whether this is an urgent delivery (prioritizes faster vehicles)."""

    is_fragile: bool = False
    """Whether the delivery contains fragile items."""

    is_pharma: bool = False
    """Whether the delivery requires pharma-grade transport."""

    requires_multi_drop: bool = False
    """Whether this delivery is part of a multi-drop route."""

    logistics_type: str = "courier"
    """Logistics type (company_rider, courier, self_pickup)."""

    max_distance_km: float | None = None
    """Maximum distance for delivery (None for unlimited)."""


@dataclasses.dataclass
class EligibleDriver:
    """A driver eligible for a delivery with match scoring."""

    driver_id: uuid.UUID
    """User ID of the driver."""

    driver_profile_id: uuid.UUID
    """ID of the driver profile record."""

    vehicle_type: str | None
    """Driver's vehicle type."""

    status: str
    """Driver status (available, busy, offline, on_break)."""

    match_score: float
    """Suitability score (higher is better)."""

    distance_km: float | None
    """Distance from driver to pickup in km."""

    capacity_utilization: float
    """Current capacity utilization (0.0 to 1.0)."""

    estimated_pickup_minutes: int | None = None
    """Estimated minutes for driver to reach pickup."""

    vehicle_plate: str | None = None
    """Vehicle license plate."""

    rating: float | None = None
    """Driver's average rating."""

    preferred_zone: str | None = None
    """Driver's preferred zone."""


# Vehicle type configurations - ordered by speed (fastest first)
VEHICLE_TYPE_CONFIGS: dict[str, VehicleTypeConfig] = {
    "bicycle": VehicleTypeConfig(
        vehicle_type="bicycle",
        display_name="Bicycle",
        max_weight_kg=3.0,
        max_volume_m3=0.05,
        base_speed_kmh=15.0,
        max_distance_km=5.0,
        max_concurrent_deliveries=5,
        supports_multi_drop=True,
        supports_fragile=True,
        supports_pharma=True,  # Good for last-mile pharma in dense areas
        suitable_for_urgent=True,
    ),
    "motorcycle": VehicleTypeConfig(
        vehicle_type="motorcycle",
        display_name="Motorcycle",
        max_weight_kg=5.0,
        max_volume_m3=0.1,
        base_speed_kmh=35.0,  # Updated to 35km/h per requirements
        max_distance_km=15.0,
        max_concurrent_deliveries=4,
        supports_multi_drop=True,
        supports_fragile=True,
        supports_pharma=True,
        suitable_for_urgent=True,
    ),
    "car": VehicleTypeConfig(
        vehicle_type="car",
        display_name="Car",
        max_weight_kg=50.0,
        max_volume_m3=0.5,
        base_speed_kmh=30.0,  # Updated to 30km/h urban per requirements
        max_distance_km=50.0,
        max_concurrent_deliveries=3,
        supports_multi_drop=True,
        supports_fragile=True,
        supports_pharma=True,
        suitable_for_urgent=False,  # Cars are slower due to traffic
    ),
    "van": VehicleTypeConfig(
        vehicle_type="van",
        display_name="Van",
        max_weight_kg=200.0,
        max_volume_m3=3.0,
        base_speed_kmh=20.0,
        max_distance_km=100.0,
        max_concurrent_deliveries=2,
        supports_multi_drop=True,
        supports_fragile=True,
        supports_pharma=True,
        suitable_for_urgent=False,
    ),
    "truck": VehicleTypeConfig(
        vehicle_type="truck",
        display_name="Truck",
        max_weight_kg=1000.0,
        max_volume_m3=15.0,
        base_speed_kmh=15.0,
        max_distance_km=None,  # Unlimited
        max_concurrent_deliveries=1,
        supports_multi_drop=True,
        supports_fragile=False,  # Trucks may not have climate control
        supports_pharma=False,  # Trucks may not meet pharma requirements
        suitable_for_urgent=False,
    ),
}


def get_vehicle_config(vehicle_type: str) -> VehicleTypeConfig | None:
    """Get configuration for a vehicle type.

    Args:
        vehicle_type: Vehicle type identifier

    Returns:
        VehicleTypeConfig or None if not found
    """
    return VEHICLE_TYPE_CONFIGS.get(vehicle_type.lower())


def get_compatible_vehicle_types(requirements: DeliveryRequirements) -> list[VehicleTypeConfig]:
    """Get all vehicle types that can handle delivery requirements.

    Args:
        requirements: Delivery requirements

    Returns:
        List of compatible vehicle types, ordered by suitability
    """
    compatible = []

    for config in VEHICLE_TYPE_CONFIGS.values():
        # Check weight capacity
        if requirements.weight_kg > config.max_weight_kg:
            continue

        # Check volume capacity
        if requirements.volume_m3 > config.max_volume_m3:
            continue

        # Check fragile items support
        if requirements.is_fragile and not config.supports_fragile:
            continue

        # Check pharma support
        if requirements.is_pharma and not config.supports_pharma:
            continue

        # Check multi-drop support
        if requirements.requires_multi_drop and not config.supports_multi_drop:
            continue

        # Check distance limit
        if requirements.max_distance_km:
            if config.max_distance_km and config.max_distance_km < requirements.max_distance_km:
                continue

        compatible.append(config)

    # Sort by suitability for the delivery type
    if requirements.is_urgent:
        # Prioritize faster vehicles
        compatible.sort(key=lambda c: -c.base_speed_kmh)
    else:
        # Prioritize capacity (larger vehicles for larger loads)
        compatible.sort(key=lambda c: c.max_weight_kg)

    return compatible


def is_vehicle_compatible(vehicle_type: str, requirements: DeliveryRequirements) -> bool:
    """Check if a vehicle type is compatible with delivery requirements.

    Args:
        vehicle_type: Vehicle type to check
        requirements: Delivery requirements

    Returns:
        True if vehicle can handle the delivery
    """
    config = get_vehicle_config(vehicle_type)
    if not config:
        return False

    return bool(get_compatible_vehicle_types(requirements) and config in get_compatible_vehicle_types(requirements))


def get_zone_center(zone_code: str) -> tuple[float, float] | None:
    """Get approximate center coordinates for a zone code.

    Args:
        zone_code: Zone identifier (e.g., "CBD", "WEST", "NORTH")

    Returns:
        (latitude, longitude) or None if zone not found
    """
    # Zone centers for Nairobi (example - should be configured per deployment)
    ZONE_CENTERS: dict[str, tuple[float, float]] = {
        "CBD": (-1.286389, 36.817223),
        "WEST": (-1.278, 36.821),
        "EAST": (-1.295, 36.835),
        "NORTH": (-1.260, 36.800),
        "SOUTH": (-1.310, 36.830),
        "INDUSTRIAL": (-1.295, 36.850),
    }
    return ZONE_CENTERS.get(zone_code.upper())


@dataclasses.dataclass
class TrafficSlot:
    """Traffic configuration for a time slot."""

    slot_name: str
    coefficient: float
    """Traffic multiplier (1.0 = no traffic, higher = slower)."""


def get_traffic_coefficient_for_time(
    time: dt.datetime,
    zone_traffic_coefficient: float | None = None,
) -> float:
    """Get traffic multiplier based on time of day.

    Args:
        time: DateTime to check
        zone_traffic_coefficient: Optional zone-specific traffic coefficient

    Returns:
        Traffic coefficient (1.0 = normal, higher = more traffic)
    """
    hour = time.hour
    weekday = time.weekday()  # 0 = Monday, 6 = Sunday

    # Weekend traffic is lighter
    if weekday >= 5:  # Saturday, Sunday
        base_coefficient = 1.1
    else:
        # Weekday traffic patterns
        if 7 <= hour < 9:
            base_coefficient = 1.8  # Morning rush hour
        elif 17 <= hour < 19:
            base_coefficient = 1.8  # Evening rush hour
        elif 9 <= hour < 17:
            base_coefficient = 1.3  # Daytime
        elif 19 <= hour < 22:
            base_coefficient = 1.2  # Evening
        else:
            base_coefficient = 1.0  # Night

    # Apply zone modifier if provided
    if zone_traffic_coefficient:
        return base_coefficient * zone_traffic_coefficient

    return base_coefficient
