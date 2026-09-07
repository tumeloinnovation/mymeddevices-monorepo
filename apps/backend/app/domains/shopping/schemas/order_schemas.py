import uuid
from datetime import datetime
from typing import Any, Optional, Union

from pydantic import BaseModel, ConfigDict, field_serializer, field_validator

from app.core.field_types import OptionalKenyanPhone

# Import mobile money schemas for OrderResponse
from app.domains.payments.schemas.mobile_money_schemas import MobileMoneyPaymentResponse


class ProductMinResponse(BaseModel):
    """Minimal product response for order items."""

    id: uuid.UUID
    sku: str | None = None
    name: str
    image_url: str | None = None

    @field_serializer("image_url")
    @classmethod
    def serialize_image_url(cls, value: Any, _info: Any) -> str | None:
        """Ensure image_url is properly serialized from Product model's @property."""
        if value is None:
            return None
        return str(value) if value else None

    model_config = ConfigDict(from_attributes=True)


class OrderItemBase(BaseModel):
    product_id: uuid.UUID
    vendor_id: uuid.UUID
    quantity: float
    unit_price: int
    subtotal: int

    @field_validator("unit_price", "subtotal", mode="before")
    @classmethod
    def round_item_prices(cls, v: Union[int, float, str, None]) -> int | float | str | None:
        if v is not None:
            try:
                return round(float(v))
            except (ValueError, TypeError):
                pass
        return v


class OrderItemResponse(OrderItemBase):
    id: uuid.UUID
    product_name: str
    vendor_name: str | None = None
    sku: str | None = None
    fulfillment_status: str = "pending"
    tracking_number: str | None = None
    tracking_url: str | None = None
    total_price: int
    product: ProductMinResponse | None = None
    tax_category_code: str | None = "STANDARD_VAT_16"
    tax_rate_snapshot: float | None = 0.16
    tax_amount_snapshot: float | None = 0.0

    @field_validator("total_price", mode="before")
    @classmethod
    def round_total_price(cls, v: Union[int, float, str, None]) -> int | float | str | None:
        if v is not None:
            try:
                return round(float(v))
            except (ValueError, TypeError):
                pass
        return v

    model_config = ConfigDict(from_attributes=True)


class ShippingAddress(BaseModel):
    full_name: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    street: str | None = None
    address_line1: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = "Kenya"
    phone: OptionalKenyanPhone = None
    latitude: float | None = None
    longitude: float | None = None
    route_coordinates: list[Any] | None = None
    calculated_distance_km: float | None = None
    logistics_type: str | None = None
    assigned_driver_id: str | None = None
    payment_method: str | None = None
    payment_method_title: str | None = None
    shipping_amount: float | None = None
    packaging_fee: float | None = None
    services_fee: float | None = None
    tax_amount: float | None = None
    discount_amount: float | None = None

    model_config = ConfigDict(from_attributes=True)


class OrderBase(BaseModel):
    status: str = "pending"
    total_amount: int
    shipping_amount: int | None = 0
    packaging_fee: int | None = 100
    services_fee: int | None = 50
    tax_amount: int | None = 0
    discount_amount: int | None = 0
    subtotal: int | None = 0
    payment_method: str | None = "cod"
    payment_method_title: str | None = "Cash on Delivery"
    currency: str = "KES"
    shipping_address: ShippingAddress | None = None
    notes: str | None = None
    internal_notes: str | None = None

    @field_validator(
        "total_amount", "shipping_amount", "packaging_fee", "services_fee", "tax_amount", "discount_amount", "subtotal", mode="before"
    )
    @classmethod
    def round_order_amounts(cls, v: Union[int, float, str, None]) -> int | float | str | None:
        if v is not None:
            try:
                return round(float(v))
            except (ValueError, TypeError):
                pass
        return v


class OrderCreate(BaseModel):
    cart_id: uuid.UUID
    shipping_address: ShippingAddress
    notes: str | None = None
    idempotency_key: str | None = None
    guest_token: str | None = None
    points_to_redeem: int | None = 0


class OrderStatusUpdate(BaseModel):
    status: str


class OrderInternalNotesUpdate(BaseModel):
    internal_notes: str


class UserMinResponse(BaseModel):
    id: uuid.UUID
    first_name: str | None = None
    last_name: str | None = None
    email: str
    phone: str | None = None
    role: str | None = None
    company_name: str | None = None

    model_config = ConfigDict(from_attributes=True)


class OrderTimelineEventResponse(BaseModel):
    id: uuid.UUID
    status: str
    message: str
    created_at: datetime
    created_by: uuid.UUID | None = None

    model_config = ConfigDict(from_attributes=True)


class OrderResponse(OrderBase):
    id: uuid.UUID
    order_number: int | None = None
    user_id: uuid.UUID | None = None
    guest_token: str | None = None
    loyalty_discount: float | None = None
    loyalty_points_redeemed: int | None = None
    shipping_subsidy_amount: float | None = None
    created_at: datetime
    updated_at: datetime | None
    items: list[OrderItemResponse]
    user: UserMinResponse | None = None
    timeline_events: list[OrderTimelineEventResponse] | None = None
    mobile_money_payment: Optional["MobileMoneyPaymentResponse"] = None

    model_config = ConfigDict(from_attributes=True)


class OrderListResponse(BaseModel):
    orders: list[OrderResponse]
    total: int


class VendorOrderItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    sku: str | None = None
    quantity: float
    unit_price: int
    total: int
    status: str
    tracking_number: str | None = None
    tracking_url: str | None = None

    @field_validator("unit_price", "total", mode="before")
    @classmethod
    def round_item_prices(cls, v: Any) -> Any:
        if v is not None:
            try:
                return round(float(v))
            except (ValueError, TypeError):
                pass
        return v

    model_config = ConfigDict(from_attributes=True)


class VendorOrderResponse(BaseModel):
    id: uuid.UUID
    order_number: int | None = None
    customer_name: str
    customer_email: str
    status: str
    total_amount: int
    vendor_amount: int
    item_count: int
    created_at: datetime
    customer_notes: str | None = None
    items: list[VendorOrderItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class VendorOrderDetailResponse(VendorOrderResponse):
    shipping_address: ShippingAddress | None = None
    billing_address: ShippingAddress | None = None
    items: list[VendorOrderItemResponse]
    payment_method: str
    payment_status: str
    timeline: list[OrderTimelineEventResponse]


class VendorOrderListResponse(BaseModel):
    items: list[VendorOrderResponse]
    total: int
    page: int
    limit: int
    pages: int
    orders: list[VendorOrderResponse] | None = None
