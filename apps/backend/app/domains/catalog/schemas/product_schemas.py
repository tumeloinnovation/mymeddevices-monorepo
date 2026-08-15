import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

# ============================================================================
# IMAGE SCHEMAS
# ============================================================================


class ProductImageCreate(BaseModel):
    """Schema for adding a product image"""

    url: str = Field(..., max_length=1000)
    alt_text: str | None = Field(None, max_length=500)
    sort_order: int = 0
    is_primary: bool = False


class ProductImageResponse(BaseModel):
    """Product image response"""

    id: uuid.UUID
    url: str
    alt_text: str | None = None
    sort_order: int
    is_primary: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductImageReorder(BaseModel):
    """Schema for reordering product images"""

    image_ids: list[uuid.UUID] = Field(..., description="Ordered list of image IDs")


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
    vendor_id: uuid.UUID | None = Field(
        None, description="Vendor ID (required for admin creation, auto-filled for vendors)"
    )
    category_id: uuid.UUID | None = None
    description: str | None = None
    short_description: str | None = Field(None, max_length=1000)
    sku: str | None = Field(None, max_length=100)

    # Pricing & Tax
    base_price: float | None = Field(None, ge=0)
    markup_price: float | None = Field(None, ge=0)
    commission_fee: float | None = Field(None, ge=0)
    price: float | None = Field(None, ge=0)
    cost_price: float | None = Field(None, ge=0)
    wholesale_price: float | None = Field(None, ge=0)
    compare_at_price: float | None = Field(None, ge=0)
    currency: str = "KES"
    has_vat: bool = True
    vat_rate: float = 16.0

    # Inventory
    stock_quantity: int = 0
    stock_status: str = "instock"
    low_stock_threshold: int = 5
    track_inventory: bool = True

    # Physical
    weight_kg: float | None = Field(None, ge=0)
    dimensions: dict | None = None

    # Medical device specifics
    brand: str | None = Field(None, max_length=255)
    model_number: str | None = Field(None, max_length=255)
    specifications: dict | None = None
    certifications: list | None = None
    kmpdb_registration_number: str | None = Field(None, max_length=255)
    ppb_classification: str | None = Field(None, max_length=100)
    ce_marking_or_fda_clearance: str | None = Field(None, max_length=255)
    warranty_info: str | None = None

    # SEO
    permalink: str | None = Field(None, max_length=500)
    meta_title: str | None = Field(None, max_length=255)
    meta_description: str | None = Field(None, max_length=500)
    tags: list[str] | None = None


class ProductUpdate(BaseModel):
    """Schema for updating a product. All fields optional."""

    product_type: str | None = Field(None, description="simple, variable, or bundle")
    name: str | None = Field(None, min_length=2, max_length=500)
    category_id: uuid.UUID | None = None
    description: str | None = None
    short_description: str | None = Field(None, max_length=1000)
    sku: str | None = Field(None, max_length=100)

    # Pricing & Tax
    base_price: float | None = Field(None, ge=0)
    markup_price: float | None = Field(None, ge=0)
    commission_fee: float | None = Field(None, ge=0)
    price: float | None = Field(None, ge=0)
    cost_price: float | None = Field(None, ge=0)
    wholesale_price: float | None = Field(None, ge=0)
    compare_at_price: float | None = Field(None, ge=0)
    currency: str | None = None
    has_vat: bool | None = None
    vat_rate: float | None = None

    # Inventory
    stock_quantity: int | None = None
    stock_status: str | None = None
    low_stock_threshold: int | None = None
    track_inventory: bool | None = None

    # SEO
    permalink: str | None = Field(None, max_length=500)

    # Physical
    weight_kg: float | None = Field(None, ge=0)
    dimensions: dict | None = None

    # Medical device specifics
    brand: str | None = Field(None, max_length=255)
    model_number: str | None = Field(None, max_length=255)
    specifications: dict | None = None
    certifications: list | None = None
    kmpdb_registration_number: str | None = Field(None, max_length=255)
    ppb_classification: str | None = Field(None, max_length=100)
    ce_marking_or_fda_clearance: str | None = Field(None, max_length=255)
    warranty_info: str | None = None

    # SEO
    meta_title: str | None = Field(None, max_length=255)
    meta_description: str | None = Field(None, max_length=500)
    tags: list[str] | None = None
    is_clinical_pick: bool | None = None

    # Status (admin can change status directly)
    status: str | None = Field(None, description="Product status: draft, pending_review, published, archived")


# ============================================================================
# PRODUCT RESPONSES
# ============================================================================
# VARIANT, BUNDLE & RELATED PRODUCT SCHEMAS
# ============================================================================


class ProductVariantCreate(BaseModel):
    """Schema for creating a product variant"""

    name: str = Field(..., max_length=255)
    sku: str | None = Field(None, max_length=100)
    price_adjustment: float | None = 0
    override_price: float | None = None
    stock_quantity: int = 0
    attributes: dict | None = None
    is_active: bool = True
    is_default: bool = False
    image_url: str | None = Field(None, max_length=1000)
    sort_order: int = 0
    weight_kg: float | None = None


class ProductVariantUpdate(BaseModel):
    """Schema for updating a product variant"""

    name: str | None = Field(None, max_length=255)
    sku: str | None = Field(None, max_length=100)
    price_adjustment: float | None = None
    override_price: float | None = None
    stock_quantity: int | None = None
    attributes: dict | None = None
    is_active: bool | None = None
    is_default: bool | None = None
    image_url: str | None = Field(None, max_length=1000)
    sort_order: int | None = None
    weight_kg: float | None = None


class VariantMatrixRequest(BaseModel):
    """Bulk matrix generation request from attribute groups"""

    attribute_groups: dict[str, list[str]] = Field(
        ..., description="e.g. {'size': ['S', 'M'], 'color': ['Blue', 'Black']}"
    )
    base_sku_prefix: str | None = None
    default_stock: int = 0


class ProductVariantResponse(BaseModel):
    """Product variant response"""

    id: uuid.UUID
    product_id: uuid.UUID
    name: str
    sku: str | None = None
    price_adjustment: float | None = 0
    override_price: float | None = None
    calculated_price: float | None = None
    stock_quantity: int = 0
    attributes: dict | None = None
    is_active: bool = True
    is_default: bool = False
    image_url: str | None = None
    sort_order: int = 0
    weight_kg: float | None = None

    model_config = ConfigDict(from_attributes=True)


class BundleItemCreate(BaseModel):
    """Schema for adding a component to a bundle product"""

    component_product_id: uuid.UUID
    quantity: int = Field(1, ge=1)
    sort_order: int = 0
    is_optional: bool = False


class BundleItemUpdate(BaseModel):
    """Schema for updating a bundle item"""

    quantity: int | None = Field(None, ge=1)
    sort_order: int | None = None
    is_optional: bool | None = None


class ComponentProductSummary(BaseModel):
    """Compact summary of a component product inside a bundle"""

    id: uuid.UUID
    name: str
    slug: str
    sku: str | None = None
    price: float | None = None
    image_url: str | None = None
    stock_status: str | None = "instock"

    model_config = ConfigDict(from_attributes=True)

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
    component_product: ComponentProductSummary | None = None
    quantity: int
    sort_order: int
    is_optional: bool

    model_config = ConfigDict(from_attributes=True)


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
    related_product: ComponentProductSummary | None = None
    relation_type: str
    sort_order: int
    is_bidirectional: bool

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# PRODUCT RESPONSES
# ============================================================================


class ProductResponse(BaseModel):
    """Full product response for vendor dashboard (includes all fields)"""

    id: uuid.UUID
    vendor_id: uuid.UUID
    category_id: uuid.UUID | None = None
    category_name: str | None = None

    # Basic info
    product_type: str = "simple"
    name: str
    slug: str
    description: str | None = None
    short_description: str | None = None
    sku: str | None = None

    # Pricing & Tax
    base_price: float | None = None
    markup_price: float | None = None
    commission_fee: float | None = None
    price: float | None = None
    cost_price: float | None = None
    wholesale_price: float | None = None
    compare_at_price: float | None = None
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
    verified_at: datetime | None = None
    rejection_reason: str | None = None

    # Merchandising
    is_featured: bool = False
    is_clinical_pick: bool = False
    is_on_sale: bool = False
    popularity_score: int
    view_count: int

    # Physical
    weight_kg: float | None = None
    dimensions: dict | None = None

    # Medical device specifics
    brand: str | None = None
    model_number: str | None = None
    specifications: dict | None = None
    certifications: list | None = None
    kmpdb_registration_number: str | None = None
    ppb_classification: str | None = None
    ce_marking_or_fda_clearance: str | None = None
    warranty_info: str | None = None

    # SEO
    permalink: str | None = None
    meta_title: str | None = None
    meta_description: str | None = None
    tags: list[str] | None = None

    # AI assist
    ai_generated_fields: dict | None = None
    completeness_score: int

    # Images, Variants, Bundles, Related
    images: list[ProductImageResponse] = []
    variants: list[ProductVariantResponse] = []
    bundle_items: list[BundleItemResponse] = []
    related_products: list[RelatedProductResponse] = []

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProductListResponse(BaseModel):
    """Paginated product list for vendor dashboard"""

    products: list[ProductResponse]
    total: int
    page: int
    page_size: int


# ============================================================================
# STOREFRONT RESPONSES (NO VENDOR INFO)
# ============================================================================


class StorefrontProductResponse(BaseModel):
    """Product response for public storefront. Vendor identity is HIDDEN."""

    id: uuid.UUID
    category_id: uuid.UUID | None = None
    category_name: str | None = None

    # Basic info
    product_type: str = "simple"
    name: str
    slug: str
    sku: str | None = None
    description: str | None = None
    short_description: str | None = None

    # Pricing & Tax
    price: float | None = None
    compare_at_price: float | None = None
    currency: str
    is_on_sale: bool = False
    has_vat: bool = True
    vat_rate: float = 16.0

    # Inventory
    in_stock: bool = True
    stock_status: str | None = None  # instock, outofstock, backorder
    stock_quantity: int | None = None  # Only shown if track_inventory

    # Merchandising
    is_featured: bool
    popularity_score: int

    # Physical
    weight_kg: float | None = None
    dimensions: dict | None = None

    # Medical device specifics
    brand: str | None = None
    model_number: str | None = None
    specifications: dict | None = None
    certifications: list | None = None
    kmpdb_registration_number: str | None = None
    ppb_classification: str | None = None
    ce_marking_or_fda_clearance: str | None = None
    warranty_info: str | None = None

    # SEO
    meta_title: str | None = None
    meta_description: str | None = None
    tags: list[str] | None = None

    # Images, Variants, Bundles, Related
    images: list[ProductImageResponse] = []
    variants: list[ProductVariantResponse] = []
    bundle_items: list[BundleItemResponse] = []
    related_products: list[RelatedProductResponse] = []

    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    @classmethod
    def resolve_brand_name(cls, data: Any) -> Any:
        if isinstance(data, dict):
            brand_rel = data.get("brand_relation")
            if isinstance(brand_rel, dict) and brand_rel.get("name"):
                brand_val = data.get("brand")
                if not brand_val or (isinstance(brand_val, str) and len(brand_val) == 36 and "-" in brand_val):
                    data["brand"] = brand_rel["name"]
        elif hasattr(data, "__dict__"):
            # Check ORM instance __dict__ directly to avoid triggering async lazy load / MissingGreenlet
            brand_rel = data.__dict__.get("brand_relation")
            if brand_rel and getattr(brand_rel, "name", None):
                brand_val = getattr(data, "brand", None)
                if not brand_val or (isinstance(brand_val, str) and len(brand_val) == 36 and "-" in brand_val):
                    data.brand = brand_rel.name
        return data


class StorefrontProductListResponse(BaseModel):
    """Paginated product list for public storefront"""

    products: list[StorefrontProductResponse]
    total: int
    page: int
    page_size: int


# ============================================================================
# AI ASSIST SCHEMAS
# ============================================================================


class AIAssistRequest(BaseModel):
    """Request AI to suggest product fields"""

    fields_to_generate: list[str] = Field(
        default=["description", "short_description", "specifications", "tags", "meta_title", "meta_description"],
        description="Which fields to generate suggestions for",
    )


class AIDescriptionRequest(BaseModel):
    """Request AI to generate product descriptions from name and brand"""

    product_name: str = Field(..., description="Product name")
    brand: str = Field(..., description="Brand name")
    category: str | None = Field(None, description="Category name (optional)")


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
    items: list[CompletenessItem]
    missing_required: list[str]  # Required fields that are missing


# ============================================================================
# BULK IMPORT SCHEMAS
# ============================================================================


class BulkImportRowError(BaseModel):
    """Error details for a single row in bulk import"""

    row: int = Field(..., description="Row number in CSV (1-indexed, header is row 0)")
    sku: str | None = Field(None, description="SKU from the row")
    field: str | None = Field(None, description="Field name that caused the error")
    error: str = Field(..., description="Error message")
    severity: str = Field(default="error", description="error or warning")


class BulkImportResult(BaseModel):
    """Result of bulk import operation"""

    success: bool = Field(..., description="Overall success status")
    total_rows: int = Field(..., description="Total number of data rows processed")
    created_count: int = Field(default=0, description="Number of products successfully created")
    updated_count: int = Field(default=0, description="Number of products successfully updated")
    skipped_count: int = Field(default=0, description="Number of rows skipped")
    errors: list[BulkImportRowError] = Field(default_factory=list, description="List of row-level errors")
    warnings: list[BulkImportRowError] = Field(default_factory=list, description="List of row-level warnings")
    created_products: list[str] = Field(default_factory=list, description="IDs of created products")
    processing_time_seconds: float = Field(..., description="Total processing time in seconds")


class BulkImportPreview(BaseModel):
    """Preview of bulk import data before actual import"""

    total_rows: int = Field(..., description="Total number of data rows")
    valid_rows: int = Field(..., description="Number of rows that pass validation")
    invalid_rows: int = Field(..., description="Number of rows with errors")
    warnings_count: int = Field(default=0, description="Number of rows with warnings")
    errors: list[BulkImportRowError] = Field(default_factory=list, description="Validation errors")
    warnings: list[BulkImportRowError] = Field(default_factory=list, description="Validation warnings")
    preview_data: list[dict] = Field(default_factory=list, description="Sample of valid rows (max 5)")


class BulkImportOptions(BaseModel):
    """Options for bulk import behavior"""

    update_existing: bool = Field(False, description="Update products if SKU exists")
    default_status: str = Field("draft", description="Default status for new products")
    skip_duplicates: bool = Field(True, description="Skip rows with duplicate SKUs instead of erroring")
    vendor_id: uuid.UUID | None = Field(None, description="Default vendor ID (if not specified in CSV)")
