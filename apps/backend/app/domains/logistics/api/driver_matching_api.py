"""Driver matching API endpoints for finding and assigning drivers."""

import logging
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db, get_current_active_user
from app.domains.auth.models.user import User
from app.domains.logistics.schemas.delivery_schemas import (
    DeliveryRequirementsRequest,
    EligibleDriverResponse,
    ETAResponse,
    FindDriversRequest,
    FindDriversResponse,
    MultiDropBatchRequest,
    MultiDropBatchResponse,
)
from app.domains.logistics.services.capacity_management_service import CapacityManagementService
from app.domains.logistics.services.driver_matching_service import DriverMatchingService
from app.domains.logistics.services.eta_estimation_service import ETAEstimationService
from app.domains.logistics.utils.matching import DeliveryRequirements

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/logistics/driver-matching", tags=["Driver Matching"])


@router.post("/find-drivers", response_model=FindDriversResponse)
async def find_eligible_drivers(
    request: FindDriversRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> FindDriversResponse:
    """Find eligible drivers for a delivery based on requirements and location.

    Args:
        request: Driver finding request with requirements and location
        db: Database session
        current_user: Authenticated user

    Returns:
        List of eligible drivers sorted by match score
    """
    try:
        # Convert request requirements to domain model
        requirements = DeliveryRequirements(
            weight_kg=request.requirements.weight_kg,
            volume_m3=request.requirements.volume_m3,
            is_urgent=request.requirements.is_urgent,
            is_fragile=request.requirements.is_fragile,
            is_pharma=request.requirements.is_pharma,
            requires_multi_drop=request.requirements.requires_multi_drop,
            logistics_type=request.requirements.logistics_type,
            max_distance_km=request.requirements.max_distance_km,
        )

        # Get pickup location
        pickup_location = None
        if request.pickup_latitude is not None and request.pickup_longitude is not None:
            pickup_location = (request.pickup_latitude, request.pickup_longitude)

        # Find eligible drivers
        matching_service = DriverMatchingService(db)
        eligible_drivers = await matching_service.find_eligible_drivers(
            delivery_requirements=requirements,
            pickup_location=pickup_location,
            zone_code=request.zone_code,
            limit=request.limit,
        )

        # Convert to response models
        driver_responses = [
            EligibleDriverResponse(
                driver_id=d.driver_id,
                driver_profile_id=d.driver_profile_id,
                vehicle_type=d.vehicle_type,
                status=d.status,
                match_score=d.match_score,
                distance_km=d.distance_km,
                capacity_utilization=d.capacity_utilization,
                estimated_pickup_minutes=d.estimated_pickup_minutes,
                vehicle_plate=d.vehicle_plate,
                rating=d.rating,
                preferred_zone=d.preferred_zone,
            )
            for d in eligible_drivers
        ]

        return FindDriversResponse(
            eligible_drivers=driver_responses,
            total_count=len(driver_responses),
            search_criteria={
                "weight_kg": requirements.weight_kg,
                "volume_m3": requirements.volume_m3,
                "is_urgent": requirements.is_urgent,
                "is_fragile": requirements.is_fragile,
                "is_pharma": requirements.is_pharma,
                "pickup_location": pickup_location,
                "zone_code": request.zone_code,
            },
        )
    except Exception as e:
        logger.error(f"Error finding eligible drivers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to find eligible drivers: {str(e)}",
        )


@router.post("/assign-driver/{delivery_id}")
async def assign_driver_to_delivery(
    delivery_id: uuid.UUID,
    driver_id: uuid.UUID,
    multi_drop_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict[str, Any]:
    """Assign a driver to a delivery with capacity management.

    Args:
        delivery_id: Delivery to assign driver to
        driver_id: Driver to assign
        multi_drop_id: Optional multi-drop batch ID
        db: Database session
        current_user: Authenticated user

    Returns:
        Assignment confirmation
    """
    try:
        matching_service = DriverMatchingService(db)
        delivery = await matching_service.assign_driver_with_capacity(
            delivery_id=delivery_id,
            driver_id=driver_id,
            multi_drop_id=multi_drop_id,
        )

        return {
            "success": True,
            "delivery_id": str(delivery_id),
            "driver_id": str(driver_id),
            "status": delivery.status.value,
            "multi_drop_id": str(multi_drop_id) if multi_drop_id else None,
        }
    except Exception as e:
        logger.error(f"Error assigning driver: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign driver: {str(e)}",
        )


@router.get("/driver-capacity/{driver_id}")
async def get_driver_capacity(
    driver_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Get current capacity status for a driver.

    Args:
        driver_id: Driver to check
        db: Database session
        current_user: Authenticated user

    Returns:
        Driver capacity information
    """
    try:
        capacity_service = CapacityManagementService(db)
        capacity = await capacity_service.get_driver_capacity(driver_id)

        return {
            "driver_id": str(capacity.driver_id),
            "current_deliveries": capacity.current_deliveries,
            "max_concurrent_deliveries": capacity.max_concurrent_deliveries,
            "available_slots": capacity.available_slots,
            "utilization_percent": capacity.utilization_percent,
            "is_at_capacity": capacity.is_at_capacity,
            "vehicle_type": capacity.vehicle_type,
            "vehicle_capacity_weight_kg": capacity.vehicle_capacity_weight_kg,
            "vehicle_capacity_volume_m3": capacity.vehicle_capacity_volume_m3,
        }
    except Exception as e:
        logger.error(f"Error getting driver capacity: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND
            if "not found" in str(e).lower()
            else status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/multi-drop-batch", response_model=MultiDropBatchResponse)
async def create_multi_drop_batch(
    request: MultiDropBatchRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> MultiDropBatchResponse:
    """Create a multi-drop batch with multiple deliveries for one driver.

    Args:
        request: Batch creation request
        db: Database session
        current_user: Authenticated user

    Returns:
        Multi-drop batch information
    """
    try:
        capacity_service = CapacityManagementService(db)
        multi_drop_id = await capacity_service.create_multi_drop_batch(
            delivery_ids=request.delivery_ids,
            driver_id=request.driver_id,
            multi_drop_id=request.multi_drop_id,
        )

        return MultiDropBatchResponse(
            multi_drop_id=multi_drop_id,
            deliveries_assigned=len(request.delivery_ids),
            driver_id=request.driver_id,
        )
    except Exception as e:
        logger.error(f"Error creating multi-drop batch: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST
            if "capacity" in str(e).lower()
            else status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/release-capacity/{delivery_id}")
async def release_driver_capacity(
    delivery_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict[str, Any]:
    """Release driver capacity when delivery completes.

    Should be called when delivery status changes to:
    - DELIVERED
    - FAILED_ATTEMPT
    - CANCELLED

    Args:
        delivery_id: Delivery that is completing
        db: Database session
        current_user: Authenticated user

    Returns:
        Capacity release confirmation
    """
    try:
        capacity_service = CapacityManagementService(db)
        await capacity_service.release_capacity(delivery_id)

        return {
            "success": True,
            "delivery_id": str(delivery_id),
            "message": "Capacity released successfully",
        }
    except Exception as e:
        logger.error(f"Error releasing capacity: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND
            if "not found" in str(e).lower()
            else status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.post("/reconcile-capacity/{driver_id}")
async def reconcile_driver_capacity(
    driver_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> dict[str, Any]:
    """Reconcile driver capacity to fix any data inconsistencies.

    This should be called periodically or when capacity mismatches are detected.

    Args:
        driver_id: Driver to reconcile
        db: Database session
        current_user: Authenticated user

    Returns:
        Reconciliation result
    """
    try:
        capacity_service = CapacityManagementService(db)
        await capacity_service.reconcile_capacity(driver_id)

        return {
            "success": True,
            "driver_id": str(driver_id),
            "message": "Capacity reconciled successfully",
        }
    except Exception as e:
        logger.error(f"Error reconciling capacity: {e}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND
            if "not found" in str(e).lower()
            else status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )


@router.get("/vehicle-types")
async def get_vehicle_type_information(
    current_user: User = Depends(get_current_active_user),
) -> dict[str, Any]:
    """Get information about all available vehicle types.

    Returns vehicle configurations for frontend display and validation.

    Args:
        current_user: Authenticated user

    Returns:
        Vehicle type configurations
    """
    from app.domains.logistics.utils.matching import VEHICLE_TYPE_CONFIGS

    return {
        vehicle_type: {
            "display_name": config.display_name,
            "max_weight_kg": config.max_weight_kg,
            "max_volume_m3": config.max_volume_m3,
            "base_speed_kmh": config.base_speed_kmh,
            "max_distance_km": config.max_distance_km,
            "max_concurrent_deliveries": config.max_concurrent_deliveries,
            "supports_multi_drop": config.supports_multi_drop,
            "supports_fragile": config.supports_fragile,
            "supports_pharma": config.supports_pharma,
            "suitable_for_urgent": config.suitable_for_urgent,
        }
        for vehicle_type, config in VEHICLE_TYPE_CONFIGS.items()
    }


@router.get("/traffic-coefficient")
async def get_traffic_info(
    zone_code: str | None = Query(None, description="Zone code for zone-specific traffic"),
    current_user: User = Depends(get_current_active_user),
) -> dict[str, Any]:
    """Get current traffic coefficient for ETA calculations.

    Args:
        zone_code: Optional zone for zone-specific traffic
        current_user: Authenticated user

    Returns:
        Current traffic information
    """
    from datetime import datetime, UTC

    from app.domains.logistics.utils.matching import get_traffic_coefficient_for_time

    current_time = datetime.now(UTC)
    traffic_coeff = get_traffic_coefficient_for_time(current_time)

    # Add zone modifier if zone provided
    if zone_code:
        from app.domains.logistics.utils.matching import get_zone_center

        zone_modifiers = {
            "CBD": 1.3,
            "INDUSTRIAL": 1.2,
            "WEST": 1.1,
            "EAST": 1.1,
            "NORTH": 1.0,
            "SOUTH": 1.0,
        }
        zone_modifier = zone_modifiers.get(zone_code.upper(), 1.0)
        traffic_coeff *= zone_modifier

    return {
        "current_time": current_time.isoformat(),
        "traffic_coefficient": traffic_coeff,
        "zone_code": zone_code,
    }
