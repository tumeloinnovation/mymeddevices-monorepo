import uuid
from contextlib import asynccontextmanager
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleError, NotFoundError
from app.domains.shopping.models.order import Order, OrderStatus
from app.domains.shopping.models.shipment import Shipment, ShipmentStatus
from app.domains.shopping.schemas.shipment_schemas import MockShipmentProcess


class ShippingService:
    def __init__(self, db: AsyncSession):
        self.db = db

    @asynccontextmanager
    async def _transaction(self):
        """Use begin_nested (SAVEPOINT) when already in a transaction."""
        if self.db.in_transaction():
            async with self.db.begin_nested():
                yield
        else:
            async with self.db.begin():
                yield

    async def process_mock_shipment(self, data: MockShipmentProcess) -> Shipment:
        # 1. Fetch order
        stmt = select(Order).where(Order.id == data.order_id)
        result = await self.db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            raise NotFoundError("Order", data.order_id)

        if order.status not in (OrderStatus.PROCESSING, OrderStatus.PENDING):
            raise BusinessRuleError(f"Cannot ship order in status: {order.status}. Must be 'processing'.")

        # 2. Simulate shipping process
        tracking_number = f"TRK-{uuid.uuid4().hex[:12].upper()}"
        estimated_delivery = datetime.now(UTC) + timedelta(days=3)

        shipment = Shipment(
            id=uuid.uuid4(),
            order_id=order.id,
            tracking_number=tracking_number,
            carrier=data.carrier,
            status=ShipmentStatus.IN_TRANSIT,
            estimated_delivery=estimated_delivery,
            shipping_details={"mock": True, "origin": "Main Warehouse", "destination": order.shipping_address},
        )
        self.db.add(shipment)

        # 3. Update order status
        order.status = OrderStatus.SHIPPED

        # Use transaction for atomic shipment creation
        async with self._transaction():
            pass  # Updates already done via ORM

        await self.db.refresh(shipment)
        return shipment

    async def get_shipment_by_order(self, order_id: uuid.UUID) -> Shipment | None:
        stmt = select(Shipment).where(Shipment.order_id == order_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
