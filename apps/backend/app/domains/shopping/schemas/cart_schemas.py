import uuid
from typing import Optional, List

from app.domains.catalog.schemas.product_schemas import ProductImageResponse
from pydantic import BaseModel, Field, field_validator
from datetime import datetime


class CartItemCreate(BaseModel):
    """Schema for adding an item to cart."""
    product_id: uuid.UUID = Field(..., description="ID of the product to add")
    quantity: int = Field(default=1, gt=0, le=99, description="Quantity (1-99)")
    notes: Optional[str] = Field(None, max_length=500, description="Customer notes for this item")
    substitution_allowed: bool = Field(default=True, description="Allow substitution if out of stock")


class CartItemUpdate(BaseModel):
    """Schema for updating a cart item."""
    quantity: int = Field(gt=0, le=99, description="Quantity (1-99)")
    notes: Optional[str] = Field(None, max_length=500, description="Customer notes for this item")
    substitution_allowed: Optional[bool] = Field(default=True)


class CartProductResponse(BaseModel):
    """Product details in cart item response."""
    id: uuid.UUID
    sku: Optional[str] = None
    name: str
    price: Optional[float] = None
    images: List[ProductImageResponse] = []
    stock_quantity: int

    class Config:
        from_attributes = True


class CartItemResponse(BaseModel):
    """Cart item response with product details."""
    id: uuid.UUID
    cart_id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    unit_price: Optional[float] = None
    notes: Optional[str] = None
    substitution_allowed: bool
    product: CartProductResponse
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    """Cart response with items."""
    id: uuid.UUID
    user_id: Optional[uuid.UUID] = None
    session_id: Optional[str] = None
    cart_token: Optional[str] = None
    cart_type: str
    is_active: bool
    expires_at: Optional[datetime] = None
    items: List[CartItemResponse] = []
    item_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GuestCartResponse(BaseModel):
    """Response for guest cart creation."""
    cart_id: uuid.UUID
    cart_token: str
    expires_at: datetime
    message: str = "Cart created. Store this token to retrieve your cart."


class CartTotalsResponse(BaseModel):
    """Cart totals with breakdown."""
    cart_id: uuid.UUID
    subtotal: int
    discount_amount: int = 0
    tax_amount: int = 0
    shipping_amount: int = 0
    total: int
    currency: str = "KES"
    item_count: int
    applied_discounts: List[dict] = []
    logistics_type: Optional[str] = None
    calculated_distance_km: Optional[float] = 0.0
    route_coordinates: Optional[List[List[float]]] = []


class CartValidationError(BaseModel):
    """Individual validation error."""
    item_id: uuid.UUID
    product_id: uuid.UUID
    error_type: str  # 'out_of_stock', 'price_changed', 'product_unavailable', 'quantity_limit'
    message: str
    current_value: Optional[float] = None
    available_quantity: Optional[int] = None


class CartValidationResponse(BaseModel):
    """Cart validation result."""
    is_valid: bool
    cart_id: uuid.UUID
    item_count: int
    errors: List[CartValidationError] = []
    warnings: List[CartValidationError] = []
    subtotal: int
    estimated_total: int


class CartMergeRequest(BaseModel):
    """Request to merge guest cart into customer cart."""
    guest_cart_token: str
    merge_method: str = Field(
        default="merge",
        description="Merge strategy: 'replace' (use guest), 'merge' (combine), 'keep_both' (no merge)"
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
