from typing import Optional
from sqlalchemy import String, Boolean, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid

from app.core.database import Base
from app.domains.shared.models import IDMixin, AuditMixin

class Address(Base, IDMixin, AuditMixin):
    __tablename__ = "addresses"

    customer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("customer_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    type: Mapped[str] = mapped_column(String(20), default="shipping") # shipping, billing
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    address_line1: Mapped[str] = mapped_column(String(255), nullable=False)
    address_line2: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    state: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    country: Mapped[str] = mapped_column(String(100), default="Kenya")
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    place_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)

    # Relationships
    customer: Mapped["CustomerProfile"] = relationship("CustomerProfile", back_populates="addresses")

    def __repr__(self):
        return f"<Address(id={self.id}, type={self.type}, city={self.city})>"
