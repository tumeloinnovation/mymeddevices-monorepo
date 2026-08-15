import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TagCreate(BaseModel):
    """Schema for creating a new tag (admin only)"""

    name: str = Field(..., min_length=2, max_length=255)
    slug: str | None = Field(None, min_length=2, max_length=255, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = None
    color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")  # Hex color code
    sort_order: int = 0
    is_active: bool = True

    @field_validator("color")
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        if v is not None and not v.startswith("#"):
            return f"#{v}"
        return v


class TagUpdate(BaseModel):
    """Schema for updating a tag"""

    name: str | None = Field(None, min_length=2, max_length=255)
    slug: str | None = Field(None, min_length=2, max_length=255, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = None
    color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")  # Hex color code
    sort_order: int | None = None
    is_active: bool | None = None

    @field_validator("color")
    @classmethod
    def validate_color(cls, v: str | None) -> str | None:
        if v is not None and not v.startswith("#"):
            return f"#{v}"
        return v


class TagResponse(BaseModel):
    """Single tag response"""

    id: uuid.UUID
    name: str
    slug: str
    description: str | None = None
    color: str | None = None
    sort_order: int
    is_active: bool
    product_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TagListResponse(BaseModel):
    """Paginated tag list response"""

    tags: list[TagResponse]
    total: int
    page: int
    page_size: int
