import enum

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import mapped_column

from app.core.database import Base
from app.domains.shared.models.base import AuditMixin, IDMixin


class NotificationType(str, enum.Enum):
    ORDER_SHIPPED = "order_shipped"
    SYSTEM = "system"


class UserNotification(Base, IDMixin, AuditMixin):
    __tablename__ = "user_notifications"

    user_id = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    notification_type = mapped_column(
        String(50), nullable=False, default=NotificationType.SYSTEM.value, index=True
    )
    title = mapped_column(String(200), nullable=False)
    body = mapped_column(String(500), nullable=False)
    data = mapped_column(JSON, nullable=False, default=dict)
    is_read = mapped_column(Boolean, nullable=False, default=False, index=True)
    read_at = mapped_column(DateTime(timezone=True), nullable=True)
