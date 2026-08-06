from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
from enum import Enum


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
    description: Optional[str] = None
    image_url: Optional[str] = None
    image_alt_text: Optional[str] = Field(None, max_length=200)
    background_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    text_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    cta_text: Optional[str] = Field(None, max_length=100)
    cta_link: Optional[str] = None
    cta_target: str = "_self"
    placement: BannerPlacement
    priority: int = 0
    target_audience: Optional[List[str]] = None
    target_categories: Optional[List[str]] = None
    target_products: Optional[List[str]] = None
    exclude_products: Optional[List[str]] = None
    coupon_id: Optional[UUID] = None
    vendor_id: Optional[UUID] = None
    is_dismissible: bool = False
    show_close_button: bool = True
    mobile_hidden: bool = False
    desktop_hidden: bool = False


class BannerCreate(BannerBase):
    """Schema for creating a banner."""
    status: BannerStatus = BannerStatus.DRAFT
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None

    @field_validator('scheduled_end')
    @classmethod
    def validate_end_date(cls, v: Optional[datetime], info) -> Optional[datetime]:
        if v and info.data.get('scheduled_start') and v < info.data['scheduled_start']:
            raise ValueError('End date must be after start date')
        return v


class BannerUpdate(BaseModel):
    """Schema for updating a banner."""
    title: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    image_url: Optional[str] = None
    image_alt_text: Optional[str] = Field(None, max_length=200)
    background_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    text_color: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    cta_text: Optional[str] = Field(None, max_length=100)
    cta_link: Optional[str] = None
    cta_target: Optional[str] = None
    placement: Optional[BannerPlacement] = None
    priority: Optional[int] = None
    status: Optional[BannerStatus] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    target_audience: Optional[List[str]] = None
    target_categories: Optional[List[str]] = None
    target_products: Optional[List[str]] = None
    exclude_products: Optional[List[str]] = None
    coupon_id: Optional[UUID] = None
    vendor_id: Optional[UUID] = None
    is_dismissible: Optional[bool] = None
    show_close_button: Optional[bool] = None
    mobile_hidden: Optional[bool] = None
    desktop_hidden: Optional[bool] = None


class BannerResponse(BannerBase):
    """Banner response schema."""
    id: UUID
    status: BannerStatus
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    impressions: int = 0
    clicks: int = 0
    dismissals: int = 0
    click_through_rate: float = 0.0
    created_at: datetime
    updated_at: datetime
    created_by_id: Optional[UUID] = None

    class Config:
        from_attributes = True


class BannerListResponse(BaseModel):
    """Response schema for banner list."""
    items: List[BannerResponse]
    total: int
    page: int
    page_size: int


class PublicBanner(BaseModel):
    """Minimal banner info for public display."""
    id: UUID
    title: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    image_alt_text: Optional[str] = None
    background_color: Optional[str] = None
    text_color: Optional[str] = None
    cta_text: Optional[str] = None
    cta_link: Optional[str] = None
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
    session_id: Optional[str] = None


class BannerDismissalCreate(BaseModel):
    """Schema for recording a banner dismissal."""
    banner_id: UUID
    session_id: Optional[str] = None


class BannerAnalytics(BaseModel):
    """Banner analytics response."""
    banner_id: UUID
    title: str
    impressions: int
    clicks: int
    dismissals: int
    click_through_rate: float
    status: BannerStatus
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
