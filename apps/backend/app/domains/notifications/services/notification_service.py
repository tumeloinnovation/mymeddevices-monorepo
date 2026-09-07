import uuid
from collections.abc import Sequence
from datetime import UTC, datetime

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.notifications.models.notification import NotificationType, UserNotification


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_notification(
        self,
        *,
        user_id: uuid.UUID,
        notification_type: NotificationType,
        title: str,
        body: str,
        data: dict | None = None,
    ) -> UserNotification:
        n_type = notification_type.value if hasattr(notification_type, "value") else str(notification_type)
        notification = UserNotification(
            id=uuid.uuid4(),
            user_id=user_id,
            notification_type=n_type,
            title=title[:200],
            body=body[:500],
            data=data or {},
            is_read=False,
        )
        self.db.add(notification)
        return notification

    async def list_for_user(
        self,
        user_id: uuid.UUID,
        *,
        unread_only: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> Sequence[UserNotification]:
        stmt = (
            select(UserNotification)
            .where(UserNotification.user_id == user_id)
            .order_by(UserNotification.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        if unread_only:
            stmt = stmt.where(UserNotification.is_read.is_(False))
        return (await self.db.execute(stmt)).scalars().all()

    async def count_unread(self, user_id: uuid.UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(UserNotification)
            .where(UserNotification.user_id == user_id, UserNotification.is_read.is_(False))
        )
        return (await self.db.execute(stmt)).scalar_one()

    async def mark_read(
        self,
        user_id: uuid.UUID,
        notification_ids: Sequence[uuid.UUID] | None = None,
    ) -> int:
        stmt = update(UserNotification).where(
            UserNotification.user_id == user_id,
            UserNotification.is_read.is_(False),
        )
        if notification_ids:
            stmt = stmt.where(UserNotification.id.in_(notification_ids))
        now = datetime.now(UTC)
        result = await self.db.execute(
            stmt.values(is_read=True, read_at=now).execution_options(synchronize_session=False)
        )
        await self.db.commit()
        return result.rowcount or 0
