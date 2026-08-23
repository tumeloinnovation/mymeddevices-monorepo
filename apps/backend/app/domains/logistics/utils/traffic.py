"""Traffic estimation utilities with time-of-day and zone-based coefficients.

Provides traffic coefficient lookups and time estimation for delivery routing.
"""

import dataclasses
import datetime as dt
from enum import StrEnum
from typing import Literal


class TimeSlot(StrEnum):
    """Time slots for traffic patterns."""

    RUSH_HOUR_MORNING = "rush_hour_morning"
    RUSH_HOUR_EVENING = "rush_hour_evening"
    DAYTIME = "daytime"
    EVENING = "evening"
    NIGHT = "night"
    WEEKEND = "weekend"


@dataclasses.dataclass(frozen=True)
class TrafficConfig:
    """Traffic configuration for a time slot."""

    slot_name: TimeSlot
    coefficient: float
    """Traffic multiplier (1.0 = normal, higher = slower)."""

    hours: tuple[int, int] | None
    """Hour range (start, end) or None for time-based logic."""

    description: str
    """Human-readable description."""


# Traffic coefficient lookup table - ordered by severity
TRAFFIC_COEFFICIENTS: dict[TimeSlot, TrafficConfig] = {
    TimeSlot.RUSH_HOUR_MORNING: TrafficConfig(
        slot_name=TimeSlot.RUSH_HOUR_MORNING,
        coefficient=1.8,
        hours=(7, 9),
        description="Morning rush hour (7-9am)",
    ),
    TimeSlot.RUSH_HOUR_EVENING: TrafficConfig(
        slot_name=TimeSlot.RUSH_HOUR_EVENING,
        coefficient=1.8,
        hours=(17, 19),
        description="Evening rush hour (5-7pm)",
    ),
    TimeSlot.DAYTIME: TrafficConfig(
        slot_name=TimeSlot.DAYTIME,
        coefficient=1.2,
        hours=(9, 17),
        description="Daytime normal traffic (9am-5pm)",
    ),
    TimeSlot.EVENING: TrafficConfig(
        slot_name=TimeSlot.EVENING,
        coefficient=1.1,
        hours=(19, 22),
        description="Evening light traffic (7-10pm)",
    ),
    TimeSlot.NIGHT: TrafficConfig(
        slot_name=TimeSlot.NIGHT,
        coefficient=1.0,
        hours=(22, 7),
        description="Night time minimal traffic (10pm-7am)",
    ),
    TimeSlot.WEEKEND: TrafficConfig(
        slot_name=TimeSlot.WEEKEND,
        coefficient=1.1,
        hours=None,
        description="Weekend baseline traffic",
    ),
}


# Zone-specific traffic modifiers (multiplied with time-based coefficient)
ZONE_TRAFFIC_MODIFIERS: dict[str, float] = {
    "CBD": 1.3,
    "INDUSTRIAL": 1.2,
    "WEST": 1.1,
    "EAST": 1.1,
    "NORTH": 1.0,
    "SOUTH": 1.0,
    "AIRPORT": 1.2,
    "SUBURBAN": 0.9,
}


def get_time_slot(time: dt.datetime) -> TimeSlot:
    """Determine time slot for a given datetime.

    Args:
        time: DateTime to check

    Returns:
        TimeSlot enum value
    """
    hour = time.hour
    weekday = time.weekday()  # 0 = Monday, 6 = Sunday

    # Weekend handling
    if weekday >= 5:  # Saturday, Sunday
        return TimeSlot.WEEKEND

    # Weekday time slots
    if 7 <= hour < 9:
        return TimeSlot.RUSH_HOUR_MORNING
    elif 17 <= hour < 19:
        return TimeSlot.RUSH_HOUR_EVENING
    elif 9 <= hour < 17:
        return TimeSlot.DAYTIME
    elif 19 <= hour < 22:
        return TimeSlot.EVENING
    else:
        return TimeSlot.NIGHT


def get_traffic_coefficient(
    time: dt.datetime,
    zone_code: str | None = None,
    zone_traffic_coefficient: float | None = None,
) -> float:
    """Get traffic multiplier based on time of day and zone.

    Args:
        time: DateTime to check
        zone_code: Optional zone code for zone-specific traffic
        zone_traffic_coefficient: Optional direct zone coefficient

    Returns:
        Traffic coefficient (1.0 = normal, higher = more traffic)
    """
    time_slot = get_time_slot(time)
    traffic_config = TRAFFIC_COEFFICIENTS[time_slot]
    base_coefficient = traffic_config.coefficient

    # Apply zone modifier if provided
    zone_modifier = 1.0
    if zone_code:
        zone_modifier = ZONE_TRAFFIC_MODIFIERS.get(zone_code.upper(), 1.0)
    elif zone_traffic_coefficient:
        zone_modifier = zone_traffic_coefficient

    return base_coefficient * zone_modifier


def get_vehicle_base_speed(vehicle_type: str) -> float:
    """Get base speed for a vehicle type in km/h.

    Args:
        vehicle_type: Vehicle type (motorcycle, bicycle, car, van, truck)

    Returns:
        Base speed in km/h
    """
    speeds = {
        "motorcycle": 35.0,  # Fast urban delivery
        "bicycle": 15.0,  # Slow but maneuverable
        "car": 30.0,  # Urban speed
        "van": 20.0,  # Slower due to size
        "truck": 15.0,  # Slowest
    }
    return speeds.get(vehicle_type.lower(), 25.0)


@dataclasses.dataclass
class TravelTimeEstimate:
    """Result of travel time estimation."""

    estimated_duration_minutes: int
    """Total estimated travel time in minutes."""

    base_time_minutes: float
    """Base travel time without traffic or stops."""

    traffic_coefficient: float
    """Traffic multiplier applied."""

    traffic_delay_minutes: float
    """Additional minutes due to traffic."""

    stop_delay_minutes: int
    """Additional minutes due to stops."""

    distance_km: float
    """Total distance traveled."""

    vehicle_type: str
    """Vehicle type used for calculation."""

    time_slot: TimeSlot
    """Traffic time slot for the departure time."""

    def get_breakdown(self) -> dict[str, float]:
        """Get detailed breakdown of time components.

        Returns:
            Dict with time component labels and values in minutes
        """
        return {
            "base_time": round(self.base_time_minutes, 1),
            "traffic_delay": round(self.traffic_delay_minutes, 1),
            "stop_delay": self.stop_delay_minutes,
            "total": self.estimated_duration_minutes,
        }


def estimate_travel_time(
    distance_km: float,
    vehicle_type: str,
    departure_time: dt.datetime | None = None,
    num_stops: int = 0,
    zone_code: str | None = None,
) -> TravelTimeEstimate:
    """Estimate travel time with traffic and stop factors.

    Args:
        distance_km: Total distance to travel in kilometers
        vehicle_type: Vehicle type for speed calculation
        departure_time: Departure time (defaults to now)
        num_stops: Number of intermediate stops
        zone_code: Zone code for zone-specific traffic

    Returns:
        TravelTimeEstimate with detailed breakdown
    """
    check_time = departure_time or dt.datetime.now(dt.UTC)
    time_slot = get_time_slot(check_time)

    # Get base speed for vehicle
    base_speed = get_vehicle_base_speed(vehicle_type)

    # Calculate base travel time in minutes
    base_time = (distance_km / base_speed) * 60

    # Get traffic coefficient
    traffic_coeff = get_traffic_coefficient(check_time, zone_code)

    # Apply traffic factor
    travel_time = base_time * traffic_coeff

    # Calculate traffic delay
    traffic_delay = travel_time - base_time

    # Add stop penalties (5 minutes per stop)
    stop_delay = num_stops * 5

    # Add buffer time
    buffer = 10

    # Total time
    total_minutes = int(travel_time + stop_delay + buffer)

    return TravelTimeEstimate(
        estimated_duration_minutes=total_minutes,
        base_time_minutes=base_time,
        traffic_coefficient=traffic_coeff,
        traffic_delay_minutes=traffic_delay,
        stop_delay_minutes=stop_delay,
        distance_km=distance_km,
        vehicle_type=vehicle_type,
        time_slot=time_slot,
    )
