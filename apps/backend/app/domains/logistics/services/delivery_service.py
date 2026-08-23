"""Delivery service for delivery lifecycle management.

Enhanced from ShippingService.process_mock_shipment().
"""

import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import BusinessRuleError, NotFoundError
from app.domains.auth.models.user import User
from app.domains.logistics.models.delivery import Delivery, DeliveryStatus, LogisticsType
from app.domains.logistics.models.delivery_proof import DeliveryProof, ProofType
from app.domains.logistics.models.delivery_stop import DeliveryStop
from app.domains.logistics.services.tracking_events import publish_tracking_event
from app.domains.logistics.services.tracking_service import TrackingService
from app.domains.logistics.state_machines.delivery_state_machine import (
    DeliveryStateMachine,
)
from app.domains.shared.models.outbox import OutboxEvent, OutboxStatus
from app.domains.shopping.models.order import (
    Order,
    OrderItem,
    OrderItemFulfillmentStatus,
    OrderStatus,
    OrderTimelineEvent,
)
from app.domains.shopping.services.order_state_machine import OrderStateMachine
from app.domains.vendor.models.vendor_profile import VendorProfile


class DeliveryService:
    """Service for delivery lifecycle management."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.state_machine = DeliveryStateMachine()

    def _delivery_query(self):
        """Base delivery query with eager-loaded relationships for responses."""
        return select(Delivery).options(
            selectinload(Delivery.stops),
            selectinload(Delivery.driver).selectinload(User.driver_profile),
        )

    async def create_delivery_from_order(
        self,
        order_id: uuid.UUID,
        apply_stored_driver: bool = True,
        dispatch_idempotency_key: str | None = None,
    ) -> Delivery:
        """Create delivery entity from order.

        Args:
            order_id: Order to create delivery for
            apply_stored_driver: If True, honor any ``assigned_driver_id`` stored in
                the order's shipping address. When auto-dispatching (all items packed),
                pass ``False`` so a fresh driver match can be performed.

        Returns:
            Created Delivery entity

        Raises:
            NotFoundError: If order doesn't exist
        """
        # Fetch order
        stmt = (
            select(Order)
            .where(Order.id == order_id)
            .options(
                selectinload(Order.items).selectinload(OrderItem.product),
            )
        )
        result = await self.db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            raise NotFoundError("Order", order_id)

        # Extract logistics info from shipping_address
        shipping_address = order.shipping_address or {}
        logistics_type_str = shipping_address.get("logistics_type", "courier")
        logistics_type = LogisticsType.COMPANY_RIDER if logistics_type_str == "company_rider" else LogisticsType.COURIER

        # Generate tracking number
        tracking_number = f"TRK-{uuid.uuid4().hex[:12].upper()}"

        # Calculate estimated delivery (3 business days)
        estimated_delivery = datetime.now(UTC) + timedelta(days=3)

        # Create delivery
        delivery = Delivery(
            id=uuid.uuid4(),
            order_id=order.id,
            dispatch_idempotency_key=dispatch_idempotency_key,
            logistics_type=logistics_type,
            status=DeliveryStatus.CREATED,
            route_coordinates=shipping_address.get("route_coordinates"),
            calculated_distance_km=shipping_address.get("calculated_distance_km"),
            estimated_duration_minutes=shipping_address.get("estimated_duration_minutes"),
            delivery_address=shipping_address,
            tracking_number=tracking_number,
            estimated_delivery=estimated_delivery,
            shipping_amount=shipping_address.get("shipping_amount"),
            customer_phone=shipping_address.get("phone"),
        )

        # Assign driver if specified
        if apply_stored_driver:
            assigned_driver_id = shipping_address.get("assigned_driver_id")
            if assigned_driver_id:
                delivery.assigned_driver_id = (
                    uuid.UUID(assigned_driver_id) if isinstance(assigned_driver_id, str) else assigned_driver_id
                )
                delivery.status = DeliveryStatus.ASSIGNED

        self.db.add(delivery)
        await self.db.commit()
        await self.db.refresh(delivery)

        # Create delivery stops from route coordinates
        await self._create_delivery_stops(delivery, shipping_address, order)

        # Reload with eager-loaded relationships for a complete response
        reloaded = await self.get_delivery(delivery.id)
        return reloaded or delivery

    async def _create_delivery_stops(self, delivery: Delivery, shipping_address: dict[str, Any], order: Order) -> None:
        """Create delivery stops from route coordinates.

        Route shape: Office -> Vendor(s) -> Customer.

        Args:
            delivery: Delivery entity
            shipping_address: Shipping address with route_coordinates
            order: The order the delivery belongs to
        """
        route_coords = shipping_address.get("route_coordinates", [])
        if not route_coords:
            return

        vendor_ids = {item.vendor_id for item in order.items if item.vendor_id}

        # Resolve vendor names for stop addresses
        vendor_names: dict[uuid.UUID, str] = {}
        if vendor_ids:
            vendor_stmt = select(VendorProfile).where(VendorProfile.id.in_(vendor_ids))
            vendor_result = await self.db.execute(vendor_stmt)
            for vp in vendor_result.scalars().all():
                vendor_names[vp.id] = vp.store_name

        # Customer address label
        customer_label = (
            shipping_address.get("full_name")
            or f"{shipping_address.get('first_name', '')} {shipping_address.get('last_name', '')}".strip()
            or "Customer"
        )

        vendor_id_list = list(vendor_ids)
        for i, coord in enumerate(route_coords):
            stop_type = "office" if i == 0 else ("customer" if i == len(route_coords) - 1 else "vendor")
            address = None
            vendor_id = None
            vendor_name = None

            if stop_type == "office":
                address = shipping_address.get("office_address") or "MyMedDevices Office"
            elif stop_type == "customer":
                address = shipping_address.get("address") or customer_label
            else:
                idx = i - 1
                if idx < len(vendor_id_list):
                    vendor_id = vendor_id_list[idx]
                    vendor_name = vendor_names.get(vendor_id)

            stop = DeliveryStop(
                id=uuid.uuid4(),
                delivery_id=delivery.id,
                stop_sequence=i + 1,
                stop_type=stop_type,
                latitude=float(coord[0]),
                longitude=float(coord[1]),
                address=address,
                vendor_id=vendor_id,
                vendor_name=vendor_name,
            )
            self.db.add(stop)

        await self.db.commit()

    async def update_delivery_status(
        self,
        delivery_id: uuid.UUID,
        new_status: DeliveryStatus | str,
        updated_by: uuid.UUID | None = None,
        actor: User | None = None,
    ) -> Delivery:
        """Update delivery status with state machine validation.

        Args:
            delivery_id: Delivery to update
            new_status: New delivery status
            updated_by: User ID making the update (legacy, kept for compatibility)
            actor: Authenticated user; drivers may only transition their own deliveries

        Returns:
            Updated Delivery entity

        Raises:
            NotFoundError: If delivery doesn't exist
            InvalidDeliveryTransitionError: If status transition is invalid
            BusinessRuleError: If a driver actor tries to update another driver's delivery
        """
        # Convert string to enum if needed
        if isinstance(new_status, str):
            new_status = DeliveryStatus(new_status)

        # Fetch delivery
        stmt = self._delivery_query().where(Delivery.id == delivery_id)
        result = await self.db.execute(stmt)
        delivery = result.scalar_one_or_none()

        if not delivery:
            raise NotFoundError("Delivery", delivery_id)

        if actor is not None and actor.role == "driver":
            if delivery.assigned_driver_id != actor.id:
                raise BusinessRuleError("Driver can only update their own assigned deliveries")

        # Validate transition
        self.state_machine.validate_transition(delivery.status, new_status.value)

        if new_status == DeliveryStatus.DELIVERED:
            proof_stmt = select(DeliveryProof.delivery_id).where(
                DeliveryProof.delivery_id == delivery_id,
                DeliveryProof.proof_type.in_([ProofType.PHOTO, ProofType.SIGNATURE]),
            )
            has_photo_or_signature = (await self.db.execute(proof_stmt.limit(1))).scalar_one_or_none() is not None
            gps_stmt = select(DeliveryProof.id).where(
                DeliveryProof.delivery_id == delivery_id,
                DeliveryProof.proof_type == ProofType.GPS_COORDINATE,
            )
            has_gps = (await self.db.execute(gps_stmt.limit(1))).scalar_one_or_none() is not None
            if not (has_photo_or_signature and has_gps):
                raise BusinessRuleError("Photo/signature proof and GPS evidence are required to complete delivery")

        # Update status
        delivery.status = new_status

        # Set actual delivery time if delivered
        if new_status == DeliveryStatus.DELIVERED and not delivery.actual_delivery:
            delivery.actual_delivery = datetime.now(UTC)

        self._add_status_event(delivery, "DeliveryStatusChanged")
        await self.db.commit()
        await self.db.refresh(delivery)

        snapshot = await TrackingService(self.db).get_tracking(delivery_id)
        if snapshot:
            await publish_tracking_event(str(delivery_id), "status", {"tracking": snapshot})

        # Completion side effects (own transactions): capacity release + fulfillment rollup
        if new_status == DeliveryStatus.DELIVERED:
            await self._complete_delivery(delivery)
        elif new_status in (DeliveryStatus.FAILED_ATTEMPT, DeliveryStatus.CANCELLED):
            await self._release_capacity(delivery)

        reloaded = await self.get_delivery(delivery_id)
        return reloaded or delivery

    async def _complete_delivery(self, delivery: Delivery) -> None:
        """Roll order fulfillment to delivered and bump driver stats."""
        await self._apply_order_fulfillment(delivery.order_id, "delivered")
        await self._release_capacity(delivery)
        if delivery.assigned_driver_id:
            profile_stmt = select(User).where(User.id == delivery.assigned_driver_id)
            result = await self.db.execute(profile_stmt)
            driver_user = result.scalar_one_or_none()
            if driver_user:
                profile = getattr(driver_user, "driver_profile", None)
                if profile is not None:
                    profile.total_deliveries += 1
                    profile.successful_deliveries += 1
                    if hasattr(profile, "last_completion"):
                        profile.last_completion = datetime.now(UTC)
                    await self.db.commit()

    async def _release_capacity(self, delivery: Delivery) -> None:
        """Release driver capacity for a completed/cancelled delivery."""
        from app.domains.logistics.services.capacity_management_service import CapacityManagementService

        if delivery.assigned_driver_id:
            await CapacityManagementService(self.db).release_capacity(delivery.id)

    async def _apply_order_fulfillment(self, order_id: uuid.UUID, item_status: str) -> None:
        """Set all active order items to ``item_status`` and roll up the order.

        Used when a delivery is picked up (shipped) or delivered.
        """
        stmt = select(Order).where(Order.id == order_id).options(selectinload(Order.items))
        result = await self.db.execute(stmt)
        order = result.scalar_one_or_none()
        if not order:
            return

        active_items = [i for i in order.items if i.fulfillment_status != "cancelled"]
        for item in active_items:
            item.fulfillment_status = OrderItemFulfillmentStatus(item_status)

        if active_items:
            new_order_status = OrderStateMachine.calculate_order_status(
                [i.fulfillment_status.value for i in active_items]
            )
            if new_order_status and new_order_status != order.status.value:
                order.status = OrderStatus(new_order_status)
                self.db.add(
                    OrderTimelineEvent(
                        id=uuid.uuid4(),
                        order_id=order.id,
                        status=new_order_status,
                        message=f"Order automatically rolled up to {new_order_status}",
                    )
                )

        await self.db.commit()

    async def confirm_pickup(self, delivery_id: uuid.UUID, driver_id: uuid.UUID) -> Delivery:
        """Confirm package pickup at the vendor/office stop.

        Transitions the delivery to ``in_transit``, marks the current pickup stop
        as departed, and rolls the order items to ``shipped``.

        Args:
            delivery_id: Delivery being picked up
            driver_id: Authenticated driver user ID

        Returns:
            Updated Delivery entity

        Raises:
            NotFoundError: If delivery doesn't exist
            BusinessRuleError: If the driver is not assigned or status is invalid
        """
        stmt = self._delivery_query().where(Delivery.id == delivery_id)
        result = await self.db.execute(stmt)
        delivery = result.scalar_one_or_none()

        if not delivery:
            raise NotFoundError("Delivery", delivery_id)

        if delivery.assigned_driver_id != driver_id:
            raise BusinessRuleError("Only the assigned driver can confirm pickup")

        if delivery.status not in (DeliveryStatus.ROUTED, DeliveryStatus.AT_VENDOR):
            raise BusinessRuleError(f"Cannot confirm pickup from status '{delivery.status.value}'")

        # Mark current pickup stop departed (first non-customer stop in sequence)
        pickup_stops = sorted(
            (s for s in (delivery.stops or []) if s.stop_type in ("office", "vendor")),
            key=lambda s: s.stop_sequence,
        )
        for stop in pickup_stops:
            if stop.status != "completed":
                stop.status = "completed"
                stop.departed_at = datetime.now(UTC)
                break

        self.state_machine.validate_transition(delivery.status.value, DeliveryStatus.IN_TRANSIT.value)
        delivery.status = DeliveryStatus.IN_TRANSIT

        self._add_status_event(delivery, "DeliveryStatusChanged")
        await self.db.commit()
        await self._apply_order_fulfillment(delivery.order_id, "shipped")

        snapshot = await TrackingService(self.db).get_tracking(delivery_id)
        if snapshot:
            await publish_tracking_event(str(delivery_id), "status", {"tracking": snapshot})

        reloaded = await self.get_delivery(delivery_id)
        return reloaded or delivery

    async def assign_driver(self, delivery_id: uuid.UUID, driver_id: uuid.UUID) -> Delivery:
        """Assign driver to delivery.

        Args:
            delivery_id: Delivery to assign driver to
            driver_id: User ID of driver

        Returns:
            Updated Delivery entity

        Raises:
            NotFoundError: If delivery doesn't exist
            BusinessRuleError: If driver assignment is invalid
        """
        stmt = self._delivery_query().where(Delivery.id == delivery_id).with_for_update()
        result = await self.db.execute(stmt)
        delivery = result.scalar_one_or_none()

        if not delivery:
            raise NotFoundError("Delivery", delivery_id)

        if delivery.assigned_driver_id:
            raise BusinessRuleError("Delivery already has a driver assigned")

        delivery.assigned_driver_id = driver_id
        delivery.status = DeliveryStatus.ASSIGNED
        self._add_status_event(delivery, "DeliveryStatusChanged")

        await self.db.commit()
        await self.db.refresh(delivery)

        reloaded = await self.get_delivery(delivery_id)
        return reloaded or delivery

    async def get_delivery(self, delivery_id: uuid.UUID) -> Delivery | None:
        """Get delivery by ID with stops and driver relationships eager-loaded."""
        stmt = self._delivery_query().where(Delivery.id == delivery_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_driver_deliveries(self, driver_id: uuid.UUID, status: DeliveryStatus | None = None) -> list[Delivery]:
        """Get deliveries assigned to a driver.

        Args:
            driver_id: User ID of driver
            status: Optional status filter

        Returns:
            List of Delivery entities
        """
        stmt = self._delivery_query().where(Delivery.assigned_driver_id == driver_id)

        if status:
            stmt = stmt.where(Delivery.status == status)

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def acknowledge_assignment(
        self,
        delivery_id: uuid.UUID,
        driver_id: uuid.UUID,
        decision: str,
        reason: str | None = None,
    ) -> Delivery:
        """Record an assigned driver's explicit accept/reject decision."""
        delivery = await self.get_delivery(delivery_id)
        if not delivery:
            raise NotFoundError("Delivery", delivery_id)
        if delivery.assigned_driver_id != driver_id:
            raise BusinessRuleError("Only the assigned driver can respond to this assignment")
        if delivery.assignment_status not in ("pending", "rejected"):
            raise BusinessRuleError("Assignment already acknowledged")
        if decision == "accepted":
            if delivery.status != DeliveryStatus.ASSIGNED:
                raise BusinessRuleError("Only newly assigned deliveries can be accepted")
            delivery.assignment_status = "accepted"
        elif decision == "rejected":
            delivery.assignment_status = "rejected"
            delivery.failure_reason = f"Driver rejected assignment: {reason or 'no reason provided'}"
        else:
            raise BusinessRuleError("Invalid assignment decision")
        delivery.assignment_responded_at = datetime.now(UTC)
        await self.db.commit()
        snapshot = await TrackingService(self.db).get_tracking(delivery_id)
        if snapshot:
            await publish_tracking_event(str(delivery_id), "assignment", {"tracking": snapshot})
        return (await self.get_delivery(delivery_id)) or delivery

    async def add_proof(
        self,
        delivery_id: uuid.UUID,
        proof_type: ProofType,
        proof_data: dict[str, Any],
        captured_by_user_id: uuid.UUID,
    ) -> None:
        """Record proof-of-delivery evidence for a delivery.

        Args:
            delivery_id: Delivery the proof belongs to
            proof_type: Type of proof (photo, signature, gps_coordinate, notes)
            proof_data: JSON payload (e.g. ``{"photo_url": "/static/..."}``)
        captured_by_user_id: User capturing the proof
        """
        stmt = select(Delivery.id).where(Delivery.id == delivery_id)
        if self.db.bind is not None and self.db.bind.dialect.name != "sqlite":
            stmt = stmt.with_for_update()
        if (await self.db.execute(stmt)).scalar_one_or_none() is None:
            raise NotFoundError("Delivery", delivery_id)

        self.db.add(
            DeliveryProof(
                id=uuid.uuid4(),
                delivery_id=delivery_id,
                proof_type=proof_type,
                proof_data=proof_data,
                captured_by_user_id=captured_by_user_id,
            )
        )
        self._add_proof_ready_event(delivery_id, proof_type.value)
        await self.db.commit()

    def _add_status_event(self, delivery: Delivery, event_type: str) -> None:
        """Queue a durable status notification for outbox relay processing."""
        self.db.add(
            OutboxEvent(
                id=uuid.uuid4(),
                aggregate_type="Delivery",
                aggregate_id=str(delivery.id),
                event_type=event_type,
                payload={
                    "delivery_id": str(delivery.id),
                    "order_id": str(delivery.order_id),
                    "status": delivery.status.value,
                    "estimated_delivery": delivery.estimated_delivery.isoformat()
                    if delivery.estimated_delivery
                    else None,
                    "driver_id": str(delivery.assigned_driver_id) if delivery.assigned_driver_id else None,
                },
                status=OutboxStatus.PENDING,
            )
        )

    def _add_proof_ready_event(self, delivery_id: uuid.UUID, proof_type: str) -> None:
        """Queue proof-ready metadata for customer-facing tracking consumers."""
        self.db.add(
            OutboxEvent(
                id=uuid.uuid4(),
                aggregate_type="Delivery",
                aggregate_id=str(delivery_id),
                event_type="DeliveryProofReady",
                payload={"delivery_id": str(delivery_id), "proof_type": proof_type},
                status=OutboxStatus.PENDING,
            )
        )
