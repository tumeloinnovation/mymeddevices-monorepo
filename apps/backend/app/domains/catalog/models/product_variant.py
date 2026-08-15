import uuid
from typing import TYPE_CHECKING

from sqlalchemy import JSON, Boolean, Float, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domains.shared.models import AuditMixin, IDMixin

if TYPE_CHECKING:
    from app.domains.catalog.models.product import Product


class ProductVariant(Base, IDMixin, AuditMixin):
    """Product variants for different sizes, configurations, etc."""

    __tablename__ = "product_variants"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[str | None] = mapped_column(String(100), nullable=True)
    price_adjustment: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True, default=0)
    override_price: Mapped[float | None] = mapped_column(Numeric(12, 2), nullable=True)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
    attributes: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # {"size": "L", "color": "blue"}
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    image_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Relationship
    product: Mapped["Product"] = relationship("Product", back_populates="variants")

    @hybrid_property
    def calculated_price(self) -> float | None:
        if self.override_price is not None:
            return float(self.override_price)
        if self.price_adjustment is not None and self.product and self.product.price is not None:
            return float(self.product.price) + float(self.price_adjustment)
        return float(self.product.price) if self.product and self.product.price is not None else None
