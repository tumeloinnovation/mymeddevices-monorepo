"""Shipping service - compatibility wrapper for legacy shipment operations.

@deprecated Use DeliveryService from logistics domain instead.
"""

import uuid
from contextlib import asynccontextmanager
from typing import TYPE_CHECKING

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleError, NotFoundError
from app.domains.shared.models.outbox import OutboxEvent, OutboxStatus
from app.domains.shopping.models.order import Order, OrderStatus
from app.domains.shopping.models.shipment import Shipment, ShipmentStatus
from app.domains.shopping.schemas.shipment_schemas import MockShipmentProcess

if TYPE_CHECKING:
    from app.domains.logistics.services.delivery_service import DeliveryService


class ShippingService:
    """Compatibility wrapper for legacy shipment operations.

    This service provides backwards compatibility for the old Shipment model
    while delegating to the new logistics domain's DeliveryService.
    """

    def __init__(self, db: AsyncSession):
        self.db = db
        self._delivery_service = None

    @property
    def delivery_service(self) -> "DeliveryService":
        """Lazy load the DeliveryService to avoid circular imports."""
        if self._delivery_service is None:
            from app.domains.logistics.services.delivery_service import DeliveryService
            self._delivery_service = DeliveryService(self.db)
        return self._delivery_service

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
        """Legacy method - delegates to DeliveryService.

        @deprecated Use DeliveryService.create_delivery_from_order() instead.
        """
        # 1. Fetch order
        stmt = select(Order).where(Order.id == data.order_id)
        result = await self.db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            raise NotFoundError("Order", data.order_id)

        if order.status not in (OrderStatus.PROCESSING, OrderStatus.PENDING):
            raise BusinessRuleError(f"Cannot ship order in status: {order.status}. Must be 'processing'.")

        # 2. Create delivery using logistics domain
        delivery = await self.delivery_service.create_delivery_from_order(data.order_id)

        # 3. Create legacy Shipment for backwards compatibility
        shipment = Shipment(
            id=delivery.id,  # Use same ID for easy mapping
            order_id=delivery.order_id,
            tracking_number=delivery.tracking_number,
            carrier=data.carrier or delivery.carrier,
            status=ShipmentStatus.IN_TRANSIT,  # Map delivery status to shipment status
            estimated_delivery=delivery.estimated_delivery,
            shipping_details={
                "logistics_type": delivery.logistics_type.value,
                "route_coordinates": delivery.route_coordinates,
                "distance_km": delivery.calculated_distance_km,
            },
        )

        self.db.add(shipment)

        # 4. Update order status
        order.status = OrderStatus.SHIPPED

        self.db.add(
            OutboxEvent(
                id=uuid.uuid4(),
                aggregate_type="Order",
                aggregate_id=str(order.id),
                event_type="OrderShipped",
                payload={
                    "delivery_id": str(delivery.id),
                    "tracking_number": delivery.tracking_number,
                    "carrier": delivery.carrier,
                    "estimated_delivery": delivery.estimated_delivery.isoformat()
                    if delivery.estimated_delivery
                    else None,
                },
                status=OutboxStatus.PENDING,
            )
        )

        # Use transaction for atomic shipment creation
        async with self._transaction():
            pass  # Updates already done via ORM

        await self.db.refresh(shipment)
        return shipment

    async def get_shipment_by_order(self, order_id: uuid.UUID) -> Shipment | None:
        """Get shipment by order ID.

        @deprecated Use DeliveryService.get_delivery() instead.
        """
        stmt = select(Shipment).where(Shipment.order_id == order_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
