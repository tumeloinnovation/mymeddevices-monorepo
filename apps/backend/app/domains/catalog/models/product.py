from typing import Optional, List
from datetime import datetime
from sqlalchemy import (
    String, Text, Boolean, Integer, Float, Numeric,
    ForeignKey, JSON, DateTime, Index
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.domains.shared.models import IDMixin, AuditMixin, SoftDeleteMixin
import uuid


class Product(Base, IDMixin, AuditMixin, SoftDeleteMixin):
    """
    Core product model for medical device marketplace.
    
    Lifecycle: draft -> pending_review -> published -> archived
    Products must be verified by the vendor before publishing.
    """
    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_vendor_status", "vendor_id", "status"),
        Index("ix_products_status_featured", "status", "is_featured"),
        Index("ix_products_status_popularity", "status", "popularity_score"),
        Index("idx_products_status_deleted", "status", "is_deleted"),
        Index("idx_products_vendor_status_deleted", "vendor_id", "status", "is_deleted"),
    )

    # ===============================
    # OWNERSHIP
    # ===============================
    vendor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("vendor_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    category_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # ===============================
    # BASIC INFO
    # ===============================
    product_type: Mapped[str] = mapped_column(
        String(20), default="simple", nullable=False, index=True
    )  # simple, variable, bundle
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    slug: Mapped[str] = mapped_column(String(500), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    short_description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    sku: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)

    # ===============================
    # PRICING & TAX
    # ===============================
    base_price: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)  # Vendor payout
    markup_price: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    commission_fee: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    price: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)  # Final customer retail price
    cost_price: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)  # Internal vendor cost
    wholesale_price: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)  # B2B bulk price
    compare_at_price: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)  # Slash-through price
    currency: Mapped[str] = mapped_column(String(3), default="KES")
    has_vat: Mapped[bool] = mapped_column(Boolean, default=True)
    vat_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=16.0)

    # ===============================
    # INVENTORY
    # ===============================
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
    stock_status: Mapped[str] = mapped_column(
        String(20),
        default="instock",
        nullable=False,
        index=True
    )  # instock, outofstock, backorder
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=5)
    track_inventory: Mapped[bool] = mapped_column(Boolean, default=True)

    # ===============================
    # STATUS & VISIBILITY
    # ===============================
    status: Mapped[str] = mapped_column(
        String(20),
        default="draft",
        nullable=False,
        index=True
    )  # draft, pending_review, published, archived
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ===============================
    # MERCHANDISING FLAGS
    # ===============================
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_clinical_pick: Mapped[bool] = mapped_column(Boolean, default=False)
    is_on_sale: Mapped[bool] = mapped_column(Boolean, default=False)
    popularity_score: Mapped[int] = mapped_column(Integer, default=0)
    view_count: Mapped[int] = mapped_column(Integer, default=0)

    # ===============================
    # PHYSICAL ATTRIBUTES
    # ===============================
    weight_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    dimensions: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {length, width, height, unit}

    # ===============================
    # MEDICAL DEVICE SPECIFICS
    # ===============================
    brand_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("brands.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    brand: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # Legacy, kept for backward compatibility
    model_number: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    specifications: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # Flexible key-value specs
    certifications: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # [{type, number, expiry}]
    kmpdb_registration_number: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ppb_classification: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    ce_marking_or_fda_clearance: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    warranty_info: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # ===============================
    # SEO
    # ===============================
    permalink: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)  # For SEO/external URL references
    meta_title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    meta_description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    tags: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)  # ["surgical", "disposable", ...]

    # ===============================
    # AI ASSIST TRACKING
    # ===============================
    ai_generated_fields: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # Tracks which fields AI filled
    completeness_score: Mapped[int] = mapped_column(Integer, default=0)

    # ===============================
    # RELATIONSHIPS
    # ===============================
    vendor: Mapped["VendorProfile"] = relationship(
        "VendorProfile",
        backref="products"
    )
    category: Mapped[Optional["Category"]] = relationship(
        "Category",
        back_populates="products",
        lazy="selectin"
    )
    images: Mapped[List["ProductImage"]] = relationship(
        "ProductImage",
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="ProductImage.sort_order",
        lazy="selectin"
    )
    variants: Mapped[List["ProductVariant"]] = relationship(
        "ProductVariant",
        back_populates="product",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    bundle_items: Mapped[List["BundleItem"]] = relationship(
        "BundleItem",
        foreign_keys="BundleItem.bundle_product_id",
        back_populates="bundle_product",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    related_products: Mapped[List["RelatedProduct"]] = relationship(
        "RelatedProduct",
        foreign_keys="RelatedProduct.product_id",
        back_populates="product",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    brand_relation: Mapped[Optional["Brand"]] = relationship(
        "Brand",
        back_populates="products"
    )
    tags_relation: Mapped[List["Tag"]] = relationship(
        "Tag",
        secondary="product_tags",
        back_populates="products",
        lazy="selectin"
    )
    reviews: Mapped[List["Review"]] = relationship(
        "Review",
        back_populates="product",
        cascade="all, delete-orphan",
        lazy="selectin"
    )

    @property
    def category_name(self) -> Optional[str]:
        """Get the category name from the relationship"""
        return self.category.name if self.category else None

    @property
    def image_url(self) -> Optional[str]:
        """Get the primary image URL or first image URL if available."""
        if self.images:
            # Try to find the primary image first
            for img in self.images:
                if img.is_primary:
                    return img.url
            # Fall back to the first image (sort_order=0 is the hero image)
            if self.images:
                return self.images[0].url
        return None
