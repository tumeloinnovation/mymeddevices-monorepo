import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.domains.catalog.models.bundle import BundleDiscountType


class BundleComponentCreate(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(default=1, gt=0)
    sort_order: int = Field(default=0)
    allowed_vendor_ids: list[str] | None = None


class BundleCreate(BaseModel):
    name: str = Field(min_length=3, max_length=255)
    slug: str = Field(min_length=3, max_length=255)
    description: str | None = None
    discount_type: BundleDiscountType = BundleDiscountType.FIXED_AMOUNT
    discount_value: Decimal = Field(default=Decimal("0.00"), ge=0)
    funding_source: str = Field(default="PLATFORM")
    is_active: bool = True
    components: list[BundleComponentCreate] = Field(min_length=1)


class BundleUpdate(BaseModel):
    name: str | None = Field(None, min_length=3, max_length=255)
    slug: str | None = Field(None, min_length=3, max_length=255)
    description: str | None = None
    discount_type: BundleDiscountType | None = None
    discount_value: Decimal | None = Field(None, ge=0)
    funding_source: str | None = None
    is_active: bool | None = None


class BundleComponentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    product_slug: str
    quantity: int
    sort_order: int
    gross_unit_price: Decimal | None = None
    allocated_discount: Decimal | None = None
    net_unit_price: Decimal | None = None
    winning_vendor_name: str | None = None


class BundleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    description: str | None = None
    discount_type: BundleDiscountType
    discount_value: Decimal
    funding_source: str
    is_active: bool
    is_available: bool = True
    gross_customer_price: Decimal | None = None
    discount_amount: Decimal | None = None
    net_customer_price: Decimal | None = None
    components: list[BundleComponentResponse] = []
    created_at: datetime
    updated_at: datetime
