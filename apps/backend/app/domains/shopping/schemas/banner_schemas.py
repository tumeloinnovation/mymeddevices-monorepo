from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class BannerPlacement(str, Enum):
    """Where banners can be displayed."""

    HOMEPAGE_HERO = "homepage_hero"
    HOMEPAGE_SIDEBAR = "homepage_sidebar"
    CATEGORY_PAGE = "category_page"
    PRODUCT_PAGE = "product_page"
    CHECKOUT_PAGE = "checkout_page"
    HEADER_BAR = "header_bar"
    FOOTER = "footer"


class BannerStatus(str, Enum):
    """Banner status."""

    DRAFT = "draft"
    SCHEDULED = "scheduled"
    ACTIVE = "active"
    PAUSED = "paused"
    EXPIRED = "expired"


class BannerBase(BaseModel):
    """Base banner schema."""

    title: str = Field(..., max_length=200)
    description: str | None = None
    image_url: str | None = None
    image_alt_text: str | None = Field(None, max_length=200)
    background_color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    text_color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    cta_text: str | None = Field(None, max_length=100)
    cta_link: str | None = None
    cta_target: str = "_self"
    placement: BannerPlacement
    priority: int = 0
    target_audience: list[str] | None = None
    target_categories: list[str] | None = None
    target_products: list[str] | None = None
    exclude_products: list[str] | None = None
    coupon_id: UUID | None = None
    vendor_id: UUID | None = None
    is_dismissible: bool = False
    show_close_button: bool = True
    mobile_hidden: bool = False
    desktop_hidden: bool = False


class BannerCreate(BannerBase):
    """Schema for creating a banner."""

    status: BannerStatus = BannerStatus.DRAFT
    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None

    @field_validator("scheduled_end")
    @classmethod
    def validate_end_date(cls, v: datetime | None, info) -> datetime | None:
        if v and info.data.get("scheduled_start") and v < info.data["scheduled_start"]:
            raise ValueError("End date must be after start date")
        return v


class BannerUpdate(BaseModel):
    """Schema for updating a banner."""

    title: str | None = Field(None, max_length=200)
    description: str | None = None
    image_url: str | None = None
    image_alt_text: str | None = Field(None, max_length=200)
    background_color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    text_color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    cta_text: str | None = Field(None, max_length=100)
    cta_link: str | None = None
    cta_target: str | None = None
    placement: BannerPlacement | None = None
    priority: int | None = None
    status: BannerStatus | None = None
    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None
    target_audience: list[str] | None = None
    target_categories: list[str] | None = None
    target_products: list[str] | None = None
    exclude_products: list[str] | None = None
    coupon_id: UUID | None = None
    vendor_id: UUID | None = None
    is_dismissible: bool | None = None
    show_close_button: bool | None = None
    mobile_hidden: bool | None = None
    desktop_hidden: bool | None = None


class BannerResponse(BannerBase):
    """Banner response schema."""

    id: UUID
    status: BannerStatus
    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None
    impressions: int = 0
    clicks: int = 0
    dismissals: int = 0
    click_through_rate: float = 0.0
    created_at: datetime
    updated_at: datetime
    created_by_id: UUID | None = None

    model_config = ConfigDict(from_attributes=True)


class BannerListResponse(BaseModel):
    """Response schema for banner list."""

    items: list[BannerResponse]
    total: int
    page: int
    page_size: int


class PublicBanner(BaseModel):
    """Minimal banner info for public display."""

    id: UUID
    title: str
    description: str | None = None
    image_url: str | None = None
    image_alt_text: str | None = None
    background_color: str | None = None
    text_color: str | None = None
    cta_text: str | None = None
    cta_link: str | None = None
    cta_target: str = "_self"
    placement: BannerPlacement
    priority: int
    is_dismissible: bool
    show_close_button: bool
    mobile_hidden: bool
    desktop_hidden: bool


class BannerClickCreate(BaseModel):
    """Schema for recording a banner click."""

    banner_id: UUID
    session_id: str | None = None


class BannerDismissalCreate(BaseModel):
    """Schema for recording a banner dismissal."""

    banner_id: UUID
    session_id: str | None = None


class BannerAnalytics(BaseModel):
    """Banner analytics response."""

    banner_id: UUID
    title: str
    impressions: int
    clicks: int
    dismissals: int
    click_through_rate: float
    status: BannerStatus
    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None
