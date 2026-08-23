"""Driver API endpoints for driver management."""

import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.domains.auth.models.user import User
from app.domains.logistics.dependencies import DriverAssignmentServiceDep
from app.domains.logistics.models.driver_profile import DriverStatus
from app.domains.logistics.schemas.driver_schemas import DriverProfileResponse, DriverStatusUpdate

router = APIRouter(prefix="/drivers", tags=["Drivers"])


class DriverProfileUpdate(BaseModel):
    """Schema for a driver updating their own profile/vehicle info."""

    vehicle_type: str | None = Field(None, description="motorcycle, bicycle, car, van, truck")
    vehicle_plate: str | None = None
    vehicle_color: str | None = None
    max_concurrent_deliveries: int | None = Field(None, ge=1, le=10)
    vehicle_capacity_weight_kg: float | None = Field(None, ge=0)
    vehicle_capacity_volume_m3: float | None = Field(None, ge=0)
    preferred_zone: str | None = None
    home_base_latitude: float | None = Field(None, ge=-90, le=90)
    home_base_longitude: float | None = Field(None, ge=-180, le=180)


def _require_driver_or_staff(driver_id: str, current_user: User) -> None:
    """Allow a driver to manage their own profile, and staff to manage any."""
    if current_user.role in ("admin", "worker"):
        return
    if current_user.role == "driver" and current_user.id == uuid.UUID(driver_id):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Access denied: not your driver profile",
    )


@router.get("/{driver_id}", response_model=DriverProfileResponse)
async def get_driver_profile(
    driver_id: str,
    service: DriverAssignmentServiceDep,
    current_user: User = Depends(get_current_user),
) -> DriverProfileResponse:
    """Get a driver's profile (self-service or staff)."""
    _require_driver_or_staff(driver_id, current_user)
    profile = await service.get_driver_profile(uuid.UUID(driver_id))
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found",
        )
    return DriverProfileResponse.model_validate(profile)


@router.patch("/{driver_id}/status")
async def update_driver_status(
    driver_id: str,
    body: DriverStatusUpdate,
    service: DriverAssignmentServiceDep,
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    """Update driver availability status.

    Drivers may toggle their own status (available/offline/on_break); staff may
    set any driver's status.
    """
    _require_driver_or_staff(driver_id, current_user)
    await service.update_driver_status(uuid.UUID(driver_id), body.status)
    return {"message": "Driver status updated", "new_status": body.status.value}


@router.patch("/{driver_id}", response_model=DriverProfileResponse)
async def update_driver_profile(
    driver_id: str,
    body: DriverProfileUpdate,
    service: DriverAssignmentServiceDep,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DriverProfileResponse:
    """Update driver profile / vehicle information (self-service or staff)."""
    _require_driver_or_staff(driver_id, current_user)
    profile = await service.get_driver_profile(uuid.UUID(driver_id))
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found",
        )

    updates: dict[str, Any] = {}
    if body.vehicle_type is not None:
        updates["vehicle_type"] = body.vehicle_type
    if body.vehicle_plate is not None:
        updates["vehicle_plate"] = body.vehicle_plate
    if body.vehicle_color is not None:
        updates["vehicle_color"] = body.vehicle_color
    if body.max_concurrent_deliveries is not None:
        updates["max_concurrent_deliveries"] = body.max_concurrent_deliveries
    if body.vehicle_capacity_weight_kg is not None:
        updates["vehicle_capacity_weight_kg"] = body.vehicle_capacity_weight_kg
    if body.vehicle_capacity_volume_m3 is not None:
        updates["vehicle_capacity_volume_m3"] = body.vehicle_capacity_volume_m3
    if body.preferred_zone is not None:
        updates["preferred_zone"] = body.preferred_zone
    if body.home_base_latitude is not None and body.home_base_longitude is not None:
        updates["home_base_latitude"] = body.home_base_latitude
        updates["home_base_longitude"] = body.home_base_longitude

    for key, value in updates.items():
        setattr(profile, key, value)

    await db.commit()
    await db.refresh(profile)

    return DriverProfileResponse.model_validate(profile)
