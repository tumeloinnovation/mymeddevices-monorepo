import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SavedCartItemCreate(BaseModel):
    """Schema for adding an item to a saved cart."""

    product_id: uuid.UUID
    quantity: int = Field(gt=0, le=9999)
    notes: str | None = Field(None, max_length=500)


class SavedCartItemResponse(BaseModel):
    """Saved cart item response."""

    id: uuid.UUID
    saved_cart_id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SavedCartCreate(BaseModel):
    """Schema for creating a saved cart."""

    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = Field(None, max_length=500)
    items: list[SavedCartItemCreate] = []


class SavedCartUpdate(BaseModel):
    """Schema for updating a saved cart."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = Field(None, max_length=500)


class SavedCartResponse(BaseModel):
    """Saved cart response with items."""

    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: str | None = None
    item_count: int = 0
    items: list[SavedCartItemResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
