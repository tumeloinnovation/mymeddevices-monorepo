import enum
import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, CheckConstraint, Enum, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domains.shared.models import AuditMixin, IDMixin

if TYPE_CHECKING:
    from app.domains.catalog.models.product import Product


class BundleDiscountType(str, enum.Enum):
    FIXED_AMOUNT = "FIXED_AMOUNT"
    PERCENTAGE = "PERCENTAGE"


class Bundle(Base, IDMixin, AuditMixin):
    """
    Merchandising bundle entity (e.g. "Clinic Starter Kit", "Maternity Diagnostic Package").
    Bundles dynamically resolve into eligible component product offers at checkout.
    """

    __tablename__ = "bundles"
    __table_args__ = (
        CheckConstraint("discount_value >= 0", name="chk_bundle_discount_val_pos"),
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    discount_type: Mapped[BundleDiscountType] = mapped_column(
        Enum(BundleDiscountType), default=BundleDiscountType.FIXED_AMOUNT, nullable=False
    )
    discount_value: Mapped[float] = mapped_column(Numeric(12, 2), default=0.00, nullable=False)
    funding_source: Mapped[str] = mapped_column(String(20), default="PLATFORM", nullable=False)  # PLATFORM, VENDOR, MIXED
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    components: Mapped[list["BundleComponent"]] = relationship(
        "BundleComponent", back_populates="bundle", cascade="all, delete-orphan", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Bundle(id={self.id}, name='{self.name}', slug='{self.slug}', discount={self.discount_value})>"


class BundleComponent(Base, IDMixin):
    """
    Component product included in a merchandising bundle.
    V1 Invariant: Component Product MUST have exactly ONE active sellable ProductVariant.
    """

    __tablename__ = "bundle_components"
    __table_args__ = (
        UniqueConstraint("bundle_id", "product_id", name="uq_bundle_product"),
        CheckConstraint("quantity > 0", name="chk_bundle_comp_qty_pos"),
    )

    bundle_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("bundles.id", ondelete="CASCADE"), nullable=False, index=True
    )
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    quantity: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    allowed_vendor_ids: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)

    # Relationships
    bundle: Mapped["Bundle"] = relationship("Bundle", back_populates="components")
    product: Mapped["Product"] = relationship("Product", lazy="selectin")

    def __repr__(self) -> str:
        return f"<BundleComponent(bundle_id={self.bundle_id}, product_id={self.product_id}, qty={self.quantity})>"
