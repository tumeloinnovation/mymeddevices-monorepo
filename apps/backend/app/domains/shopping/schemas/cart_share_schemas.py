import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CartShareCreate(BaseModel):
    """Schema for creating a cart share."""

    expires_days: int | None = Field(
        default=7, ge=1, le=30, description="Number of days until share link expires (1-30, default 7)"
    )


class CartShareResponse(BaseModel):
    """Cart share response."""

    id: uuid.UUID
    cart_id: uuid.UUID
    share_token: str
    expires_at: datetime | None = None
    access_count: int
    share_url: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SharedCartProduct(BaseModel):
    """Product details in shared cart."""

    id: uuid.UUID
    sku: str | None = None
    name: str
    price: float
    image_url: str | None = None


class SharedCartItem(BaseModel):
    """Cart item in shared cart."""

    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    notes: str | None = None
    product: SharedCartProduct


class SharedCartResponse(BaseModel):
    """Shared cart response (accessible without auth)."""

    cart_id: uuid.UUID
    items: list[SharedCartItem] = []
    item_count: int = 0
    subtotal: float
    shared_at: datetime
    expires_at: datetime | None = None
