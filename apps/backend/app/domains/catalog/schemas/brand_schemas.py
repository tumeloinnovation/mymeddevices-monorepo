from typing import Optional, List
import uuid
from pydantic import BaseModel, Field, HttpUrl
from datetime import datetime
from typing import Literal


class BrandQuickCreate(BaseModel):
    """Minimal schema for quick brand creation (inline during product creation)"""
    name: str = Field(..., min_length=2, max_length=255, description="Brand name (slug will be auto-generated)")


class BrandCreate(BaseModel):
    """Schema for creating a new brand (admin only)"""
    name: str = Field(..., min_length=2, max_length=255)
    slug: Optional[str] = Field(None, min_length=2, max_length=255, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: Optional[str] = Field(None, max_length=5000)
    logo_url: Optional[str] = Field(None, max_length=200000)  # Supports base64 data URIs up to ~200KB
    website_url: Optional[str] = Field(None, max_length=500)
    sort_order: int = 0
    is_active: bool = True


class BrandUpdate(BaseModel):
    """Schema for updating a brand"""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    slug: Optional[str] = Field(None, min_length=2, max_length=255, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: Optional[str] = Field(None, max_length=5000)
    logo_url: Optional[str] = Field(None, max_length=200000)  # Supports base64 data URIs up to ~200KB
    website_url: Optional[str] = Field(None, max_length=500)
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class BrandResponse(BaseModel):
    """Single brand response"""
    id: uuid.UUID
    name: str
    slug: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    sort_order: int
    is_active: bool
    approval_status: Literal["pending", "approved", "rejected"] = "approved"
    product_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BrandListResponse(BaseModel):
    """Paginated brand list response"""
    brands: List[BrandResponse]
    total: int
    page: int
    page_size: int
