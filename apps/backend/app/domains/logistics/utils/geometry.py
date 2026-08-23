"""Geometry utility functions for distance calculations and zone-based fallbacks."""

import datetime as dt
import math
from dataclasses import dataclass
from typing import Any


# Office coordinates for default reference
OFFICE_LAT = -1.3011758537859464
OFFICE_LON = 36.800690681948126

# Zone centroids for Nairobi (approximate central points)
# These can be configured per deployment
ZONE_CENTROIDS: dict[str, tuple[float, float]] = {
    "CBD": (-1.286389, 36.819222),  # Central Business District
    "WESTLANDS": (-1.266667, 36.800000),  # Westlands area
    "EASTLEIGH": (-1.275000, 36.841667),  # Eastleigh area
    "SOUTH_B": (-1.315000, 36.842000),  # South B area
    "SOUTH_C": (-1.320000, 36.850000),  # South C area
    "IMARA_DAIMA": (-1.333333, 36.850000),  # Imara Daima
    "KILIMANI": (-1.275000, 36.800000),  # Kilmani area
    "LANGATA": (-1.300000, 36.783333),  # Langata area
    "KASARANI": (-1.235000, 36.875000),  # Kasarani area
    "ROYSAMBU": (-1.240000, 36.870000),  # Roysambu area
    "BURUBURU": (-1.285000, 36.870000),  # Buruburu area
    "MAKADARA": (-1.295000, 36.880000),  # Makadara area
    "EMBAKASI": (-1.318000, 36.900000),  # Embakasi area
    "NAIROBI_WEST": (-1.250000, 36.820000),  # Nairobi West
    " DAGORETTI": (-1.255000, 36.795000),  # Dagoretti area
    "KIBERA": (-1.310000, 36.795000),  # Kibera area
}

# Distance penalties for stale location data (in km)
PENALTY_FRESHNESS = {
    "fresh": 0.0,  # < 5 minutes old
    "recent": 0.5,  # 5-15 minutes old
    "stale": 1.0,  # 15-60 minutes old
    "very_stale": 2.0,  # 1-4 hours old
    "obsolete": 5.0,  # 4+ hours old
}

# Zone-based fallback distance (km) when no GPS available
DEFAULT_ZONE_DISTANCE = 5.0
DEFAULT_HOME_BASE_DISTANCE = 8.0


@dataclass
class LocationDistanceResult:
    """Result of distance calculation with metadata.

    Attributes:
        distance_km: Calculated distance in kilometers
        location_source: Type of location used ('current', 'last_known', 'home_base', 'zone', 'fallback')
        confidence: Confidence level (1.0 = high, 0.0 = unknown)
        freshness_penalty: Additional distance added due to stale data
        age_minutes: How old the location data is (None for static locations like home_base/zone)
    """

    distance_km: float
    location_source: str
    confidence: float
    freshness_penalty: float = 0.0
    age_minutes: float | None = None


def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in km between two lat/lon coordinates using Haversine formula.

    Args:
        lat1: Latitude of first point
        lon1: Longitude of first point
        lat2: Latitude of second point
        lon2: Longitude of second point

    Returns:
        Distance in kilometers
    """
    R = 6371.0  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def get_location_freshness_penalty(
    location_timestamp: dt.datetime | None, reference_time: dt.datetime | None = None
) -> tuple[str, float, float | None]:
    """Get freshness penalty based on location age.

    Args:
        location_timestamp: When the location was recorded
        reference_time: Reference time for comparison (defaults to now)

    Returns:
        Tuple of (freshness_category, penalty_km, age_minutes)
    """
    if location_timestamp is None:
        return "obsolete", PENALTY_FRESHNESS["obsolete"], None

    if reference_time is None:
        reference_time = dt.datetime.now(dt.UTC)

    age = reference_time - location_timestamp
    age_minutes = age.total_seconds() / 60

    if age_minutes < 5:
        return "fresh", PENALTY_FRESHNESS["fresh"], age_minutes
    elif age_minutes < 15:
        return "recent", PENALTY_FRESHNESS["recent"], age_minutes
    elif age_minutes < 60:
        return "stale", PENALTY_FRESHNESS["stale"], age_minutes
    elif age_minutes < 240:  # 4 hours
        return "very_stale", PENALTY_FRESHNESS["very_stale"], age_minutes
    else:
        return "obsolete", PENALTY_FRESHNESS["obsolete"], age_minutes


def get_zone_centroid(zone: str) -> tuple[float, float] | None:
    """Get approximate centroid coordinates for a zone.

    Args:
        zone: Zone identifier

    Returns:
        (lat, lon) tuple or None if zone not found
    """
    return ZONE_CENTROIDS.get(zone.upper())


def estimate_distance_by_zone(
    from_zone: str | None,
    to_zone: str | None,
    from_lat: float | None = None,
    from_lon: float | None = None,
) -> float:
    """Estimate distance between two zones or a point and a zone.

    Uses zone centroids for estimation. Falls back to default distances
    if zones are unknown.

    Args:
        from_zone: Source zone code
        to_zone: Destination zone code
        from_lat: Optional source latitude (overrides zone centroid)
        from_lon: Optional source longitude (overrides zone centroid)

    Returns:
        Estimated distance in kilometers
    """
    # Use provided coordinates if available
    if from_lat is not None and from_lon is not None:
        from_coords = (from_lat, from_lon)
    else:
        from_coords = get_zone_centroid(from_zone) if from_zone else None

    to_coords = get_zone_centroid(to_zone) if to_zone else None

    # If both zone centroids are available, calculate distance
    if from_coords and to_coords:
        return calculate_haversine_distance(from_coords[0], from_coords[1], to_coords[0], to_coords[1])

    # Fallback distances when zones are unknown
    if from_zone == to_zone:
        return DEFAULT_ZONE_DISTANCE / 2  # Same zone, closer estimate

    return DEFAULT_ZONE_DISTANCE  # Default zone-to-zone distance


def calculate_driver_distance_with_fallback(
    pickup_lat: float,
    pickup_lon: float,
    driver_profile: Any,
    delivery_zone: str | None = None,
) -> LocationDistanceResult:
    """Calculate distance to driver with smart fallback strategy.

    Fallback hierarchy:
    1. Current GPS location (live)
    2. Last known location with freshness penalty
    3. Home base location
    4. Zone centroid (if preferred_zone matches delivery_zone)
    5. Default fallback (office location with higher penalty)

    Args:
        pickup_lat: Pickup latitude
        pickup_lon: Pickup longitude
        driver_profile: DriverProfile instance
        delivery_zone: Delivery zone for zone-based matching

    Returns:
        LocationDistanceResult with distance and metadata
    """
    # Strategy 1: Current GPS location
    if driver_profile.current_latitude is not None and driver_profile.current_longitude is not None:
        distance = calculate_haversine_distance(
            pickup_lat,
            pickup_lon,
            driver_profile.current_latitude,
            driver_profile.current_longitude,
        )
        return LocationDistanceResult(
            distance_km=distance,
            location_source="current",
            confidence=1.0,
            freshness_penalty=0.0,
            age_minutes=0.0,
        )

    # Strategy 2: Last known location with freshness penalty
    if driver_profile.last_known_latitude is not None and driver_profile.last_known_longitude is not None:
        base_distance = calculate_haversine_distance(
            pickup_lat,
            pickup_lon,
            driver_profile.last_known_latitude,
            driver_profile.last_known_longitude,
        )
        freshness, penalty, age = get_location_freshness_penalty(driver_profile.last_location_update_at)
        total_distance = base_distance + penalty

        # Reduce confidence based on data age
        if age is not None:
            confidence = max(0.2, 1.0 - (age / 480.0))  # Linear decay over 8 hours
        else:
            confidence = 0.5

        return LocationDistanceResult(
            distance_km=total_distance,
            location_source="last_known",
            confidence=confidence,
            freshness_penalty=penalty,
            age_minutes=age,
        )

    # Strategy 3: Home base location
    if driver_profile.home_base_latitude is not None and driver_profile.home_base_longitude is not None:
        distance = calculate_haversine_distance(
            pickup_lat,
            pickup_lon,
            driver_profile.home_base_latitude,
            driver_profile.home_base_longitude,
        )
        # Add small penalty for using home base instead of actual location
        distance += 0.5
        return LocationDistanceResult(
            distance_km=distance,
            location_source="home_base",
            confidence=0.6,
            freshness_penalty=0.5,
            age_minutes=None,
        )

    # Strategy 4: Zone-based matching (light penalty if zones match)
    if (
        driver_profile.preferred_zone
        and delivery_zone
        and driver_profile.preferred_zone.lower() == delivery_zone.lower()
    ):
        # Same zone - use default intra-zone distance
        return LocationDistanceResult(
            distance_km=DEFAULT_ZONE_DISTANCE / 2,
            location_source="zone",
            confidence=0.4,
            freshness_penalty=0.0,
            age_minutes=None,
        )

    # Strategy 4b: Zone centroid available (different zone)
    if driver_profile.preferred_zone:
        zone_coords = get_zone_centroid(driver_profile.preferred_zone)
        if zone_coords:
            distance = calculate_haversine_distance(pickup_lat, pickup_lon, zone_coords[0], zone_coords[1])
            return LocationDistanceResult(
                distance_km=distance,
                location_source="zone",
                confidence=0.3,
                freshness_penalty=0.0,
                age_minutes=None,
            )

    # Strategy 5: Delivery zone centroid as fallback
    if delivery_zone:
        zone_coords = get_zone_centroid(delivery_zone)
        if zone_coords:
            distance = calculate_haversine_distance(pickup_lat, pickup_lon, zone_coords[0], zone_coords[1])
            return LocationDistanceResult(
                distance_km=distance + DEFAULT_HOME_BASE_DISTANCE,  # Add penalty
                location_source="zone_fallback",
                confidence=0.2,
                freshness_penalty=DEFAULT_HOME_BASE_DISTANCE,
                age_minutes=None,
            )

    # Final fallback: Office location with significant penalty
    distance = calculate_haversine_distance(pickup_lat, pickup_lon, OFFICE_LAT, OFFICE_LON)
    return LocationDistanceResult(
        distance_km=distance + DEFAULT_HOME_BASE_DISTANCE * 2,
        location_source="fallback",
        confidence=0.1,
        freshness_penalty=DEFAULT_HOME_BASE_DISTANCE * 2,
        age_minutes=None,
    )


def add_workload_balance_adjustment(
    distance_result: LocationDistanceResult,
    driver_current_deliveries: int,
    driver_max_deliveries: int,
    adjustment_factor: float = 0.3,
) -> float:
    """Adjust distance based on driver's current workload.

    Drivers with fewer current deliveries get priority by having
    their effective distance reduced.

    Args:
        distance_result: Original distance calculation result
        driver_current_deliveries: Driver's current delivery count
        driver_max_deliveries: Driver's maximum concurrent deliveries
        adjustment_factor: How much to weight workload (0.0 = ignore, 1.0 = heavy weight)

    Returns:
        Adjusted distance in kilometers
    """
    if driver_max_deliveries <= 0:
        return distance_result.distance_km

    # Calculate utilization ratio (0.0 = empty, 1.0 = full)
    utilization = driver_current_deliveries / driver_max_deliveries

    # Drivers at 0 capacity get biggest bonus, drivers at full capacity get penalty
    # Bonus range: -adjustment_factor * distance to +adjustment_factor * distance
    workload_adjustment = (0.5 - utilization) * adjustment_factor * distance_result.distance_km

    return distance_result.distance_km + workload_adjustment
