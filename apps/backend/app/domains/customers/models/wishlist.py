import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domains.shared.models import AuditMixin, IDMixin

if TYPE_CHECKING:
    from app.domains.catalog.models.product import Product
    from app.domains.customers.models.customer_profile import CustomerProfile


class WishlistItem(Base, IDMixin, AuditMixin):
    __tablename__ = "wishlist_items"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("customer_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )

    notes: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Relationships
    customer: Mapped["CustomerProfile"] = relationship("CustomerProfile", back_populates="wishlist_items")
    product: Mapped["Product"] = relationship("Product")

    def __repr__(self):
        return f"<WishlistItem(customer_id={self.customer_id}, product_id={self.product_id})>"
