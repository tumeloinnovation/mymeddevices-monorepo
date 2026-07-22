import uuid
from typing import Optional, List, Any
from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import datetime


class CouponCreate(BaseModel):
    """Schema for creating a coupon (admin only)."""
    code: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    coupon_type: str = Field(..., description="percentage, fixed_amount, free_shipping, etc.")
    discount_value: float = Field(..., gt=0)
    discount_scope: str = Field(default="cart")
    vendor_id: Optional[uuid.UUID] = None
    is_stackable: bool = False
    valid_from: datetime
    valid_until: Optional[datetime] = None
    distribution_type: str = "public"
    
    # Restriction fields (will be used to create CouponRestriction)
    min_order_value: Optional[float] = Field(None, ge=0)
    max_discount_amount: Optional[float] = Field(None, gt=0)
    global_usage_limit: Optional[int] = Field(None, gt=0)
    new_users_only: bool = False
    first_purchase_only: bool = False
    one_time_per_user: bool = True

    # Category and product restrictions
    category_ids: Optional[List[str]] = None
    product_ids: Optional[List[uuid.UUID]] = None


class CouponUpdate(BaseModel):
    """Schema for updating a coupon (admin only)."""
    description: Optional[str] = Field(None, max_length=500)
    coupon_type: Optional[str] = None
    discount_value: Optional[float] = Field(None, gt=0)
    is_active: Optional[bool] = None
    is_stackable: Optional[bool] = None
    valid_from: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    
    # Restriction updates
    min_order_value: Optional[float] = None
    max_discount_amount: Optional[float] = None
    global_usage_limit: Optional[int] = None

    # Category and product restrictions
    category_ids: Optional[List[str]] = None
    product_ids: Optional[List[uuid.UUID]] = None


class CouponResponse(BaseModel):
    """Coupon response."""
    id: uuid.UUID
    code: str
    description: Optional[str] = None
    coupon_type: str
    discount_value: float
    discount_scope: str
    vendor_id: Optional[uuid.UUID] = None
    is_active: bool
    is_stackable: bool
    valid_from: datetime
    valid_until: Optional[datetime] = None
    distribution_type: str
    
    # Flattened restrictions for easier response handling
    min_order_value: Optional[float] = None
    max_discount_amount: Optional[float] = None
    global_usage_limit: Optional[int] = None

    # Category and product restrictions
    category_ids: Optional[List[str]] = None
    product_ids: Optional[List[uuid.UUID]] = None
    
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

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
    coupon_id: Optional[uuid.UUID] = None
    code: str
    message: str
    coupon_type: Optional[str] = None
    discount_value: Optional[float] = None
    discount_amount: float = 0.0
