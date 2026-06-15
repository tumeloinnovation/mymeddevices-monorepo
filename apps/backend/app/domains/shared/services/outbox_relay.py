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
            # logic to load user and send email
            # This is a placeholder for actual email dispatch logic
            logger.info(f"Dispatching OrderCreated event for {event.aggregate_id}")
            pass
        elif event.event_type == "OrderPaid":
            logger.info(f"Dispatching OrderPaid event for {event.aggregate_id}")
            pass
        elif event.event_type == "OrderShipped":
            logger.info(f"Dispatching OrderShipped event for {event.aggregate_id}")
            pass
        # Extend as necessary
