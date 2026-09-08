import uuid
from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class LoyaltyLedger(Base):
    __tablename__ = "loyalty_ledger"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_type = Column(String(50), nullable=False)  # earn, redeem, expire, adjust
    points = Column(Integer, nullable=False)  # positive for earn, negative for redeem
    balance_after = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    reference_type = Column(String(50), nullable=True)  # order, refund, manual, etc.
    reference_id = Column(UUID(as_uuid=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    # Relationships
    customer = relationship("User", backref="loyalty_ledger_entries")
