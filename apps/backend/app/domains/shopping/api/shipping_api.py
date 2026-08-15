import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.domains.auth.models.user import User
from app.domains.shopping.models.order import Order
from app.domains.shopping.schemas.shipment_schemas import MockShipmentProcess, ShipmentResponse
from app.domains.shopping.services.shipping_service import ShippingService

router = APIRouter(prefix="/shipping", tags=["Shipping"])


@router.post("/ship-mock", response_model=ShipmentResponse)
async def ship_mock_order(
    data: MockShipmentProcess,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("admin", "worker")),
):
    service = ShippingService(db)
    try:
        return await service.process_mock_shipment(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/order/{order_id}", response_model=ShipmentResponse)
async def get_shipment_by_order(
    order_id: uuid.UUID, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    # Verify order ownership or staff role
    order_stmt = select(Order).where(Order.id == order_id)
    order_res = await db.execute(order_stmt)
    order = order_res.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.user_id != current_user.id and current_user.role not in ("admin", "worker"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to access shipment for this order"
        )

    service = ShippingService(db)
    shipment = await service.get_shipment_by_order(order_id)
    if not shipment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shipment not found for this order")
    return shipment
