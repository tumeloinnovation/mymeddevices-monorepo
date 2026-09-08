import uuid
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domains.shared.models import AuditMixin, IDMixin

if TYPE_CHECKING:
    from app.domains.shopping.models.cart import Cart


class CartDiscount(Base, IDMixin, AuditMixin):
    """A discount applied to a cart."""

    __tablename__ = "cart_discounts"

    cart_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("carts.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # Discount source
    coupon_code: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)  # If from a coupon

    promotion_id: Mapped[str | None] = mapped_column(String(100), nullable=True)  # If from a promotion (future)

    # Discount details
    discount_type: Mapped[str] = mapped_column(String(50), nullable=False)  # 'percentage', 'fixed', 'free_shipping'

    discount_value: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False
    )  # Percentage (0-100) or fixed amount

    # Calculated discount amount
    discount_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=0
    )  # Actual discount applied to cart

    # Metadata
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)  # Human-readable description

    is_applied: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=True
    )  # Whether discount is currently active

    # Relationships
    cart: Mapped["Cart"] = relationship("Cart", back_populates="discounts")

    def __repr__(self) -> str:
        if self.coupon_code:
            return f"<CartDiscount(id={self.id}, cart_id={self.cart_id}, coupon={self.coupon_code}, type={self.discount_type})>"
        return f"<CartDiscount(id={self.id}, cart_id={self.cart_id}, type={self.discount_type}, value={self.discount_value})>"
