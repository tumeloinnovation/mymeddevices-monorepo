from typing import Optional, List
import uuid
from pydantic import BaseModel, Field, field_validator
from datetime import datetime


class TagCreate(BaseModel):
    """Schema for creating a new tag (admin only)"""
    name: str = Field(..., min_length=2, max_length=255)
    slug: Optional[str] = Field(None, min_length=2, max_length=255, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")  # Hex color code
    sort_order: int = 0
    is_active: bool = True

    @field_validator('color')
    @classmethod
    def validate_color(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.startswith('#'):
            return f"#{v}"
        return v


class TagUpdate(BaseModel):
    """Schema for updating a tag"""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    slug: Optional[str] = Field(None, min_length=2, max_length=255, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: Optional[str] = None
    color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")  # Hex color code
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None

    @field_validator('color')
    @classmethod
    def validate_color(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.startswith('#'):
            return f"#{v}"
        return v


class TagResponse(BaseModel):
    """Single tag response"""
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    color: Optional[str] = None
    sort_order: int
    is_active: bool
    product_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TagListResponse(BaseModel):
    """Paginated tag list response"""
    tags: List[TagResponse]
    total: int
    page: int
    page_size: int
