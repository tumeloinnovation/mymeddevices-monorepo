import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.domains.shopping.models.promotion import PromotionType


class PromotionBase(BaseModel):
    title: str = Field(..., max_length=255)
    code: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    promotion_type: PromotionType = PromotionType.PERCENTAGE
    discount_value: Decimal = Field(default=Decimal("0.0"), ge=Decimal("0.0"))
    min_order_amount: Decimal = Field(default=Decimal("0.0"), ge=Decimal("0.0"))
    max_discount_amount: Optional[Decimal] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: bool = True
    banner_text: Optional[str] = None
    badge_text: Optional[str] = None
    applicable_category_ids: Optional[list[str]] = None
    applicable_product_ids: Optional[list[str]] = None
    usage_limit: Optional[int] = None
    priority: int = 0


class PromotionCreate(PromotionBase):
    pass


class PromotionUpdate(BaseModel):
    title: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    promotion_type: Optional[PromotionType] = None
    discount_value: Optional[Decimal] = None
    min_order_amount: Optional[Decimal] = None
    max_discount_amount: Optional[Decimal] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_active: Optional[bool] = None
    banner_text: Optional[str] = None
    badge_text: Optional[str] = None
    applicable_category_ids: Optional[list[str]] = None
    applicable_product_ids: Optional[list[str]] = None
    usage_limit: Optional[int] = None
    priority: Optional[int] = None


class PromotionResponse(PromotionBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    usage_count: int
    created_at: datetime
    updated_at: datetime
