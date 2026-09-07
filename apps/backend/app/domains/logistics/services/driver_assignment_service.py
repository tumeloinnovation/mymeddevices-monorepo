"""Driver assignment service for finding and assigning drivers to deliveries.

Extracted from CheckoutService lines 165-172.
Enhanced with capacity tracking for multi-drop deliveries, vehicle type matching,
ETA estimation, and intelligent driver scoring.
"""

import datetime as dt
import uuid
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import BusinessRuleError, NotFoundError, ValidationError
from app.domains.auth.models.user import User
from app.domains.logistics.models.delivery import Delivery
from app.domains.logistics.models.driver_location import DriverLocationPoint
from app.domains.logistics.models.driver_profile import DriverProfile, DriverStatus
from app.domains.logistics.utils.geometry import (
    LocationDistanceResult,
    add_workload_balance_adjustment,
    calculate_driver_distance_with_fallback,
    calculate_haversine_distance,
)

# Vehicle type configurations for matching and ETA calculation
VEHICLE_CONFIGS: dict[str, dict[str, Any]] = {
    "motorcycle": {
        "average_speed_kmh": 35.0,  # Average speed in urban traffic
        "capacity_weight_kg": 30.0,
        "capacity_volume_m3": 0.1,
        "priority": 1,  # Lower is higher priority
    },
    "bicycle": {
        "average_speed_kmh": 15.0,
        "capacity_weight_kg": 20.0,
        "capacity_volume_m3": 0.05,
        "priority": 2,
    },
    "car": {
        "average_speed_kmh": 25.0,
        "capacity_weight_kg": 100.0,
        "capacity_volume_m3": 0.5,
        "priority": 3,
    },
    "van": {
        "average_speed_kmh": 20.0,
        "capacity_weight_kg": 500.0,
        "capacity_volume_m3": 2.0,
        "priority": 4,
    },
    "truck": {
        "average_speed_kmh": 15.0,
        "capacity_weight_kg": 2000.0,
        "capacity_volume_m3": 10.0,
        "priority": 5,
    },
}

# Default ETA when vehicle type is unknown
_DEFAULT_SPEED_KMH = 25.0


@dataclass
class DriverScore:
    """Score result for a driver assignment candidate.

    Attributes:
        driver: The driver User object
        profile: The driver's profile
        total_score: Combined weighted score (higher is better)
        proximity_score: Score based on distance/ETA (0-100)
        vehicle_score: Score based on vehicle type match (0-100)
        workload_score: Score based on current workload (0-100)
        performance_score: Score based on historical performance (0-100)
        eta_minutes: Estimated time of arrival in minutes
        distance_km: Distance to pickup in kilometers
        metadata: Additional information about the scoring
    """

    driver: User
    profile: DriverProfile
    total_score: float
    proximity_score: float
    vehicle_score: float
    workload_score: float
    performance_score: float
    eta_minutes: float
    distance_km: float
    metadata: dict[str, Any] = field(default_factory=dict)

    def __repr__(self) -> str:
        return f"<DriverScore(driver={self.driver.email}, score={self.total_score:.1f}, eta={self.eta_minutes:.0f}min)>"


@dataclass
class BatchAssignmentResult:
    """Result of batch driver assignment.

    Attributes:
        successful: List of (delivery_id, driver_id) tuples for successful assignments
        failed: List of (delivery_id, error_message) tuples for failed assignments
        total_attempted: Total number of deliveries attempted
        total_success: Number of successful assignments
    """

    successful: list[tuple[uuid.UUID, uuid.UUID]] = field(default_factory=list)
    failed: list[tuple[uuid.UUID, str]] = field(default_factory=list)
    total_attempted: int = 0
    total_success: int = 0

    @property
    def success_rate(self) -> float:
        """Calculate success rate as percentage."""
        if self.total_attempted == 0:
            return 0.0
        return (self.total_success / self.total_attempted) * 100


@dataclass
class DriverStatistics:
    """Statistics for a driver's performance and availability.

    Attributes:
        driver_id: User ID of the driver
        total_assignments: Total number of assignments made
        successful_deliveries: Number of successfully completed deliveries
        success_rate: Percentage of successful deliveries
        average_rating: Driver's average customer rating
        current_deliveries: Current number of active deliveries
        max_concurrent: Maximum concurrent deliveries allowed
        utilization_rate: Current utilization percentage
        vehicle_type: Driver's vehicle type
        preferred_zone: Driver's preferred zone
        last_assignment: Timestamp of last assignment
        last_completion: Timestamp of last delivery completion
    """

    driver_id: uuid.UUID
    total_assignments: int = 0
    successful_deliveries: int = 0
    success_rate: float = 0.0
    average_rating: float | None = None
    current_deliveries: int = 0
    max_concurrent: int = 0
    utilization_rate: float = 0.0
    vehicle_type: str | None = None
    preferred_zone: str | None = None
    last_assignment: dt.datetime | None = None
    last_completion: dt.datetime | None = None


class DriverAssignmentService:
    """Service for assigning drivers to deliveries and managing driver status.

    Enhanced with:
    - Capacity tracking for multi-drop deliveries
    - Vehicle type matching and optimization
    - ETA-based driver ranking
    - Intelligent driver scoring with weighted factors
    - Batch assignment support
    - Performance statistics tracking
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def assign_nearest_driver(
        self,
        delivery_id: uuid.UUID,
        pickup_location: tuple[float, float] | None = None,
        weight_kg: float | None = None,
        volume_m3: float | None = None,
        zone: str | None = None,
        vehicle_preference: str | None = None,
    ) -> User | None:
        """Find and assign nearest available driver to a delivery.

        Uses enhanced filtering with vehicle type matching, capacity checks,
        and ETA-based ranking.

        Args:
            delivery_id: Delivery to assign driver to
            pickup_location: (lat, lon) of pickup location for distance calculation
            weight_kg: Delivery weight in kg for capacity matching
            volume_m3: Delivery volume in m³ for capacity matching
            zone: Delivery zone for zone preference matching
            vehicle_preference: Preferred vehicle type (e.g., 'motorcycle', 'car')

        Returns:
            Assigned User (driver) or None if no available drivers

        Raises:
            NotFoundError: If delivery doesn't exist
            ValidationError: If delivery cannot be assigned (driver at capacity)
        """
        # Fetch delivery
        stmt = select(Delivery).where(Delivery.id == delivery_id).with_for_update()
        result = await self.db.execute(stmt)
        delivery = result.scalar_one_or_none()

        if not delivery:
            raise NotFoundError("Delivery", delivery_id)

        if delivery.assigned_driver_id:
            raise BusinessRuleError("Delivery already has a driver assigned")

        # Get available drivers with enhanced filtering
        drivers = await self.get_available_drivers(
            location=pickup_location,
            weight_kg=weight_kg,
            volume_m3=volume_m3,
            zone=zone,
            vehicle_type=vehicle_preference,
            sort_by_eta=True,
        )

        if not drivers:
            return None

        # Assign first (nearest/lowest ETA) driver
        driver = drivers[0]
        delivery.assigned_driver_id = driver.id
        delivery.status = "assigned"  # Update delivery status

        # Update estimated delivery time based on ETA
        if pickup_location:
            eta = await self._estimate_driver_eta(
                driver_id=driver.id,
                pickup_location=pickup_location,
            )
            if eta:
                delivery.estimated_delivery = dt.datetime.now(dt.UTC) + dt.timedelta(minutes=eta)

        # Increment driver's delivery count
        await self.increment_driver_delivery_count(driver.id)

        # Update driver statistics
        await self._track_assignment(driver.id)

        # Mark driver as busy if now at capacity
        driver_profile = await self.get_driver_profile(driver.id)
        if driver_profile and driver_profile.is_at_capacity:
            await self.update_driver_status(driver.id, DriverStatus.BUSY)

        await self.db.commit()
        return driver

    async def assign_best_driver(
        self,
        delivery_id: uuid.UUID,
        pickup_location: tuple[float, float] | None = None,
        weight_kg: float | None = None,
        volume_m3: float | None = None,
        zone: str | None = None,
        vehicle_preference: str | None = None,
        proximity_weight: float = 0.4,
        vehicle_weight: float = 0.25,
        workload_weight: float = 0.2,
        performance_weight: float = 0.15,
    ) -> User | None:
        """Assign the best driver using a weighted scoring algorithm.

        Scoring formula:
        score = w1 * proximity_score + w2 * vehicle_score +
                w3 * workload_score + w4 * performance_score

        Args:
            delivery_id: Delivery to assign driver to
            pickup_location: (lat, lon) of pickup location
            weight_kg: Delivery weight in kg
            volume_m3: Delivery volume in m³
            zone: Delivery zone for zone preference matching
            vehicle_preference: Preferred vehicle type
            proximity_weight: Weight for proximity/ETA score (default 0.4)
            vehicle_weight: Weight for vehicle type matching (default 0.25)
            workload_weight: Weight for workload balance (default 0.2)
            performance_weight: Weight for historical performance (default 0.15)

        Returns:
            Assigned User (driver) or None if no suitable drivers

        Raises:
            NotFoundError: If delivery doesn't exist
            ValidationError: If weights don't sum to approximately 1.0
        """
        # Validate weights
        total_weight = proximity_weight + vehicle_weight + workload_weight + performance_weight
        if not (0.9 <= total_weight <= 1.1):
            raise ValidationError(f"Scoring weights must sum to approximately 1.0, got {total_weight}")

        # Fetch delivery
        stmt = select(Delivery).where(Delivery.id == delivery_id).with_for_update()
        result = await self.db.execute(stmt)
        delivery = result.scalar_one_or_none()

        if not delivery:
            raise NotFoundError("Delivery", delivery_id)

        if delivery.assigned_driver_id:
            raise BusinessRuleError("Delivery already has a driver assigned")

        # Get scored drivers
        scored_drivers = await self.score_drivers(
            pickup_location=pickup_location,
            weight_kg=weight_kg,
            volume_m3=volume_m3,
            zone=zone,
            vehicle_preference=vehicle_preference,
            proximity_weight=proximity_weight,
            vehicle_weight=vehicle_weight,
            workload_weight=workload_weight,
            performance_weight=performance_weight,
        )

        if not scored_drivers:
            return None

        # Assign highest-scoring driver
        best_score = scored_drivers[0]
        delivery.assigned_driver_id = best_score.driver.id
        delivery.status = "assigned"

        # Update estimated delivery time
        if pickup_location:
            delivery.estimated_delivery = dt.datetime.now(dt.UTC) + dt.timedelta(minutes=best_score.eta_minutes)

        # Increment driver's delivery count
        await self.increment_driver_delivery_count(best_score.driver.id)

        # Update driver statistics
        await self._track_assignment(best_score.driver.id)

        # Mark driver as busy if now at capacity
        if best_score.profile.is_at_capacity:
            await self.update_driver_status(best_score.driver.id, DriverStatus.BUSY)

        await self.db.commit()
        return best_score.driver

    async def score_drivers(
        self,
        pickup_location: tuple[float, float] | None = None,
        weight_kg: float | None = None,
        volume_m3: float | None = None,
        zone: str | None = None,
        vehicle_preference: str | None = None,
        proximity_weight: float = 0.4,
        vehicle_weight: float = 0.25,
        workload_weight: float = 0.2,
        performance_weight: float = 0.15,
    ) -> list[DriverScore]:
        """Score available drivers using weighted factors.

        Returns a list of DriverScore objects sorted by total_score descending.

        Args:
            pickup_location: (lat, lon) for proximity/ETA calculation
            weight_kg: Delivery weight for capacity matching
            volume_m3: Delivery volume for capacity matching
            zone: Delivery zone for zone preference matching
            vehicle_preference: Preferred vehicle type
            proximity_weight: Weight for proximity score (0-1)
            vehicle_weight: Weight for vehicle score (0-1)
            workload_weight: Weight for workload score (0-1)
            performance_weight: Weight for performance score (0-1)

        Returns:
            List of DriverScore objects, sorted by total_score descending
        """
        # Get available drivers (without sorting since we'll do it ourselves)
        drivers = await self.get_available_drivers(
            location=None,  # Don't pre-sort by distance
            weight_kg=weight_kg,
            volume_m3=volume_m3,
            zone=zone,
            vehicle_type=vehicle_preference,
            exclude_at_capacity=True,
        )

        if not drivers:
            return []

        scored_drivers = []

        for driver in drivers:
            profile = await self.get_driver_profile(driver.id)
            if not profile:
                continue

            # Calculate individual scores
            proximity_score, eta_minutes, distance_km = await self._calculate_proximity_score(
                driver_id=driver.id,
                pickup_location=pickup_location,
            )

            vehicle_score = self._calculate_vehicle_score(
                driver_profile=profile,
                weight_kg=weight_kg,
                volume_m3=volume_m3,
                preferred_type=vehicle_preference,
            )

            workload_score = self._calculate_workload_score(
                current_deliveries=profile.current_deliveries_count,
                max_deliveries=profile.max_concurrent_deliveries,
            )

            performance_score = self._calculate_performance_score(
                total_deliveries=profile.total_deliveries,
                successful_deliveries=profile.successful_deliveries,
                average_rating=profile.average_rating,
            )

            # Calculate weighted total score
            total_score = (
                proximity_weight * proximity_score
                + vehicle_weight * vehicle_score
                + workload_weight * workload_score
                + performance_weight * performance_score
            )

            scored_drivers.append(
                DriverScore(
                    driver=driver,
                    profile=profile,
                    total_score=total_score,
                    proximity_score=proximity_score,
                    vehicle_score=vehicle_score,
                    workload_score=workload_score,
                    performance_score=performance_score,
                    eta_minutes=eta_minutes,
                    distance_km=distance_km,
                    metadata={
                        "vehicle_type": profile.vehicle_type,
                        "preferred_zone": profile.preferred_zone,
                        "current_deliveries": profile.current_deliveries_count,
                    },
                )
            )

        # Sort by total score descending
        scored_drivers.sort(key=lambda x: x.total_score, reverse=True)
        return scored_drivers

    async def assign_batch(
        self,
        delivery_requests: list[dict[str, Any]],
    ) -> BatchAssignmentResult:
        """Assign drivers to multiple deliveries in batch.

        Args:
            delivery_requests: List of delivery assignment requests, each containing:
                - delivery_id: UUID of the delivery
                - pickup_location: Optional (lat, lon) tuple
                - weight_kg: Optional weight in kg
                - volume_m3: Optional volume in m³
                - zone: Optional zone code
                - vehicle_preference: Optional preferred vehicle type

        Returns:
            BatchAssignmentResult with successful and failed assignments
        """
        result = BatchAssignmentResult()
        result.total_attempted = len(delivery_requests)

        for request in delivery_requests:
            delivery_id = request.get("delivery_id")
            if not delivery_id:
                result.failed.append((delivery_id, "Missing delivery_id in request"))
                continue

            try:
                driver = await self.assign_nearest_driver(
                    delivery_id=delivery_id,
                    pickup_location=request.get("pickup_location"),
                    weight_kg=request.get("weight_kg"),
                    volume_m3=request.get("volume_m3"),
                    zone=request.get("zone"),
                    vehicle_preference=request.get("vehicle_preference"),
                )

                if driver:
                    result.successful.append((delivery_id, driver.id))
                    result.total_success += 1
                else:
                    result.failed.append((delivery_id, "No available drivers"))

            except Exception as e:
                result.failed.append((delivery_id, str(e)))

        return result

    async def get_available_drivers(
        self,
        location: tuple[float, float] | None = None,
        weight_kg: float | None = None,
        volume_m3: float | None = None,
        zone: str | None = None,
        vehicle_type: str | None = None,
        exclude_at_capacity: bool = True,
        sort_by_eta: bool = True,
    ) -> list[User]:
        """Get list of available drivers, optionally sorted by proximity or ETA.

        Filters drivers based on:
        - Active user status with driver role
        - Driver profile status (AVAILABLE)
        - Capacity constraints (current < max concurrent deliveries)
        - Vehicle capacity (weight and volume limits)
        - Vehicle type preference (if specified)
        - Zone preference (prioritized, not a hard filter)

        Args:
            location: Optional (lat, lon) for proximity/ETA sorting
            weight_kg: Filter drivers by vehicle weight capacity
            volume_m3: Filter drivers by vehicle volume capacity
            zone: Prioritize drivers with matching preferred_zone
            vehicle_type: Filter by vehicle type (motorcycle, bicycle, car, van, truck)
            exclude_at_capacity: Exclude drivers at max capacity (default True)
            sort_by_eta: Sort by ETA instead of raw distance (default True)

        Returns:
            List of available User objects with driver role, sorted by ETA/proximity
            and zone preference
        """
        # Get users with driver role who are active
        stmt = select(User).where(
            User.role == "driver",
            User.is_active == True,
        )

        result = await self.db.execute(stmt)
        drivers = list(result.scalars().all())

        # Filter by driver profile status and capacity
        available_drivers = []
        zone_preferred_drivers = []
        other_drivers = []

        for driver in drivers:
            # Get driver profile
            profile_stmt = select(DriverProfile).where(DriverProfile.user_id == driver.id)
            profile_result = await self.db.execute(profile_stmt)
            profile = profile_result.scalar_one_or_none()

            # Skip if no profile
            if not profile:
                continue

            # Check if driver is available
            if profile.status != DriverStatus.AVAILABLE:
                continue

            # Check capacity constraints
            if exclude_at_capacity and profile.is_at_capacity:
                continue

            # Check vehicle capacity constraints
            if not profile.can_accept_delivery(weight_kg=weight_kg, volume_m3=volume_m3):
                continue

            # Check vehicle type filter
            if vehicle_type and profile.vehicle_type != vehicle_type:
                # Check if vehicle type exists in config
                if vehicle_type not in VEHICLE_CONFIGS:
                    # Invalid vehicle type, skip this filter
                    pass
                else:
                    continue

            # Separate by zone preference for sorting
            if zone and profile.preferred_zone == zone:
                zone_preferred_drivers.append((driver, profile))
            else:
                other_drivers.append((driver, profile))

        # Combine zone-preferred drivers first, then others
        combined_drivers = zone_preferred_drivers + other_drivers

        # Extract driver users from tuples
        available_drivers = [d[0] for d in combined_drivers]

        # Sort by ETA/proximity if location provided
        if location and available_drivers:
            if sort_by_eta:
                # Sort by ETA (estimated arrival time)
                driver_eta = []
                for driver in available_drivers:
                    eta = await self._estimate_driver_eta(
                        driver_id=driver.id,
                        pickup_location=location,
                    )
                    distance = await self._distance_to_driver(
                        driver_id=driver.id,
                        location=location,
                        zone=zone,
                        apply_workload_balance=False,
                    )
                    driver_eta.append((driver, eta if eta else 9999.0, distance))

                # Sort by ETA, then by distance as tiebreaker
                driver_eta.sort(key=lambda x: (x[1], x[2]))
                available_drivers = [d[0] for d in driver_eta]
            else:
                # Sort by distance with workload balancing
                driver_distances = []
                for driver in available_drivers:
                    distance = await self._distance_to_driver(
                        driver_id=driver.id,
                        location=location,
                        zone=zone,
                        apply_workload_balance=True,
                    )
                    driver_distances.append((driver, distance))

                # Sort by distance and extract drivers
                driver_distances.sort(key=lambda x: x[1])
                available_drivers = [d[0] for d in driver_distances]

        return available_drivers

    async def update_driver_status(self, driver_id: uuid.UUID, status: DriverStatus) -> None:
        """Update driver availability status.

        Args:
            driver_id: User ID of driver
            status: New driver status

        Raises:
            NotFoundError: If driver profile doesn't exist
        """
        stmt = select(DriverProfile).where(DriverProfile.user_id == driver_id)
        result = await self.db.execute(stmt)
        profile = result.scalar_one_or_none()

        if not profile:
            # Create profile if it doesn't exist, using .value to get the string
            profile = DriverProfile(user_id=driver_id, status=status.value)
            self.db.add(profile)
        else:
            # Use .value to ensure we set the string value, not the enum name
            profile.status = status.value

        await self.db.commit()

    async def increment_driver_delivery_count(self, driver_id: uuid.UUID, amount: int = 1) -> DriverProfile:
        """Increment driver's current delivery count.

        Args:
            driver_id: User ID of driver
            amount: Amount to increment (default 1)

        Returns:
            Updated DriverProfile

        Raises:
            NotFoundError: If driver profile doesn't exist
            ValidationError: If increment would exceed max capacity
        """
        profile = await self.get_driver_profile(driver_id)

        if not profile:
            raise NotFoundError("DriverProfile", f"for user {driver_id}")

        try:
            profile.increment_delivery_count(amount)
        except ValueError as e:
            raise ValidationError(str(e))

        await self.db.commit()
        await self.db.refresh(profile)
        return profile

    async def decrement_driver_delivery_count(self, driver_id: uuid.UUID, amount: int = 1) -> DriverProfile:
        """Decrement driver's current delivery count.

        Should be called when a delivery is completed or cancelled.

        Args:
            driver_id: User ID of driver
            amount: Amount to decrement (default 1)

        Returns:
            Updated DriverProfile

        Raises:
            NotFoundError: If driver profile doesn't exist
            ValidationError: If decrement would go below zero
        """
        profile = await self.get_driver_profile(driver_id)

        if not profile:
            raise NotFoundError("DriverProfile", f"for user {driver_id}")

        try:
            profile.decrement_delivery_count(amount)
        except ValueError as e:
            raise ValidationError(str(e))

        # Update total deliveries counter
        profile.total_deliveries += amount

        # Auto-update status to AVAILABLE if driver was BUSY and now has capacity
        if profile.status == DriverStatus.BUSY and not profile.is_at_capacity and profile.current_deliveries_count == 0:
            profile.status = DriverStatus.AVAILABLE.value

        # Track completion timestamp
        profile.last_completion = dt.datetime.now(dt.UTC)

        await self.db.commit()
        await self.db.refresh(profile)
        return profile

    async def get_driver_profile(self, driver_id: uuid.UUID) -> DriverProfile | None:
        """Get driver profile by user ID.

        Args:
            driver_id: User ID of driver

        Returns:
            DriverProfile or None if not found
        """
        stmt = select(DriverProfile).where(DriverProfile.user_id == driver_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_driver_capacity_info(self, driver_id: uuid.UUID) -> dict[str, Any] | None:
        """Get detailed capacity information for a driver.

        Args:
            driver_id: User ID of driver

        Returns:
            Dict with capacity info or None if profile not found:
            {
                "current_deliveries": int,
                "max_concurrent_deliveries": int,
                "available_capacity": int,
                "is_at_capacity": bool,
                "vehicle_capacity_weight_kg": float | None,
                "vehicle_capacity_volume_m3": float | None,
                "preferred_zone": str | None,
            }
        """
        profile = await self.get_driver_profile(driver_id)

        if not profile:
            return None

        return {
            "current_deliveries": profile.current_deliveries_count,
            "max_concurrent_deliveries": profile.max_concurrent_deliveries,
            "available_capacity": profile.available_capacity,
            "is_at_capacity": profile.is_at_capacity,
            "vehicle_capacity_weight_kg": profile.vehicle_capacity_weight_kg,
            "vehicle_capacity_volume_m3": profile.vehicle_capacity_volume_m3,
            "preferred_zone": profile.preferred_zone,
        }

    async def get_driver_statistics(self, driver_id: uuid.UUID) -> DriverStatistics | None:
        """Get comprehensive statistics for a driver.

        Args:
            driver_id: User ID of driver

        Returns:
            DriverStatistics object or None if profile not found
        """
        profile = await self.get_driver_profile(driver_id)

        if not profile:
            return None

        # Calculate success rate
        if profile.total_deliveries > 0:
            success_rate = (profile.successful_deliveries / profile.total_deliveries) * 100
        else:
            success_rate = 0.0

        # Calculate utilization rate
        if profile.max_concurrent_deliveries > 0:
            utilization_rate = (profile.current_deliveries_count / profile.max_concurrent_deliveries) * 100
        else:
            utilization_rate = 0.0

        return DriverStatistics(
            driver_id=driver_id,
            total_assignments=profile.total_deliveries,
            successful_deliveries=profile.successful_deliveries,
            success_rate=success_rate,
            average_rating=profile.average_rating,
            current_deliveries=profile.current_deliveries_count,
            max_concurrent=profile.max_concurrent_deliveries,
            utilization_rate=utilization_rate,
            vehicle_type=profile.vehicle_type,
            preferred_zone=profile.preferred_zone,
            last_assignment=getattr(profile, "last_assignment", None),
            last_completion=profile.last_completion,
        )

    async def update_driver_location(
        self,
        driver_id: uuid.UUID,
        latitude: float,
        longitude: float,
        delivery_id: uuid.UUID | None = None,
        accuracy_m: float | None = None,
        speed_kmh: float | None = None,
        heading_degrees: float | None = None,
        source: str = "gps",
        client_timestamp=None,
    ) -> DriverProfile | None:
        """Update driver's current GPS location.

        Args:
            driver_id: User ID of driver
            latitude: Current latitude
            longitude: Current longitude

        Returns:
            Updated DriverProfile or None if not found
        """
        profile = await self.get_driver_profile(driver_id)

        if not profile:
            return None

        profile.update_location(latitude, longitude)
        self.db.add(
            DriverLocationPoint(
                driver_id=driver_id,
                delivery_id=delivery_id,
                latitude=latitude,
                longitude=longitude,
                accuracy_m=accuracy_m,
                speed_kmh=speed_kmh,
                heading_degrees=heading_degrees,
                source=source,
                client_timestamp=client_timestamp,
                recorded_at=datetime.now(UTC),
            )
        )

        if delivery_id:
            delivery_result = await self.db.execute(
                select(Delivery).options(selectinload(Delivery.stops)).where(Delivery.id == delivery_id)
            )
            delivery = delivery_result.scalar_one_or_none()
            if delivery:
                stops = sorted(delivery.stops or [], key=lambda stop: stop.stop_sequence)
                next_stop = next((stop for stop in stops if stop.status != "completed"), None)
                if next_stop:
                    delivery.remaining_distance_km = round(
                        calculate_haversine_distance(latitude, longitude, next_stop.latitude, next_stop.longitude),
                        3,
                    )

        await self.db.commit()
        await self.db.refresh(profile)
        return profile

    async def set_driver_home_base(
        self, driver_id: uuid.UUID, latitude: float, longitude: float
    ) -> DriverProfile | None:
        """Set driver's home base location.

        Args:
            driver_id: User ID of driver
            latitude: Home base latitude
            longitude: Home base longitude

        Returns:
            Updated DriverProfile or None if not found
        """
        profile = await self.get_driver_profile(driver_id)

        if not profile:
            return None

        profile.set_home_base(latitude, longitude)
        await self.db.commit()
        await self.db.refresh(profile)
        return profile

    async def _estimate_driver_eta(
        self,
        driver_id: uuid.UUID,
        pickup_location: tuple[float, float],
    ) -> float | None:
        """Estimate time of arrival for a driver to reach pickup location.

        Args:
            driver_id: User ID of driver
            pickup_location: (lat, lon) of pickup location

        Returns:
            ETA in minutes, or None if cannot be calculated
        """
        profile = await self.get_driver_profile(driver_id)
        if not profile:
            return None

        # Calculate distance to driver
        distance_result = calculate_driver_distance_with_fallback(
            pickup_lat=pickup_location[0],
            pickup_lon=pickup_location[1],
            driver_profile=profile,
            delivery_zone=None,
        )

        # Get vehicle speed
        vehicle_config = VEHICLE_CONFIGS.get(profile.vehicle_type or "", {})
        speed_kmh = vehicle_config.get("average_speed_kmh", _DEFAULT_SPEED_KMH)

        # Calculate ETA: distance / speed * 60 (to get minutes)
        # Add buffer for pickup time (5 minutes)
        eta_minutes = (distance_result.distance_km / speed_kmh) * 60 + 5

        return max(0, eta_minutes)

    def _score_from_eta(self, eta_minutes: float, max_eta: float = 60.0) -> float:
        """Calculate proximity score based on ETA.

        Lower ETA = higher score. Score is 0-100.

        Args:
            eta_minutes: Estimated time to arrival in minutes
            max_eta: Maximum ETA for scoring (higher ETAs get score 0)

        Returns:
            Proximity score from 0-100
        """
        if eta_minutes <= 0:
            return 100.0

        # Linear decay: score = 100 * (1 - eta / max_eta)
        score = 100 * (1 - min(eta_minutes / max_eta, 1.0))
        return max(0, score)

    async def _calculate_proximity_score(
        self,
        driver_id: uuid.UUID,
        pickup_location: tuple[float, float] | None,
    ) -> tuple[float, float, float]:
        """Calculate proximity score with ETA and distance.

        Args:
            driver_id: User ID of driver
            pickup_location: (lat, lon) of pickup location

        Returns:
            Tuple of (proximity_score, eta_minutes, distance_km)
        """
        if not pickup_location:
            return 50.0, 30.0, 10.0  # Default values when no location

        profile = await self.get_driver_profile(driver_id)
        if not profile:
            return 0.0, 999.0, 999.0

        # Calculate distance
        distance_result = calculate_driver_distance_with_fallback(
            pickup_lat=pickup_location[0],
            pickup_lon=pickup_location[1],
            driver_profile=profile,
            delivery_zone=None,
        )

        # Estimate ETA
        vehicle_config = VEHICLE_CONFIGS.get(profile.vehicle_type or "", {})
        speed_kmh = vehicle_config.get("average_speed_kmh", _DEFAULT_SPEED_KMH)
        eta_minutes = (distance_result.distance_km / speed_kmh) * 60 + 5

        # Calculate proximity score (0-100, lower is better)
        score = self._score_from_eta(eta_minutes)

        return score, eta_minutes, distance_result.distance_km

    def _calculate_vehicle_score(
        self,
        driver_profile: DriverProfile,
        weight_kg: float | None = None,
        volume_m3: float | None = None,
        preferred_type: str | None = None,
    ) -> float:
        """Calculate vehicle matching score.

        Scores based on:
        - Vehicle type preference match
        - Capacity adequacy (not too small, not wastefully large)

        Args:
            driver_profile: Driver's profile
            weight_kg: Delivery weight in kg
            volume_m3: Delivery volume in m³
            preferred_type: Preferred vehicle type

        Returns:
            Vehicle score from 0-100
        """
        score = 50.0  # Base score

        # Vehicle type preference match
        if preferred_type and driver_profile.vehicle_type == preferred_type:
            score += 30.0  # Significant boost for exact match
        elif driver_profile.vehicle_type:
            # Small boost for having any vehicle type defined
            score += 10.0

        # Capacity adequacy check
        if weight_kg is not None and driver_profile.vehicle_capacity_weight_kg:
            capacity_ratio = weight_kg / driver_profile.vehicle_capacity_weight_kg
            # Optimal is 60-80% capacity utilization
            if 0.6 <= capacity_ratio <= 0.8:
                score += 15.0  # Good fit
            elif 0.4 <= capacity_ratio < 0.6 or 0.8 < capacity_ratio <= 0.9:
                score += 10.0  # Acceptable fit
            elif capacity_ratio > 0.9:
                score += 5.0  # Tight fit
            else:
                score += 0.0  # Underutilized

        if volume_m3 is not None and driver_profile.vehicle_capacity_volume_m3:
            volume_ratio = volume_m3 / driver_profile.vehicle_capacity_volume_m3
            # Same optimal range logic
            if 0.6 <= volume_ratio <= 0.8:
                score += 15.0
            elif 0.4 <= volume_ratio < 0.6 or 0.8 < volume_ratio <= 0.9:
                score += 10.0
            elif volume_ratio > 0.9:
                score += 5.0

        return min(100.0, max(0.0, score))

    def _calculate_workload_score(
        self,
        current_deliveries: int,
        max_deliveries: int,
    ) -> float:
        """Calculate workload balance score.

        Drivers with fewer current deliveries get higher scores.

        Args:
            current_deliveries: Driver's current delivery count
            max_deliveries: Driver's maximum concurrent deliveries

        Returns:
            Workload score from 0-100
        """
        if max_deliveries <= 0:
            return 50.0

        # Calculate utilization (0.0 = empty, 1.0 = full)
        utilization = current_deliveries / max_deliveries

        # Inverse score: lower utilization = higher score
        # 0% utilization = 100 score, 100% utilization = 0 score
        score = 100 * (1 - utilization)

        return max(0.0, min(100.0, score))

    def _calculate_performance_score(
        self,
        total_deliveries: int,
        successful_deliveries: int,
        average_rating: float | None = None,
    ) -> float:
        """Calculate historical performance score.

        Args:
            total_deliveries: Total deliveries assigned to driver
            successful_deliveries: Successfully completed deliveries
            average_rating: Driver's average customer rating (1-5)

        Returns:
            Performance score from 0-100
        """
        score = 0.0

        # Success rate component (up to 60 points)
        if total_deliveries > 0:
            success_rate = successful_deliveries / total_deliveries
            score += success_rate * 60
        else:
            # New driver gets neutral score
            score += 30.0

        # Rating component (up to 40 points)
        if average_rating is not None:
            # Rating of 5 = 40 points, 1 = 0 points
            normalized_rating = (average_rating - 1) / 4  # 0-1 range
            score += normalized_rating * 40
        else:
            # No rating yet, give average points
            score += 20.0

        return max(0.0, min(100.0, score))

    async def _distance_to_driver(
        self,
        driver_id: uuid.UUID,
        location: tuple[float, float],
        zone: str | None = None,
        apply_workload_balance: bool = True,
    ) -> float:
        """Calculate distance from location to driver with smart fallback strategies.

        Uses a hierarchical fallback strategy:
        1. Current GPS location (highest confidence)
        2. Last known location with freshness penalty based on age
        3. Home base location
        4. Zone centroid matching
        5. Default fallback to office location

        Args:
            driver_id: User ID of driver
            location: (lat, lon) to calculate distance from
            zone: Delivery zone for zone-based fallback
            apply_workload_balance: Whether to adjust distance based on driver workload

        Returns:
            Adjusted distance in km (lower is closer/better)
        """
        stmt = select(DriverProfile).where(DriverProfile.user_id == driver_id)
        result = await self.db.execute(stmt)
        profile = result.scalar_one_or_none()

        if not profile:
            return 999999.0  # No profile at all

        # Calculate distance with smart fallback strategies
        distance_result = calculate_driver_distance_with_fallback(
            pickup_lat=location[0],
            pickup_lon=location[1],
            driver_profile=profile,
            delivery_zone=zone,
        )

        # Apply workload balance adjustment if requested
        if apply_workload_balance:
            final_distance = add_workload_balance_adjustment(
                distance_result=distance_result,
                driver_current_deliveries=profile.current_deliveries_count,
                driver_max_deliveries=profile.max_concurrent_deliveries,
                adjustment_factor=0.3,  # 30% weight on workload
            )
            return final_distance

        return distance_result.distance_km

    async def _distance_to_driver_with_metadata(
        self,
        driver_id: uuid.UUID,
        location: tuple[float, float],
        zone: str | None = None,
        apply_workload_balance: bool = True,
    ) -> LocationDistanceResult | None:
        """Calculate distance to driver with full metadata for debugging/analysis.

        Returns the LocationDistanceResult object with source, confidence,
        and freshness information instead of just the distance.

        Args:
            driver_id: User ID of driver
            location: (lat, lon) to calculate distance from
            zone: Delivery zone for zone-based fallback
            apply_workload_balance: Whether to apply workload balance adjustment

        Returns:
            LocationDistanceResult with metadata, or None if profile not found
        """
        stmt = select(DriverProfile).where(DriverProfile.user_id == driver_id)
        result = await self.db.execute(stmt)
        profile = result.scalar_one_or_none()

        if not profile:
            return None

        distance_result = calculate_driver_distance_with_fallback(
            pickup_lat=location[0],
            pickup_lon=location[1],
            driver_profile=profile,
            delivery_zone=zone,
        )

        # Apply workload balance adjustment to the distance
        if apply_workload_balance:
            adjusted_distance = add_workload_balance_adjustment(
                distance_result=distance_result,
                driver_current_deliveries=profile.current_deliveries_count,
                driver_max_deliveries=profile.max_concurrent_deliveries,
                adjustment_factor=0.3,
            )
            # Update the distance_km in the result
            distance_result.distance_km = adjusted_distance

        return distance_result

    async def get_driver_distance_info(
        self,
        driver_id: uuid.UUID,
        pickup_lat: float,
        pickup_lon: float,
        zone: str | None = None,
    ) -> dict[str, Any] | None:
        """Get detailed distance information for a driver with metadata.

        Useful for debugging assignment decisions and displaying
        to users why a particular driver was chosen.

        Args:
            driver_id: User ID of driver
            pickup_lat: Pickup location latitude
            pickup_lon: Pickup location longitude
            zone: Delivery zone code

        Returns:
            Dict with distance information or None if profile not found:
            {
                "driver_id": uuid.UUID,
                "distance_km": float,
                "location_source": str,  # 'current', 'last_known', 'home_base', 'zone', 'fallback'
                "confidence": float,     # 0.0-1.0, higher is more reliable
                "freshness_penalty": float,  # Added km due to stale location data
                "age_minutes": float | None,  # How old the location data is
                "workload_adjusted_distance": float,  # Final distance after workload adjustment
                "current_deliveries": int,
                "max_concurrent_deliveries": int,
                "preferred_zone": str | None,
            }
        """
        result = await self._distance_to_driver_with_metadata(
            driver_id=driver_id,
            location=(pickup_lat, pickup_lon),
            zone=zone,
            apply_workload_balance=False,  # Get base distance first
        )

        if not result:
            return None

        profile = await self.get_driver_profile(driver_id)
        if not profile:
            return None

        # Calculate workload-adjusted distance
        workload_adjusted = add_workload_balance_adjustment(
            distance_result=result,
            driver_current_deliveries=profile.current_deliveries_count,
            driver_max_deliveries=profile.max_concurrent_deliveries,
            adjustment_factor=0.3,
        )

        return {
            "driver_id": driver_id,
            "distance_km": result.distance_km,
            "location_source": result.location_source,
            "confidence": result.confidence,
            "freshness_penalty": result.freshness_penalty,
            "age_minutes": result.age_minutes,
            "workload_adjusted_distance": workload_adjusted,
            "current_deliveries": profile.current_deliveries_count,
            "max_concurrent_deliveries": profile.max_concurrent_deliveries,
            "preferred_zone": profile.preferred_zone,
        }

    async def _track_assignment(self, driver_id: uuid.UUID) -> None:
        """Track driver assignment for statistics.

        Updates internal tracking for driver performance metrics.

        Args:
            driver_id: User ID of driver being assigned
        """
        profile = await self.get_driver_profile(driver_id)
        if profile:
            # Update last assignment timestamp
            # Note: This assumes we add this field to DriverProfile
            # For now, we'll track through total_deliveries on completion
            pass
