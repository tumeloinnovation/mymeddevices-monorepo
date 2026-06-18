from typing import Optional, List
import uuid
from pydantic import BaseModel, Field
from datetime import datetime


class CategoryCreate(BaseModel):
    """Schema for creating a new category (admin only)"""
    name: str = Field(..., min_length=2, max_length=255)
    slug: str = Field(..., min_length=2, max_length=255, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: Optional[str] = None
    permalink: Optional[str] = Field(None, max_length=500)
    icon_url: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    sort_order: int = 0
    is_active: bool = True


class CategoryUpdate(BaseModel):
    """Schema for updating a category"""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    slug: Optional[str] = Field(None, min_length=2, max_length=255, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: Optional[str] = None
    permalink: Optional[str] = Field(None, max_length=500)
    icon_url: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryResponse(BaseModel):
    """Single category response"""
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    permalink: Optional[str] = None
    icon_url: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    sort_order: int
    is_active: bool
    product_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CategoryTreeResponse(BaseModel):
    """Category with nested children for tree display"""
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    permalink: Optional[str] = None
    icon_url: Optional[str] = None
    sort_order: int
    is_active: bool
    children: List["CategoryTreeResponse"] = []

    class Config:
        from_attributes = True


# Enable self-referential model
CategoryTreeResponse.model_rebuild()
