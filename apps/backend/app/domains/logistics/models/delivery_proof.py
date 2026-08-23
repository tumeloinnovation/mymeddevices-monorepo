"""DeliveryProof model for proof of delivery support."""

import enum
import uuid
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from sqlalchemy import JSON, DateTime, ForeignKey
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.domains.shared.models import AuditMixin, IDMixin

if TYPE_CHECKING:
    from app.domains.logistics.models.delivery import Delivery


class ProofType(str, enum.Enum):
    """Type of proof of delivery evidence."""

    SIGNATURE = "signature"
    PHOTO = "photo"
    GPS_COORDINATE = "gps_coordinate"
    NOTES = "notes"


class DeliveryProof(Base, IDMixin, AuditMixin):
    """Proof of delivery evidence.

    Stores verification data for completed deliveries including
    signatures, photos, GPS coordinates, and notes.
    """

    __tablename__ = "delivery_proofs"

    delivery_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("deliveries.id", ondelete="CASCADE"), nullable=False, index=True
    )

    proof_type: Mapped[ProofType] = mapped_column(
        SQLEnum(ProofType, name="prooftype", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )

    # Proof data (signature image URL, photo URL, coordinates, etc.)
    proof_data: Mapped[dict] = mapped_column(JSON, nullable=False, default={})

    captured_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    captured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), nullable=False
    )

    # Relationships
    delivery: Mapped["Delivery"] = relationship("Delivery", back_populates="proofs")

    def __repr__(self) -> str:
        return f"<DeliveryProof(id={self.id}, type={self.proof_type})>"
