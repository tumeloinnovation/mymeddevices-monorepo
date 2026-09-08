import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.domains.shopping.models.promotion import PromotionType


class PromotionBase(BaseModel):
    title: str = Field(..., max_length=255)
    code: str | None = Field(None, max_length=100)
    description: str | None = None
    promotion_type: PromotionType = PromotionType.PERCENTAGE
    discount_value: Decimal = Field(default=Decimal("0.0"), ge=Decimal("0.0"))
    min_order_amount: Decimal = Field(default=Decimal("0.0"), ge=Decimal("0.0"))
    max_discount_amount: Decimal | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    is_active: bool = True
    banner_text: str | None = None
    badge_text: str | None = None
    applicable_category_ids: list[str] | None = None
    applicable_product_ids: list[str] | None = None
    usage_limit: int | None = None
    priority: int = 0


class PromotionCreate(PromotionBase):
    pass


class PromotionUpdate(BaseModel):
    title: str | None = None
    code: str | None = None
    description: str | None = None
    promotion_type: PromotionType | None = None
    discount_value: Decimal | None = None
    min_order_amount: Decimal | None = None
    max_discount_amount: Decimal | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    is_active: bool | None = None
    banner_text: str | None = None
    badge_text: str | None = None
    applicable_category_ids: list[str] | None = None
    applicable_product_ids: list[str] | None = None
    usage_limit: int | None = None
    priority: int | None = None


class PromotionResponse(PromotionBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    usage_count: int
    created_at: datetime
    updated_at: datetime
