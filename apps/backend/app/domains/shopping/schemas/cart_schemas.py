import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.domains.catalog.schemas.product_schemas import ProductImageResponse


class CartItemCreate(BaseModel):
    """Schema for adding an item to cart."""

    product_id: uuid.UUID = Field(..., description="ID of the product to add")
    product_variant_id: uuid.UUID | None = Field(None, description="Optional variant ID")
    quantity: int = Field(default=1, gt=0, le=9999, description="Quantity (1-9999)")
    notes: str | None = Field(None, max_length=500, description="Customer notes for this item")
    substitution_allowed: bool = Field(default=True, description="Allow substitution if out of stock")


class CartItemUpdate(BaseModel):
    """Schema for updating a cart item."""

    quantity: int = Field(gt=0, le=9999, description="Quantity (1-9999)")
    notes: str | None = Field(None, max_length=500, description="Customer notes for this item")
    substitution_allowed: bool | None = Field(default=True)


class CartProductResponse(BaseModel):
    """Product details in cart item response."""

    id: uuid.UUID
    sku: str | None = None
    name: str
    price: float | None = None
    images: list[ProductImageResponse] = []
    stock_quantity: int

    model_config = ConfigDict(from_attributes=True)


class CartItemResponse(BaseModel):
    """Cart item response with product details."""

    id: uuid.UUID
    cart_id: uuid.UUID
    product_id: uuid.UUID
    product_variant_id: uuid.UUID | None = None
    quantity: int
    unit_price: float | None = None
    notes: str | None = None
    substitution_allowed: bool
    product: CartProductResponse
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


from app.domains.auth.schemas.auth_schemas import UserResponse


class CartResponse(BaseModel):
    """Cart response with items."""

    id: uuid.UUID
    user_id: uuid.UUID | None = None
    user: UserResponse | None = None
    session_id: str | None = None
    cart_token: str | None = None
    cart_type: str
    is_active: bool
    expires_at: datetime | None = None
    items: list[CartItemResponse] = []
    item_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class GuestCartResponse(BaseModel):
    """Response for guest cart creation."""

    cart_id: uuid.UUID
    cart_token: str
    expires_at: datetime
    message: str = "Cart created. Store this token to retrieve your cart."


class CartTotalsResponse(BaseModel):
    """Cart totals with breakdown."""

    cart_id: uuid.UUID
    subtotal: float
    discount_amount: float = 0.0
    tax_amount: float = 0.0
    shipping_amount: float = 0.0
    packaging_fee: float = 0.0
    services_fee: float = 0.0
    total: float
    currency: str = "KES"
    item_count: int
    applied_discounts: list[dict] = []
    logistics_type: str | None = None
    calculated_distance_km: float | None = 0.0
    route_coordinates: list[list[float]] | None = []


class CartValidationError(BaseModel):
    """Individual validation error."""

    item_id: uuid.UUID
    product_id: uuid.UUID
    error_type: str  # 'out_of_stock', 'price_changed', 'product_unavailable', 'quantity_limit'
    message: str
    current_value: float | None = None
    available_quantity: int | None = None


class CartValidationResponse(BaseModel):
    """Cart validation result."""

    is_valid: bool
    cart_id: uuid.UUID
    item_count: int
    errors: list[CartValidationError] = []
    warnings: list[CartValidationError] = []
    subtotal: int
    estimated_total: int


class CartMergeRequest(BaseModel):
    """Request to merge guest cart into customer cart."""

    guest_cart_token: str
    merge_method: str = Field(
        default="merge", description="Merge strategy: 'replace' (use guest), 'merge' (combine), 'keep_both' (no merge)"
    )

    @field_validator("merge_method")
    @classmethod
    def validate_merge_method(cls, v: str) -> str:
        if v not in ["replace", "merge", "keep_both"]:
            raise ValueError("merge_method must be 'replace', 'merge', or 'keep_both'")
        return v


class CartMergeResponse(BaseModel):
    """Response after cart merge."""

    success: bool
    message: str
    cart_id: uuid.UUID
    item_count: int
    merge_log_id: uuid.UUID
