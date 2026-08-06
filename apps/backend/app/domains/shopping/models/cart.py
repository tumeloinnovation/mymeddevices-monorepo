import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional, List

from sqlalchemy import String, Boolean, Integer, ForeignKey, Numeric, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base
from app.domains.shared.models import IDMixin, AuditMixin


class Cart(Base, IDMixin, AuditMixin):
    """Shopping cart supporting both guest and customer carts.

    Guest carts are identified by:
    - session_id: Browser session tracking
    - cart_token: For cart retrieval across sessions
    - expires_at: Auto-expiration after 48 hours

    Customer carts are associated with a user and don't expire.
    """

    __tablename__ = "carts"

    # User association (nullable for guest carts)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True
    )

    # Guest cart tracking
    session_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        unique=True,
        index=True
    )  # Browser session ID for guest carts

    cart_token: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        unique=True,
        index=True
    )  # Token for cart retrieval (guest carts)

    # Cart expiration (guest carts only)
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True
    )

    # Cart state
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
        index=True
    )  # Soft delete flag (different from SoftDeleteMixin as it might be used differently)

    cart_type: Mapped[str] = mapped_column(
        String(20),
        default="persistent",
        nullable=False
    )  # 'persistent' (customer) or 'guest'

    # Relationships
    user: Mapped[Optional["User"]] = relationship(
        "User",
        lazy="selectin"
    )

    items: Mapped[List["CartItem"]] = relationship(
        "CartItem",
        back_populates="cart",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    discounts: Mapped[List["CartDiscount"]] = relationship(
        "CartDiscount",
        back_populates="cart",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    shares: Mapped[List["CartShare"]] = relationship(
        "CartShare",
        back_populates="cart",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        if self.user_id:
            return f"<Cart(id={self.id}, user_id={self.user_id}, type={self.cart_type})>"
        return f"<Cart(id={self.id}, guest, token={self.cart_token})>"


class CartItem(Base, IDMixin, AuditMixin):
    """Item in a shopping cart with customization options."""

    __tablename__ = "cart_items"

    cart_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("carts.id", ondelete="CASCADE"),
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
        default=1,
        nullable=False
    )

    # Price snapshot at time of adding to cart
    unit_price: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(12, 2),
        nullable=True
    )  # NULL means use current product price

    # Item customization
    notes: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True
    )  # Customer notes for this item

    substitution_allowed: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )  # Allow substitution if out of stock

    # Relationships
    cart: Mapped["Cart"] = relationship(
        "Cart",
        back_populates="items"
    )

    product: Mapped["Product"] = relationship(
        "Product",
        lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<CartItem(id={self.id}, cart_id={self.cart_id}, product_id={self.product_id}, qty={self.quantity})>"
