import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domains.shared.models import AuditMixin, IDMixin, SoftDeleteMixin

if TYPE_CHECKING:
    from app.domains.catalog.models.category_attribute import CategoryAttributeDefinition
    from app.domains.catalog.models.product import Product


class Category(Base, IDMixin, AuditMixin, SoftDeleteMixin):
    """Hierarchical category taxonomy for medical device products."""

    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    permalink: Mapped[str | None] = mapped_column(String(500), nullable=True)  # For SEO/external URL references
    icon_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tax_category_code: Mapped[str] = mapped_column(
        String(50), default="STANDARD_VAT_16", nullable=False
    )  # e.g., 'EXEMPT_MEDICAL_DEVICE', 'STANDARD_VAT_16'
    min_warranty_months: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Self-referential hierarchy
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Relationships
    parent: Mapped[Optional["Category"]] = relationship(
        "Category", remote_side="Category.id", back_populates="children"
    )
    children: Mapped[list["Category"]] = relationship(
        "Category", back_populates="parent", cascade="all, delete-orphan", lazy="selectin"
    )
    products: Mapped[list["Product"]] = relationship("Product", back_populates="category")
    attribute_definitions: Mapped[list["CategoryAttributeDefinition"]] = relationship(
        "CategoryAttributeDefinition", back_populates="category", cascade="all, delete-orphan", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Category(id={self.id}, name='{self.name}', slug='{self.slug}')>"
