import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import String, ForeignKey, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base
from app.domains.shared.models import IDMixin, AuditMixin


class CartShare(Base, IDMixin, AuditMixin):
    """A shared cart accessible via a unique token."""

    __tablename__ = "cart_shares"

    cart_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("carts.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Unique token for accessing the shared cart
    share_token: Mapped[str] = mapped_column(
        String(32),
        unique=True,
        nullable=False,
        index=True
    )

    # Optional expiry
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True
    )

    # Track usage
    access_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    # Optional metadata
    created_by_user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )  # Track who created the share (if authenticated)

    # Relationships
    cart: Mapped["Cart"] = relationship(
        "Cart",
        back_populates="shares"
    )

    def __repr__(self) -> str:
        return f"<CartShare(id={self.id}, token={self.share_token}, expires={self.expires_at})>"
