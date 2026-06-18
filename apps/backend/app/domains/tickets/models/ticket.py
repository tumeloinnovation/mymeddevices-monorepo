import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, ForeignKey, Enum as SQLEnum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.core.database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_number = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=False, default="general")
    priority = Column(SQLEnum("low", "medium", "high", "urgent", name="ticket_priority"), default="medium")
    status = Column(SQLEnum("open", "in_progress", "waiting_on_customer", "resolved", "closed", name="ticket_status"), default="open", index=True)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    resolution = Column(Text, nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_reply_at = Column(DateTime(timezone=True), nullable=True)
    ticket_metadata = Column("metadata", JSONB, nullable=True)

    # Relationships
    customer = relationship("User", foreign_keys=[customer_id], backref="customer_tickets")
    assignee = relationship("User", foreign_keys=[assigned_to], backref="assigned_tickets")
    replies = relationship("TicketReply", back_populates="ticket", cascade="all, delete-orphan", order_by="TicketReply.created_at")


class TicketReply(Base):
    __tablename__ = "ticket_replies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_id = Column(UUID(as_uuid=True), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    is_internal = Column(SQLEnum("yes", "no", name="yes_no"), default="no", nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    ticket = relationship("Ticket", back_populates="replies")
    user = relationship("User", backref="ticket_replies")
