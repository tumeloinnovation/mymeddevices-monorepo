import uuid
from typing import Optional
from sqlalchemy import String, Boolean, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.domains.shared.models import IDMixin, AuditMixin


class RelatedProduct(Base, IDMixin, AuditMixin):
    """Explicit product-to-product relationships (cross_sell, upsell, accessory, spare_part)."""
    __tablename__ = "related_products"
    __table_args__ = (
        UniqueConstraint("product_id", "related_product_id", "relation_type", name="uq_related_products_pair_type"),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    related_product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    relation_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True
    )  # cross_sell, upsell, accessory, spare_part
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_bidirectional: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    product: Mapped["Product"] = relationship("Product", foreign_keys=[product_id], back_populates="related_products")
    related_product: Mapped["Product"] = relationship("Product", foreign_keys=[related_product_id], lazy="selectin")
