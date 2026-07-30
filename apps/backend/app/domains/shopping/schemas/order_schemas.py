from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Any, Union
from datetime import datetime
import uuid

class ProductMinResponse(BaseModel):
    """Minimal product response for order items."""
    id: uuid.UUID
    sku: Optional[str] = None
    name: str
    image_url: Optional[str] = None

    class Config:
        from_attributes = True

class OrderItemBase(BaseModel):
    product_id: uuid.UUID
    vendor_id: uuid.UUID
    quantity: float
    unit_price: int
    subtotal: int

    @field_validator("unit_price", "subtotal", mode="before")
    @classmethod
    def round_item_prices(cls, v: Union[int, float, str, None]) -> Optional[int]:
        if v is not None:
            try:
                return round(float(v))
            except (ValueError, TypeError):
                pass
        return v

class OrderItemResponse(OrderItemBase):
    id: uuid.UUID
    product_name: str
    fulfillment_status: str = "pending"
    tracking_number: Optional[str] = None
    tracking_url: Optional[str] = None
    total_price: int
    product: Optional[ProductMinResponse] = None

    @field_validator("total_price", mode="before")
    @classmethod
    def round_total_price(cls, v: Union[int, float, str, None]) -> Optional[int]:
        if v is not None:
            try:
                return round(float(v))
            except (ValueError, TypeError):
                pass
        return v

    class Config:
        from_attributes = True

class ShippingAddress(BaseModel):
    full_name: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    street: Optional[str] = None
    address_line1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "Kenya"
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    route_coordinates: Optional[List[Any]] = None
    calculated_distance_km: Optional[float] = None
    logistics_type: Optional[str] = None
    assigned_driver_id: Optional[str] = None
    payment_method: Optional[str] = None
    payment_method_title: Optional[str] = None
    shipping_amount: Optional[float] = None
    packaging_fee: Optional[float] = None
    services_fee: Optional[float] = None
    discount_amount: Optional[float] = None

    class Config:
        from_attributes = True

class OrderBase(BaseModel):
    status: str = "pending"
    total_amount: int
    shipping_amount: Optional[int] = 0
    packaging_fee: Optional[int] = 100
    services_fee: Optional[int] = 50
    discount_amount: Optional[int] = 0
    subtotal: Optional[int] = 0
    payment_method: Optional[str] = "cod"
    payment_method_title: Optional[str] = "Cash on Delivery"
    currency: str = "KES"
    shipping_address: Optional[ShippingAddress] = None
    notes: Optional[str] = None

    @field_validator("total_amount", "shipping_amount", "packaging_fee", "services_fee", "discount_amount", "subtotal", mode="before")
    @classmethod
    def round_total_amount(cls, v: Union[int, float, str, None]) -> Optional[int]:
        if v is not None:
            try:
                return round(float(v))
            except (ValueError, TypeError):
                pass
        return v

class OrderCreate(BaseModel):
    cart_id: uuid.UUID
    shipping_address: ShippingAddress
    notes: Optional[str] = None
    idempotency_key: Optional[str] = None
    guest_token: Optional[str] = None

class OrderStatusUpdate(BaseModel):
    status: str

class UserMinResponse(BaseModel):
    id: uuid.UUID
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: str

    class Config:
        from_attributes = True

class OrderResponse(OrderBase):
    id: uuid.UUID
    order_number: Optional[int] = None
    user_id: Optional[uuid.UUID] = None
    guest_token: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime]
    items: List[OrderItemResponse]
    user: Optional[UserMinResponse] = None

    class Config:
        from_attributes = True

class OrderListResponse(BaseModel):
    orders: List[OrderResponse]
    total: int

class OrderTimelineEventResponse(BaseModel):
    id: uuid.UUID
    status: str
    message: str
    created_at: datetime
    created_by: Optional[uuid.UUID] = None

    class Config:
        from_attributes = True

class VendorOrderItemResponse(BaseModel):
    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    sku: Optional[str] = None
    quantity: float
    unit_price: int
    total: int
    status: str
    tracking_number: Optional[str] = None
    tracking_url: Optional[str] = None

    @field_validator("unit_price", "total", mode="before")
    @classmethod
    def round_item_prices(cls, v: Any) -> Any:
        if v is not None:
            try:
                return round(float(v))
            except (ValueError, TypeError):
                pass
        return v

    class Config:
        from_attributes = True

class VendorOrderResponse(BaseModel):
    id: uuid.UUID
    order_number: Optional[int] = None
    customer_name: str
    customer_email: str
    status: str
    total_amount: int
    vendor_amount: int
    item_count: int
    created_at: datetime
    items: List[VendorOrderItemResponse] = []

    class Config:
        from_attributes = True

class VendorOrderDetailResponse(VendorOrderResponse):
    shipping_address: Optional[ShippingAddress] = None
    billing_address: Optional[ShippingAddress] = None
    items: List[VendorOrderItemResponse]
    payment_method: str
    payment_status: str
    timeline: List[OrderTimelineEventResponse]

class VendorOrderListResponse(BaseModel):
    items: List[VendorOrderResponse]
    total: int
    page: int
    limit: int
    pages: int
    orders: Optional[List[VendorOrderResponse]] = None

