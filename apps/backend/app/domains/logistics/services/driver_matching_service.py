"""Driver matching service with vehicle type compatibility and location fallback."""

import datetime as dt
import logging
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import Base
from app.domains.auth.models.user import User
from app.domains.logistics.models.driver_profile import DriverProfile, DriverStatus
from app.domains.logistics.models.delivery import Delivery, DeliveryStatus
from app.domains.logistics.utils.geometry import calculate_haversine_distance
from app.domains.logistics.utils.matching import (
    EligibleDriver,
    DeliveryRequirements,
    VehicleTypeConfig,
    get_compatible_vehicle_types,
    get_traffic_coefficient_for_time,
    get_vehicle_config,
    get_zone_center,
)

logger = logging.getLogger(__name__)


class DriverMatchingService:
    """Enhanced driver matching with vehicle type compatibility and location fallback.

    This service provides intelligent driver-to-delivery matching based on:
    - Vehicle type compatibility with delivery requirements
    - Driver capacity (concurrent deliveries and vehicle limits)
    - Proximity to pickup location with multiple fallback strategies
    - Driver performance metrics and zone preferences
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_eligible_drivers(
        self,
        delivery_requirements: DeliveryRequirements,
        pickup_location: tuple[float, float] | None = None,
        zone_code: str | None = None,
        logistics_type: str | None = None,
        limit: int | None = None,
    ) -> list[EligibleDriver]:
        """Find drivers matching vehicle type, capacity, and location criteria.

        Args:
            delivery_requirements: Delivery weight, volume, and special requirements
            pickup_location: Optional (lat, lon) for proximity calculation
            zone_code: Optional zone code for zone preference matching
            logistics_type: Optional filter by logistics_type (company_rider vs courier)
            limit: Maximum number of drivers to return

        Returns:
            List of eligible drivers sorted by match score (highest first)
        """
        # Get compatible vehicle types for this delivery
        compatible_configs = get_compatible_vehicle_types(delivery_requirements)

        if not compatible_configs:
            logger.warning(f"No vehicle types compatible with requirements: {delivery_requirements}")
            return []

        # Extract vehicle type names
        compatible_vehicle_types = [cfg.vehicle_type for cfg in compatible_configs]

        # Build query for available drivers
        stmt = (
            select(User, DriverProfile)
            .join(DriverProfile, User.id == DriverProfile.user_id)
            .where(
                User.role == "driver",
                User.is_active == True,
                DriverProfile.status == DriverStatus.AVAILABLE,
                DriverProfile.verified_vehicle == True,
                DriverProfile.vehicle_type.in_(compatible_vehicle_types),
            )
        )

        # Filter by logistics_type if specified
        # This assumes there's a way to determine if a driver is company_rider or courier
        # For now, we'll skip this filter but it can be added later

        result = await self.db.execute(stmt)
        driver_rows = result.all()

        eligible_drivers: list[EligibleDriver] = []

        for driver_user, driver_profile in driver_rows:
            # Check driver capacity
            if driver_profile.is_at_capacity:
                continue

            # Get vehicle config
            vehicle_config = get_vehicle_config(driver_profile.vehicle_type or "")
            if not vehicle_config:
                continue

            # Check vehicle capacity limits
            if not self._check_vehicle_capacity(driver_profile, delivery_requirements):
                continue

            # Calculate distance and location
            distance_km = None
            driver_location = None

            if pickup_location:
                driver_location = self.apply_location_fallback(driver_profile, pickup_location)
                distance_km = calculate_haversine_distance(
                    pickup_location[0], pickup_location[1], driver_location[0], driver_location[1]
                )

                # Filter by max distance if vehicle has limit
                if vehicle_config.max_distance_km and distance_km > vehicle_config.max_distance_km:
                    continue

            # Calculate match score
            match_score = self.calculate_match_score(
                driver_profile, delivery_requirements, distance_km or 0.0, zone_code
            )

            # Calculate capacity utilization
            capacity_utilization = driver_profile.current_deliveries_count / driver_profile.max_concurrent_deliveries

            # Calculate estimated pickup time
            estimated_pickup_minutes = None
            if distance_km and vehicle_config:
                estimated_pickup_minutes = self._estimate_pickup_minutes(distance_km, vehicle_config, driver_profile)

            eligible_drivers.append(
                EligibleDriver(
                    driver_id=driver_user.id,
                    driver_profile_id=driver_profile.id,
                    vehicle_type=driver_profile.vehicle_type,
                    status=driver_profile.status.value,
                    match_score=match_score,
                    distance_km=distance_km,
                    capacity_utilization=capacity_utilization,
                    estimated_pickup_minutes=estimated_pickup_minutes,
                    vehicle_plate=driver_profile.vehicle_plate,
                    rating=driver_profile.average_rating,
                    preferred_zone=driver_profile.preferred_zone,
                )
            )

        # Sort by match score descending
        eligible_drivers.sort(key=lambda d: d.match_score, reverse=True)

        if limit:
            eligible_drivers = eligible_drivers[:limit]

        return eligible_drivers

    def apply_location_fallback(
        self, driver: DriverProfile, pickup_location: tuple[float, float]
    ) -> tuple[float, float]:
        """Determine driver location using fallback strategy.

        Fallback chain:
        1. Live GPS (current_latitude/current_longitude)
        2. Last known location (last_known_latitude/last_known_longitude)
        3. Home base (home_base_latitude/home_base_longitude)
        4. Zone center (preferred_zone)

        Args:
            driver: Driver profile to get location for
            pickup_location: Pickup location for reference

        Returns:
            (latitude, longitude) tuple
        """
        # 1. Check live GPS
        if driver.current_latitude is not None and driver.current_longitude is not None:
            return (driver.current_latitude, driver.current_longitude)

        # 2. Check last known location
        if driver.last_known_latitude is not None and driver.last_known_longitude is not None:
            return (driver.last_known_latitude, driver.last_known_longitude)

        # 3. Check home base
        if driver.home_base_latitude is not None and driver.home_base_longitude is not None:
            return (driver.home_base_latitude, driver.home_base_longitude)

        # 4. Use zone center
        if driver.preferred_zone:
            zone_center = get_zone_center(driver.preferred_zone)
            if zone_center:
                return zone_center

        # No location available - return pickup as fallback
        logger.warning(f"No location available for driver {driver.id}, using pickup as fallback")
        return pickup_location

    def calculate_match_score(
        self,
        driver: DriverProfile,
        requirements: DeliveryRequirements,
        distance_km: float,
        zone_code: str | None = None,
    ) -> float:
        """Calculate suitability score for driver-delivery match.

        Scoring formula:
        - Base score: 100
        - Distance penalty: -2 points per km
        - Capacity penalty: -10 if at 80%+ capacity
        - Zone bonus: +15 if in preferred_zone
        - Rating bonus: +5 if rating >= 4.5
        - Urgency bonus: +10 if urgent and vehicle is suitable

        Args:
            driver: Driver profile to score
            requirements: Delivery requirements
            distance_km: Distance from driver to pickup in km
            zone_code: Delivery zone code

        Returns:
            Match score (higher is better, minimum 0)
        """
        score = 100.0

        # Distance penalty
        distance_penalty = distance_km * 2.0
        score -= distance_penalty

        # Capacity penalty
        capacity_ratio = driver.current_deliveries_count / driver.max_concurrent_deliveries
        if capacity_ratio >= 0.8:
            score -= 10.0
        elif capacity_ratio >= 0.5:
            score -= 5.0

        # Zone bonus
        if zone_code and driver.preferred_zone == zone_code:
            score += 15.0

        # Rating bonus
        if driver.average_rating and driver.average_rating >= 4.5:
            score += 5.0
        elif driver.average_rating and driver.average_rating >= 4.0:
            score += 2.0

        # Urgency bonus for suitable vehicles
        if requirements.is_urgent:
            vehicle_config = get_vehicle_config(driver.vehicle_type or "")
            if vehicle_config and vehicle_config.suitable_for_urgent:
                score += 10.0

        return max(0.0, score)

    async def assign_driver_with_capacity(
        self,
        delivery_id: uuid.UUID,
        driver_id: uuid.UUID,
        multi_drop_id: uuid.UUID | None = None,
    ) -> Delivery:
        """Assign driver and increment capacity counters.

        Args:
            delivery_id: Delivery to assign
            driver_id: Driver to assign
            multi_drop_id: Optional multi-drop batch ID

        Returns:
            Updated delivery

        Raises:
            NotFoundError: If delivery or driver not found
            ValidationError: If driver is at capacity
        """
        from app.core.exceptions import NotFoundError, ValidationError

        # Get delivery
        delivery_stmt = select(Delivery).where(Delivery.id == delivery_id)
        delivery_result = await self.db.execute(delivery_stmt)
        delivery = delivery_result.scalar_one_or_none()

        if not delivery:
            raise NotFoundError("Delivery", str(delivery_id))

        if delivery.assigned_driver_id:
            raise ValidationError(f"Delivery {delivery_id} already has a driver assigned")

        # Get driver profile
        profile_stmt = select(DriverProfile).where(DriverProfile.user_id == driver_id)
        profile_result = await self.db.execute(profile_stmt)
        driver_profile = profile_result.scalar_one_or_none()

        if not driver_profile:
            raise NotFoundError("DriverProfile", f"for driver {driver_id}")

        # Check capacity
        if driver_profile.is_at_capacity:
            raise ValidationError(f"Driver {driver_id} is at capacity")

        # Assign driver
        delivery.assigned_driver_id = driver_id
        delivery.status = DeliveryStatus.ASSIGNED

        # Increment capacity (use increment method for validation)
        driver_profile.increment_delivery_count(1)

        # Mark driver as busy if at capacity
        if driver_profile.is_at_capacity:
            driver_profile.status = DriverStatus.BUSY

        await self.db.commit()
        await self.db.refresh(delivery)

        return delivery

    async def find_drivers_for_multi_drop(
        self,
        delivery_requirements_list: list[DeliveryRequirements],
        pickup_locations: list[tuple[float, float]],
        zone_code: str | None = None,
        driver_id: uuid.UUID | None = None,
    ) -> list[EligibleDriver]:
        """Find drivers suitable for multi-drop deliveries.

        Args:
            delivery_requirements_list: List of delivery requirements
            pickup_locations: List of pickup locations
            zone_code: Delivery zone code
            driver_id: Optional specific driver to check

        Returns:
            List of eligible drivers for multi-drop

        Note:
            This aggregates requirements to find drivers who can handle
            the combined weight/volume of all deliveries.
        """
        # Aggregate requirements
        total_weight = sum(req.weight_kg for req in delivery_requirements_list)
        total_volume = sum(req.volume_m3 for req in delivery_requirements_list)
        any_urgent = any(req.is_urgent for req in delivery_requirements_list)
        any_fragile = any(req.is_fragile for req in delivery_requirements_list)
        any_pharma = any(req.is_pharma for req in delivery_requirements_list)

        # Get average pickup location
        avg_lat = sum(loc[0] for loc in pickup_locations) / len(pickup_locations)
        avg_lon = sum(loc[1] for loc in pickup_locations) / len(pickup_locations)
        avg_location = (avg_lat, avg_lon)

        aggregated_requirements = DeliveryRequirements(
            weight_kg=total_weight,
            volume_m3=total_volume,
            is_urgent=any_urgent,
            is_fragile=any_fragile,
            is_pharma=any_pharma,
            requires_multi_drop=True,
            logistics_type=delivery_requirements_list[0].logistics_type,
        )

        return await self.find_eligible_drivers(
            delivery_requirements=aggregated_requirements,
            pickup_location=avg_location,
            zone_code=zone_code,
        )

    def _check_vehicle_capacity(self, driver: DriverProfile, requirements: DeliveryRequirements) -> bool:
        """Check if driver's vehicle can handle delivery requirements.

        Args:
            driver: Driver profile with vehicle info
            requirements: Delivery requirements

        Returns:
            True if vehicle has sufficient capacity
        """
        # Check weight
        if (
            requirements.weight_kg
            and driver.vehicle_capacity_weight_kg is not None
            and requirements.weight_kg > driver.vehicle_capacity_weight_kg
        ):
            return False

        # Check volume
        if (
            requirements.volume_m3
            and driver.vehicle_capacity_volume_m3 is not None
            and requirements.volume_m3 > driver.vehicle_capacity_volume_m3
        ):
            return False

        return True

    def _estimate_pickup_minutes(
        self, distance_km: float, vehicle_config: VehicleTypeConfig, driver: DriverProfile
    ) -> int:
        """Estimate minutes for driver to reach pickup location.

        Args:
            distance_km: Distance to pickup in km
            vehicle_config: Vehicle type configuration
            driver: Driver profile

        Returns:
            Estimated minutes to reach pickup
        """
        # Get traffic coefficient
        traffic_coeff = get_traffic_coefficient_for_time(dt.datetime.now(dt.UTC))

        # Calculate base travel time
        base_time = (distance_km / vehicle_config.base_speed_kmh) * 60

        # Apply traffic
        travel_time = base_time * traffic_coeff

        # Add 5 min buffer for preparation
        return int(travel_time + 5)
