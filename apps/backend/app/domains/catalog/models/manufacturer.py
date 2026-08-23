import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domains.shared.models import AuditMixin, IDMixin, SoftDeleteMixin

if TYPE_CHECKING:
    from app.domains.catalog.models.brand import Brand
    from app.domains.catalog.models.product import Product


class Manufacturer(Base, IDMixin, AuditMixin, SoftDeleteMixin):
    """
    Authoritative legal manufacturing entity for medical devices.
    Holds device master files, ISO 13485 certification, and legal regulatory provenance.
    """

    __tablename__ = "manufacturers"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    country_of_origin: Mapped[str | None] = mapped_column(String(2), nullable=True)  # ISO 3166-1 alpha-2
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    brands: Mapped[list["Brand"]] = relationship(
        "Brand", back_populates="manufacturer", lazy="selectin"
    )
    products: Mapped[list["Product"]] = relationship(
        "Product", back_populates="manufacturer", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Manufacturer(id={self.id}, name='{self.name}', slug='{self.slug}')>"
