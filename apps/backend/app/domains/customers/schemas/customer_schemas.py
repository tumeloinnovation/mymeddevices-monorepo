from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr
import uuid
from datetime import datetime
from app.domains.catalog.schemas.product_schemas import StorefrontProductResponse

# ============================================================================
# Customer Profile Schemas
# ============================================================================

class CustomerProfileBase(BaseModel):
    avatar_url: Optional[str] = Field(None, description="URL to customer's avatar image")
    marketing_enabled: bool = Field(False, description="Whether the customer opted into marketing emails")
    notes: Optional[str] = Field(None, description="Internal notes about the customer")

class CustomerProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    marketing_enabled: Optional[bool] = None
    email_order_updates: Optional[bool] = None
    email_promotions: Optional[bool] = None
    email_newsletter: Optional[bool] = None
    email_security: Optional[bool] = None
    sms_order_updates: Optional[bool] = None
    sms_promotions: Optional[bool] = None
    sms_security: Optional[bool] = None
    email_frequency: Optional[str] = None
    # Dashboard preferences
    language: Optional[str] = None
    timezone: Optional[str] = None
    items_per_page: Optional[int] = None
    default_sort: Optional[str] = None
    show_recently_viewed: Optional[bool] = None
    reduced_motion: Optional[bool] = None
    font_size: Optional[str] = None
    high_contrast: Optional[bool] = None
    notes: Optional[str] = None

class CustomerResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
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
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ============================================================================
# Address Schemas
# ============================================================================

class AddressBase(BaseModel):
    type: str = Field("shipping", description="Address type: shipping or billing")
    first_name: str = Field(..., alias="first_name")
    last_name: str = Field(..., alias="last_name")
    address_line1: str = Field(..., alias="address_line1")
    address_line2: Optional[str] = Field(None, alias="address_line2")
    city: str
    state: Optional[str] = None
    postal_code: Optional[str] = Field(None, alias="postal_code")
    country: str = "Kenya"
    phone: Optional[str] = None
    is_default: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    place_id: Optional[str] = Field(None, description="Google Place ID for validation")

    class Config:
        populate_by_name = True

class AddressCreate(AddressBase):
    pass

class AddressUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    is_default: Optional[bool] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    place_id: Optional[str] = None

class AddressResponse(AddressBase):
    id: uuid.UUID
    customer_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ============================================================================
# Loyalty Schemas
# ============================================================================

class LoyaltyTierInfo(BaseModel):
    name: str
    multiplier: float
    benefits: List[str]

class LoyaltyStatusResponse(BaseModel):
    customer_id: uuid.UUID
    current_tier: str
    points_balance: int
    points_to_next_tier: int
    next_tier: Optional[str]
    total_earned: int
    total_redeemed: int
    tier_benefits: List[str]

class LoyaltySummaryResponse(BaseModel):
    customer_id: str
    total_points: int
    current_tier: LoyaltyTierInfo
    next_tier: Optional[dict] = None
    points_to_next_tier: int
    tier_progress: float

class LoyaltyLedgerEntryResponse(BaseModel):
    id: uuid.UUID
    transaction_type: str
    points: int
    balance_after: int
    description: Optional[str] = None
    reference_type: Optional[str] = None
    reference_id: Optional[uuid.UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True

class LoyaltyLedgerResponse(BaseModel):
    items: List[LoyaltyLedgerEntryResponse]
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
    notes: Optional[str] = None

class WishlistItemCreate(WishlistItemBase):
    pass

class WishlistItemResponse(BaseModel):
    id: uuid.UUID
    customer_id: uuid.UUID
    product_id: uuid.UUID
    notes: Optional[str] = None
    created_at: datetime
    product: Optional[StorefrontProductResponse] = None

    class Config:
        from_attributes = True

# ============================================================================
# Review Schemas
# ============================================================================

class ReviewBase(BaseModel):
    product_id: uuid.UUID
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None

class ReviewCreate(ReviewBase):
    pass

class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None

class ReviewResponse(ReviewBase):
    id: uuid.UUID
    customer_id: uuid.UUID
    is_verified_purchase: bool
    contains_profanity: bool
    flagged_words: Optional[List[str]] = None
    moderation_status: str
    moderation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    product: Optional[StorefrontProductResponse] = None

    class Config:
        from_attributes = True


# Public storefront review response (hides customer identity for privacy)
class PublicReviewResponse(BaseModel):
    id: uuid.UUID
    customer_id: Optional[uuid.UUID] = None
    rating: int
    comment: Optional[str] = None
    is_verified_purchase: bool
    created_at: datetime
    # Customer info anonymized
    reviewer_name: Optional[str] = None  # Will be derived from customer

    class Config:
        from_attributes = True


class ReviewModerationRequest(BaseModel):
    moderation_status: str = Field(..., description="New moderation status: visible, hidden, removed")
    reason: Optional[str] = Field(None, description="Reason for moderation action")


class VendorReviewResponse(ReviewResponse):
    """Extended review response for vendors showing customer details"""
    customer_email: Optional[str] = None
    customer_name: Optional[str] = None
    product_name: Optional[str] = None
