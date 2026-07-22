from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.domains.catalog.services.catalog_service import CatalogService
from app.domains.catalog.schemas.product_schemas import (
    StorefrontProductResponse,
    StorefrontProductListResponse,
)
from app.domains.catalog.schemas.category_schemas import CategoryTreeResponse
from app.core.rate_limiting import RateLimiterDependency

router = APIRouter(prefix="", tags=["Public Storefront"])


@router.get("/products", response_model=StorefrontProductListResponse, dependencies=[Depends(RateLimiterDependency("products_get"))])
async def get_storefront_products(
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    category_slug: Optional[str] = Query(None, description="Filter by category slug"),
    search: Optional[str] = Query(None, description="Search term for products"),
    price_min: Optional[float] = Query(None, ge=0, description="Minimum price"),
    price_max: Optional[float] = Query(None, ge=0, description="Maximum price"),
    is_featured: Optional[bool] = Query(None, description="Filter by featured status"),
    is_on_sale: Optional[bool] = Query(None, description="Filter by on sale status"),
    in_stock: Optional[bool] = Query(None, description="Filter by stock availability"),
    sort_by: str = Query("newest", description="Sorting options: newest, price_asc, price_desc, popular, name_asc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
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
        is_on_sale=is_on_sale,
        in_stock=in_stock,
        sort_by=sort_by,
        page=page,
        page_size=page_size
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

    return {
        "products": storefront_products,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.get("/products/{slug}", response_model=StorefrontProductResponse, dependencies=[Depends(RateLimiterDependency("products_get"))])
async def get_storefront_product(
    slug: str,
    db: AsyncSession = Depends(get_db)
):
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


@router.get("/categories", response_model=List[CategoryTreeResponse])
async def get_storefront_categories(db: AsyncSession = Depends(get_db)):
    """List category taxonomy tree for navigation."""
    service = CatalogService(db)
    categories = await service.get_categories(active_only=True)
    return categories


@router.get("/categories/{slug}/products", response_model=StorefrontProductListResponse, dependencies=[Depends(RateLimiterDependency("products_get"))])
async def get_storefront_products_by_category(
    slug: str,
    price_min: Optional[float] = Query(None, ge=0),
    price_max: Optional[float] = Query(None, ge=0),
    in_stock: Optional[bool] = Query(None),
    sort_by: str = Query("newest"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
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
        page_size=page_size
    )

    storefront_products = []
    for p in products:
        p_dict = StorefrontProductResponse.model_validate(p)
        p_dict.in_stock = p.stock_quantity > 0
        storefront_products.append(p_dict)

    return {
        "products": storefront_products,
        "total": total,
        "page": page,
        "page_size": page_size
    }
