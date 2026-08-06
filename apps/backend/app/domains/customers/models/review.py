from typing import Optional
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Text, Boolean, ForeignKey, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.core.database import Base
from app.domains.shared.models import IDMixin, AuditMixin

class Review(Base, IDMixin, AuditMixin):
    __tablename__ = "product_reviews"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customer_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    rating: Mapped[int] = mapped_column(Integer, nullable=False) # 1-5
    comment: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_verified_purchase: Mapped[bool] = mapped_column(Boolean, default=False)

    # Profanity and moderation fields
    contains_profanity: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    flagged_words: Mapped[Optional[list]] = mapped_column(JSON, nullable=True) # Stores list of flagged words found
    moderation_status: Mapped[str] = mapped_column(
        String(20),
        default="visible",
        nullable=False,
        index=True
    ) # visible, hidden, removed
    moderation_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    moderated_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    moderated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    customer: Mapped["CustomerProfile"] = relationship("CustomerProfile", back_populates="reviews", lazy="selectin")
    product: Mapped["Product"] = relationship("Product", lazy="selectin")

    def __repr__(self):
        return f"<Review(id={self.id}, product_id={self.product_id}, rating={self.rating}, moderation_status={self.moderation_status})>"
