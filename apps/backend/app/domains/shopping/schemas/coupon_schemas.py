import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator


class CouponCreate(BaseModel):
    """Schema for creating a coupon (admin only)."""

    code: str = Field(..., min_length=2, max_length=100)
    description: str | None = Field(None, max_length=500)
    coupon_type: str = Field(..., description="percentage, fixed_amount, free_shipping, etc.")
    discount_value: float = Field(..., gt=0)
    discount_scope: str = Field(default="cart")
    vendor_id: uuid.UUID | None = None
    is_stackable: bool = False
    valid_from: datetime
    valid_until: datetime | None = None
    distribution_type: str = "public"

    # Restriction fields (will be used to create CouponRestriction)
    min_order_value: float | None = Field(None, ge=0)
    max_discount_amount: float | None = Field(None, gt=0)
    global_usage_limit: int | None = Field(None, gt=0)
    new_users_only: bool = False
    first_purchase_only: bool = False
    one_time_per_user: bool = True

    # Category and product restrictions
    category_ids: list[str] | None = None
    product_ids: list[uuid.UUID] | None = None


class CouponUpdate(BaseModel):
    """Schema for updating a coupon (admin only)."""

    description: str | None = Field(None, max_length=500)
    coupon_type: str | None = None
    discount_value: float | None = Field(None, gt=0)
    is_active: bool | None = None
    is_stackable: bool | None = None
    valid_from: datetime | None = None
    valid_until: datetime | None = None

    # Restriction updates
    min_order_value: float | None = None
    max_discount_amount: float | None = None
    global_usage_limit: int | None = None

    # Category and product restrictions
    category_ids: list[str] | None = None
    product_ids: list[uuid.UUID] | None = None


class CouponResponse(BaseModel):
    """Coupon response."""

    id: uuid.UUID
    code: str
    description: str | None = None
    coupon_type: str
    discount_value: float
    discount_scope: str
    vendor_id: uuid.UUID | None = None
    is_active: bool
    is_stackable: bool
    valid_from: datetime
    valid_until: datetime | None = None
    distribution_type: str

    # Flattened restrictions for easier response handling
    min_order_value: float | None = None
    max_discount_amount: float | None = None
    global_usage_limit: int | None = None

    # Category and product restrictions
    category_ids: list[str] | None = None
    product_ids: list[uuid.UUID] | None = None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def flatten_restrictions(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return data
        if hasattr(data, "restrictions") and data.restrictions:
            r = data.restrictions
            data.min_order_value = float(r.min_order_value) if r.min_order_value else None
            data.max_discount_amount = float(r.max_discount_amount) if r.max_discount_amount else None
            data.global_usage_limit = r.global_usage_limit

        if hasattr(data, "categories") and data.categories:
            data.category_ids = [c.category for c in data.categories]
        else:
            data.category_ids = []

        if hasattr(data, "products") and data.products:
            data.product_ids = [p.product_id for p in data.products]
        else:
            data.product_ids = []

        return data


class CouponValidationResponse(BaseModel):
    """Coupon validation result."""

    is_valid: bool
    coupon_id: uuid.UUID | None = None
    code: str
    message: str
    coupon_type: str | None = None
    discount_value: float | None = None
    discount_amount: float = 0.0
