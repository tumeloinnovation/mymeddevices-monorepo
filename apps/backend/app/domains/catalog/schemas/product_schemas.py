from typing import Optional, List, Any
import uuid
from pydantic import BaseModel, Field, field_validator, model_validator
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


class ProductReject(BaseModel):
    """Schema for rejecting a product with a reason."""
    reason: str = Field(..., min_length=5, max_length=1000)


# ============================================================================
# PRODUCT CREATE / UPDATE
# ============================================================================

class ProductCreate(BaseModel):
    """Schema for creating a new draft product. Only name is required."""
    product_type: str = Field("simple", description="simple, variable, or bundle")
    name: str = Field(..., min_length=2, max_length=500)
    vendor_id: Optional[uuid.UUID] = Field(None, description="Vendor ID (required for admin creation, auto-filled for vendors)")
    category_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=1000)
    sku: Optional[str] = Field(None, max_length=100)

    # Pricing & Tax
    base_price: Optional[float] = Field(None, ge=0)
    markup_price: Optional[float] = Field(None, ge=0)
    commission_fee: Optional[float] = Field(None, ge=0)
    price: Optional[float] = Field(None, ge=0)
    cost_price: Optional[float] = Field(None, ge=0)
    wholesale_price: Optional[float] = Field(None, ge=0)
    compare_at_price: Optional[float] = Field(None, ge=0)
    currency: str = "KES"
    has_vat: bool = True
    vat_rate: float = 16.0

    # Inventory
    stock_quantity: int = 0
    stock_status: str = "instock"
    low_stock_threshold: int = 5
    track_inventory: bool = True

    # Physical
    weight_kg: Optional[float] = Field(None, ge=0)
    dimensions: Optional[dict] = None

    # Medical device specifics
    brand: Optional[str] = Field(None, max_length=255)
    model_number: Optional[str] = Field(None, max_length=255)
    specifications: Optional[dict] = None
    certifications: Optional[list] = None
    kmpdb_registration_number: Optional[str] = Field(None, max_length=255)
    ppb_classification: Optional[str] = Field(None, max_length=100)
    ce_marking_or_fda_clearance: Optional[str] = Field(None, max_length=255)
    warranty_info: Optional[str] = None

    # SEO
    permalink: Optional[str] = Field(None, max_length=500)
    meta_title: Optional[str] = Field(None, max_length=255)
    meta_description: Optional[str] = Field(None, max_length=500)
    tags: Optional[List[str]] = None


class ProductUpdate(BaseModel):
    """Schema for updating a product. All fields optional."""
    product_type: Optional[str] = Field(None, description="simple, variable, or bundle")
    name: Optional[str] = Field(None, min_length=2, max_length=500)
    category_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=1000)
    sku: Optional[str] = Field(None, max_length=100)

    # Pricing & Tax
    base_price: Optional[float] = Field(None, ge=0)
    markup_price: Optional[float] = Field(None, ge=0)
    commission_fee: Optional[float] = Field(None, ge=0)
    price: Optional[float] = Field(None, ge=0)
    cost_price: Optional[float] = Field(None, ge=0)
    wholesale_price: Optional[float] = Field(None, ge=0)
    compare_at_price: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = None
    has_vat: Optional[bool] = None
    vat_rate: Optional[float] = None

    # Inventory
    stock_quantity: Optional[int] = None
    stock_status: Optional[str] = None
    low_stock_threshold: Optional[int] = None
    track_inventory: Optional[bool] = None

    # SEO
    permalink: Optional[str] = Field(None, max_length=500)

    # Physical
    weight_kg: Optional[float] = Field(None, ge=0)
    dimensions: Optional[dict] = None

    # Medical device specifics
    brand: Optional[str] = Field(None, max_length=255)
    model_number: Optional[str] = Field(None, max_length=255)
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
    is_clinical_pick: Optional[bool] = None

    # Status (admin can change status directly)
    status: Optional[str] = Field(None, description="Product status: draft, pending_review, published, archived")


# ============================================================================
# PRODUCT RESPONSES
# ============================================================================
# VARIANT, BUNDLE & RELATED PRODUCT SCHEMAS
# ============================================================================

class ProductVariantCreate(BaseModel):
    """Schema for creating a product variant"""
    name: str = Field(..., max_length=255)
    sku: Optional[str] = Field(None, max_length=100)
    price_adjustment: Optional[float] = 0
    override_price: Optional[float] = None
    stock_quantity: int = 0
    attributes: Optional[dict] = None
    is_active: bool = True
    is_default: bool = False
    image_url: Optional[str] = Field(None, max_length=1000)
    sort_order: int = 0
    weight_kg: Optional[float] = None


class ProductVariantUpdate(BaseModel):
    """Schema for updating a product variant"""
    name: Optional[str] = Field(None, max_length=255)
    sku: Optional[str] = Field(None, max_length=100)
    price_adjustment: Optional[float] = None
    override_price: Optional[float] = None
    stock_quantity: Optional[int] = None
    attributes: Optional[dict] = None
    is_active: Optional[bool] = None
    is_default: Optional[bool] = None
    image_url: Optional[str] = Field(None, max_length=1000)
    sort_order: Optional[int] = None
    weight_kg: Optional[float] = None


class VariantMatrixRequest(BaseModel):
    """Bulk matrix generation request from attribute groups"""
    attribute_groups: dict[str, List[str]] = Field(..., description="e.g. {'size': ['S', 'M'], 'color': ['Blue', 'Black']}")
    base_sku_prefix: Optional[str] = None
    default_stock: int = 0


class ProductVariantResponse(BaseModel):
    """Product variant response"""
    id: uuid.UUID
    product_id: uuid.UUID
    name: str
    sku: Optional[str] = None
    price_adjustment: Optional[float] = 0
    override_price: Optional[float] = None
    calculated_price: Optional[float] = None
    stock_quantity: int = 0
    attributes: Optional[dict] = None
    is_active: bool = True
    is_default: bool = False
    image_url: Optional[str] = None
    sort_order: int = 0
    weight_kg: Optional[float] = None

    class Config:
        from_attributes = True


class BundleItemCreate(BaseModel):
    """Schema for adding a component to a bundle product"""
    component_product_id: uuid.UUID
    quantity: int = Field(1, ge=1)
    sort_order: int = 0
    is_optional: bool = False


class BundleItemUpdate(BaseModel):
    """Schema for updating a bundle item"""
    quantity: Optional[int] = Field(None, ge=1)
    sort_order: Optional[int] = None
    is_optional: Optional[bool] = None


class ComponentProductSummary(BaseModel):
    """Compact summary of a component product inside a bundle"""
    id: uuid.UUID
    name: str
    slug: str
    sku: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    stock_status: Optional[str] = "instock"

    class Config:
        from_attributes = True

    @field_validator("image_url", mode="before")
    @classmethod
    def get_image_url(cls, v: Any, info: Any) -> Any:
        if v:
            return v
        return None

    @field_validator("stock_status", mode="before")
    @classmethod
    def get_stock_status(cls, v: Any) -> Any:
        if v:
            return v
        return "instock"


class BundleItemResponse(BaseModel):
    """Bundle item response"""
    id: uuid.UUID
    bundle_product_id: uuid.UUID
    component_product_id: uuid.UUID
    component_product: Optional[ComponentProductSummary] = None
    quantity: int
    sort_order: int
    is_optional: bool

    class Config:
        from_attributes = True


class RelatedProductCreate(BaseModel):
    """Schema for adding a related product link"""
    related_product_id: uuid.UUID
    relation_type: str = Field(..., description="cross_sell, upsell, accessory, spare_part")
    sort_order: int = 0
    is_bidirectional: bool = True


class RelatedProductResponse(BaseModel):
    """Related product response"""
    id: uuid.UUID
    product_id: uuid.UUID
    related_product_id: uuid.UUID
    related_product: Optional[ComponentProductSummary] = None
    relation_type: str
    sort_order: int
    is_bidirectional: bool

    class Config:
        from_attributes = True


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
    product_type: str = "simple"
    name: str
    slug: str
    description: Optional[str] = None
    short_description: Optional[str] = None
    sku: Optional[str] = None

    # Pricing & Tax
    base_price: Optional[float] = None
    markup_price: Optional[float] = None
    commission_fee: Optional[float] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    wholesale_price: Optional[float] = None
    compare_at_price: Optional[float] = None
    currency: str
    has_vat: bool = True
    vat_rate: float = 16.0

    # Inventory
    stock_quantity: int
    stock_status: str
    low_stock_threshold: int
    track_inventory: bool

    # Status
    status: str
    is_verified: bool
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None

    # Merchandising
    is_featured: bool = False
    is_clinical_pick: bool = False
    is_on_sale: bool = False
    popularity_score: int
    view_count: int

    # Physical
    weight_kg: Optional[float] = None
    dimensions: Optional[dict] = None

    # Medical device specifics
    brand: Optional[str] = None
    model_number: Optional[str] = None
    specifications: Optional[dict] = None
    certifications: Optional[list] = None
    kmpdb_registration_number: Optional[str] = None
    ppb_classification: Optional[str] = None
    ce_marking_or_fda_clearance: Optional[str] = None
    warranty_info: Optional[str] = None

    # SEO
    permalink: Optional[str] = None
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    tags: Optional[List[str]] = None

    # AI assist
    ai_generated_fields: Optional[dict] = None
    completeness_score: int

    # Images, Variants, Bundles, Related
    images: List[ProductImageResponse] = []
    variants: List[ProductVariantResponse] = []
    bundle_items: List[BundleItemResponse] = []
    related_products: List[RelatedProductResponse] = []

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
    product_type: str = "simple"
    name: str
    slug: str
    sku: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None

    # Pricing & Tax
    price: Optional[float] = None
    compare_at_price: Optional[float] = None
    currency: str
    is_on_sale: bool = False
    has_vat: bool = True
    vat_rate: float = 16.0

    # Inventory
    in_stock: bool = True
    stock_status: Optional[str] = None  # instock, outofstock, backorder
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

    # Images, Variants, Bundles, Related
    images: List[ProductImageResponse] = []
    variants: List[ProductVariantResponse] = []
    bundle_items: List[BundleItemResponse] = []
    related_products: List[RelatedProductResponse] = []

    created_at: datetime

    class Config:
        from_attributes = True

    @model_validator(mode="before")
    @classmethod
    def resolve_brand_name(cls, data: Any) -> Any:
        # Check if data is an ORM object
        if hasattr(data, "brand_relation") and getattr(data, "brand_relation", None):
            brand_rel = getattr(data, "brand_relation")
            if hasattr(brand_rel, "name") and brand_rel.name:
                # If brand attribute on ORM object is None or a UUID string, set brand to brand_relation.name
                brand_val = getattr(data, "brand", None)
                if not brand_val or (isinstance(brand_val, str) and len(brand_val) == 36 and "-" in brand_val):
                    setattr(data, "brand", brand_rel.name)
        elif hasattr(data, "brand"):
            brand_val = getattr(data, "brand", None)
            if isinstance(brand_val, str) and len(brand_val) == 36 and "-" in brand_val:
                # Fallback if brand field on ORM object is a UUID string and brand_relation isn't loaded
                pass
        elif isinstance(data, dict):
            brand_rel = data.get("brand_relation")
            if isinstance(brand_rel, dict) and brand_rel.get("name"):
                brand_val = data.get("brand")
                if not brand_val or (isinstance(brand_val, str) and len(brand_val) == 36 and "-" in brand_val):
                    data["brand"] = brand_rel["name"]
        return data


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


class AIDescriptionRequest(BaseModel):
    """Request AI to generate product descriptions from name and brand"""
    product_name: str = Field(..., description="Product name")
    brand: str = Field(..., description="Brand name")
    category: Optional[str] = Field(None, description="Category name (optional)")


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


# ============================================================================
# BULK IMPORT SCHEMAS
# ============================================================================

class BulkImportRowError(BaseModel):
    """Error details for a single row in bulk import"""
    row: int = Field(..., description="Row number in CSV (1-indexed, header is row 0)")
    sku: Optional[str] = Field(None, description="SKU from the row")
    field: Optional[str] = Field(None, description="Field name that caused the error")
    error: str = Field(..., description="Error message")
    severity: str = Field(default="error", description="error or warning")


class BulkImportResult(BaseModel):
    """Result of bulk import operation"""
    success: bool = Field(..., description="Overall success status")
    total_rows: int = Field(..., description="Total number of data rows processed")
    created_count: int = Field(default=0, description="Number of products successfully created")
    updated_count: int = Field(default=0, description="Number of products successfully updated")
    skipped_count: int = Field(default=0, description="Number of rows skipped")
    errors: List[BulkImportRowError] = Field(default_factory=list, description="List of row-level errors")
    warnings: List[BulkImportRowError] = Field(default_factory=list, description="List of row-level warnings")
    created_products: List[str] = Field(default_factory=list, description="IDs of created products")
    processing_time_seconds: float = Field(..., description="Total processing time in seconds")


class BulkImportPreview(BaseModel):
    """Preview of bulk import data before actual import"""
    total_rows: int = Field(..., description="Total number of data rows")
    valid_rows: int = Field(..., description="Number of rows that pass validation")
    invalid_rows: int = Field(..., description="Number of rows with errors")
    warnings_count: int = Field(default=0, description="Number of rows with warnings")
    errors: List[BulkImportRowError] = Field(default_factory=list, description="Validation errors")
    warnings: List[BulkImportRowError] = Field(default_factory=list, description="Validation warnings")
    preview_data: List[dict] = Field(default_factory=list, description="Sample of valid rows (max 5)")


class BulkImportOptions(BaseModel):
    """Options for bulk import behavior"""
    update_existing: bool = Field(False, description="Update products if SKU exists")
    default_status: str = Field("draft", description="Default status for new products")
    skip_duplicates: bool = Field(True, description="Skip rows with duplicate SKUs instead of erroring")
    vendor_id: Optional[uuid.UUID] = Field(None, description="Default vendor ID (if not specified in CSV)")
