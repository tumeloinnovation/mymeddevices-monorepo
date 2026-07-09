import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, ForeignKey, Enum as SQLEnum, DateTime, Numeric, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base


class ReturnRequest(Base):
    __tablename__ = "return_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    return_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    status = Column(
        SQLEnum("pending", "approved", "rejected", "processing", "completed", "refunded", name="return_status"),
        default="pending",
        nullable=False,
        index=True,
    )
    reason = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    items = Column(JSON, nullable=False, default=list)  # List of items being returned with UUIDs
    refund_method = Column(String(50), default="original")  # original, store_credit, bank_transfer
    refund_amount = Column(Numeric(10, 2), nullable=True)
    refund_transaction_id = Column(UUID(as_uuid=True), nullable=True)
    shipping_label = Column(Text, nullable=True)
    tracking_number = Column(String(100), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    customer = relationship("User", foreign_keys=[customer_id], backref="customer_returns")
    resolver = relationship("User", foreign_keys=[resolved_by], backref="resolved_returns")
