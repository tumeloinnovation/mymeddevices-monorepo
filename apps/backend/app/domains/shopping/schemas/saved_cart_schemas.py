import uuid
from typing import Optional, List
from pydantic import BaseModel, Field
from datetime import datetime


class SavedCartItemCreate(BaseModel):
    """Schema for adding an item to a saved cart."""
    product_id: uuid.UUID
    quantity: int = Field(gt=0, le=99)
    notes: Optional[str] = Field(None, max_length=500)


class SavedCartItemResponse(BaseModel):
    """Saved cart item response."""
    id: uuid.UUID
    saved_cart_id: uuid.UUID
    product_id: uuid.UUID
    quantity: int
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SavedCartCreate(BaseModel):
    """Schema for creating a saved cart."""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)
    items: List[SavedCartItemCreate] = []


class SavedCartUpdate(BaseModel):
    """Schema for updating a saved cart."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=500)


class SavedCartResponse(BaseModel):
    """Saved cart response with items."""
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: Optional[str] = None
    item_count: int = 0
    items: List[SavedCartItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
