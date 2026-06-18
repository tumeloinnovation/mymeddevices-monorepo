from sqlalchemy import String, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.domains.shared.models.base import IDMixin, AuditMixin

class SystemSetting(Base, IDMixin, AuditMixin):
    __tablename__ = "system_settings"

    key: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    value: Mapped[dict] = mapped_column(JSON)
    description: Mapped[str] = mapped_column(String(500), nullable=True)

    def __repr__(self) -> str:
        return f"<SystemSetting(key='{self.key}', value={self.value})>"
