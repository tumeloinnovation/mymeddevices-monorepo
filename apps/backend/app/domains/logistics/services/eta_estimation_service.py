"""ETA estimation service with traffic, time-of-day, and distance factors."""

import datetime as dt
import logging
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import NotFoundError
from app.domains.logistics.models.delivery import Delivery
from app.domains.logistics.models.driver_profile import DriverProfile
from app.domains.logistics.utils.geometry import calculate_haversine_distance
from app.domains.logistics.utils.matching import (
    get_traffic_coefficient_for_time,
    get_vehicle_config,
    get_zone_center,
)

logger = logging.getLogger(__name__)


class ETAEstimationService:
    """ETA calculation service with traffic, time-of-day, and distance factors.

    Provides estimated times for:
    - Driver to reach pickup location
    - Delivery to reach customer
    - Multi-drop route completion
    - Real-time ETA updates during transit
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def calculate_pickup_eta(
        self,
        driver_id: uuid.UUID,
        pickup_location: tuple[float, float],
        current_time: dt.datetime | None = None,
    ) -> dt.datetime:
        """Calculate ETA for driver to reach pickup location.

        Args:
            driver_id: User ID of the driver
            pickup_location: (latitude, longitude) of pickup
            current_time: Base time for calculation (defaults to now)

        Returns:
            Estimated arrival datetime

        Raises:
            NotFoundError: If driver not found
        """
        # Get driver profile
        stmt = select(DriverProfile).where(DriverProfile.user_id == driver_id)
        result = await self.db.execute(stmt)
        driver = result.scalar_one_or_none()

        if not driver:
            raise NotFoundError("Driver", str(driver_id))

        # Get driver location with fallback
        driver_location = self._get_driver_location(driver, pickup_location)

        # Calculate distance
        distance_km = calculate_haversine_distance(
            driver_location[0], driver_location[1], pickup_location[0], pickup_location[1]
        )

        # Get vehicle config
        vehicle_config = get_vehicle_config(driver.vehicle_type or "")
        base_speed = vehicle_config.base_speed_kmh if vehicle_config else 30.0

        # Get traffic coefficient
        check_time = current_time or dt.datetime.now(dt.UTC)
        traffic_coeff = await self.get_traffic_coefficient(check_time, driver.preferred_zone)

        # Calculate travel time in minutes
        travel_minutes = (distance_km / base_speed) * 60 * traffic_coeff

        # Add buffer for pickup preparation
        total_minutes = travel_minutes + 5

        # Calculate ETA
        eta = check_time + dt.timedelta(minutes=total_minutes)

        return eta

    async def calculate_delivery_eta(
        self,
        delivery_id: uuid.UUID,
        route_distance_km: float | None = None,
        num_stops: int | None = None,
        current_time: dt.datetime | None = None,
    ) -> dt.datetime:
        """Calculate ETA for final delivery to customer.

        Args:
            delivery_id: Delivery ID
            route_distance_km: Route distance in km (calculated if not provided)
            num_stops: Number of intermediate stops (counted if not provided)
            current_time: Base time for calculation (defaults to now)

        Returns:
            Estimated delivery datetime

        Raises:
            NotFoundError: If delivery or driver not found
        """
        # Get delivery with driver info
        stmt = select(Delivery).options(selectinload(Delivery.driver)).where(Delivery.id == delivery_id)
        result = await self.db.execute(stmt)
        delivery = result.scalar_one_or_none()

        if not delivery:
            raise NotFoundError("Delivery", str(delivery_id))

        if not delivery.assigned_driver_id:
            raise NotFoundError("Driver", f"for delivery {delivery_id}")

        # Get driver profile
        profile_stmt = select(DriverProfile).where(DriverProfile.user_id == delivery.assigned_driver_id)
        profile_result = await self.db.execute(profile_stmt)
        driver_profile = profile_result.scalar_one_or_none()

        if not driver_profile:
            raise NotFoundError("DriverProfile", f"for driver {delivery.assigned_driver_id}")

        # Get vehicle config
        vehicle_config = get_vehicle_config(driver_profile.vehicle_type or "")
        base_speed = vehicle_config.base_speed_kmh if vehicle_config else 30.0

        # Calculate route distance if not provided
        if route_distance_km is None:
            # This would typically use routing service
            # For now, estimate based on delivery coordinates if available
            route_distance_km = delivery.calculated_distance_km or 10.0

        # Count stops if not provided
        if num_stops is None:
            # Count intermediate stops for multi-drop
            # This would need to query delivery stops table
            # For now, assume single drop
            num_stops = 0

        # Get traffic coefficient
        check_time = current_time or dt.datetime.now(dt.UTC)
        traffic_coeff = await self.get_traffic_coefficient(check_time, driver_profile.preferred_zone)

        # Calculate base travel time in minutes
        base_time = (route_distance_km / base_speed) * 60

        # Apply traffic factor
        travel_time = base_time * traffic_coeff

        # Add stop penalties (5 min per intermediate stop)
        stop_penalty = num_stops * 5

        # Add buffer for delays
        buffer = 10

        # Total time
        total_minutes = travel_time + stop_penalty + buffer

        # Calculate ETA from current time
        eta = check_time + dt.timedelta(minutes=total_minutes)

        return eta

    async def get_traffic_coefficient(self, time: dt.datetime, zone_code: str | None = None) -> float:
        """Get traffic multiplier based on time of day and zone.

        Args:
            time: DateTime to check
            zone_code: Optional zone code for zone-specific traffic

        Returns:
            Traffic coefficient (1.0 = normal, higher = more traffic)
        """
        # Get time-based coefficient
        time_coeff = get_traffic_coefficient_for_time(time)

        # Zone-specific traffic could be configured in database
        # For now, use a simple zone modifier
        zone_modifier = 1.0
        if zone_code:
            # Zone-specific traffic modifiers (example)
            zone_modifiers = {
                "CBD": 1.3,  # CBD has more traffic
                "INDUSTRIAL": 1.2,
                "WEST": 1.1,
                "EAST": 1.1,
                "NORTH": 1.0,
                "SOUTH": 1.0,
            }
            zone_modifier = zone_modifiers.get(zone_code.upper(), 1.0)

        return time_coeff * zone_modifier

    async def update_eta_in_transit(
        self,
        delivery_id: uuid.UUID,
        current_location: tuple[float, float] | None = None,
    ) -> None:
        """Recalculate ETA based on real-time driver location.

        Args:
            delivery_id: Delivery ID to update
            current_location: Driver's current (lat, lon), fetched if not provided

        Raises:
            NotFoundError: If delivery not found
        """
        # Get delivery
        stmt = select(Delivery).where(Delivery.id == delivery_id)
        result = await self.db.execute(stmt)
        delivery = result.scalar_one_or_none()

        if not delivery:
            raise NotFoundError("Delivery", str(delivery_id))

        if not delivery.assigned_driver_id:
            logger.warning(f"Cannot update ETA for delivery {delivery_id}: no driver assigned")
            return

        # Get driver profile for current location
        profile_stmt = select(DriverProfile).where(DriverProfile.user_id == delivery.assigned_driver_id)
        profile_result = await self.db.execute(profile_stmt)
        driver_profile = profile_result.scalar_one_or_none()

        if not driver_profile:
            logger.warning(f"Cannot update ETA for delivery {delivery_id}: no driver profile")
            return

        # Use provided location or driver's current location
        driver_location = current_location
        if driver_location is None:
            if driver_profile.current_latitude and driver_profile.current_longitude:
                driver_location = (
                    driver_profile.current_latitude,
                    driver_profile.current_longitude,
                )
            else:
                logger.warning(f"Cannot update ETA for delivery {delivery_id}: no driver location")
                return

        # Get destination location from delivery address
        if not delivery.delivery_address:
            logger.warning(f"Cannot update ETA for delivery {delivery_id}: no delivery address")
            return

        dest_location = (
            delivery.delivery_address.get("latitude"),
            delivery.delivery_address.get("longitude"),
        )

        if not dest_location[0] or not dest_location[1]:
            logger.warning(f"Cannot update ETA for delivery {delivery_id}: invalid destination")
            return

        # Calculate remaining distance
        remaining_km = calculate_haversine_distance(
            driver_location[0], driver_location[1], dest_location[0], dest_location[1]
        )

        # Get vehicle config
        vehicle_config = get_vehicle_config(driver_profile.vehicle_type or "")
        base_speed = vehicle_config.base_speed_kmh if vehicle_config else 30.0

        # Get current traffic
        traffic_coeff = await self.get_traffic_coefficient(dt.datetime.now(dt.UTC), driver_profile.preferred_zone)

        # Calculate remaining time
        remaining_minutes = (remaining_km / base_speed) * 60 * traffic_coeff

        # Count remaining stops (estimate from route if available)
        remaining_stops = 0  # Would need to calculate from route data

        # Add buffers
        total_minutes = remaining_minutes + (remaining_stops * 5) + 5

        # Update ETA
        delivery.estimated_delivery = dt.datetime.now(dt.UTC) + dt.timedelta(minutes=total_minutes)

        await self.db.commit()

    async def calculate_route_duration(
        self,
        route_distance_km: float,
        vehicle_type: str,
        start_time: dt.datetime | None = None,
        num_stops: int = 0,
    ) -> int:
        """Calculate total duration for a route.

        Args:
            route_distance_km: Total route distance in km
            vehicle_type: Vehicle type for speed calculation
            start_time: Route start time (defaults to now)
            num_stops: Number of stops along route

        Returns:
            Duration in minutes
        """
        # Get vehicle config
        vehicle_config = get_vehicle_config(vehicle_type)
        base_speed = vehicle_config.base_speed_kmh if vehicle_config else 30.0

        # Get traffic coefficient
        check_time = start_time or dt.datetime.now(dt.UTC)
        traffic_coeff = await self.get_traffic_coefficient(check_time)

        # Base travel time
        base_time = (route_distance_km / base_speed) * 60

        # Apply traffic
        travel_time = base_time * traffic_coeff

        # Add stop penalties
        stop_time = num_stops * 5

        # Add buffer
        buffer = 10

        total_minutes = travel_time + stop_time + buffer

        return int(total_minutes)

    async def estimate_time_window(
        self,
        pickup_location: tuple[float, float],
        delivery_location: tuple[float, float],
        vehicle_type: str = "motorcycle",
        requested_time: dt.datetime | None = None,
    ) -> tuple[dt.datetime, dt.datetime]:
        """Calculate estimated time window for a delivery.

        Args:
            pickup_location: (lat, lon) of pickup
            delivery_location: (lat, lon) of delivery
            vehicle_type: Vehicle type for speed calculation
            requested_time: Desired delivery time (defaults to now)

        Returns:
            (earliest_eta, latest_eta) tuple
        """
        # Calculate distance
        distance_km = calculate_haversine_distance(
            pickup_location[0], pickup_location[1], delivery_location[0], delivery_location[1]
        )

        # Get vehicle config
        vehicle_config = get_vehicle_config(vehicle_type)
        base_speed = vehicle_config.base_speed_kmh if vehicle_config else 30.0

        # Get traffic coefficient
        check_time = requested_time or dt.datetime.now(dt.UTC)
        traffic_coeff = await self.get_traffic_coefficient(check_time)

        # Calculate base time
        base_time = (distance_km / base_speed) * 60

        # Earliest ETA (best case - normal traffic)
        earliest_minutes = base_time * traffic_coeff

        # Latest ETA (worst case - add 20% for variability)
        latest_minutes = earliest_minutes * 1.2

        earliest_eta = check_time + dt.timedelta(minutes=earliest_minutes)
        latest_eta = check_time + dt.timedelta(minutes=latest_minutes)

        return earliest_eta, latest_eta

    def _get_driver_location(self, driver: DriverProfile, pickup_location: tuple[float, float]) -> tuple[float, float]:
        """Get driver location with fallback strategy.

        Args:
            driver: Driver profile
            pickup_location: Pickup location for fallback

        Returns:
            (latitude, longitude) tuple
        """
        # Try current GPS
        if driver.current_latitude and driver.current_longitude:
            return (driver.current_latitude, driver.current_longitude)

        # Try last known
        if driver.last_known_latitude and driver.last_known_longitude:
            return (driver.last_known_latitude, driver.last_known_longitude)

        # Try home base
        if driver.home_base_latitude and driver.home_base_longitude:
            return (driver.home_base_latitude, driver.home_base_longitude)

        # Use zone center
        if driver.preferred_zone:
            zone_center = get_zone_center(driver.preferred_zone)
            if zone_center:
                return zone_center

        # Fallback to pickup
        return pickup_location
