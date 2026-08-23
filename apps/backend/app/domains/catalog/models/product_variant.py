import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Float, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domains.shared.models import AuditMixin, IDMixin

if TYPE_CHECKING:
    from app.domains.catalog.models.category_attribute import VariantAttributeValue
    from app.domains.catalog.models.product import Product
    from app.domains.vendor.models.vendor_offer import VendorOffer


class ProductVariant(Base, IDMixin, AuditMixin):
    """
    Platform-owned physical configuration variant of a canonical Product.
    Configured via platform-controlled CategoryAttributeDefinitions.
    """

    __tablename__ = "product_variants"
    __table_args__ = (
        UniqueConstraint("product_id", "variant_slug", name="uq_product_variant_slug"),
    )

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    variant_slug: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    gtin_or_ean: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    attributes_summary: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # {"folds": "5", "actuation": "Electric"}
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    dimensions_cm: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # {"length": 210, "width": 95, "height": 60}
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    image_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # Legacy transition columns (preserved for backward compatibility during phased migration)
    sku: Mapped[str | None] = mapped_column(String(100), nullable=True)
    price_adjustment: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True, default=0)
    override_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    attributes: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Relationships
    product: Mapped["Product"] = relationship("Product", back_populates="variants")
    attribute_values: Mapped[list["VariantAttributeValue"]] = relationship(
        "VariantAttributeValue", back_populates="product_variant", cascade="all, delete-orphan", lazy="selectin"
    )
    offers: Mapped[list["VendorOffer"]] = relationship(
        "VendorOffer", back_populates="product_variant", cascade="all, delete-orphan", lazy="selectin"
    )

    @hybrid_property
    def calculated_price(self) -> float | None:
        if self.override_price is not None:
            return float(self.override_price)
        if self.price_adjustment is not None and self.product and self.product.price is not None:
            return float(self.product.price) + float(self.price_adjustment)
        return float(self.product.price) if self.product and self.product.price is not None else None

    def __repr__(self) -> str:
        return f"<ProductVariant(id={self.id}, product_id={self.product_id}, name='{self.name}')>"
