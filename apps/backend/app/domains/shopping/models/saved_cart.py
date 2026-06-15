import uuid
from typing import Optional, List

from sqlalchemy import String, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base
from app.domains.shared.models import IDMixin, AuditMixin


class SavedCart(Base, IDMixin, AuditMixin):
    """A saved cart configuration for future use."""

    __tablename__ = "saved_carts"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )  # User-defined name

    # Optional metadata
    description: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True
    )  # User notes about this saved cart

    # Relationships
    items: Mapped[List["SavedCartItem"]] = relationship(
        "SavedCartItem",
        back_populates="saved_cart",
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="SavedCartItem.id"
    )

    def __repr__(self) -> str:
        return f"<SavedCart(id={self.id}, user_id={self.user_id}, name={self.name})>"


class SavedCartItem(Base, IDMixin, AuditMixin):
    """An item in a saved cart."""

    __tablename__ = "saved_cart_items"

    saved_cart_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("saved_carts.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )

    # Item customization (mirrors CartItem)
    notes: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True
    )

    # Relationships
    saved_cart: Mapped["SavedCart"] = relationship(
        "SavedCart",
        back_populates="items"
    )

    product: Mapped["Product"] = relationship(
        "Product",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<SavedCartItem(id={self.id}, saved_cart_id={self.saved_cart_id}, product_id={self.product_id})>"
