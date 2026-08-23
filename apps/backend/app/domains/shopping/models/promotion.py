import enum
import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Enum, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.domains.shared.models import AuditMixin, IDMixin


class PromotionType(str, enum.Enum):
    PERCENTAGE = "percentage"
    FIXED = "fixed"
    FREE_SHIPPING = "free_shipping"
    BUNDLE = "bundle"
    FLASH_SALE = "flash_sale"


class PromotionStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"
    EXPIRED = "expired"


class Promotion(Base, IDMixin, AuditMixin):
    __tablename__ = "promotions"

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str | None] = mapped_column(String(100), unique=True, index=True, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    promotion_type: Mapped[PromotionType] = mapped_column(
        Enum(PromotionType, name="promotion_type", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=PromotionType.PERCENTAGE,
        index=True,
    )
    discount_value: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    min_order_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0.0)
    max_discount_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    start_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    end_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    banner_text: Mapped[str | None] = mapped_column(String(255), nullable=True)
    badge_text: Mapped[str | None] = mapped_column(String(100), nullable=True)
    applicable_category_ids: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    applicable_product_ids: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    usage_limit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    usage_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    priority: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_by_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    def is_valid_now(self) -> bool:
        if not self.is_active:
            return False
        now = datetime.now(self.start_date.tzinfo if self.start_date else None)
        if self.start_date and now < self.start_date:
            return False
        if self.end_date and now > self.end_date:
            return False
        if self.usage_limit is not None and self.usage_count >= self.usage_limit:
            return False
        return True

    def __repr__(self) -> str:
        return f"<Promotion(id={self.id}, title='{self.title}', type='{self.promotion_type}', active={self.is_active})>"
