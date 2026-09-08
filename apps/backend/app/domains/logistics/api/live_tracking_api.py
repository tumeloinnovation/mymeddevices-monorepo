"""Live tracking HTTP and WebSocket APIs."""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.security import verify_access_token
from app.domains.auth.models.user import User
from app.domains.logistics.dependencies import TrackingServiceDep
from app.domains.logistics.schemas.tracking_schemas import DriverLocationBatch
from app.domains.logistics.services.delivery_service import DeliveryService
from app.domains.logistics.services.driver_assignment_service import DriverAssignmentService
from app.domains.logistics.services.tracking_events import publish_tracking_event, subscribe_tracking_events
from app.domains.logistics.services.tracking_service import TrackingService

router = APIRouter(tags=["Live tracking"])


@router.post("/logistics/drivers/{driver_id}/location/batch")
async def record_driver_location_batch(
    driver_id: str,
    payload: DriverLocationBatch,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, Any]:
    """Persist a batch of driver location samples and update live route metrics."""
    driver_uuid = uuid.UUID(driver_id)
    if current_user.id != driver_uuid and current_user.role not in ("admin", "worker"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this driver")

    assignment_service = DriverAssignmentService(db=db)
    profile = await assignment_service.get_driver_profile(driver_uuid)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver profile not found")

    delivery_uuid = uuid.UUID(payload.delivery_id) if payload.delivery_id else None
    for point in reversed(payload.points):
        await assignment_service.update_driver_location(
            driver_id=driver_uuid,
            latitude=point.latitude,
            longitude=point.longitude,
            delivery_id=delivery_uuid,
            accuracy_m=point.accuracy_m,
            speed_kmh=point.speed_kmh,
            heading_degrees=point.heading_degrees,
            source=point.source,
            client_timestamp=point.client_timestamp,
        )

    if delivery_uuid:
        snapshot = await TrackingService(db).get_tracking(delivery_uuid)
        if snapshot:
            await publish_tracking_event(str(delivery_uuid), "location", {"tracking": snapshot})
    return {"status": "accepted", "accepted_points": len(payload.points)}


@router.get("/logistics/deliveries/{delivery_id}/tracking")
async def get_delivery_tracking_snapshot(
    delivery_id: str,
    service: TrackingServiceDep,
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    delivery = await DeliveryService(service.db).get_delivery(uuid.UUID(delivery_id))
    if not delivery:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")
    order_owner = delivery.order.user_id if delivery.order else None
    authorized = (
        current_user.role in ("admin", "worker")
        or (current_user.role == "driver" and delivery.assigned_driver_id == current_user.id)
        or order_owner == current_user.id
    )
    if not authorized:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view this tracking")
    snapshot = await service.get_tracking(uuid.UUID(delivery_id))
    if not snapshot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tracking not found")
    return snapshot


@router.websocket("/ws/logistics/deliveries/{delivery_id}/tracking")
async def tracking_websocket(
    websocket: WebSocket,
    delivery_id: str,
    token: str | None = Query(default=None),
):
    """Stream canonical snapshots; accepts JWT or delivery-scoped guest token."""
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    try:
        snapshot = None
        payload = verify_access_token(token)
        async for db in get_db():
            if payload:
                result = await db.execute(select(User).where(User.id == uuid.UUID(str(payload["sub"]))))
                current_user = result.scalar_one_or_none()
                if not current_user or not current_user.is_active:
                    raise PermissionError("Invalid WebSocket identity")
                delivery = await DeliveryService(db).get_delivery(uuid.UUID(delivery_id))
                owner_id = delivery.order.user_id if delivery and delivery.order else None
                allowed = delivery and (
                    current_user.role in ("admin", "worker")
                    or (current_user.role == "driver" and delivery.assigned_driver_id == current_user.id)
                    or owner_id == current_user.id
                )
                if not allowed:
                    raise PermissionError("Tracking access denied")
                snapshot = await TrackingService(db).get_tracking(uuid.UUID(delivery_id))
            else:
                snapshot = await TrackingService(db).get_tracking_by_token(token)
        await websocket.send_json(snapshot)
        async for event in subscribe_tracking_events(delivery_id):
            await websocket.send_text(event)
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
