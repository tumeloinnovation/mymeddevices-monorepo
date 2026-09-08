"""Capacity management service for driver capacity and multi-drop coordination."""

import dataclasses as dc
import logging
import uuid
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError, ValidationError
from app.domains.logistics.models.delivery import Delivery, DeliveryStatus
from app.domains.logistics.models.driver_profile import DriverProfile, DriverStatus

logger = logging.getLogger(__name__)


@dc.dataclass
class DriverCapacity:
    """Driver capacity status information."""

    driver_id: uuid.UUID
    """User ID of the driver."""

    current_deliveries: int
    """Current number of active deliveries."""

    max_concurrent_deliveries: int
    """Maximum concurrent deliveries allowed."""

    available_slots: int
    """Number of additional deliveries driver can accept."""

    utilization_percent: float
    """Capacity utilization percentage (0-100)."""

    is_at_capacity: bool
    """Whether driver is at maximum capacity."""

    vehicle_capacity_weight_kg: float | None = None
    """Maximum vehicle weight capacity in kg."""

    vehicle_capacity_volume_m3: float | None = None
    """Maximum vehicle volume capacity in m³."""

    vehicle_type: str | None = None
    """Driver's vehicle type."""


class CapacityManagementService:
    """Manage driver capacity and multi-drop delivery coordination.

    This service handles:
    - Tracking driver capacity utilization
    - Releasing capacity on delivery completion
    - Multi-drop batch creation and assignment
    - Capacity reconciliation for data consistency
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_driver_capacity(self, driver_id: uuid.UUID) -> DriverCapacity:
        """Get current capacity status for a driver.

        Args:
            driver_id: User ID of the driver

        Returns:
            DriverCapacity with current status

        Raises:
            NotFoundError: If driver profile not found
        """
        # Get driver profile
        stmt = select(DriverProfile).where(DriverProfile.user_id == driver_id)
        result = await self.db.execute(stmt)
        driver_profile = result.scalar_one_or_none()

        if not driver_profile:
            # Lazy-provision a profile so drivers can start using capacity
            # tracking immediately, even if provisioning was skipped at creation.
            logger.info(f"Creating missing driver profile for driver {driver_id}")
            # Use .value to get the string value ("offline") instead of the enum name
            driver_profile = DriverProfile(user_id=driver_id, status=DriverStatus.OFFLINE.value)
            self.db.add(driver_profile)
            await self.db.commit()

        # Count active deliveries
        active_statuses = [
            DeliveryStatus.ASSIGNED,
            DeliveryStatus.ROUTED,
            DeliveryStatus.AT_VENDOR,
            DeliveryStatus.IN_TRANSIT,
        ]

        delivery_stmt = select(func.count(Delivery.id)).where(
            Delivery.assigned_driver_id == driver_id,
            Delivery.status.in_(active_statuses),
        )
        delivery_result = await self.db.execute(delivery_stmt)
        actual_count = delivery_result.scalar() or 0

        # Verify count matches profile (reconcile if mismatch)
        if actual_count != driver_profile.current_deliveries_count:
            logger.warning(
                f"Capacity mismatch for driver {driver_id}: "
                f"profile={driver_profile.current_deliveries_count}, actual={actual_count}"
            )
            # Reconcile
            driver_profile.current_deliveries_count = actual_count
            await self.db.commit()

        available_slots = max(0, driver_profile.max_concurrent_deliveries - driver_profile.current_deliveries_count)
        utilization = (
            (driver_profile.current_deliveries_count / driver_profile.max_concurrent_deliveries) * 100
            if driver_profile.max_concurrent_deliveries > 0
            else 0
        )

        return DriverCapacity(
            driver_id=driver_id,
            current_deliveries=driver_profile.current_deliveries_count,
            max_concurrent_deliveries=driver_profile.max_concurrent_deliveries,
            available_slots=available_slots,
            utilization_percent=utilization,
            is_at_capacity=driver_profile.is_at_capacity,
            vehicle_capacity_weight_kg=driver_profile.vehicle_capacity_weight_kg,
            vehicle_capacity_volume_m3=driver_profile.vehicle_capacity_volume_m3,
            vehicle_type=driver_profile.vehicle_type,
        )

    async def release_capacity(self, delivery_id: uuid.UUID) -> None:
        """Release driver capacity when delivery completes.

        Should be called when delivery status changes to:
        - DELIVERED
        - FAILED_ATTEMPT
        - CANCELLED

        Args:
            delivery_id: Delivery that is completing

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
            logger.info(f"Delivery {delivery_id} has no driver, skipping capacity release")
            return

        # Get driver profile
        profile_stmt = select(DriverProfile).where(DriverProfile.user_id == delivery.assigned_driver_id)
        profile_result = await self.db.execute(profile_stmt)
        driver_profile = profile_result.scalar_one_or_none()

        if not driver_profile:
            logger.warning(f"No driver profile for driver {delivery.assigned_driver_id}")
            return

        # Decrement capacity (with safety check)
        if driver_profile.current_deliveries_count > 0:
            driver_profile.current_deliveries_count -= 1
        else:
            logger.warning(f"Driver {delivery.assigned_driver_id} has count 0, cannot decrement")

        # Update status if was busy and now has capacity
        if (
            driver_profile.status == DriverStatus.BUSY
            and driver_profile.current_deliveries_count < driver_profile.max_concurrent_deliveries
        ):
            driver_profile.status = DriverStatus.AVAILABLE.value
            logger.info(f"Driver {delivery.assigned_driver_id} now AVAILABLE")

        await self.db.commit()

    async def create_multi_drop_batch(
        self,
        delivery_ids: list[uuid.UUID],
        driver_id: uuid.UUID,
        multi_drop_id: uuid.UUID | None = None,
    ) -> uuid.UUID:
        """Group deliveries for multi-drop route optimization.

        Args:
            delivery_ids: List of delivery IDs to batch
            driver_id: Driver to assign all deliveries to
            multi_drop_id: Optional existing multi_drop_id to join

        Returns:
            multi_drop_id UUID

        Raises:
            ValidationError: If deliveries cannot be batched
            NotFoundError: If driver not found
        """
        # Get driver profile
        profile_stmt = select(DriverProfile).where(DriverProfile.user_id == driver_id)
        profile_result = await self.db.execute(profile_stmt)
        driver_profile = profile_result.scalar_one_or_none()

        if not driver_profile:
            raise NotFoundError("DriverProfile", f"for driver {driver_id}")

        # Check driver has capacity
        if driver_profile.is_at_capacity:
            raise ValidationError(
                f"Driver {driver_id} is at capacity ({driver_profile.current_deliveries_count}/"
                f"{driver_profile.max_concurrent_deliveries})"
            )

        # Validate all deliveries exist and are unassigned
        deliveries_stmt = select(Delivery).where(Delivery.id.in_(delivery_ids))
        deliveries_result = await self.db.execute(deliveries_stmt)
        deliveries = list(deliveries_result.scalars().all())

        if len(deliveries) != len(delivery_ids):
            found_ids = {d.id for d in deliveries}
            missing = set(delivery_ids) - found_ids
            raise NotFoundError(f"Deliveries not found: {missing}")

        # Check all are unassigned
        for delivery in deliveries:
            if delivery.assigned_driver_id:
                raise ValidationError(
                    f"Delivery {delivery.id} already assigned to driver {delivery.assigned_driver_id}"
                )

        # Generate or use existing multi_drop_id
        if multi_drop_id is None:
            multi_drop_id = uuid.uuid4()

        # Assign driver to all deliveries with sequence
        # For now, assign the same multi_drop_id but sequence would be
        # calculated by routing service
        for idx, delivery in enumerate(deliveries):
            delivery.assigned_driver_id = driver_id
            delivery.status = DeliveryStatus.ASSIGNED
            # Store multi_drop_id in a JSON field or extended attribute
            # This would need a schema update to add multi_drop_id column
            # For now, we'll use route_coordinates to store metadata
            if delivery.route_coordinates is None:
                delivery.route_coordinates = []
            # Store metadata in route_coordinates
            delivery.route_coordinates = [[float(multi_drop_id.fields[0]), float(multi_drop_id.fields[1]), idx + 1]]

        # Increment driver capacity once for the batch
        driver_profile.increment_delivery_count(1)

        # Update status if now at capacity
        if driver_profile.is_at_capacity:
            driver_profile.status = DriverStatus.BUSY.value

        await self.db.commit()

        return multi_drop_id

    async def reconcile_capacity(self, driver_id: uuid.UUID) -> None:
        """Fix capacity count mismatches from failed transactions.

        This should be called periodically (e.g., via cron) or when
        capacity inconsistencies are detected.

        Args:
            driver_id: Driver to reconcile

        Raises:
            NotFoundError: If driver profile not found
        """
        # Get driver profile
        stmt = select(DriverProfile).where(DriverProfile.user_id == driver_id)
        result = await self.db.execute(stmt)
        driver_profile = result.scalar_one_or_none()

        if not driver_profile:
            raise NotFoundError("DriverProfile", f"for driver {driver_id}")

        # Count actual active deliveries
        active_statuses = [
            DeliveryStatus.ASSIGNED,
            DeliveryStatus.ROUTED,
            DeliveryStatus.AT_VENDOR,
            DeliveryStatus.IN_TRANSIT,
        ]

        delivery_stmt = select(func.count(Delivery.id)).where(
            Delivery.assigned_driver_id == driver_id,
            Delivery.status.in_(active_statuses),
        )
        delivery_result = await self.db.execute(delivery_stmt)
        actual_count = delivery_result.scalar() or 0

        # Check for discrepancy
        if actual_count != driver_profile.current_deliveries_count:
            discrepancy = actual_count - driver_profile.current_deliveries_count
            logger.info(
                f"Reconciling capacity for driver {driver_id}: "
                f"{driver_profile.current_deliveries_count} -> {actual_count} ({discrepancy:+d})"
            )

            # Update to actual count
            old_count = driver_profile.current_deliveries_count
            driver_profile.current_deliveries_count = actual_count

            # Update status appropriately
            if actual_count == 0:
                driver_profile.status = DriverStatus.AVAILABLE.value
            elif actual_count >= driver_profile.max_concurrent_deliveries:
                driver_profile.status = DriverStatus.BUSY.value

            await self.db.commit()

            logger.info(f"Capacity reconciled for driver {driver_id}: {old_count} -> {actual_count}")
        else:
            logger.info(f"Capacity already correct for driver {driver_id}")

    async def batch_reconcile_all_drivers(self) -> dict[str, Any]:
        """Reconcile capacity for all drivers.

        Returns summary of discrepancies found and fixed.

        Returns:
            Dict with reconciliation results
        """
        # Get all driver profiles
        stmt = select(DriverProfile)
        result = await self.db.execute(stmt)
        driver_profiles = result.scalars().all()

        discrepancies_found = 0
        total_fixed = 0

        for profile in driver_profiles:
            old_count = profile.current_deliveries_count

            # Count actual
            active_statuses = [
                DeliveryStatus.ASSIGNED,
                DeliveryStatus.ROUTED,
                DeliveryStatus.AT_VENDOR,
                DeliveryStatus.IN_TRANSIT,
            ]

            delivery_stmt = select(func.count(Delivery.id)).where(
                Delivery.assigned_driver_id == profile.user_id,
                Delivery.status.in_(active_statuses),
            )
            delivery_result = await self.db.execute(delivery_stmt)
            actual_count = delivery_result.scalar() or 0

            if actual_count != old_count:
                discrepancies_found += 1
                profile.current_deliveries_count = actual_count
                total_fixed += 1

                # Update status
                if actual_count == 0:
                    profile.status = DriverStatus.AVAILABLE.value
                elif actual_count >= profile.max_concurrent_deliveries:
                    profile.status = DriverStatus.BUSY.value

        await self.db.commit()

        return {
            "drivers_checked": len(driver_profiles),
            "discrepancies_found": discrepancies_found,
            "total_fixed": total_fixed,
        }

    async def check_batch_capacity(self, driver_id: uuid.UUID, num_deliveries: int) -> bool:
        """Check if driver has capacity for a batch of deliveries.

        Args:
            driver_id: Driver to check
            num_deliveries: Number of deliveries in batch

        Returns:
            True if driver can accept the batch

        Raises:
            NotFoundError: If driver profile not found
        """
        capacity = await self.get_driver_capacity(driver_id)
        return capacity.available_slots >= num_deliveries

    async def reserve_capacity(self, driver_id: uuid.UUID, amount: int = 1) -> DriverCapacity:
        """Reserve capacity slots without assigning specific deliveries.

        Useful for pre-allocating capacity before final assignment.

        Args:
            driver_id: Driver to reserve capacity for
            amount: Number of slots to reserve

        Returns:
            Updated DriverCapacity

        Raises:
            NotFoundError: If driver not found
            ValidationError: If insufficient capacity
        """
        # Get driver profile
        stmt = select(DriverProfile).where(DriverProfile.user_id == driver_id)
        result = await self.db.execute(stmt)
        driver_profile = result.scalar_one_or_none()

        if not driver_profile:
            raise NotFoundError("DriverProfile", f"for driver {driver_id}")

        # Check capacity
        if driver_profile.current_deliveries_count + amount > driver_profile.max_concurrent_deliveries:
            raise ValidationError(
                f"Insufficient capacity: driver has {driver_profile.available_slots} slots, needs {amount}"
            )

        # Reserve
        driver_profile.current_deliveries_count += amount

        # Update status if at capacity
        if driver_profile.is_at_capacity:
            driver_profile.status = DriverStatus.BUSY.value

        await self.db.commit()

        return await self.get_driver_capacity(driver_id)

    async def get_available_drivers_for_batch(
        self, batch_size: int, vehicle_type: str | None = None, zone: str | None = None
    ) -> list[uuid.UUID]:
        """Find drivers with capacity for a batch of deliveries.

        Args:
            batch_size: Number of deliveries in batch
            vehicle_type: Optional vehicle type filter
            zone: Optional zone filter

        Returns:
            List of driver user IDs with sufficient capacity
        """
        # Build query for available drivers
        stmt = select(DriverProfile).where(
            DriverProfile.status == DriverStatus.AVAILABLE,
            DriverProfile.verified_vehicle == True,
            DriverProfile.max_concurrent_deliveries - DriverProfile.current_deliveries_count >= batch_size,
        )

        if vehicle_type:
            stmt = stmt.where(DriverProfile.vehicle_type == vehicle_type)

        if zone:
            stmt = stmt.where(DriverProfile.preferred_zone == zone)

        result = await self.db.execute(stmt)
        profiles = result.scalars().all()

        return [p.user_id for p in profiles]
