import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domains.shared.models import AuditMixin, IDMixin, SoftDeleteMixin

if TYPE_CHECKING:
    from app.domains.catalog.models.brand import Brand
    from app.domains.catalog.models.bundle import BundleComponent
    from app.domains.catalog.models.bundle_item import BundleItem
    from app.domains.catalog.models.category import Category
    from app.domains.catalog.models.manufacturer import Manufacturer
    from app.domains.catalog.models.product_image import ProductImage
    from app.domains.catalog.models.product_variant import ProductVariant
    from app.domains.catalog.models.related_product import RelatedProduct
    from app.domains.catalog.models.tag import Tag
    from app.domains.customers.models.review import Review
    from app.domains.vendor.models.vendor_profile import VendorProfile


class Product(Base, IDMixin, AuditMixin, SoftDeleteMixin):
    """
    Authoritative canonical medical device model (Platform Owned).

    Lifecycle: draft -> pending_review -> published -> archived | legacy_unverified
    Single vs. multi-variant state is dynamically derived from variants count.
    """

    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_vendor_status", "vendor_id", "status"),
        Index("ix_products_status_featured", "status", "is_featured"),
        Index("ix_products_status_popularity", "status", "popularity_score"),
        Index("idx_products_status_deleted", "status", "is_deleted"),
        Index("idx_products_vendor_status_deleted", "vendor_id", "status", "is_deleted"),
        Index("ix_products_manufacturer_model", "manufacturer_id", "manufacturer_model_number"),
    )

    # ===============================
    # CANONICAL IDENTITY & TAXONOMY
    # ===============================
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True, index=True
    )
    brand_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("brands.id", ondelete="SET NULL"), nullable=True, index=True
    )
    manufacturer_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("manufacturers.id", ondelete="SET NULL"), nullable=True, index=True
    )
    manufacturer_model_number: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    slug: Mapped[str] = mapped_column(String(500), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    short_description: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    # ===============================
    # STATUS & VISIBILITY
    # ===============================
    status: Mapped[str] = mapped_column(
        String(20), default="draft", nullable=False, index=True
    )  # draft, pending_review, published, archived, legacy_unverified
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ===============================
    # MERCHANDISING FLAGS
    # ===============================
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_clinical_pick: Mapped[bool] = mapped_column(Boolean, default=False)
    is_on_sale: Mapped[bool] = mapped_column(Boolean, default=False)
    popularity_score: Mapped[int] = mapped_column(Integer, default=0)
    view_count: Mapped[int] = mapped_column(Integer, default=0)

    # ===============================
    # PHYSICAL ATTRIBUTES & SPECS
    # ===============================
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    dimensions: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # {length, width, height, unit}
    specifications: Mapped[dict | None] = mapped_column(JSONB, nullable=True)  # Structured category specs
    warranty_info: Mapped[str | None] = mapped_column(Text, nullable=True)

    # ===============================
    # SEO & CATALOG QUALITY
    # ===============================
    permalink: Mapped[str | None] = mapped_column(String(500), nullable=True)
    meta_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tags: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # ["surgical", "disposable", ...]
    completeness_score: Mapped[int] = mapped_column(Integer, default=0)
    ai_generated_fields: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # ===============================
    # TRANSITIONAL / LEGACY COLUMNS
    # Preserved as nullable for migration phases
    # ===============================
    vendor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vendor_profiles.id", ondelete="SET NULL"), nullable=True, index=True
    )
    product_type: Mapped[str] = mapped_column(
        String(20), default="simple", nullable=False, index=True
    )  # Deprecated: derived from len(variants)
    sku: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    base_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    markup_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    commission_fee: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    cost_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    wholesale_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    compare_at_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), default="KES")
    has_vat: Mapped[bool] = mapped_column(Boolean, default=True)
    vat_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=16.0)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
    stock_status: Mapped[str] = mapped_column(String(20), default="instock", nullable=False, index=True)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=5)
    track_inventory: Mapped[bool] = mapped_column(Boolean, default=True)
    brand: Mapped[str | None] = mapped_column(String(255), nullable=True)
    model_number: Mapped[str | None] = mapped_column(String(255), nullable=True)
    certifications: Mapped[list | None] = mapped_column(JSONB, nullable=True)

    # ===============================
    # RELATIONSHIPS
    # ===============================
    manufacturer: Mapped[Optional["Manufacturer"]] = relationship("Manufacturer", back_populates="products", lazy="selectin")
    category: Mapped[Optional["Category"]] = relationship("Category", back_populates="products", lazy="selectin")
    brand_relation: Mapped[Optional["Brand"]] = relationship("Brand", back_populates="products", lazy="selectin")
    vendor: Mapped[Optional["VendorProfile"]] = relationship("VendorProfile", backref="products")
    images: Mapped[list["ProductImage"]] = relationship(
        "ProductImage",
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductImage.sort_order",
        lazy="selectin",
    )
    variants: Mapped[list["ProductVariant"]] = relationship(
        "ProductVariant", back_populates="product", cascade="all, delete-orphan", lazy="selectin"
    )
    bundle_items: Mapped[list["BundleItem"]] = relationship(
        "BundleItem",
        foreign_keys="BundleItem.bundle_product_id",
        back_populates="bundle_product",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    bundle_components: Mapped[list["BundleComponent"]] = relationship(
        "BundleComponent", back_populates="product", cascade="all, delete-orphan", lazy="selectin"
    )
    related_products: Mapped[list["RelatedProduct"]] = relationship(
        "RelatedProduct",
        foreign_keys="RelatedProduct.product_id",
        back_populates="product",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    tags_relation: Mapped[list["Tag"]] = relationship(
        "Tag", secondary="product_tags", back_populates="products", lazy="selectin"
    )
    reviews: Mapped[list["Review"]] = relationship(
        "Review", back_populates="product", cascade="all, delete-orphan", lazy="selectin"
    )

    @property
    def category_name(self) -> str | None:
        """Get the category name from the relationship"""
        return self.category.name if self.category else None

    @property
    def category_slug(self) -> str | None:
        """Get the category slug from the relationship"""
        return self.category.slug if self.category else None

    @property
    def active_variants(self) -> list["ProductVariant"]:
        """Get active sellable variants."""
        return [v for v in self.variants if v.is_active]

    @property
    def is_single_variant(self) -> bool:
        """Derived property: Single-variant products have exactly 1 active variant."""
        return len(self.active_variants) <= 1

    @property
    def is_multi_variant(self) -> bool:
        """Derived property: Multi-variant products have 2 or more active variants."""
        return len(self.active_variants) > 1

    @property
    def image_url(self) -> str | None:
        """Get the primary image URL or first image URL if available."""
        if self.images:
            for img in self.images:
                if img.is_primary:
                    return img.url
            if self.images:
                return self.images[0].url
        return None

    def __repr__(self) -> str:
        return f"<Product(id={self.id}, name='{self.name}', slug='{self.slug}', status='{self.status}')>"
