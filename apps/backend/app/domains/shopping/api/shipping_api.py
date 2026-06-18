from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import uuid

from app.core.database import get_db
from app.domains.shopping.schemas.shipment_schemas import ShipmentResponse, MockShipmentProcess
from app.domains.shopping.services.shipping_service import ShippingService
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/shipping", tags=["Shipping"])

@router.post("/ship-mock", response_model=ShipmentResponse)
async def ship_mock_order(
    data: MockShipmentProcess,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = ShippingService(db)
    try:
        return await service.process_mock_shipment(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/order/{order_id}", response_model=ShipmentResponse)
async def get_shipment_by_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = ShippingService(db)
    shipment = await service.get_shipment_by_order(order_id)
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found for this order")
    return shipment
