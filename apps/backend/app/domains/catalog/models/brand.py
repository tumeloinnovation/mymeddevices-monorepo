from typing import Optional, List
from sqlalchemy import String, Text, Boolean, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.domains.shared.models import IDMixin, AuditMixin, SoftDeleteMixin
import uuid


class Brand(Base, IDMixin, AuditMixin, SoftDeleteMixin):
    """Brand model for medical device manufacturers and suppliers."""
    __tablename__ = "brands"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    website_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    products: Mapped[List["Product"]] = relationship(
        "Product",
        back_populates="brand_relation",
        lazy="selectin"
    )
