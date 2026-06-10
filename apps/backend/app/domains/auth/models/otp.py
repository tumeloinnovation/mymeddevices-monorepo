import uuid
from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
from app.domains.shared.models import IDMixin, AuditMixin

class OTP(Base, IDMixin, AuditMixin):
    __tablename__ = "otps"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    code: Mapped[str] = mapped_column(String(6), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_used: Mapped[bool] = mapped_column(default=False)
    purpose: Mapped[str] = mapped_column(String(50), default="verification") # verification, reset_password

    user: Mapped["User"] = relationship("User", back_populates="otps")
