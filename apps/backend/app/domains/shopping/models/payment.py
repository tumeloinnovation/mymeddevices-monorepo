from sqlalchemy import Column, String, Float, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.core.database import Base
from app.domains.shared.models import IDMixin, AuditMixin

class Payment(Base, IDMixin, AuditMixin):
    __tablename__ = "payments"

    order_id = Column(ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), default="KES", nullable=False)
    payment_method = Column(String(50), nullable=False) # mpesa, card, etc.
    status = Column(String(50), default="pending", nullable=False) # pending, completed, failed, refunded
    transaction_id = Column(String(100), unique=True, nullable=True)
    provider_response = Column(JSON, nullable=True)

    # Relationships
    order = relationship("Order", backref="payments")

    def __repr__(self):
        return f"<Payment(id={self.id}, order_id={self.order_id}, status={self.status})>"
