from typing import Optional
from sqlalchemy import String, Boolean, Integer, Numeric, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.domains.shared.models import IDMixin, AuditMixin
import uuid


class ProductVariant(Base, IDMixin, AuditMixin):
    """Product variants for different sizes, configurations, etc."""
    __tablename__ = "product_variants"

    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    price_adjustment: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True, default=0)
    stock_quantity: Mapped[int] = mapped_column(Integer, default=0)
    attributes: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)  # {size: "L", color: "blue"}
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationship
    product: Mapped["Product"] = relationship("Product", back_populates="variants")
