import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.field_types import OptionalKenyanPhone
from app.domains.catalog.schemas.product_schemas import StorefrontProductResponse

# ============================================================================
# Customer Profile Schemas
# ============================================================================


class CustomerProfileBase(BaseModel):
    avatar_url: str | None = Field(None, description="URL to customer's avatar image")
    marketing_enabled: bool = Field(False, description="Whether the customer opted into marketing emails")
    notes: str | None = Field(None, description="Internal notes about the customer")


class CustomerProfileUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: OptionalKenyanPhone = None
    avatar_url: str | None = None
    marketing_enabled: bool | None = None
    email_order_updates: bool | None = None
    email_promotions: bool | None = None
    email_newsletter: bool | None = None
    email_security: bool | None = None
    sms_order_updates: bool | None = None
    sms_promotions: bool | None = None
    sms_security: bool | None = None
    email_frequency: str | None = None
    # Dashboard preferences
    language: str | None = None
    timezone: str | None = None
    items_per_page: int | None = None
    default_sort: str | None = None
    show_recently_viewed: bool | None = None
    reduced_motion: bool | None = None
    font_size: str | None = None
    high_contrast: bool | None = None
    notes: str | None = None


class CustomerResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    phone: OptionalKenyanPhone = None
    avatar_url: str | None = None
    loyalty_tier: str = "bronze"
    loyalty_points: int = 0
    marketing_enabled: bool = False
    email_order_updates: bool = True
    email_promotions: bool = False
    email_newsletter: bool = True
    email_security: bool = True
    sms_order_updates: bool = True
    sms_promotions: bool = False
    sms_security: bool = True
    email_frequency: str = "instant"
    # Dashboard preferences
    language: str = "en"
    timezone: str = "eat"
    items_per_page: int = 24
    default_sort: str = "newest"
    show_recently_viewed: bool = True
    reduced_motion: bool = False
    font_size: str = "normal"
    high_contrast: bool = False
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Address Schemas
# ============================================================================


class AddressBase(BaseModel):
    type: str = Field("shipping", description="Address type: shipping or billing")
    first_name: str = Field(..., alias="first_name")
    last_name: str = Field(..., alias="last_name")
    address_line1: str = Field(..., alias="address_line1")
    address_line2: str | None = Field(None, alias="address_line2")
    city: str
    state: str | None = None
    postal_code: str | None = Field(None, alias="postal_code")
    country: str = "Kenya"
    phone: OptionalKenyanPhone = None
    is_default: bool = False
    latitude: float | None = None
    longitude: float | None = None
    place_id: str | None = Field(None, description="Google Place ID for validation")

    model_config = ConfigDict(populate_by_name=True)


class AddressCreate(AddressBase):
    pass


class AddressUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None
    country: str | None = None
    phone: OptionalKenyanPhone = None
    is_default: bool | None = None
    latitude: float | None = None
    longitude: float | None = None
    place_id: str | None = None


class AddressResponse(AddressBase):
    id: uuid.UUID
    customer_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Loyalty Schemas
# ============================================================================


class LoyaltyTierInfo(BaseModel):
    name: str
    multiplier: float
    benefits: list[str]


class LoyaltyStatusResponse(BaseModel):
    customer_id: uuid.UUID
    current_tier: str
    points_balance: int
    points_to_next_tier: int
    next_tier: str | None
    total_earned: int
    total_redeemed: int
    tier_benefits: list[str]


class LoyaltySummaryResponse(BaseModel):
    customer_id: str
    total_points: int
    current_tier: LoyaltyTierInfo
    next_tier: dict | None = None
    points_to_next_tier: int
    tier_progress: float


class LoyaltyLedgerEntryResponse(BaseModel):
    id: uuid.UUID
    transaction_type: str
    points: int
    balance_after: int
    description: str | None = None
    reference_type: str | None = None
    reference_id: uuid.UUID | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LoyaltyLedgerResponse(BaseModel):
    items: list[LoyaltyLedgerEntryResponse]
    total: int
    page: int
    limit: int


class PointsRedeemRequest(BaseModel):
    points: int = Field(..., gt=0, description="Number of points to redeem")
    description: str = Field(..., description="Reason for redemption")


# ============================================================================
# Wishlist Schemas
# ============================================================================


class WishlistItemBase(BaseModel):
    product_id: uuid.UUID
    notes: str | None = None


class WishlistItemCreate(WishlistItemBase):
    pass


class WishlistItemResponse(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    product_id: uuid.UUID
    notes: str | None = None
    created_at: datetime
    product: StorefrontProductResponse | None = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Review Schemas
# ============================================================================


class ReviewBase(BaseModel):
    product_id: uuid.UUID
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = None


class ReviewCreate(ReviewBase):
    pass


class ReviewUpdate(BaseModel):
    rating: int | None = Field(None, ge=1, le=5)
    comment: str | None = None


class ReviewResponse(ReviewBase):
    id: uuid.UUID
    customer_id: uuid.UUID
    is_verified_purchase: bool
    contains_profanity: bool
    flagged_words: list[str] | None = None
    moderation_status: str
    moderation_reason: str | None = None
    created_at: datetime
    updated_at: datetime
    product: StorefrontProductResponse | None = None

    model_config = ConfigDict(from_attributes=True)


# Public storefront review response (hides customer identity for privacy)
class PublicReviewResponse(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID | None = None
    rating: int
    comment: str | None = None
    is_verified_purchase: bool
    created_at: datetime
    # Customer info anonymized
    reviewer_name: str | None = None  # Will be derived from customer

    model_config = ConfigDict(from_attributes=True)


class ReviewModerationRequest(BaseModel):
    moderation_status: str = Field(..., description="New moderation status: visible, hidden, removed")
    reason: str | None = Field(None, description="Reason for moderation action")


class VendorReviewResponse(ReviewResponse):
    """Extended review response for vendors showing customer details"""

    customer_email: str | None = None
    customer_name: str | None = None
    product_name: str | None = None
