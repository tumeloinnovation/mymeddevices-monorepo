import uuid
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class CartShareCreate(BaseModel):
    """Schema for creating a cart share."""
    expires_days: Optional[int] = Field(
        default=7,
        ge=1,
        le=30,
        description="Number of days until share link expires (1-30, default 7)"
    )


class CartShareResponse(BaseModel):
    """Cart share response."""
    id: uuid.UUID
    cart_id: uuid.UUID
    share_token: str
    expires_at: Optional[datetime] = None
    access_count: int
    share_url: str
    created_at: datetime

    class Config:
        from_attributes = True


class SharedCartProduct(BaseModel):
    """Product details in shared cart."""
    id: uuid.UUID
    sku: Optional[str] = None
    name: str
    price: float
    image_url: Optional[str] = None


class SharedCartItem(BaseModel):
    """Cart item in shared cart."""
    id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    notes: Optional[str] = None
    product: SharedCartProduct


class SharedCartResponse(BaseModel):
    """Shared cart response (accessible without auth)."""
    cart_id: uuid.UUID
    items: List[SharedCartItem] = []
    item_count: int = 0
    subtotal: float
    shared_at: datetime
    expires_at: Optional[datetime] = None
