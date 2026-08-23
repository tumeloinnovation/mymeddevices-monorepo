from datetime import datetime
from decimal import Decimal
from typing import Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field

from app.domains.catalog.models.bundle import BundleDiscountType


class BundleComponentCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(default=1, gt=0)
    sort_order: int = Field(default=0)
    allowed_vendor_ids: Optional[list[str]] = None


class BundleCreate(BaseModel):
    name: str = Field(min_length=3, max_length=255)
    slug: str = Field(min_length=3, max_length=255)
    description: Optional[str] = None
    discount_type: BundleDiscountType = BundleDiscountType.FIXED_AMOUNT
    discount_value: Decimal = Field(default=Decimal("0.00"), ge=0)
    funding_source: str = Field(default="PLATFORM")
    is_active: bool = True
    components: list[BundleComponentCreate] = Field(min_length=1)


class BundleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=255)
    slug: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = None
    discount_type: Optional[BundleDiscountType] = None
    discount_value: Optional[Decimal] = Field(None, ge=0)
    funding_source: Optional[str] = None
    is_active: Optional[bool] = None


class BundleComponentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    product_slug: str
    quantity: int
    sort_order: int
    gross_unit_price: Optional[Decimal] = None
    allocated_discount: Optional[Decimal] = None
    net_unit_price: Optional[Decimal] = None
    winning_vendor_name: Optional[str] = None


class BundleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    discount_type: BundleDiscountType
    discount_value: Decimal
    funding_source: str
    is_active: bool
    is_available: bool = True
    gross_customer_price: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    net_customer_price: Optional[Decimal] = None
    components: list[BundleComponentResponse] = []
    created_at: datetime
    updated_at: datetime
