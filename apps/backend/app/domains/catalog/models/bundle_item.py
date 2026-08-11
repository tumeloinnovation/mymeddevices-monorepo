import uuid
from typing import Optional
from sqlalchemy import String, Boolean, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.domains.shared.models import IDMixin, AuditMixin


class BundleItem(Base, IDMixin, AuditMixin):
    """Links a bundle product to its component products with quantities."""
    __tablename__ = "bundle_items"

    bundle_product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    component_product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_optional: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships
    bundle_product: Mapped["Product"] = relationship("Product", foreign_keys=[bundle_product_id], back_populates="bundle_items")
    component_product: Mapped["Product"] = relationship("Product", foreign_keys=[component_product_id])
