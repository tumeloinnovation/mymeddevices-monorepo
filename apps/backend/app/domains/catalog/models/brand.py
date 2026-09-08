import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domains.shared.models import AuditMixin, IDMixin, SoftDeleteMixin

if TYPE_CHECKING:
    from app.domains.catalog.models.manufacturer import Manufacturer
    from app.domains.catalog.models.product import Product


class Brand(Base, IDMixin, AuditMixin, SoftDeleteMixin):
    """Brand model for medical device commercial labels."""

    __tablename__ = "brands"

    manufacturer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("manufacturers.id", ondelete="SET NULL"), nullable=True, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)  # Changed to TEXT for base64 support
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    approval_status: Mapped[str] = mapped_column(
        String(20), default="approved", nullable=False, index=True
    )  # "pending", "approved", "rejected"

    # Relationships
    manufacturer: Mapped[Optional["Manufacturer"]] = relationship("Manufacturer", back_populates="brands")
    products: Mapped[list["Product"]] = relationship("Product", back_populates="brand_relation", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Brand(id={self.id}, name='{self.name}', slug='{self.slug}')>"
