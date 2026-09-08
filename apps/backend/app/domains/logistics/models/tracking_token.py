"""Secure tracking token model for guest order tracking."""

import secrets
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.core.security import get_password_hash
from app.domains.shared.models import IDMixin


class DeliveryTrackingToken(Base, IDMixin):
    """Hashed guest access token scoped to one delivery."""

    __tablename__ = "delivery_tracking_tokens"

    delivery_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("deliveries.id", ondelete="CASCADE"), nullable=False)
    token_hash: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_by_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    use_count: Mapped[int] = mapped_column(default=0, nullable=False)

    __table_args__ = (Index("ix_delivery_tracking_tokens_delivery_active", "delivery_id", "revoked_at"),)

    @classmethod
    def issue(cls, delivery_id: uuid.UUID, created_by_user_id: uuid.UUID | None, ttl_hours: int = 72):
        token = secrets.token_urlsafe(32)
        return cls(
            delivery_id=delivery_id,
            token_hash=get_password_hash(token),
            expires_at=datetime.now(UTC) + timedelta(hours=ttl_hours),
            created_by_user_id=created_by_user_id,
        ), token

    @property
    def is_active(self) -> bool:
        now = datetime.now(UTC)
        return self.revoked_at is None and self.expires_at > now
