from decimal import Decimal
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.rate_limiting import RateLimiterDependency
from app.core.responses import ApiSuccessResponse, success_response
from app.domains.catalog.models.bundle import Bundle
from app.domains.catalog.models.category import Category
from app.domains.catalog.models.product import Product
from app.domains.catalog.models.product_variant import ProductVariant
from app.domains.catalog.schemas.bundle_schemas import (
    BundleComponentResponse,
    BundleResponse,
)
from app.domains.catalog.schemas.category_schemas import CategoryTreeResponse
from app.domains.catalog.schemas.offer_schemas import BuyBoxCandidateResponse
from app.domains.catalog.schemas.product_schemas import (
    RelatedProductResponse,
    StorefrontProductListResponse,
    StorefrontProductResponse,
)
from app.domains.catalog.services.bundle_service import bundle_service
from app.domains.catalog.services.buy_box_service import buy_box_service
from app.domains.catalog.services.catalog_service import CatalogService
from app.domains.catalog.services.pricing_engine import pricing_engine
from app.domains.customers.repositories.customer_repository import ReviewRepository
from app.domains.customers.schemas.customer_schemas import PublicReviewResponse
from app.domains.vendor.models.vendor_offer import (
    OfferInventory,
    OfferStatusEnum,
    SellingUnitEnum,
    VendorOffer,
)

router = APIRouter(prefix="", tags=["Public Storefront"])


@router.get(
    "/products",
    response_model=StorefrontProductListResponse,
    dependencies=[Depends(RateLimiterDependency("products_get"))],
)
async def get_storefront_products(
    category: str | None = Query(None, description="Filter by category slug or ID"),
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
    effective_slug = category_slug or category
    service = CatalogService(db)
    products, total = await service.get_storefront_products(
        category_id=category_id,
        category_slug=effective_slug,
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

    storefront_products = []
    for p in products:
        p_dict = StorefrontProductResponse.model_validate(p)
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


@router.get(
    "/products/{slug}/buy-box",
    response_model=list[BuyBoxCandidateResponse],
    dependencies=[Depends(RateLimiterDependency("products_get"))],
)
async def get_product_buy_box_offers(slug: str, db: AsyncSession = Depends(get_db)):
    """
    Retrieve all eligible commercial packaging choices and Buy-Box winning offers for a product.
    """
    # 1. Fetch Product and its variants
    stmt_p = (
        select(Product)
        .options(selectinload(Product.variants))
        .where(Product.slug == slug, Product.status == "published", Product.is_deleted == False)
    )
    res_p = await db.execute(stmt_p)
    product = res_p.scalar_one_or_none()

    if not product or not product.variants:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product or variants not found")

    results: list[BuyBoxCandidateResponse] = []

    # 2. Iterate through each variant and distinct packaging configuration
    for variant in product.variants:
        if not variant.is_active:
            continue

        stmt_pkg = (
            select(VendorOffer.selling_unit, VendorOffer.package_quantity)
            .where(VendorOffer.product_variant_id == variant.id, VendorOffer.status == OfferStatusEnum.ACTIVE)
            .distinct()
        )
        res_pkg = await db.execute(stmt_pkg)
        pkg_configs = res_pkg.all()

        for s_unit, p_qty in pkg_configs:
            bb = await buy_box_service.resolve_buy_box(
                session=db,
                product_variant_id=variant.id,
                selling_unit=s_unit,
                package_quantity=p_qty,
                required_quantity=1,
            )
            if bb.winning_candidate:
                w = bb.winning_candidate
                v_name = w.offer.vendor.store_name if w.offer.vendor else "Certified Vendor"
                pkg_label = f"{s_unit.value.capitalize()} of {p_qty}" if p_qty > 1 else s_unit.value.capitalize()

                results.append(
                    BuyBoxCandidateResponse(
                        offer_id=w.offer.id,
                        vendor_id=w.offer.vendor_id,
                        vendor_name=v_name,
                        selling_unit=s_unit,
                        package_quantity=p_qty,
                        package_display_label=pkg_label,
                        vendor_price=Decimal(str(w.offer.vendor_price)),
                        customer_price=w.pricing.customer_price,
                        unit_customer_price=w.unit_customer_price,
                        lead_time_days=w.offer.lead_time_days,
                        warranty_months=w.offer.warranty_months,
                        available_stock=w.inventory.quantity_on_hand - w.inventory.quantity_reserved,
                        is_buy_box_winner=True,
                    )
                )

    return results


@router.get("/bundles", response_model=list[BundleResponse])
async def list_storefront_bundles(db: AsyncSession = Depends(get_db)):
    """
    List active merchandising bundles for storefront display.
    """
    stmt = (
        select(Bundle)
        .where(Bundle.is_active == True)
        .order_by(Bundle.created_at.desc())
    )
    res = await db.execute(stmt)
    bundles = res.scalars().all()

    output = []
    for b in bundles:
        try:
            resolved = await bundle_service.resolve_bundle(db, b.id)
            comp_res = [
                BundleComponentResponse(
                    id=c.component.id,
                    product_id=c.product.id,
                    product_name=c.product.name,
                    product_slug=c.product.slug,
                    quantity=c.quantity,
                    sort_order=c.component.sort_order,
                    gross_unit_price=c.gross_unit_customer_price,
                    allocated_discount=c.allocated_line_discount,
                    net_unit_price=c.net_unit_customer_price,
                    winning_vendor_name=c.winning_offer.offer.vendor.store_name if c.winning_offer and c.winning_offer.offer.vendor else None,
                )
                for c in resolved.components
            ]
            output.append(
                BundleResponse(
                    id=b.id,
                    name=b.name,
                    slug=b.slug,
                    description=b.description,
                    discount_type=b.discount_type,
                    discount_value=Decimal(str(b.discount_value)),
                    funding_source=b.funding_source,
                    is_active=b.is_active,
                    is_available=resolved.is_available,
                    gross_customer_price=resolved.gross_customer_price,
                    discount_amount=resolved.discount_amount,
                    net_customer_price=resolved.net_customer_price,
                    components=comp_res,
                    created_at=b.created_at,
                    updated_at=b.updated_at,
                )
            )
        except Exception:
            # Fallback: calculate using product catalog price if live vendor offer resolution fails
            try:
                res_b = await db.execute(
                    select(Bundle)
                    .options(
                        selectinload(Bundle.components)
                        .selectinload(BundleComponent.product)
                        .selectinload(Product.variants)
                    )
                    .where(Bundle.id == b.id)
                )
                bundle_full = res_b.scalar_one_or_none()
                if not bundle_full:
                    continue

                gross_total = Decimal("0.00")
                comp_res = []
                for comp in bundle_full.components:
                    prod = comp.product
                    prod_price = Decimal(str(prod.price)) if prod and prod.price else Decimal("0.00")
                    gross_total += prod_price * comp.quantity
                    comp_res.append(
                        BundleComponentResponse(
                            id=comp.id,
                            product_id=comp.product_id,
                            product_name=prod.name if prod else "Component Item",
                            product_slug=prod.slug if prod else "",
                            quantity=comp.quantity,
                            sort_order=comp.sort_order,
                            gross_unit_price=prod_price,
                            allocated_discount=None,
                            net_unit_price=prod_price,
                            winning_vendor_name=None,
                        )
                    )

                if b.discount_type == "PERCENTAGE":
                    discount_amt = (gross_total * Decimal(str(b.discount_value))) / Decimal("100")
                else:
                    discount_amt = Decimal(str(b.discount_value))

                discount_amt = min(gross_total, max(Decimal("0.00"), discount_amt))
                net_total = max(Decimal("0.00"), gross_total - discount_amt)

                output.append(
                    BundleResponse(
                        id=b.id,
                        name=b.name,
                        slug=b.slug,
                        description=b.description,
                        discount_type=b.discount_type,
                        discount_value=Decimal(str(b.discount_value)),
                        funding_source=b.funding_source,
                        is_active=b.is_active,
                        is_available=True,
                        gross_customer_price=gross_total,
                        discount_amount=discount_amt,
                        net_customer_price=net_total,
                        components=comp_res,
                        created_at=b.created_at,
                        updated_at=b.updated_at,
                    )
                )
            except Exception:
                continue

    return output


@router.get("/bundles/{slug}", response_model=BundleResponse)
async def get_storefront_bundle(slug: str, db: AsyncSession = Depends(get_db)):
    """
    Get detailed merchandising bundle by slug with dynamically resolved component pricing.
    """
    stmt = select(Bundle).where(Bundle.slug == slug, Bundle.is_active == True)
    res = await db.execute(stmt)
    bundle = res.scalar_one_or_none()

    if not bundle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bundle not found")

    try:
        resolved = await bundle_service.resolve_bundle(db, bundle.id)
        comp_res = [
            BundleComponentResponse(
                id=c.component.id,
                product_id=c.product.id,
                product_name=c.product.name,
                product_slug=c.product.slug,
                quantity=c.quantity,
                sort_order=c.component.sort_order,
                gross_unit_price=c.gross_unit_customer_price,
                allocated_discount=c.allocated_line_discount,
                net_unit_price=c.net_unit_customer_price,
                winning_vendor_name=c.winning_offer.offer.vendor.store_name if c.winning_offer and c.winning_offer.offer.vendor else None,
            )
            for c in resolved.components
        ]

        return BundleResponse(
            id=bundle.id,
            name=bundle.name,
            slug=bundle.slug,
            description=bundle.description,
            discount_type=bundle.discount_type,
            discount_value=Decimal(str(bundle.discount_value)),
            funding_source=bundle.funding_source,
            is_active=bundle.is_active,
            is_available=resolved.is_available,
            gross_customer_price=resolved.gross_customer_price,
            discount_amount=resolved.discount_amount,
            net_customer_price=resolved.net_customer_price,
            components=comp_res,
            created_at=bundle.created_at,
            updated_at=bundle.updated_at,
        )
    except Exception:
        # Fallback to catalog prices
        res_b = await db.execute(
            select(Bundle)
            .options(
                selectinload(Bundle.components)
                .selectinload(BundleComponent.product)
                .selectinload(Product.variants)
            )
            .where(Bundle.id == bundle.id)
        )
        bundle_full = res_b.scalar_one_or_none()
        if not bundle_full:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bundle components not found")

        gross_total = Decimal("0.00")
        comp_res = []
        for comp in bundle_full.components:
            prod = comp.product
            prod_price = Decimal(str(prod.price)) if prod and prod.price else Decimal("0.00")
            gross_total += prod_price * comp.quantity
            comp_res.append(
                BundleComponentResponse(
                    id=comp.id,
                    product_id=comp.product_id,
                    product_name=prod.name if prod else "Component Item",
                    product_slug=prod.slug if prod else "",
                    quantity=comp.quantity,
                    sort_order=comp.sort_order,
                    gross_unit_price=prod_price,
                    allocated_discount=None,
                    net_unit_price=prod_price,
                    winning_vendor_name=None,
                )
            )

        if bundle.discount_type == "PERCENTAGE":
            discount_amt = (gross_total * Decimal(str(bundle.discount_value))) / Decimal("100")
        else:
            discount_amt = Decimal(str(bundle.discount_value))

        discount_amt = min(gross_total, max(Decimal("0.00"), discount_amt))
        net_total = max(Decimal("0.00"), gross_total - discount_amt)

        return BundleResponse(
            id=bundle.id,
            name=bundle.name,
            slug=bundle.slug,
            description=bundle.description,
            discount_type=bundle.discount_type,
            discount_value=Decimal(str(bundle.discount_value)),
            funding_source=bundle.funding_source,
            is_active=bundle.is_active,
            is_available=True,
            gross_customer_price=gross_total,
            discount_amount=discount_amt,
            net_customer_price=net_total,
            components=comp_res,
            created_at=bundle.created_at,
            updated_at=bundle.updated_at,
        )


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

    review_repo = ReviewRepository(db)
    reviews = await review_repo.get_product_reviews(product.id, include_hidden=False)

    public_reviews = []
    for review in reviews:
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
