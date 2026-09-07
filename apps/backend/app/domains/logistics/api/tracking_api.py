"""Tracking API endpoints for real-time delivery tracking."""

import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.core.dependencies import get_current_user
from app.domains.auth.models.user import User
from app.domains.logistics.dependencies import DeliveryServiceDep, DriverAssignmentServiceDep
from app.domains.logistics.models.delivery import Delivery, DeliveryStatus
from app.domains.logistics.schemas.tracking_schemas import DeliveryProgress, LocationUpdate, TrackingStop
from app.domains.logistics.utils.geometry import calculate_haversine_distance

router = APIRouter(prefix="/tracking", tags=["Tracking"])

# Distance under which a driver is considered "nearby" a stop (meters)
NEARBY_RADIUS_M = 200.0


@router.get("/delivery/{delivery_id}", response_model=DeliveryProgress)
async def get_delivery_tracking(
    delivery_id: str,
    service: DeliveryServiceDep,
    current_user: User = Depends(get_current_user),
) -> DeliveryProgress:
    """Get real-time tracking for a delivery.

    Accessible to the assigned driver, admin/worker, or the customer who owns
    the associated order.
    """
    delivery = await service.get_delivery(uuid.UUID(delivery_id))
    if not delivery:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")

    if current_user.role not in ("admin", "worker", "driver"):
        # Customers can track deliveries on their own orders
        order_owner = delivery.order.user_id if delivery.order else None
        if order_owner != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this delivery")
    elif current_user.role == "driver" and delivery.assigned_driver_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not assigned to this delivery")

    stops = sorted((delivery.stops or []), key=lambda s: s.stop_sequence)
    current_stop_index = 0
    for i, stop in enumerate(stops):
        if stop.status != "completed":
            current_stop_index = i
            break
    else:
        current_stop_index = max(0, len(stops) - 1)

    driver_location = None
    driver_name = None
    vehicle_plate = None
    assigned_user = delivery.driver
    if assigned_user is not None:
        driver_location = (
            (assigned_user.driver_profile.current_latitude, assigned_user.driver_profile.current_longitude)
            if assigned_user.driver_profile
            and assigned_user.driver_profile.current_latitude is not None
            and assigned_user.driver_profile.current_longitude is not None
            else None
        )
        driver_name = f"{assigned_user.first_name or ''} {assigned_user.last_name or ''}".strip() or None
        vehicle_plate = assigned_user.driver_profile.vehicle_plate if assigned_user.driver_profile else None

    return DeliveryProgress(
        delivery_id=str(delivery.id),
        status=delivery.status.value,
        current_stop_index=current_stop_index,
        total_stops=len(stops),
        driver_location=driver_location,
        driver_name=driver_name,
        vehicle_plate=vehicle_plate,
        eta_minutes=delivery.estimated_duration_minutes,
        distance_km=delivery.calculated_distance_km,
        estimated_delivery=delivery.estimated_delivery,
        stops=[
            TrackingStop(
                stop_sequence=s.stop_sequence,
                stop_type=s.stop_type,
                latitude=s.latitude,
                longitude=s.longitude,
                address=s.address,
                vendor_name=s.vendor_name,
                status=s.status,
            )
            for s in stops
        ],
    )


@router.post("/driver/{driver_id}/location")
async def update_driver_location(
    driver_id: str,
    location: LocationUpdate,
    assignment_service: DriverAssignmentServiceDep,
    delivery_service: DeliveryServiceDep,
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    """Update driver location and auto-flag nearby stops on active deliveries.

    Drivers may only push their own location; staff may push any driver's.
    """
    driver_uuid = uuid.UUID(driver_id)
    if current_user.role not in ("admin", "worker"):
        if current_user.id != driver_uuid:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this driver")

    profile = await assignment_service.update_driver_location(
        driver_id=driver_uuid,
        latitude=location.latitude,
        longitude=location.longitude,
    )
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver profile not found")

    # Auto-flag `nearby` when the driver approaches a pending stop on an active delivery
    stmt = select(Delivery).where(
        Delivery.assigned_driver_id == driver_uuid,
        Delivery.status.in_([DeliveryStatus.IN_TRANSIT, DeliveryStatus.ROUTED]),
    )
    result = await assignment_service.db.execute(stmt)
    active_deliveries = result.scalars().all()

    for delivery in active_deliveries:
        pending_stops = sorted(
            (s for s in (delivery.stops or []) if s.status != "completed"),
            key=lambda s: s.stop_sequence,
        )
        if pending_stops:
            next_stop = pending_stops[0]
            distance_m = (
                calculate_haversine_distance(
                    location.latitude, location.longitude, next_stop.latitude, next_stop.longitude
                )
                * 1000.0
            )
            if distance_m <= NEARBY_RADIUS_M:
                if delivery.status == DeliveryStatus.IN_TRANSIT:
                    delivery.status = DeliveryStatus.NEARBY
                next_stop.arrived_at = datetime.now(UTC)

    await assignment_service.db.commit()

    return {"message": "Location updated", "latitude": location.latitude, "longitude": location.longitude}
