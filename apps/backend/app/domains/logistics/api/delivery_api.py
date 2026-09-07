"""Delivery API endpoints for delivery management."""

import asyncio
import os
import shutil
import uuid
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status

from app.core.config import settings
from app.core.dependencies import get_current_user, require_role
from app.domains.auth.models.user import User
from app.domains.logistics.dependencies import DeliveryServiceDep
from app.domains.logistics.models.delivery import DeliveryStatus
from app.domains.logistics.models.delivery_proof import ProofType
from app.domains.logistics.schemas.assignment_schemas import AssignmentDecision, FailedAttempt
from app.domains.logistics.schemas.delivery_schemas import (
    DeliveryCreate,
    DeliveryResponse,
    DeliveryStatusUpdate,
)

router = APIRouter(prefix="/deliveries", tags=["Deliveries"])

_ALLOWED_PROOF_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
_MAX_PROOF_SIZE_BYTES = 10 * 1024 * 1024


@router.post("/", response_model=DeliveryResponse)
async def create_delivery(
    request: DeliveryCreate,
    service: DeliveryServiceDep,
    current_user: User = Depends(require_role("admin", "worker")),
) -> DeliveryResponse:
    """Create new delivery from order details."""
    delivery = await service.create_delivery_from_order(request.order_id)
    return DeliveryResponse.from_delivery(delivery)


@router.get("/driver/{driver_id}")
async def get_driver_deliveries(
    driver_id: str,
    service: DeliveryServiceDep,
    delivery_status: DeliveryStatus | None = Query(default=None, alias="status"),
    current_user: User = Depends(get_current_user),
) -> list[DeliveryResponse]:
    """Get deliveries assigned to a driver.

    Drivers may only list their own deliveries; admin/worker may list any driver's.
    """
    if current_user.role == "driver" and current_user.id != uuid.UUID(driver_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Drivers can only view their own deliveries",
        )
    deliveries = await service.get_driver_deliveries(uuid.UUID(driver_id), delivery_status)
    return [DeliveryResponse.from_delivery(d) for d in deliveries]


@router.get("/{delivery_id}", response_model=DeliveryResponse)
async def get_delivery(
    delivery_id: str,
    service: DeliveryServiceDep,
    current_user: User = Depends(get_current_user),
) -> DeliveryResponse:
    """Get delivery by ID."""
    delivery = await service.get_delivery(uuid.UUID(delivery_id))
    if not delivery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Delivery not found",
        )
    return DeliveryResponse.from_delivery(delivery)


@router.patch("/{delivery_id}/status")
async def update_delivery_status(
    delivery_id: str,
    status_update: DeliveryStatusUpdate,
    service: DeliveryServiceDep,
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Update delivery status.

    Drivers may only transition deliveries assigned to them. Admin/worker
    users may transition any delivery.
    """
    try:
        delivery = await service.update_delivery_status(
            delivery_id=uuid.UUID(delivery_id),
            new_status=status_update.status,
            actor=current_user,
        )
        return {
            "message": "Delivery status updated",
            "delivery_id": str(delivery.id),
            "new_status": delivery.status,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/{delivery_id}/pickup")
async def confirm_pickup(
    delivery_id: str,
    service: DeliveryServiceDep,
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Confirm package pickup at the vendor/office stop.

    Driver-only: transitions the delivery to ``in_transit`` and rolls the
    order items to ``shipped``.
    """
    if current_user.role != "driver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only drivers can confirm pickup",
        )
    try:
        delivery = await service.confirm_pickup(
            delivery_id=uuid.UUID(delivery_id),
            driver_id=current_user.id,
        )
        return {
            "message": "Pickup confirmed, delivery in transit",
            "delivery_id": str(delivery.id),
            "new_status": delivery.status,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/{delivery_id}/proof", status_code=status.HTTP_201_CREATED)
async def upload_delivery_proof(
    delivery_id: str,
    service: DeliveryServiceDep,
    file: UploadFile | None = File(None),
    proof_type: ProofType = Query(ProofType.PHOTO),
    latitude: float | None = Query(None),
    longitude: float | None = Query(None),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    """Upload proof-of-delivery evidence (photo/signature/gps) for a delivery.

    Only the assigned driver (or admin/worker) may upload proof.
    """
    delivery = await service.get_delivery(uuid.UUID(delivery_id))
    if not delivery:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found")

    if current_user.role == "driver" and delivery.assigned_driver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned driver can upload proof",
        )

    if proof_type in (ProofType.PHOTO, ProofType.SIGNATURE):
        if not file:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File is required for photo or signature proof",
            )
        file.file.seek(0, os.SEEK_END)
        file_size = file.file.tell()
        await file.seek(0)
        if file_size > _MAX_PROOF_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Proof files must be 10 MB or smaller",
            )

        # Validate image content for photo proofs
        file_ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
        if proof_type == ProofType.PHOTO and file_ext not in _ALLOWED_PROOF_EXT:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image format")

        header = await file.read(512)
        await file.seek(0)
        is_valid_image = (
            header.startswith(b"\xff\xd8\xff")
            or header.startswith(b"\x89PNG\r\n\x1a\n")
            or header.startswith(b"GIF87a")
            or header.startswith(b"GIF89a")
            or (header.startswith(b"RIFF") and b"WEBP" in header[:16])
        )
        if proof_type == ProofType.PHOTO and not is_valid_image:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image content")

        os.makedirs(settings.DELIVERY_PROOF_UPLOAD_DIR, exist_ok=True)
        filename = f"{uuid.uuid4()}{file_ext}"
        filepath = os.path.join(settings.DELIVERY_PROOF_UPLOAD_DIR, filename)

        def _save_file(src, dst):
            with open(dst, "wb") as buffer:
                shutil.copyfileobj(src, buffer)

        await asyncio.to_thread(_save_file, file.file, filepath)
        proof_url = f"/static/uploads/delivery-proofs/{filename}"
        proof_data = {"photo_url": proof_url} if proof_type == ProofType.PHOTO else {"signature_url": proof_url}
    elif proof_type == ProofType.GPS_COORDINATE:
        if latitude is None or longitude is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="latitude and longitude are required for GPS proof",
            )
        proof_data = {"latitude": latitude, "longitude": longitude}
    else:
        proof_data = {}

    await service.add_proof(
        delivery_id=delivery.id,
        proof_type=proof_type,
        proof_data=proof_data,
        captured_by_user_id=current_user.id,
    )

    response: dict[str, Any] = {"message": "Proof uploaded", "proof_type": proof_type.value}
    if "photo_url" in proof_data:
        response["proof_url"] = proof_data["photo_url"]
    elif "signature_url" in proof_data:
        response["proof_url"] = proof_data["signature_url"]
    return response


@router.post("/{delivery_id}/assignment/acknowledge")
async def acknowledge_assignment(
    delivery_id: str,
    body: AssignmentDecision,
    service: DeliveryServiceDep,
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    if current_user.role != "driver":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only drivers can respond to assignments")
    try:
        delivery = await service.acknowledge_assignment(
            delivery_id=uuid.UUID(delivery_id),
            driver_id=current_user.id,
            decision=body.decision,
            reason=body.reason,
        )
        return {
            "delivery_id": str(delivery.id),
            "assignment_status": delivery.assignment_status,
            "new_status": delivery.status,
        }
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/{delivery_id}/failed-attempt")
async def record_failed_attempt(
    delivery_id: str,
    body: FailedAttempt,
    service: DeliveryServiceDep,
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    if current_user.role != "driver":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only drivers can report failed attempts")
    try:
        delivery = await service.update_delivery_status(
            delivery_id=uuid.UUID(delivery_id),
            new_status="failed_attempt",
            actor=current_user,
        )
        delivery.failure_reason = body.reason
        await service.db.commit()
        return {"delivery_id": str(delivery.id), "new_status": delivery.status, "reason": body.reason}
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
