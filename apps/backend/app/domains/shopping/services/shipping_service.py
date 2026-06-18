import uuid
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime, timedelta

from app.domains.shopping.models.order import Order
from app.domains.shopping.models.shipment import Shipment
from app.domains.shopping.schemas.shipment_schemas import MockShipmentProcess

class ShippingService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def process_mock_shipment(self, data: MockShipmentProcess) -> Shipment:
        # 1. Fetch order
        stmt = select(Order).where(Order.id == data.order_id)
        result = await self.db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            raise ValueError("Order not found")
        
        if order.status != "paid":
            raise ValueError(f"Cannot ship order in status: {order.status}. Must be 'paid'.")

        # 2. Simulate shipping process
        tracking_number = f"TRK-{uuid.uuid4().hex[:12].upper()}"
        estimated_delivery = datetime.utcnow() + timedelta(days=3)
        
        shipment = Shipment(
            id=uuid.uuid4(),
            order_id=order.id,
            tracking_number=tracking_number,
            carrier=data.carrier,
            status="shipped",
            estimated_delivery=estimated_delivery,
            shipping_details={
                "mock": True,
                "origin": "Main Warehouse",
                "destination": order.shipping_address
            }
        )
        self.db.add(shipment)

        # 3. Update order status
        order.status = "shipped"
        
        await self.db.commit()
        await self.db.refresh(shipment)
        return shipment

    async def get_shipment_by_order(self, order_id: uuid.UUID) -> Optional[Shipment]:
        stmt = select(Shipment).where(Shipment.order_id == order_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
