import re
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CategoryCreate(BaseModel):
    """Schema for creating a new category (admin only)"""

    name: str = Field(..., min_length=2, max_length=255)
    slug: str | None = Field(None, min_length=2, max_length=255, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = None
    permalink: str | None = Field(None, max_length=500)
    icon_url: str | None = None
    tax_category_code: str = "STANDARD_VAT_16"
    min_warranty_months: int = 0
    parent_id: uuid.UUID | None = None
    sort_order: int = 0
    is_active: bool = True

    @field_validator("slug", mode="before")
    @classmethod
    def auto_slug(cls, v, info):
        if not v and info.data.get("name"):
            cleaned = re.sub(r"[^a-z0-9]+", "-", info.data["name"].lower()).strip("-")
            return cleaned or None
        return v


class CategoryUpdate(BaseModel):
    """Schema for updating a category"""

    name: str | None = Field(None, min_length=2, max_length=255)
    slug: str | None = Field(None, min_length=2, max_length=255, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = None
    permalink: str | None = Field(None, max_length=500)
    icon_url: str | None = None
    tax_category_code: str | None = None
    min_warranty_months: int | None = None
    parent_id: uuid.UUID | None = None
    sort_order: int | None = None
    is_active: bool | None = None


class CategoryResponse(BaseModel):
    """Single category response"""

    id: uuid.UUID
    name: str
    slug: str
    description: str | None = None
    permalink: str | None = None
    icon_url: str | None = None
    tax_category_code: str = "STANDARD_VAT_16"
    min_warranty_months: int = 0
    parent_id: uuid.UUID | None = None
    sort_order: int
    is_active: bool
    product_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CategoryTreeResponse(BaseModel):
    """Category with nested children for tree display"""

    id: uuid.UUID
    name: str
    slug: str
    description: str | None = None
    permalink: str | None = None
    icon_url: str | None = None
    tax_category_code: str = "STANDARD_VAT_16"
    min_warranty_months: int = 0
    parent_id: uuid.UUID | None = None
    sort_order: int
    is_active: bool
    product_count: int = 0
    children: list["CategoryTreeResponse"] = []

    model_config = ConfigDict(from_attributes=True)


# Enable self-referential model
CategoryTreeResponse.model_rebuild()
