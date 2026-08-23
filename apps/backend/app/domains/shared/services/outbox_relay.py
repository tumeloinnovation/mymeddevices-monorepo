import uuid
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any

from sqlalchemy import and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.domains.shared.models.outbox import OutboxEvent, OutboxStatus
from app.domains.shopping.services.email_notification_service import EmailNotificationService


class OutboxRelay:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.email_service = EmailNotificationService()

    async def process_pending_events(self, limit: int = 50) -> int:
        """
        Process pending and retryable failed outbox events with exponential backoff.
        Returns the number of processed events.
        """
        now = datetime.now(UTC)
        stmt = (
            select(OutboxEvent)
            .where(
                or_(
                    OutboxEvent.status == OutboxStatus.PENDING,
                    and_(
                        OutboxEvent.status == OutboxStatus.FAILED,
                        OutboxEvent.retry_count < OutboxEvent.max_retries,
                        or_(
                            OutboxEvent.next_retry_at.is_(None),
                            OutboxEvent.next_retry_at <= now,
                        ),
                    ),
                )
            )
            .order_by(OutboxEvent.created_at.asc())
            .limit(limit)
            .with_for_update(skip_locked=True)
        )

        result = await self.db.execute(stmt)
        events = result.scalars().all()

        processed_count = 0
        for event in events:
            try:
                async with self.db.begin_nested():
                    await self._dispatch(event)
                event.status = OutboxStatus.PROCESSED
                event.processed_at = datetime.now(UTC)
                event.last_error = None
                processed_count += 1
            except Exception as e:
                event.retry_count += 1
                error_msg = str(e)[:1000]
                event.last_error = error_msg
                logger.error(
                    f"Failed to process outbox event {event.id} (attempt {event.retry_count}/{event.max_retries}): {e}"
                )

                if event.retry_count >= event.max_retries:
                    event.status = OutboxStatus.DEAD_LETTER
                    logger.error(f"Outbox event {event.id} moved to DEAD_LETTER after {event.retry_count} attempts.")
                else:
                    event.status = OutboxStatus.FAILED
                    backoff_seconds = min(30 * (2 ** (event.retry_count - 1)), 3600)
                    event.next_retry_at = now + timedelta(seconds=backoff_seconds)

            self.db.add(event)

        if events:
            await self.db.commit()

        return processed_count

    async def _dispatch(self, event: OutboxEvent):
        if event.event_type == "OrderCreated":
            logger.info(f"Dispatching OrderCreated event for {event.aggregate_id}")
            from app.domains.shopping.services.order_service import OrderService
            from app.domains.vendor.models.vendor_profile import VendorProfile

            try:
                order_service = OrderService(self.db)
                order = await order_service.get_order(uuid.UUID(event.aggregate_id))
                if order:
                    vendor_items_map: dict[uuid.UUID, list[Any]] = {}
                    for item in order.items:
                        if item.vendor_id not in vendor_items_map:
                            vendor_items_map[item.vendor_id] = []
                        vendor_items_map[item.vendor_id].append(item)

                    for vendor_id, items in vendor_items_map.items():
                        from app.domains.auth.models.user import User

                        stmt = (
                            select(VendorProfile, User.email)
                            .join(User, VendorProfile.user_id == User.id)
                            .where(VendorProfile.id == vendor_id)
                        )
                        res = await self.db.execute(stmt)
                        row = res.first()
                        if row:
                            vendor_profile, user_email = row[0], row[1]
                            vendor_email = vendor_profile.business_email or user_email
                            if vendor_email:
                                vendor_total = sum(float(item.subtotal) for item in items)
                                try:
                                    await self.email_service.send_vendor_new_order(
                                        vendor_email=vendor_email,
                                        vendor_name=vendor_profile.store_name,
                                        order_number=str(order.order_number or order.id),
                                        order_total=vendor_total,
                                    )
                                except Exception as mail_err:
                                    logger.warning(
                                        f"Failed sending new order email to vendor {vendor_email}: {mail_err}"
                                    )
            except Exception as e:
                logger.error(f"Error handling OrderCreated event: {e}")
                raise

        elif event.event_type == "OrderPaid":
            logger.info(f"Dispatching OrderPaid event for {event.aggregate_id}")
            payload = event.payload or {}
            sub_orders = payload.get("sub_orders") or []

            # 1. Credit vendor ledgers idempotently (net = gross - platform fee)
            from app.domains.shopping.models.vendor_ledger import LedgerTransaction, LedgerTransactionType, VendorLedger

            for so in sub_orders:
                vendor_id = so.get("vendor_id")
                if not vendor_id:
                    continue
                vendor_uuid = uuid.UUID(str(vendor_id))
                sub_order_uuid = uuid.UUID(str(so["sub_order_id"])) if so.get("sub_order_id") else None

                # Idempotency check: check if this sub-order was already credited
                if sub_order_uuid:
                    existing_txn = (
                        await self.db.execute(
                            select(LedgerTransaction).where(
                                LedgerTransaction.sub_order_id == sub_order_uuid,
                                LedgerTransaction.transaction_type == LedgerTransactionType.CREDIT,
                            )
                        )
                    ).scalar_one_or_none()
                    if existing_txn:
                        logger.info(f"Sub-order {sub_order_uuid} already credited on ledger. Skipping duplicate.")
                        continue

                ledger_stmt = select(VendorLedger).where(VendorLedger.vendor_id == vendor_uuid)
                if self.db.bind and self.db.bind.dialect.name != "sqlite":
                    ledger_stmt = ledger_stmt.with_for_update()
                ledger_res = await self.db.execute(ledger_stmt)
                ledger = ledger_res.scalar_one_or_none()

                if not ledger:
                    ledger = VendorLedger(vendor_id=vendor_uuid, balance=Decimal("0.00"))
                    self.db.add(ledger)
                    await self.db.flush()

                gross = Decimal(str(so.get("subtotal_amount", 0)))
                platform_fee_rate = Decimal("0.10")
                platform_fee = gross * platform_fee_rate
                net = gross - platform_fee
                ledger.balance += net
                ledger.last_updated_at = datetime.now(UTC)
                self.db.add(
                    LedgerTransaction(
                        vendor_id=vendor_uuid,
                        sub_order_id=sub_order_uuid,
                        gross_amount=gross,
                        platform_fee_rate=platform_fee_rate,
                        platform_fee_amount=platform_fee,
                        net_amount=net,
                        transaction_type=LedgerTransactionType.CREDIT,
                        reference_id=str(event.aggregate_id),
                        reference_type="order",
                        notes=f"Order payment - Order {event.aggregate_id}",
                    )
                )

            # 2. Record audit StockLog entries idempotently
            from app.domains.catalog.models import Product, StockChangeReason, StockLog

            for so in sub_orders:
                for item in so.get("items") or []:
                    product_id = uuid.UUID(str(item["product_id"]))
                    # Idempotency check: has StockLog for this order and product already been created?
                    existing_log = (
                        await self.db.execute(
                            select(StockLog).where(
                                StockLog.product_id == product_id,
                                StockLog.reference_id == str(event.aggregate_id),
                                StockLog.reason == StockChangeReason.ORDER_SALE,
                            )
                        )
                    ).scalar_one_or_none()
                    if existing_log:
                        continue

                    product_res = await self.db.execute(select(Product).where(Product.id == product_id))
                    product = product_res.scalar_one_or_none()
                    current_qty = product.stock_quantity if product else 0
                    self.db.add(
                        StockLog(
                            product_id=product_id,
                            vendor_id=uuid.UUID(str(item.get("vendor_id", so.get("vendor_id")))),
                            quantity_change=-int(item.get("quantity", 0)),
                            previous_quantity=current_qty,
                            new_quantity=current_qty,
                            reason=StockChangeReason.ORDER_SALE,
                            reference_id=str(event.aggregate_id),
                            reference_type="order",
                        )
                    )

        elif event.event_type == "OrderShipped":
            logger.info(f"Dispatching OrderShipped event for {event.aggregate_id}")
            pass

        elif event.event_type == "DeliveryDispatchRetry":
            from app.domains.logistics.models.delivery import Delivery
            from app.domains.logistics.services.driver_assignment_service import DriverAssignmentService

            delivery_result = await self.db.execute(
                select(Delivery).where(Delivery.id == uuid.UUID(event.aggregate_id))
            )
            delivery = delivery_result.scalar_one_or_none()
            if not delivery or delivery.assigned_driver_id is not None:
                return

            payload = event.payload or {}
            assigned_driver = await DriverAssignmentService(self.db).assign_best_driver(
                delivery_id=delivery.id,
                pickup_location=(payload.get("pickup_latitude"), payload.get("pickup_longitude")),
            )
            if assigned_driver is None:
                raise RuntimeError("No available drivers")

        elif event.event_type == "StaffInvitationCreated":
            payload = event.payload or {}
            email = payload.get("email")
            first_name = payload.get("first_name") or "Staff Member"
            role = payload.get("role") or "staff"
            temp_password = payload.get("temp_password")
            if email:
                try:
                    await self.email_service.send_staff_invitation(
                        user_email=email,
                        first_name=first_name,
                        role=role,
                        temp_password=temp_password,
                    )
                except Exception as e:
                    logger.error(f"Error sending staff invitation email: {e}")
