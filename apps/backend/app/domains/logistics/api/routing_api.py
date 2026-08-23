"""Routing API endpoints for delivery route calculation."""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.domains.auth.models.user import User
from app.domains.logistics.dependencies import DeliveryServiceDep, RoutingServiceDep
from app.domains.logistics.schemas.routing_schemas import DeliveryRouteResult, RouteCalculationRequest

router = APIRouter(prefix="/logistics/routing", tags=["Routing"])


@router.post("/calculate", response_model=DeliveryRouteResult)
async def calculate_delivery_route(
    request: RouteCalculationRequest,
    service: RoutingServiceDep,
    current_user: User = Depends(get_current_user),
) -> DeliveryRouteResult:
    """Calculate route and shipping details for cart/checkout.

    Determines logistics type (company_rider vs courier), constructs multi-stop
    route, and calculates total distance and fees.
    """
    vendor_ids = [uuid.UUID(v) for v in request.vendor_ids] if request.vendor_ids else []
    logistics_settings = request.logistics_settings or {}

    return await service.calculate_delivery_route(
        customer_coords=request.customer_coords,
        vendor_ids=vendor_ids,
        logistics_settings=logistics_settings,
    )


@router.get("/optimize/{delivery_id}")
async def optimize_route(
    delivery_id: str,
    routing_service: RoutingServiceDep,
    delivery_service: DeliveryServiceDep,
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Optimize the route for an existing delivery and persist the result.

    Re-orders the delivery's route coordinates using a nearest-neighbor TSP
    heuristic, estimates total duration, and saves both back to the Delivery.
    """
    delivery = await delivery_service.get_delivery(uuid.UUID(delivery_id))
    if not delivery:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")

    if current_user.role == "driver" and delivery.assigned_driver_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not assigned to this delivery")

    waypoints = delivery.route_coordinates or []
    if not waypoints:
        # Fall back to stop coordinates if the delivery has no route yet
        waypoints = (
            [[s.latitude, s.longitude] for s in sorted(delivery.stops, key=lambda s: s.stop_sequence)]
            if delivery.stops
            else []
        )

    if not waypoints:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Delivery has no route coordinates")

    optimized = await routing_service.optimize_route([(p[0], p[1]) for p in waypoints])
    optimized_coords = [[float(lat), float(lon)] for lat, lon in optimized]

    # Estimate duration with the driver's vehicle type when known
    vehicle_type = "motorcycle"
    assigned_user = delivery.driver
    if assigned_user is not None and assigned_user.driver_profile and assigned_user.driver_profile.vehicle_type:
        vehicle_type = assigned_user.driver_profile.vehicle_type

    estimate = await routing_service.estimate_route_duration(
        route=optimized_coords,
        vehicle_type=vehicle_type,
    )

    delivery.route_coordinates = optimized_coords
    delivery.estimated_duration_minutes = estimate.estimated_duration_minutes
    delivery.calculated_distance_km = estimate.distance_km
    await delivery_service.db.commit()

    return {
        "delivery_id": str(delivery.id),
        "optimized_route": optimized_coords,
        "estimated_duration_minutes": estimate.estimated_duration_minutes,
        "distance_km": estimate.distance_km,
        "eta_breakdown": estimate,
    }
