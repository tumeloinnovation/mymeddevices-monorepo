import os
import uuid
import shutil
from typing import Annotated, Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_role
from app.domains.auth.models.user import User
from app.domains.catalog.models.product import Product
from app.domains.catalog.models.category import Category
from app.domains.catalog.models.brand import Brand
from app.domains.vendor.models.vendor_profile import VendorProfile
from app.domains.catalog.services.catalog_service import CatalogService
from app.domains.catalog.services.ai_assist_service import AIAssistService
from app.domains.catalog.config import settings as catalog_settings
from app.core.rate_limiting import RateLimiterDependency
from app.domains.catalog.schemas.product_schemas import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
    ProductImageResponse,
    ProductImageReorder,
    ProductReject,
    ProductVariantCreate,
    ProductVariantUpdate,
    VariantMatrixRequest,
    ProductVariantResponse,
    BundleItemCreate,
    BundleItemUpdate,
    BundleItemResponse,
    RelatedProductCreate,
    RelatedProductResponse,
    AIAssistRequest,
    AIDescriptionRequest,
    AIAssistResponse,
    ProductCompletenessResponse,
    BulkImportResult,
    BulkImportPreview,
    BulkImportOptions,
    BulkImportRowError,
)
from app.domains.catalog.schemas.brand_schemas import (
    BrandCreate,
    BrandQuickCreate,
    BrandUpdate,
    BrandResponse,
    BrandListResponse,
)
from app.domains.catalog.schemas.category_schemas import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    CategoryTreeResponse,
)
from app.domains.catalog.schemas.tag_schemas import (
    TagCreate,
    TagUpdate,
    TagResponse,
    TagListResponse,
)

router = APIRouter(tags=["Catalog"])


# ============================================================================
# CATEGORIES TAXONOMY (ADMIN-MANAGED & VENDOR VIEW)
# IMPORTANT: These routes must be defined BEFORE the /{id} routes to avoid
# route conflicts where "categories" would be matched as a product ID.
# ============================================================================

@router.get("/categories", response_model=List[CategoryTreeResponse], tags=["Categories"])
async def list_categories(db: AsyncSession = Depends(get_db)):
    """List category tree (Diagnostics -> BP monitors etc.)"""
    service = CatalogService(db)
    categories = await service.get_categories(active_only=False)
    return categories


@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED, tags=["Categories"])
async def create_category(
    data: CategoryCreate,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Admin creates a new category taxonomy."""
    service = CatalogService(db)
    try:
        category = await service.create_category(**data.model_dump())
        return category
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/categories/{category_id}", response_model=CategoryResponse, tags=["Categories"])
async def update_category(
    category_id: str,
    data: CategoryUpdate,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Admin updates category taxonomy."""
    service = CatalogService(db)
    try:
        category = await service.update_category(category_id=category_id, **data.model_dump(exclude_unset=True))
        return category
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Categories"])
async def delete_category(
    category_id: str,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Admin deletes category taxonomy."""
    service = CatalogService(db)
    try:
        await service.delete_category(category_id=category_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ============================================================================
# BRANDS (ADMIN-MANAGED)
# ============================================================================

@router.get("/brands", response_model=BrandListResponse, tags=["Brands"])
async def list_brands(
    active_only: bool = Query(True, description="Filter to active brands only"),
    approval_status: Optional[str] = Query(None, description="Filter by approval status (pending, approved, rejected)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List all brands with pagination."""
    service = CatalogService(db)
    brands, total = await service.get_brands(
        active_only=active_only,
        approval_status=approval_status,
        page=page,
        page_size=page_size
    )
    return {
        "brands": brands,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("/brands", response_model=BrandResponse, status_code=status.HTTP_201_CREATED, tags=["Brands"])
async def create_brand(
    data: BrandCreate,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Admin creates a new brand."""
    service = CatalogService(db)
    try:
        brand = await service.create_brand(**data.model_dump())
        return brand
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/brands/{brand_id}", response_model=BrandResponse, tags=["Brands"])
async def get_brand(
    brand_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a single brand by ID."""
    service = CatalogService(db)
    brand = await service.get_brand_by_id(brand_id)
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    return brand


@router.patch("/brands/{brand_id}", response_model=BrandResponse, tags=["Brands"])
async def update_brand(
    brand_id: str,
    data: BrandUpdate,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Admin updates a brand."""
    service = CatalogService(db)
    try:
        brand = await service.update_brand(brand_id=brand_id, **data.model_dump(exclude_unset=True))
        return brand
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/brands/{brand_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Brands"])
async def delete_brand(
    brand_id: str,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Admin deletes a brand."""
    service = CatalogService(db)
    try:
        await service.delete_brand(brand_id=brand_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/brands/quick-create", response_model=BrandResponse, status_code=status.HTTP_201_CREATED, tags=["Brands"])
async def quick_create_brand(
    data: BrandQuickCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """
    Quick-create a brand with minimal details (name only).
    Creates brand as auto-approved and active for immediate use.
    Accessible to all authenticated users (vendors, admins).
    """
    service = CatalogService(db)
    try:
        brand = await service.create_quick_brand(name=data.name)
        return brand
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/brands/{brand_id}/approve", response_model=BrandResponse, tags=["Brands"])
async def approve_brand(
    brand_id: str,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """
    Admin approves a pending brand.
    Sets approval_status to 'approved' and is_active to True.
    """
    service = CatalogService(db)
    try:
        brand = await service.approve_brand(brand_id=brand_id)
        return brand
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ============================================================================
# TAGS (ADMIN-MANAGED)
# ============================================================================

@router.get("/tags", response_model=TagListResponse, tags=["Tags"])
async def list_tags(
    active_only: bool = Query(True, description="Filter to active tags only"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List all tags with pagination."""
    service = CatalogService(db)
    tags, total = await service.get_tags(active_only=active_only, page=page, page_size=page_size)
    return {
        "tags": tags,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.post("/tags", response_model=TagResponse, status_code=status.HTTP_201_CREATED, tags=["Tags"])
async def create_tag(
    data: TagCreate,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Admin creates a new tag."""
    service = CatalogService(db)
    try:
        tag = await service.create_tag(**data.model_dump())
        return tag
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/tags/{tag_id}", response_model=TagResponse, tags=["Tags"])
async def get_tag(
    tag_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a single tag by ID."""
    service = CatalogService(db)
    tag = await service.get_tag_by_id(tag_id)
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    return tag


@router.patch("/tags/{tag_id}", response_model=TagResponse, tags=["Tags"])
async def update_tag(
    tag_id: str,
    data: TagUpdate,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Admin updates a tag."""
    service = CatalogService(db)
    try:
        tag = await service.update_tag(tag_id=tag_id, **data.model_dump(exclude_unset=True))
        return tag
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/tags/{tag_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Tags"])
async def delete_tag(
    tag_id: str,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Admin deletes a tag."""
    service = CatalogService(db)
    try:
        await service.delete_tag(tag_id=tag_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


async def get_approved_vendor_profile(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
) -> VendorProfile:
    """Helper to verify current user is an approved vendor."""
    if current_user.role != "vendor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only vendors can perform this action"
        )

    stmt = select(VendorProfile).where(VendorProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    vendor_profile = result.scalar_one_or_none()

    if not vendor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found"
        )

    if vendor_profile.approval_status != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Vendor profile is not approved (status: {vendor_profile.approval_status})"
        )

    return vendor_profile


async def get_vendor_context(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
) -> VendorProfile | None:
    """
    Helper to get vendor context for the current user.
    - For admins: returns None (they can manage all products)
    - For vendors: returns their approved vendor profile
    """
    # Admins can operate on all products without vendor restriction
    if current_user.role in ("admin", "worker"):
        return None

    # Vendors must have an approved profile
    if current_user.role != "vendor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only vendors and admins can perform this action"
        )

    stmt = select(VendorProfile).where(VendorProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    vendor_profile = result.scalar_one_or_none()

    if not vendor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found"
        )

    if vendor_profile.approval_status != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Vendor profile is not approved (status: {vendor_profile.approval_status})"
        )

    return vendor_profile


# ============================================================================
# VENDOR PRODUCT CRUD
# ============================================================================

import csv
import io

@router.post("/products/bulk-upload", response_model=dict, tags=["Vendor Catalog"])
async def bulk_upload_products(
    vendor_profile: Annotated[VendorProfile | None, Depends(get_vendor_context)],
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """Bulk upload products via CSV."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
        
    service = CatalogService(db)
    vendor_id = str(vendor_profile.id) if vendor_profile else None
    
    if not vendor_id:
        raise HTTPException(status_code=400, detail="Admin cannot bulk upload without a vendor context here yet.")
        
    content = await file.read()
    try:
        text = content.decode('utf-8-sig')
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Invalid file encoding. Please use UTF-8.")
        
    reader = csv.DictReader(io.StringIO(text))
    created_count = 0
    errors = []
    
    for i, row in enumerate(reader):
        try:
            # Map CSV columns to ProductCreate fields
            # Expected columns: name, sku, short_description, description, base_price, stock_quantity
            # Assuming these are mandatory minimums for the schema
            product_data = {
                "name": row.get("name"),
                "sku": row.get("sku"),
                "short_description": row.get("short_description") or "",
                "description": row.get("description") or "",
                "base_price": float(row.get("base_price", 0)),
                "stock_quantity": int(row.get("stock_quantity", 0)),
                "is_active": row.get("is_active", "true").lower() == "true",
            }
            
            # Additional optional fields could be added here
            
            await service.create_product(
                vendor_id=vendor_id,
                **product_data
            )
            created_count += 1
        except Exception as e:
            errors.append(f"Row {i+1} ({row.get('sku', 'unknown')}): {str(e)}")
            
    return {
        "message": f"Successfully created {created_count} products.",
        "created_count": created_count,
        "errors": errors
    }


# ============================================================================
# ADMIN BULK IMPORT (Enhanced)
# ============================================================================

@router.post("/products/bulk-import/preview", response_model=BulkImportPreview, tags=["Admin Catalog"])
async def bulk_import_preview(
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Preview bulk import data before actual import.
    Validates CSV structure and data without creating products.
    """
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    service = CatalogService(db)
    content = await file.read()

    try:
        text = content.decode('utf-8-sig')
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Invalid file encoding. Please use UTF-8.")

    reader = csv.DictReader(io.StringIO(text))
    errors = []
    warnings = []
    valid_count = 0
    preview_data = []

    # Required columns for validation
    required_columns = ["name"]
    optional_columns = [
        "sku", "vendor_id", "category_id", "description", "short_description",
        "base_price", "price", "cost_price", "currency", "stock_quantity",
        "stock_status", "low_stock_threshold", "track_inventory", "weight_kg",
        "brand", "model_number", "kmpdb_registration_number", "ppb_classification",
        "ce_marking_or_fda_clearance", "warranty_info", "permalink", "meta_title",
        "meta_description", "tags", "status"
    ]

    # Check for required columns
    missing_columns = [col for col in required_columns if col not in reader.fieldnames or []]
    if missing_columns:
        errors.append(BulkImportRowError(
            row=0,
            error=f"Missing required columns: {', '.join(missing_columns)}",
            severity="error"
        ))

    for i, row in enumerate(reader, start=1):
        row_errors = []
        row_warnings = []

        # Validate required fields
        if not row.get("name") or not row.get("name").strip():
            row_errors.append("name is required")

        # Validate vendor_id
        vendor_id = row.get("vendor_id")
        if vendor_id:
            try:
                uuid.UUID(vendor_id)
            except ValueError:
                row_errors.append("vendor_id must be a valid UUID")
        else:
            row_warnings.append("No vendor_id specified - product will not be associated with a vendor")

        # Validate UUIDs for related entities
        for field in ["category_id"]:
            value = row.get(field)
            if value:
                try:
                    uuid.UUID(value)
                except ValueError:
                    row_errors.append(f"{field} must be a valid UUID")

        # Validate numeric fields
        for field in ["base_price", "price", "cost_price", "weight_kg"]:
            value = row.get(field)
            if value and value.strip():
                try:
                    float(value)
                except ValueError:
                    row_errors.append(f"{field} must be a valid number")

        # Validate integer fields
        for field in ["stock_quantity", "low_stock_threshold"]:
            value = row.get(field)
            if value and value.strip():
                try:
                    int(value)
                except ValueError:
                    row_errors.append(f"{field} must be a valid integer")

        # Validate boolean fields
        for field in ["track_inventory"]:
            value = row.get(field)
            if value and value.strip():
                if value.lower() not in ["true", "false", "1", "0", "yes", "no"]:
                    row_warnings.append(f"{field} should be true/false or yes/no")

        # Collect errors and warnings
        if row_errors:
            errors.append(BulkImportRowError(
                row=i,
                sku=row.get("sku"),
                error="; ".join(row_errors),
                severity="error"
            ))

        if row_warnings:
            warnings.extend([
                BulkImportRowError(
                    row=i,
                    sku=row.get("sku"),
                    error=w,
                    severity="warning"
                )
                for w in row_warnings
            ])

        if not row_errors:
            valid_count += 1
            if len(preview_data) < 5:
                preview_data.append(dict(row))

    return BulkImportPreview(
        total_rows=i,
        valid_rows=valid_count,
        invalid_rows=len(errors),
        warnings_count=len(warnings),
        errors=errors,
        warnings=warnings,
        preview_data=preview_data
    )


@router.post("/products/bulk-import", response_model=BulkImportResult, tags=["Admin Catalog"])
async def bulk_import_products(
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    file: UploadFile = File(...),
    options: BulkImportOptions = BulkImportOptions(),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin bulk import products from CSV.
    Supports creating new products and optionally updating existing ones by SKU.
    """
    import time
    start_time = time.time()

    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    service = CatalogService(db)
    content = await file.read()

    try:
        text = content.decode('utf-8-sig')
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Invalid file encoding. Please use UTF-8.")

    reader = csv.DictReader(io.StringIO(text))
    errors = []
    warnings = []
    created_count = 0
    updated_count = 0
    skipped_count = 0
    created_products = []
    seen_skus = set()

    for i, row in enumerate(reader, start=1):
        try:
            # Skip if no name
            name = row.get("name", "").strip()
            if not name:
                errors.append(BulkImportRowError(
                    row=i,
                    error="name is required",
                    severity="error"
                ))
                continue

            # Check for duplicate SKUs within the import
            sku = row.get("sku", "").strip() if row.get("sku") else None
            if sku and options.skip_duplicates:
                if sku in seen_skus:
                    skipped_count += 1
                    warnings.append(BulkImportRowError(
                        row=i,
                        sku=sku,
                        error="Duplicate SKU in import - skipped",
                        severity="warning"
                    ))
                    continue
                seen_skus.add(sku)

            # Build product data from CSV row
            product_data = {
                "name": name,
                "sku": sku,
                "vendor_id": row.get("vendor_id") or options.vendor_id,
                "category_id": row.get("category_id"),
                "description": row.get("description") or None,
                "short_description": row.get("short_description") or None,
                "base_price": _parse_float(row.get("base_price")),
                "price": _parse_float(row.get("price")),
                "cost_price": _parse_float(row.get("cost_price")),
                "currency": row.get("currency", "KES"),
                "stock_quantity": _parse_int(row.get("stock_quantity")) or 0,
                "stock_status": row.get("stock_status", "instock"),
                "low_stock_threshold": _parse_int(row.get("low_stock_threshold")) or 5,
                "track_inventory": _parse_bool(row.get("track_inventory", "true")),
                "weight_kg": _parse_float(row.get("weight_kg")),
                "brand": row.get("brand") or None,
                "model_number": row.get("model_number") or None,
                "kmpdb_registration_number": row.get("kmpdb_registration_number") or None,
                "ppb_classification": row.get("ppb_classification") or None,
                "ce_marking_or_fda_clearance": row.get("ce_marking_or_fda_clearance") or None,
                "warranty_info": row.get("warranty_info") or None,
                "permalink": row.get("permalink") or None,
                "meta_title": row.get("meta_title") or None,
                "meta_description": row.get("meta_description") or None,
                "status": row.get("status", options.default_status),
            }

            # Parse tags (comma-separated)
            tags_str = row.get("tags")
            if tags_str:
                product_data["tags"] = [t.strip() for t in tags_str.split(",") if t.strip()]

            # Parse specifications (JSON string)
            specs_str = row.get("specifications")
            if specs_str:
                try:
                    import json
                    product_data["specifications"] = json.loads(specs_str)
                except json.JSONDecodeError:
                    warnings.append(BulkImportRowError(
                        row=i,
                        sku=sku,
                        error="Invalid JSON in specifications field - skipped",
                        severity="warning"
                    ))

            # Validate vendor_id is present
            vendor_id = product_data.get("vendor_id")
            if not vendor_id:
                errors.append(BulkImportRowError(
                    row=i,
                    sku=sku,
                    error="vendor_id is required (not specified in row or options)",
                    severity="error"
                ))
                continue

            # Check if product with SKU exists (for update)
            existing_product = None
            if sku and options.update_existing:
                existing_product = await service.get_product_by_sku(sku)

            if existing_product and options.update_existing:
                # Update existing product (use existing product's vendor_id)
                await service.update_product(
                    vendor_id=str(existing_product.vendor_id),
                    product_id=str(existing_product.id),
                    **{k: v for k, v in product_data.items() if v is not None and k != "vendor_id"}
                )
                updated_count += 1
            else:
                # Create new product
                product = await service.create_product(
                    vendor_id=str(vendor_id),
                    **{k: v for k, v in product_data.items() if k != "vendor_id"}
                )
                created_count += 1
                created_products.append(str(product.id))

        except Exception as e:
            errors.append(BulkImportRowError(
                row=i,
                sku=row.get("sku"),
                error=str(e),
                severity="error"
            ))

    processing_time = time.time() - start_time

    return BulkImportResult(
        success=len(errors) == 0 or (len(errors) < i and created_count > 0),
        total_rows=i,
        created_count=created_count,
        updated_count=updated_count,
        skipped_count=skipped_count,
        errors=errors,
        warnings=warnings,
        created_products=created_products,
        processing_time_seconds=round(processing_time, 2)
    )


def _parse_float(value: Optional[str]) -> Optional[float]:
    """Helper to parse float from CSV string"""
    if value is None or value.strip() == "":
        return None
    try:
        return float(value)
    except ValueError:
        return None


def _parse_int(value: Optional[str]) -> Optional[int]:
    """Helper to parse int from CSV string"""
    if value is None or value.strip() == "":
        return None
    try:
        return int(value)
    except ValueError:
        return None


def _parse_bool(value: Optional[str]) -> bool:
    """Helper to parse boolean from CSV string"""
    if not value:
        return True
    return value.lower() in ["true", "1", "yes"]


@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED, tags=["Vendor Catalog"])
async def create_product(
    data: ProductCreate,
    vendor_profile: Annotated[VendorProfile | None, Depends(get_vendor_context)],
    db: AsyncSession = Depends(get_db)
):
    """Create a new draft product. Vendors create for themselves, admins can create for any vendor."""
    service = CatalogService(db)
    try:
        # For vendors, use their profile id. For admins, use vendor_id from request.
        vendor_id = str(vendor_profile.id) if vendor_profile else str(data.vendor_id) if data.vendor_id else None
        if not vendor_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="vendor_id is required when creating product as admin"
            )
        product = await service.create_product(
            vendor_id=vendor_id,
            **data.model_dump(exclude_none=True, exclude={"vendor_id"})
        )
        return product
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/products", response_model=ProductListResponse, tags=["Vendor Catalog"], dependencies=[Depends(RateLimiterDependency("products_get"))])
async def list_products(
    vendor_profile: Annotated[VendorProfile | None, Depends(get_vendor_context)],
    status_filter: Optional[str] = Query(None, description="Filter by status (draft, pending_review, published, archived)"),
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    search: Optional[str] = Query(None, description="Search by name, SKU, or brand"),
    vendor_id: Optional[str] = Query(None, description="Filter by vendor ID (admin only)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List products with filtering and pagination. Vendors see their own, admins see all."""
    service = CatalogService(db)
    # Determine vendor_id: use the filter for admins, otherwise use the vendor's profile
    effective_vendor_id = vendor_id if vendor_profile is None else str(vendor_profile.id)
    products, total = await service.get_vendor_products(
        vendor_id=effective_vendor_id,
        status_filter=status_filter,
        category_id=category_id,
        search=search,
        page=page,
        page_size=page_size
    )
    return {
        "products": products,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.get("/products/{id}", response_model=ProductResponse, tags=["Vendor Catalog"], dependencies=[Depends(RateLimiterDependency("products_get"))])
async def get_product(
    id: str,
    vendor_profile: Annotated[VendorProfile | None, Depends(get_vendor_context)],
    db: AsyncSession = Depends(get_db)
):
    """Get single product detail."""
    service = CatalogService(db)
    try:
        vendor_id = str(vendor_profile.id) if vendor_profile else None
        product = await service.get_product(vendor_id=vendor_id, product_id=id)
        return product
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch("/products/{id}", response_model=ProductResponse, tags=["Vendor Catalog"])
async def update_product(
    id: str,
    data: ProductUpdate,
    vendor_profile: Annotated[VendorProfile | None, Depends(get_vendor_context)],
    db: AsyncSession = Depends(get_db)
):
    """Update product details. Resets verification status on substantial edits."""
    service = CatalogService(db)
    try:
        vendor_id = str(vendor_profile.id) if vendor_profile else None
        product = await service.update_product(
            vendor_id=vendor_id,
            product_id=id,
            **data.model_dump(exclude_unset=True)
        )
        return product
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/products/{id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Vendor Catalog"])
async def delete_product(
    id: str,
    vendor_profile: Annotated[VendorProfile | None, Depends(get_vendor_context)],
    db: AsyncSession = Depends(get_db)
):
    """Delete a draft product. Only drafts can be deleted."""
    service = CatalogService(db)
    try:
        vendor_id = str(vendor_profile.id) if vendor_profile else None
        await service.delete_product(vendor_id=vendor_id, product_id=id)
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ============================================================================
# LIFECYCLE MANAGEMENT
# ============================================================================

@router.post("/products/{id}/verify", response_model=ProductResponse, tags=["Vendor Catalog"])
async def verify_product(
    id: str,
    vendor_profile: Annotated[VendorProfile | None, Depends(get_vendor_context)],
    db: AsyncSession = Depends(get_db)
):
    """Verify product completeness and mark as ready/pending review."""
    service = CatalogService(db)
    try:
        vendor_id = str(vendor_profile.id) if vendor_profile else None
        product = await service.verify_product(vendor_id=vendor_id, product_id=id)
        return product
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/products/{id}/publish", response_model=ProductResponse, tags=["Vendor Catalog"])
async def publish_product(
    id: str,
    vendor_profile: Annotated[VendorProfile | None, Depends(get_vendor_context)],
    db: AsyncSession = Depends(get_db)
):
    """Publish a verified product to the storefront."""
    service = CatalogService(db)
    try:
        vendor_id = str(vendor_profile.id) if vendor_profile else None
        product = await service.publish_product(vendor_id=vendor_id, product_id=id)
        return product
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/products/{id}/reject", response_model=ProductResponse, tags=["Vendor Catalog"])
async def reject_product(
    id: str,
    data: ProductReject,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db)
):
    """Reject a product under review with feedback. Admin only."""
    service = CatalogService(db)
    try:
        # Admins don't have a vendor restriction
        product = await service.reject_product(vendor_id=None, product_id=id, reason=data.reason)
        return product
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/products/{id}/archive", response_model=ProductResponse, tags=["Vendor Catalog"])
async def archive_product(
    id: str,
    vendor_profile: Annotated[VendorProfile | None, Depends(get_vendor_context)],
    db: AsyncSession = Depends(get_db)
):
    """Archive a published product (removes it from storefront)."""
    service = CatalogService(db)
    try:
        vendor_id = str(vendor_profile.id) if vendor_profile else None
        product = await service.archive_product(vendor_id=vendor_id, product_id=id)
        return product
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/products/{id}/unarchive", response_model=ProductResponse, tags=["Vendor Catalog"])
async def unarchive_product(
    id: str,
    vendor_profile: Annotated[VendorProfile | None, Depends(get_vendor_context)],
    db: AsyncSession = Depends(get_db)
):
    """Unarchive an archived product back to draft status."""
    service = CatalogService(db)
    try:
        vendor_id = str(vendor_profile.id) if vendor_profile else None
        product = await service.unarchive_product(vendor_id=vendor_id, product_id=id)
        return product
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ============================================================================
# COMPLETENESS & AI ASSIST
# ============================================================================

@router.get("/products/{id}/completeness", response_model=ProductCompletenessResponse, tags=["Vendor Catalog"])
async def get_product_completeness(
    id: str,
    vendor_profile: Annotated[VendorProfile | None, Depends(get_vendor_context)],
    db: AsyncSession = Depends(get_db)
):
    """Get detailed completeness score breakdown for a product."""
    service = CatalogService(db)
    try:
        vendor_id = str(vendor_profile.id) if vendor_profile else None
        breakdown = await service.get_completeness_breakdown(vendor_id=vendor_id, product_id=id)
        return breakdown
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/ai/generate-descriptions", response_model=AIAssistResponse, tags=["Vendor Catalog"])
async def generate_product_descriptions(
    data: AIDescriptionRequest,
    current_user: Annotated[User, Depends(get_current_user)]
):
    """Generate AI-powered product descriptions from name and brand (before product creation)."""
    ai_service = AIAssistService()
    try:
        result = await ai_service.generate_descriptions_from_name_brand(
            product_name=data.product_name,
            brand=data.brand,
            category=data.category
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate descriptions: {str(e)}"
        )


@router.post("/products/{id}/ai-assist", response_model=AIAssistResponse, tags=["Vendor Catalog"])
async def get_ai_suggestions(
    id: str,
    data: AIAssistRequest,
    vendor_profile: Annotated[VendorProfile | None, Depends(get_vendor_context)],
    db: AsyncSession = Depends(get_db)
):
    """
    Trigger AI assistance to generate fields using Google Gemini.
    Accepts fields_to_generate list to control which fields to generate.
    Supports: description, short_description, specifications, tags, meta_title, meta_description
    """
    catalog_service = CatalogService(db)
    try:
        vendor_id = str(vendor_profile.id) if vendor_profile else None
        product = await catalog_service.get_product(vendor_id=vendor_id, product_id=id)

        # Load category if any
        category = None
        if product.category_id:
            category_stmt = select(Category).where(Category.id == product.category_id)
            category_res = await db.execute(category_stmt)
            category = category_res.scalar_one_or_none()

        # Resolve brand name if product.brand is a UUID or brand_id is set
        brand_name = product.brand
        if product.brand_id or (product.brand and len(product.brand) == 36 and "-" in product.brand):
            target_brand_id = product.brand_id or product.brand
            try:
                brand_uuid = uuid.UUID(str(target_brand_id))
                brand_stmt = select(Brand).where(Brand.id == brand_uuid)
                brand_res = await db.execute(brand_stmt)
                brand_obj = brand_res.scalar_one_or_none()
                if brand_obj:
                    brand_name = brand_obj.name
            except ValueError:
                pass

        # Create a transient product object with resolved brand name for AI prompt generation
        if brand_name != product.brand:
            product.brand = brand_name

        ai_service = AIAssistService()
        suggestions_res = await ai_service.generate_suggestions(
            product=product,
            category=category,
            fields_to_generate=data.fields_to_generate
        )
        return suggestions_res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/ai/generate-descriptions", response_model=AIAssistResponse, tags=["Vendor Catalog"])
async def generate_product_descriptions(
    data: AIDescriptionRequest,
    current_user: Annotated[User, Depends(get_current_user)]
):
    """
    Generate AI-powered product descriptions from name and brand (before product creation).
    Useful for pre-creation preview to help users see what content would be generated.
    """
    ai_service = AIAssistService()
    try:
        result = await ai_service.generate_descriptions_from_name_brand(
            product_name=data.product_name,
            brand=data.brand,
            category=data.category
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate descriptions: {str(e)}"
        )


@router.post("/products/{id}/ai-validate", tags=["Vendor Catalog"])
async def ai_validate_product(
    id: str,
    vendor_profile: Annotated[VendorProfile | None, Depends(get_vendor_context)],
    db: AsyncSession = Depends(get_db)
):
    """
    Run AI-powered validation on a product listing.
    Validates against medical device taxonomy, clinical accuracy, and regulatory compliance standards.
    """
    catalog_service = CatalogService(db)
    try:
        vendor_id = str(vendor_profile.id) if vendor_profile else None
        product = await catalog_service.get_product(vendor_id=vendor_id, product_id=id)

        # Load category if any for additional context
        category = None
        if product.category_id:
            category_stmt = select(Category).where(Category.id == product.category_id)
            category_res = await db.execute(category_stmt)
            category = category_res.scalar_one_or_none()

        ai_service = AIAssistService()
        validation_result = await ai_service.ai_validate_product(product=product, category=category)

        return validation_result
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# ============================================================================
# IMAGE MANAGEMENT (LOCAL FILESYSTEM STORAGE)
# ============================================================================

@router.post("/products/{id}/images", response_model=ProductImageResponse, status_code=status.HTTP_201_CREATED, tags=["Vendor Catalog"])
async def upload_product_image(
    id: str,
    vendor_profile: Annotated[VendorProfile | None, Depends(get_vendor_context)],
    file: UploadFile = File(...),
    alt_text: Optional[str] = Query(None),
    is_primary: bool = Query(False),
    sort_order: int = Query(0),
    db: AsyncSession = Depends(get_db)
):
    """Upload product image and save it locally on the server."""
    catalog_service = CatalogService(db)
    try:
        vendor_id = str(vendor_profile.id) if vendor_profile else None
        # Validate product exists and belongs to vendor (or any product for admin)
        product = await catalog_service.get_product(vendor_id=vendor_id, product_id=id)

        # Ensure uploads folder exists
        os.makedirs(catalog_settings.UPLOAD_DIR, exist_ok=True)

        # Generate safe unique filename
        file_ext = os.path.splitext(file.filename)[1].lower() or ".jpg"
        if file_ext not in [".jpg", ".jpeg", ".png", ".webp", ".gif"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image format")

        filename = f"{uuid.uuid4()}{file_ext}"
        filepath = os.path.join(catalog_settings.UPLOAD_DIR, filename)

        # Save file locally
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Web-accessible URL path
        image_url = f"/static/uploads/products/{filename}"

        # Save to DB
        image = await catalog_service.add_product_image(
            vendor_id=vendor_id,
            product_id=id,
            url=image_url,
            alt_text=alt_text,
            sort_order=sort_order,
            is_primary=is_primary
        )
        return image
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/products/{id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Vendor Catalog"])
async def remove_product_image(
    id: str,
    image_id: str,
    vendor_profile: Annotated[VendorProfile | None, Depends(get_vendor_context)],
    db: AsyncSession = Depends(get_db)
):
    """Remove image from product."""
    service = CatalogService(db)
    try:
        vendor_id = str(vendor_profile.id) if vendor_profile else None
        await service.remove_product_image(vendor_id=vendor_id, product_id=id, image_id=image_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/products/{id}/images/reorder", response_model=List[ProductImageResponse], tags=["Vendor Catalog"])
async def reorder_product_images(
    id: str,
    data: ProductImageReorder,
    vendor_profile: Annotated[VendorProfile | None, Depends(get_vendor_context)],
    db: AsyncSession = Depends(get_db)
):
    """Reorder product images."""
    service = CatalogService(db)
    try:
        vendor_id = str(vendor_profile.id) if vendor_profile else None
        images = await service.reorder_product_images(
            vendor_id=vendor_id,
            product_id=id,
            image_ids=[str(img_id) for img_id in data.image_ids]
        )
        return images
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ============================================================================
# PRODUCT VARIANTS
# ============================================================================

@router.get("/products/{id}/variants", response_model=List[ProductVariantResponse], tags=["Product Variants"])
async def list_product_variants(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """List all variants for a product."""
    service = CatalogService(db)
    return await service.get_variants(id)


@router.post("/products/{id}/variants", response_model=ProductVariantResponse, status_code=status.HTTP_201_CREATED, tags=["Product Variants"])
async def create_product_variant(
    id: uuid.UUID,
    data: ProductVariantCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Create a single product variant."""
    service = CatalogService(db)
    try:
        variant = await service.create_variant(product_id=id, **data.model_dump(exclude_unset=True))
        return variant
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/products/{id}/variants/bulk", response_model=List[ProductVariantResponse], status_code=status.HTTP_201_CREATED, tags=["Product Variants"])
async def create_variant_matrix(
    id: uuid.UUID,
    data: VariantMatrixRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Generate variant matrix combinations from attribute groups."""
    service = CatalogService(db)
    try:
        variants = await service.create_variant_matrix(
            product_id=id,
            attribute_groups=data.attribute_groups,
            base_sku_prefix=data.base_sku_prefix,
            default_stock=data.default_stock
        )
        return variants
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/products/{id}/variants/{variant_id}", response_model=ProductVariantResponse, tags=["Product Variants"])
async def update_product_variant(
    id: uuid.UUID,
    variant_id: uuid.UUID,
    data: ProductVariantUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Update a product variant."""
    service = CatalogService(db)
    try:
        variant = await service.update_variant(variant_id=variant_id, **data.model_dump(exclude_unset=True))
        return variant
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/products/{id}/variants/{variant_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Product Variants"])
async def delete_product_variant(
    id: uuid.UUID,
    variant_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Delete a product variant."""
    service = CatalogService(db)
    deleted = await service.delete_variant(variant_id=variant_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found")


# ============================================================================
# BUNDLE ITEMS
# ============================================================================

@router.get("/products/{id}/bundle-items", response_model=List[BundleItemResponse], tags=["Bundle Items"])
async def list_bundle_items(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db)
):
    """List component items for a bundle product."""
    service = CatalogService(db)
    return await service.get_bundle_items(id)


@router.post("/products/{id}/bundle-items", response_model=BundleItemResponse, status_code=status.HTTP_201_CREATED, tags=["Bundle Items"])
async def add_bundle_item(
    id: uuid.UUID,
    data: BundleItemCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Add a component item to a bundle product."""
    service = CatalogService(db)
    try:
        item = await service.add_bundle_item(
            bundle_product_id=id,
            component_product_id=data.component_product_id,
            quantity=data.quantity,
            sort_order=data.sort_order,
            is_optional=data.is_optional
        )
        return item
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.patch("/products/{id}/bundle-items/{item_id}", response_model=BundleItemResponse, tags=["Bundle Items"])
async def update_bundle_item(
    id: uuid.UUID,
    item_id: uuid.UUID,
    data: BundleItemUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Update a bundle component item."""
    service = CatalogService(db)
    try:
        item = await service.update_bundle_item(item_id=item_id, **data.model_dump(exclude_unset=True))
        return item
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/products/{id}/bundle-items/{item_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Bundle Items"])
async def remove_bundle_item(
    id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Remove a component item from a bundle product."""
    service = CatalogService(db)
    deleted = await service.remove_bundle_item(item_id=item_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bundle item not found")


# ============================================================================
# RELATED PRODUCTS
# ============================================================================

@router.get("/products/{id}/related", response_model=List[RelatedProductResponse], tags=["Related Products"])
async def list_related_products(
    id: uuid.UUID,
    relation_type: Optional[str] = Query(None, description="cross_sell, upsell, accessory, spare_part"),
    db: AsyncSession = Depends(get_db)
):
    """List related products linked to a product."""
    service = CatalogService(db)
    return await service.get_related_products(product_id=id, relation_type=relation_type)


@router.post("/products/{id}/related", response_model=RelatedProductResponse, status_code=status.HTTP_201_CREATED, tags=["Related Products"])
async def add_related_product(
    id: uuid.UUID,
    data: RelatedProductCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Link a related product (cross_sell, upsell, accessory, spare_part)."""
    service = CatalogService(db)
    try:
        rel = await service.add_related_product(
            product_id=id,
            related_product_id=data.related_product_id,
            relation_type=data.relation_type,
            sort_order=data.sort_order,
            is_bidirectional=data.is_bidirectional
        )
        return rel
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/products/{id}/related/{relation_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Related Products"])
async def remove_related_product(
    id: uuid.UUID,
    relation_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Remove a related product link."""
    service = CatalogService(db)
    deleted = await service.remove_related_product(relation_id=relation_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relation not found")
