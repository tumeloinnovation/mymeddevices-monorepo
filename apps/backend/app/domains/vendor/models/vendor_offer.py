import enum
import uuid
from typing import TYPE_CHECKING, Optional

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domains.shared.models import AuditMixin, IDMixin

if TYPE_CHECKING:
    from app.domains.catalog.models.product_variant import ProductVariant
    from app.domains.vendor.models.vendor_profile import VendorProfile


class SellingUnitEnum(str, enum.Enum):
    PIECE = "PIECE"
    BOX = "BOX"
    PACK = "PACK"
    CARTON = "CARTON"
    CASE = "CASE"


class OfferStatusEnum(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"
    OUT_OF_STOCK = "OUT_OF_STOCK"


class VendorOffer(Base, IDMixin, AuditMixin):
    """
    Commercial offering of a canonical ProductVariant by a specific vendor.
    Owns vendor pricing, packaging units, vendor SKU, lead times, and warranty terms.
    """

    __tablename__ = "vendor_offers"
    __table_args__ = (
        UniqueConstraint(
            "vendor_id",
            "product_variant_id",
            "selling_unit",
            "package_quantity",
            name="uq_vendor_variant_pkg",
        ),
        CheckConstraint("vendor_price > 0", name="chk_vendor_price_pos"),
        CheckConstraint("package_quantity > 0", name="chk_package_qty_pos"),
        CheckConstraint("min_order_quantity > 0", name="chk_min_order_qty_pos"),
        CheckConstraint(
            "max_order_quantity IS NULL OR max_order_quantity >= min_order_quantity",
            name="chk_max_ge_min_order_qty",
        ),
        CheckConstraint("lead_time_days >= 0", name="chk_lead_time_pos"),
        CheckConstraint("warranty_months >= 0", name="chk_warranty_months_pos"),
        Index("ix_vendor_offers_variant_status", "product_variant_id", "status"),
        Index(
            "ix_vendor_offers_buybox",
            "product_variant_id",
            "selling_unit",
            "package_quantity",
            "status",
            "vendor_price",
        ),
    )

    vendor_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vendor_profiles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_variant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("product_variants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    vendor_sku: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)
    vendor_price: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    compare_at_vendor_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)

    # Packaging Specifications
    selling_unit: Mapped[SellingUnitEnum] = mapped_column(
        Enum(SellingUnitEnum, native_enum=False), default=SellingUnitEnum.PIECE, nullable=False, index=True
    )
    package_quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)

    # Commercial Constraints
    min_order_quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    max_order_quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    lead_time_days: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    warranty_months: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[OfferStatusEnum] = mapped_column(
        Enum(OfferStatusEnum, native_enum=False), default=OfferStatusEnum.ACTIVE, nullable=False, index=True
    )

    # Clean Extension Points for Future ERP/CSV Sync
    external_system: Mapped[str | None] = mapped_column(String(50), nullable=True)
    external_offer_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sync_metadata: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    last_synced_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    vendor: Mapped["VendorProfile"] = relationship("VendorProfile", backref="offers")
    product_variant: Mapped["ProductVariant"] = relationship("ProductVariant", back_populates="offers")
    inventory: Mapped[Optional["OfferInventory"]] = relationship(
        "OfferInventory", back_populates="offer", uselist=False, cascade="all, delete-orphan", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<VendorOffer(id={self.id}, vendor_id={self.vendor_id}, variant_id={self.product_variant_id}, price={self.vendor_price}, pkg={self.selling_unit}:{self.package_quantity})>"


class OfferInventory(Base, IDMixin, AuditMixin):
    """
    Physical stock tracking per VendorOffer.
    Separates available on-hand inventory from reserved checkout allocations.
    """

    __tablename__ = "offer_inventories"
    __table_args__ = (
        CheckConstraint("quantity_on_hand >= 0", name="chk_qty_onhand_pos"),
        CheckConstraint("quantity_reserved >= 0", name="chk_qty_res_pos"),
        CheckConstraint("quantity_reserved <= quantity_on_hand", name="chk_res_le_onhand"),
        CheckConstraint("low_stock_threshold >= 0", name="chk_low_stock_pos"),
        Index("ix_offer_inventories_offer_id", "vendor_offer_id"),
    )

    vendor_offer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("vendor_offers.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    quantity_on_hand: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    quantity_reserved: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    low_stock_threshold: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    warehouse_location: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Relationships
    offer: Mapped["VendorOffer"] = relationship("VendorOffer", back_populates="inventory")

    @property
    def available_quantity(self) -> int:
        """Units available for immediate purchase."""
        return max(0, self.quantity_on_hand - self.quantity_reserved)

    def __repr__(self) -> str:
        return f"<OfferInventory(offer_id={self.vendor_offer_id}, on_hand={self.quantity_on_hand}, reserved={self.quantity_reserved})>"
