import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.domains.vendor.models.vendor_offer import OfferStatusEnum, SellingUnitEnum


class VendorOfferCreate(BaseModel):
    product_variant_id: uuid.UUID
    vendor_sku: str | None = None
    vendor_price: Decimal = Field(gt=0, description="Vendor base price/payout")
    compare_at_vendor_price: Decimal | None = None
    selling_unit: SellingUnitEnum = SellingUnitEnum.PIECE
    package_quantity: int = Field(default=1, gt=0, description="Items per selling package")
    min_order_quantity: int = Field(default=1, gt=0)
    max_order_quantity: int | None = None
    lead_time_days: int = Field(default=1, ge=0)
    warranty_months: int = Field(default=0, ge=0)
    initial_stock_quantity: int = Field(default=0, ge=0)
    low_stock_threshold: int = Field(default=5, ge=0)
    warehouse_location: str | None = None
    external_system: str | None = None
    external_offer_id: str | None = None


class VendorOfferUpdate(BaseModel):
    vendor_sku: str | None = None
    vendor_price: Decimal | None = Field(None, gt=0)
    compare_at_vendor_price: Decimal | None = None
    selling_unit: SellingUnitEnum | None = None
    package_quantity: int | None = Field(None, gt=0)
    min_order_quantity: int | None = Field(None, gt=0)
    max_order_quantity: int | None = None
    lead_time_days: int | None = Field(None, ge=0)
    warranty_months: int | None = Field(None, ge=0)
    status: OfferStatusEnum | None = None


class OfferInventoryUpdate(BaseModel):
    quantity_on_hand: int = Field(ge=0)
    low_stock_threshold: int | None = Field(None, ge=0)
    warehouse_location: str | None = None


class OfferInventoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    quantity_on_hand: int
    quantity_reserved: int
    available_quantity: int
    low_stock_threshold: int
    warehouse_location: str | None = None
    updated_at: datetime


class VendorOfferResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    vendor_id: uuid.UUID
    product_variant_id: uuid.UUID
    vendor_sku: str | None = None
    vendor_price: Decimal
    compare_at_vendor_price: Decimal | None = None
    selling_unit: SellingUnitEnum
    package_quantity: int
    min_order_quantity: int
    max_order_quantity: int | None = None
    lead_time_days: int
    warranty_months: int
    status: OfferStatusEnum
    calculated_customer_price: Decimal | None = None
    inventory: OfferInventoryResponse | None = None
    created_at: datetime
    updated_at: datetime


class BuyBoxCandidateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    offer_id: uuid.UUID
    vendor_id: uuid.UUID
    vendor_name: str
    selling_unit: SellingUnitEnum
    package_quantity: int
    package_display_label: str
    vendor_price: Decimal
    customer_price: Decimal
    unit_customer_price: Decimal
    lead_time_days: int
    warranty_months: int
    available_stock: int
    is_buy_box_winner: bool
