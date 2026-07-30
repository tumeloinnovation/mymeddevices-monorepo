from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import asyncio

from app.domains.shared.models.outbox import OutboxEvent, OutboxStatus
from app.domains.shopping.services.email_notification_service import EmailNotificationService
from app.core.logging import logger

class OutboxRelay:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.email_service = EmailNotificationService()

    async def process_pending_events(self, limit: int = 50):
        stmt = select(OutboxEvent).where(OutboxEvent.status == OutboxStatus.PENDING).limit(limit)
        result = await self.db.execute(stmt)
        events = result.scalars().all()

        for event in events:
            try:
                await self._dispatch(event)
                event.status = OutboxStatus.PROCESSED
                event.processed_at = datetime.utcnow()
            except Exception as e:
                logger.error(f"Failed to process event {event.id}: {e}")
                event.status = OutboxStatus.FAILED
            
            self.db.add(event)
        
        if events:
            await self.db.commit()

    async def _dispatch(self, event: OutboxEvent):
        # Temporary in-process dispatcher until Celery is wired
        if event.event_type == "OrderCreated":
            logger.info(f"Dispatching OrderCreated event for {event.aggregate_id}")
            import uuid
            from sqlalchemy.orm import selectinload
            from app.domains.shopping.services.order_service import OrderService
            from app.domains.vendor.models.vendor_profile import VendorProfile
            
            try:
                order_service = OrderService(self.db)
                order = await order_service.get_order(uuid.UUID(event.aggregate_id))
                if order:
                    vendor_items_map = {}
                    for item in order.items:
                        if item.vendor_id not in vendor_items_map:
                            vendor_items_map[item.vendor_id] = []
                        vendor_items_map[item.vendor_id].append(item)

                    for vendor_id, items in vendor_items_map.items():
                        from app.domains.auth.models.user import User
                        stmt = select(VendorProfile, User.email).join(User, VendorProfile.user_id == User.id).where(VendorProfile.id == vendor_id)
                        res = await self.db.execute(stmt)
                        row = res.first()
                        if row:
                            vendor_profile, user_email = row[0], row[1]
                            vendor_email = vendor_profile.business_email or user_email
                            if vendor_email:
                                vendor_total = sum(float(item.subtotal) for item in items)
                                await self.email_service.send_vendor_new_order(
                                    vendor_email=vendor_email,
                                    vendor_name=vendor_profile.store_name,
                                    order_number=str(order.order_number or order.id),
                                    order_total=vendor_total
                                )
            except Exception as e:
                logger.error(f"Error handling OrderCreated event: {e}")
        elif event.event_type == "OrderPaid":
            logger.info(f"Dispatching OrderPaid event for {event.aggregate_id}")
            pass
        elif event.event_type == "OrderShipped":
            logger.info(f"Dispatching OrderShipped event for {event.aggregate_id}")
            pass
        # Extend as necessary
