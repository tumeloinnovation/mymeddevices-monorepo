from typing import Optional, List, Any
import uuid
from pydantic import BaseModel, Field, field_validator
from datetime import datetime


# ============================================================================
# IMAGE SCHEMAS
# ============================================================================

class ProductImageCreate(BaseModel):
    """Schema for adding a product image"""
    url: str = Field(..., max_length=1000)
    alt_text: Optional[str] = Field(None, max_length=500)
    sort_order: int = 0
    is_primary: bool = False


class ProductImageResponse(BaseModel):
    """Product image response"""
    id: uuid.UUID
    url: str
    alt_text: Optional[str] = None
    sort_order: int
    is_primary: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ProductImageReorder(BaseModel):
    """Schema for reordering product images"""
    image_ids: List[uuid.UUID] = Field(..., description="Ordered list of image IDs")


# ============================================================================
# PRODUCT CREATE / UPDATE
# ============================================================================

class ProductCreate(BaseModel):
    """Schema for creating a new draft product. Only name is required."""
    name: str = Field(..., min_length=2, max_length=500)
    vendor_id: Optional[uuid.UUID] = Field(None, description="Vendor ID (required for admin creation, auto-filled for vendors)")
    category_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=1000)
    sku: Optional[str] = Field(None, max_length=100)

    # Pricing
    base_price: Optional[float] = Field(None, ge=0)
    price: Optional[float] = Field(None, ge=0)
    compare_at_price: Optional[float] = Field(None, ge=0)
    cost_price: Optional[float] = Field(None, ge=0)
    currency: str = "KES"

    # Inventory
    stock_quantity: int = 0
    low_stock_threshold: int = 5
    track_inventory: bool = True

    # Physical
    weight_kg: Optional[float] = Field(None, ge=0)
    dimensions: Optional[dict] = None

    # Medical device specifics
    brand: Optional[str] = Field(None, max_length=255)
    model_number: Optional[str] = Field(None, max_length=255)
    manufacturer: Optional[str] = Field(None, max_length=255)
    specifications: Optional[dict] = None
    certifications: Optional[list] = None
    kmpdb_registration_number: Optional[str] = Field(None, max_length=255)
    ppb_classification: Optional[str] = Field(None, max_length=100)
    ce_marking_or_fda_clearance: Optional[str] = Field(None, max_length=255)
    warranty_info: Optional[str] = None

    # SEO
    meta_title: Optional[str] = Field(None, max_length=255)
    meta_description: Optional[str] = Field(None, max_length=500)
    tags: Optional[List[str]] = None


class ProductUpdate(BaseModel):
    """Schema for updating a product. All fields optional."""
    name: Optional[str] = Field(None, min_length=2, max_length=500)
    category_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=1000)
    sku: Optional[str] = Field(None, max_length=100)

    # Pricing
    base_price: Optional[float] = Field(None, ge=0)
    price: Optional[float] = Field(None, ge=0)
    compare_at_price: Optional[float] = Field(None, ge=0)
    cost_price: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = None

    # Inventory
    stock_quantity: Optional[int] = None
    low_stock_threshold: Optional[int] = None
    track_inventory: Optional[bool] = None

    # Physical
    weight_kg: Optional[float] = Field(None, ge=0)
    dimensions: Optional[dict] = None

    # Medical device specifics
    brand: Optional[str] = Field(None, max_length=255)
    model_number: Optional[str] = Field(None, max_length=255)
    manufacturer: Optional[str] = Field(None, max_length=255)
    specifications: Optional[dict] = None
    certifications: Optional[list] = None
    kmpdb_registration_number: Optional[str] = Field(None, max_length=255)
    ppb_classification: Optional[str] = Field(None, max_length=100)
    ce_marking_or_fda_clearance: Optional[str] = Field(None, max_length=255)
    warranty_info: Optional[str] = None

    # SEO
    meta_title: Optional[str] = Field(None, max_length=255)
    meta_description: Optional[str] = Field(None, max_length=500)
    tags: Optional[List[str]] = None


# ============================================================================
# PRODUCT RESPONSES
# ============================================================================

class ProductResponse(BaseModel):
    """Full product response for vendor dashboard (includes all fields)"""
    id: uuid.UUID
    vendor_id: uuid.UUID
    category_id: Optional[uuid.UUID] = None
    category_name: Optional[str] = None

    # Basic info
    name: str
    slug: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    sku: Optional[str] = None

    # Pricing
    base_price: Optional[float] = None
    markup_price: Optional[float] = None
    commission_fee: Optional[float] = None
    price: Optional[float] = None
    compare_at_price: Optional[float] = None
    cost_price: Optional[float] = None
    currency: str

    # Inventory
    stock_quantity: int
    low_stock_threshold: int
    track_inventory: bool

    # Status
    status: str
    is_verified: bool
    verified_at: Optional[datetime] = None

    # Merchandising
    is_featured: bool
    is_on_sale: bool
    popularity_score: int
    view_count: int

    # Physical
    weight_kg: Optional[float] = None
    dimensions: Optional[dict] = None

    # Medical device specifics
    brand: Optional[str] = None
    model_number: Optional[str] = None
    manufacturer: Optional[str] = None
    specifications: Optional[dict] = None
    certifications: Optional[list] = None
    kmpdb_registration_number: Optional[str] = None
    ppb_classification: Optional[str] = None
    ce_marking_or_fda_clearance: Optional[str] = None
    warranty_info: Optional[str] = None

    # SEO
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    tags: Optional[List[str]] = None

    # AI assist
    ai_generated_fields: Optional[dict] = None
    completeness_score: int

    # Images
    images: List[ProductImageResponse] = []

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    """Paginated product list for vendor dashboard"""
    products: List[ProductResponse]
    total: int
    page: int
    page_size: int


# ============================================================================
# STOREFRONT RESPONSES (NO VENDOR INFO)
# ============================================================================

class StorefrontProductResponse(BaseModel):
    """Product response for public storefront. Vendor identity is HIDDEN."""
    id: uuid.UUID
    category_id: Optional[uuid.UUID] = None
    category_name: Optional[str] = None

    # Basic info
    name: str
    slug: str
    description: Optional[str] = None
    short_description: Optional[str] = None

    # Pricing (NO cost_price)
    price: Optional[float] = None
    compare_at_price: Optional[float] = None
    currency: str
    is_on_sale: bool

    # Inventory
    in_stock: bool = True
    stock_quantity: Optional[int] = None  # Only shown if track_inventory

    # Merchandising
    is_featured: bool
    popularity_score: int

    # Physical
    weight_kg: Optional[float] = None
    dimensions: Optional[dict] = None

    # Medical device specifics
    brand: Optional[str] = None
    model_number: Optional[str] = None
    manufacturer: Optional[str] = None
    specifications: Optional[dict] = None
    certifications: Optional[list] = None
    kmpdb_registration_number: Optional[str] = None
    ppb_classification: Optional[str] = None
    ce_marking_or_fda_clearance: Optional[str] = None
    warranty_info: Optional[str] = None

    # SEO
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    tags: Optional[List[str]] = None

    # Images
    images: List[ProductImageResponse] = []

    created_at: datetime

    class Config:
        from_attributes = True


class StorefrontProductListResponse(BaseModel):
    """Paginated product list for public storefront"""
    products: List[StorefrontProductResponse]
    total: int
    page: int
    page_size: int


# ============================================================================
# AI ASSIST SCHEMAS
# ============================================================================

class AIAssistRequest(BaseModel):
    """Request AI to suggest product fields"""
    fields_to_generate: List[str] = Field(
        default=["description", "short_description", "specifications", "tags", "meta_title", "meta_description"],
        description="Which fields to generate suggestions for"
    )


class AIAssistResponse(BaseModel):
    """AI-generated suggestions for product fields"""
    suggestions: dict = Field(..., description="Field name -> suggested value")
    confidence: dict = Field(default={}, description="Field name -> confidence score (0-1)")
    message: str = "AI suggestions generated. Review and apply as needed."


# ============================================================================
# COMPLETENESS SCORE
# ============================================================================

class CompletenessItem(BaseModel):
    """Individual completeness check item"""
    field: str
    label: str
    weight: int
    is_complete: bool
    is_required: bool


class ProductCompletenessResponse(BaseModel):
    """Detailed completeness score breakdown"""
    score: int  # 0-100
    minimum_required: int  # 70
    is_ready_to_verify: bool
    items: List[CompletenessItem]
    missing_required: List[str]  # Required fields that are missing
