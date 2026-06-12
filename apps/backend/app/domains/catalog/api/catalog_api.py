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
from app.domains.vendor.models.vendor_profile import VendorProfile
from app.domains.catalog.services.catalog_service import CatalogService
from app.domains.catalog.services.ai_assist_service import AIAssistService
from app.domains.catalog.config import settings as catalog_settings
from app.domains.catalog.schemas.product_schemas import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
    ProductImageResponse,
    ProductImageReorder,
    AIAssistRequest,
    AIAssistResponse,
    ProductCompletenessResponse,
)
from app.domains.catalog.schemas.category_schemas import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    CategoryTreeResponse,
)

router = APIRouter(prefix="/products", tags=["Vendor Catalog"])


# ============================================================================
# CATEGORIES TAXONOMY (ADMIN-MANAGED & VENDOR VIEW)
# IMPORTANT: These routes must be defined BEFORE the /{id} routes to avoid
# route conflicts where "categories" would be matched as a product ID.
# ============================================================================

@router.get("/categories", response_model=List[CategoryTreeResponse], tags=["Categories"])
async def list_categories(db: AsyncSession = Depends(get_db)):
    """List category tree (Diagnostics -> BP monitors etc.)"""
    service = CatalogService(db)
    categories = await service.get_categories(active_only=True)
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

@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
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


@router.get("", response_model=ProductListResponse)
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


@router.get("/{id}", response_model=ProductResponse)
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


@router.patch("/{id}", response_model=ProductResponse)
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


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ============================================================================
# LIFECYCLE MANAGEMENT
# ============================================================================

@router.post("/{id}/verify", response_model=ProductResponse)
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


@router.post("/{id}/publish", response_model=ProductResponse)
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


@router.post("/{id}/archive", response_model=ProductResponse)
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


@router.post("/{id}/unarchive", response_model=ProductResponse)
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

@router.get("/{id}/completeness", response_model=ProductCompletenessResponse)
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


@router.post("/{id}/ai-assist", response_model=AIAssistResponse)
async def get_ai_suggestions(
    id: str,
    data: AIAssistRequest,
    vendor_profile: Annotated[VendorProfile | None, Depends(get_vendor_context)],
    db: AsyncSession = Depends(get_db)
):
    """Trigger AI assistance to generate fields using Google Gemini."""
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

        ai_service = AIAssistService()
        suggestions_res = await ai_service.generate_suggestions(
            product=product,
            category=category,
            fields_to_generate=data.fields_to_generate
        )
        return suggestions_res
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


# ============================================================================
# IMAGE MANAGEMENT (LOCAL FILESYSTEM STORAGE)
# ============================================================================

@router.post("/{id}/images", response_model=ProductImageResponse, status_code=status.HTTP_201_CREATED)
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


@router.delete("/{id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
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


@router.patch("/{id}/images/reorder", response_model=List[ProductImageResponse])
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
            image_ids=data.image_ids
        )
        return images
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
