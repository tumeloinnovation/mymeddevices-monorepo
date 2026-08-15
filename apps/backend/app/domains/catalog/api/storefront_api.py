import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.rate_limiting import RateLimiterDependency
from app.core.responses import ApiSuccessResponse, success_response
from app.domains.catalog.schemas.category_schemas import CategoryTreeResponse
from app.domains.catalog.schemas.product_schemas import (
    RelatedProductResponse,
    StorefrontProductListResponse,
    StorefrontProductResponse,
)
from app.domains.catalog.services.catalog_service import CatalogService
from app.domains.customers.repositories.customer_repository import ReviewRepository
from app.domains.customers.schemas.customer_schemas import PublicReviewResponse

router = APIRouter(prefix="", tags=["Public Storefront"])


@router.get(
    "/products",
    response_model=StorefrontProductListResponse,
    dependencies=[Depends(RateLimiterDependency("products_get"))],
)
async def get_storefront_products(
    category_id: str | None = Query(None, description="Filter by category ID"),
    category_slug: str | None = Query(None, description="Filter by category slug"),
    search: str | None = Query(None, description="Search term for products"),
    price_min: float | None = Query(None, ge=0, description="Minimum price"),
    price_max: float | None = Query(None, ge=0, description="Maximum price"),
    is_featured: bool | None = Query(None, description="Filter by featured status"),
    is_clinical_pick: bool | None = Query(None, description="Filter by clinical pick status"),
    care_setting: str | None = Query(None, description="Filter by care setting tag (e.g. care_setting:icu)"),
    condition: str | None = Query(None, description="Filter by condition tag (e.g. condition:respiratory)"),
    is_on_sale: bool | None = Query(None, description="Filter by on sale status"),
    in_stock: bool | None = Query(None, description="Filter by stock availability"),
    sort_by: str = Query(
        "newest", description="Sorting options: newest, price_asc, price_desc, popular, name_asc, trending"
    ),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Browse published and verified products on the storefront.
    Hides vendor identity and internal fields like base_price, markup_price, cost_price, etc.
    """
    service = CatalogService(db)
    products, total = await service.get_storefront_products(
        category_id=category_id,
        category_slug=category_slug,
        search=search,
        price_min=price_min,
        price_max=price_max,
        is_featured=is_featured,
        is_clinical_pick=is_clinical_pick,
        care_setting=care_setting,
        condition=condition,
        is_on_sale=is_on_sale,
        in_stock=in_stock,
        sort_by=sort_by,
        page=page,
        page_size=page_size,
    )

    # Convert to storefront response model
    # (Pydantic will automatically map using from_attributes, but let's handle in_stock calculation)
    storefront_products = []
    for p in products:
        # Pydantic StorefrontProductResponse has in_stock: bool
        # Let's map it explicitly or let Pydantic extract it from the object
        p_dict = StorefrontProductResponse.model_validate(p)
        # Check stock manually in case
        p_dict.in_stock = p.stock_quantity > 0
        storefront_products.append(p_dict)

    return {"products": storefront_products, "total": total, "page": page, "page_size": page_size}


@router.get(
    "/products/{slug}",
    response_model=StorefrontProductResponse,
    dependencies=[Depends(RateLimiterDependency("products_get"))],
)
async def get_storefront_product(slug: str, db: AsyncSession = Depends(get_db)):
    """
    Get detailed product by slug for public storefront view.
    Increments page view count. Hides vendor identity and internal pricing.
    """
    service = CatalogService(db)
    try:
        product = await service.get_storefront_product_by_slug(slug)
        p_resp = StorefrontProductResponse.model_validate(product)
        p_resp.in_stock = product.stock_quantity > 0
        return p_resp
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/categories", response_model=list[CategoryTreeResponse])
async def get_storefront_categories(db: AsyncSession = Depends(get_db)):
    """List category taxonomy tree for navigation."""
    service = CatalogService(db)
    categories = await service.get_categories(active_only=True)
    return categories


@router.get(
    "/categories/{slug}/products",
    response_model=StorefrontProductListResponse,
    dependencies=[Depends(RateLimiterDependency("products_get"))],
)
async def get_storefront_products_by_category(
    slug: str,
    price_min: float | None = Query(None, ge=0),
    price_max: float | None = Query(None, ge=0),
    in_stock: bool | None = Query(None),
    sort_by: str = Query("newest"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get storefront products belonging to a specific category slug."""
    service = CatalogService(db)
    products, total = await service.get_storefront_products(
        category_slug=slug,
        price_min=price_min,
        price_max=price_max,
        in_stock=in_stock,
        sort_by=sort_by,
        page=page,
        page_size=page_size,
    )

    storefront_products = []
    for p in products:
        p_dict = StorefrontProductResponse.model_validate(p)
        p_dict.in_stock = p.stock_quantity > 0
        storefront_products.append(p_dict)

    return {"products": storefront_products, "total": total, "page": page, "page_size": page_size}


@router.get(
    "/products/{slug}/reviews",
    response_model=ApiSuccessResponse[list[PublicReviewResponse]],
    dependencies=[Depends(RateLimiterDependency("products_get"))],
)
async def get_product_reviews(slug: str, db: AsyncSession = Depends(get_db)):
    """
    Get visible reviews for a product by slug.
    Returns only reviews with moderation_status='visible'.
    """
    from app.domains.catalog.models.product import Product

    # Check if slug is a valid UUID or product slug
    is_uuid = False
    try:
        product_uuid = uuid.UUID(slug)
        is_uuid = True
    except ValueError:
        pass

    if is_uuid:
        product_stmt = select(Product).where((Product.id == product_uuid) | (Product.slug == slug))
    else:
        product_stmt = select(Product).where(Product.slug == slug)

    product_result = await db.execute(product_stmt)
    product = product_result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # Get reviews for this product
    review_repo = ReviewRepository(db)
    reviews = await review_repo.get_product_reviews(product.id, include_hidden=False)

    # Convert to public response (anonymize customer info)
    public_reviews = []
    for review in reviews:
        # Get customer name from relationship
        customer_name = None
        if review.customer and review.customer.user:
            first = review.customer.user.first_name or ""
            last = review.customer.user.last_name or ""
            customer_name = f"{first[0]}. {last}" if first and last else (first or last or "Customer")

        public_reviews.append(
            {
                "id": str(review.id),
                "rating": review.rating,
                "comment": review.comment,
                "is_verified_purchase": review.is_verified_purchase,
                "created_at": review.created_at,
                "reviewer_name": customer_name,
            }
        )

    return success_response(public_reviews)


@router.get(
    "/products/{slug}/related",
    response_model=list[RelatedProductResponse],
    dependencies=[Depends(RateLimiterDependency("products_get"))],
)
async def get_storefront_related_products(
    slug: str,
    relation_type: str | None = Query(None, description="cross_sell, upsell, accessory, spare_part"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get related products for a product slug on the public storefront.
    """
    service = CatalogService(db)
    try:
        product = await service.get_storefront_product_by_slug(slug)
        related = await service.get_related_products(product_id=product.id, relation_type=relation_type)
        return related
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
