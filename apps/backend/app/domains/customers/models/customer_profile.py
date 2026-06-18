from typing import Optional, List
from sqlalchemy import String, Integer, Boolean, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.core.database import Base
from app.domains.shared.models import IDMixin, AuditMixin

class CustomerProfile(Base, IDMixin, AuditMixin):
    __tablename__ = "customer_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    loyalty_tier: Mapped[str] = mapped_column(String(50), default="bronze") # bronze, silver, gold, platinum
    loyalty_points: Mapped[int] = mapped_column(Integer, default=0)
    marketing_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    # Communication preferences
    email_order_updates: Mapped[bool] = mapped_column(Boolean, default=True)
    email_promotions: Mapped[bool] = mapped_column(Boolean, default=False)
    email_newsletter: Mapped[bool] = mapped_column(Boolean, default=True)
    email_security: Mapped[bool] = mapped_column(Boolean, default=True)
    sms_order_updates: Mapped[bool] = mapped_column(Boolean, default=True)
    sms_promotions: Mapped[bool] = mapped_column(Boolean, default=False)
    sms_security: Mapped[bool] = mapped_column(Boolean, default=True)
    email_frequency: Mapped[str] = mapped_column(String(20), default="instant")

    # Dashboard preferences
    language: Mapped[str] = mapped_column(String(10), default="en")
    timezone: Mapped[str] = mapped_column(String(50), default="eat")
    items_per_page: Mapped[int] = mapped_column(Integer, default=24)
    default_sort: Mapped[str] = mapped_column(String(50), default="newest")
    show_recently_viewed: Mapped[bool] = mapped_column(Boolean, default=True)
    reduced_motion: Mapped[bool] = mapped_column(Boolean, default=False)
    font_size: Mapped[str] = mapped_column(String(20), default="normal")
    high_contrast: Mapped[bool] = mapped_column(Boolean, default=False)

    notes: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="customer_profile")
    addresses: Mapped[List["Address"]] = relationship(
        "Address", 
        back_populates="customer", 
        cascade="all, delete-orphan"
    )
    wishlist_items: Mapped[List["WishlistItem"]] = relationship(
        "WishlistItem", 
        back_populates="customer", 
        cascade="all, delete-orphan"
    )
    reviews: Mapped[List["Review"]] = relationship(
        "Review", 
        back_populates="customer", 
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<CustomerProfile(user_id={self.user_id}, loyalty_tier={self.loyalty_tier})>"
