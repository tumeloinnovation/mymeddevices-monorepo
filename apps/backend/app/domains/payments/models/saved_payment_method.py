import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, ForeignKey, Enum as SQLEnum, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class SavedPaymentMethod(Base):
    __tablename__ = "saved_payment_methods"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    payment_type = Column(
        SQLEnum("mpesa", "card", "bank_transfer", name="payment_type"),
        nullable=False,
    )
    is_default = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    # M-Pesa fields
    phone_number = Column(String(20), nullable=True)

    # Card fields (encrypted/tokenized)
    card_token = Column(String(255), nullable=True)  # Token from payment processor
    card_last4 = Column(String(4), nullable=True)
    card_brand = Column(String(20), nullable=True)  # visa, mastercard, etc.
    card_expiry_month = Column(String(2), nullable=True)
    card_expiry_year = Column(String(4), nullable=True)
    cardholder_name = Column(String(200), nullable=True)

    # Bank transfer fields
    bank_name = Column(String(100), nullable=True)
    bank_account_number = Column(String(50), nullable=True)  # Should be encrypted
    bank_account_name = Column(String(200), nullable=True)

    # Metadata
    display_name = Column(String(100), nullable=True)
    method_metadata = Column("metadata", Text, nullable=True)  # JSON string for additional data

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    customer = relationship("User", backref="saved_payment_methods")
