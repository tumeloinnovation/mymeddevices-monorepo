import asyncio
import re
import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import String, and_, cast, func, or_, select
from sqlalchemy import update as sql_update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.logging import logger
from app.domains.catalog.config import settings as catalog_settings
from app.domains.catalog.models.brand import Brand
from app.domains.catalog.models.bundle_item import BundleItem
from app.domains.catalog.models.category import Category
from app.domains.catalog.models.product import Product
from app.domains.catalog.models.product_image import ProductImage
from app.domains.catalog.models.product_variant import ProductVariant
from app.domains.catalog.models.related_product import RelatedProduct
from app.domains.catalog.models.tag import Tag
from app.domains.catalog.services.typesense_client import TypesenseClient
from app.domains.vendor.models.vendor_profile import VendorProfile


def generate_slug(name: str, existing_slug: str | None = None) -> str:
    """Generate a URL-friendly slug from a product name."""
    # Convert to lowercase, replace non-alphanumeric chars with dashes, strip ends
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    # Collapse multiple dashes to single dashes
    slug = re.sub(r"-+", "-", slug)
    if not slug:
        slug = "product"
    return slug


class CatalogService:
    """Service for managing products, categories, and catalog operations."""

    COMPLETENESS_CHECKS: list[dict[str, Any]] = [
        {"field": "name", "label": "Product Name", "weight": 10, "required": True},
        {"field": "category_id", "label": "Category", "weight": 10, "required": True},
        {"field": "description", "label": "Description (50+ chars)", "weight": 15, "required": True},
        {"field": "price", "label": "Price", "weight": 10, "required": True},
        {"field": "has_images", "label": "At least 1 image", "weight": 15, "required": True},
        {"field": "short_description", "label": "Short Description", "weight": 5, "required": True},
        {"field": "sku", "label": "SKU", "weight": 5, "required": True},
        {"field": "brand", "label": "Brand / Manufacturer", "weight": 10, "required": False},
        {"field": "specifications", "label": "Specifications", "weight": 10, "required": True},
        {"field": "weight_or_dimensions", "label": "Weight / Dimensions", "weight": 5, "required": False},
        {"field": "seo", "label": "SEO Meta Fields", "weight": 5, "required": False},
    ]
    MIN_COMPLETENESS = 80

    def _calculate_pricing(self, base_price: float) -> tuple[float, float, float]:
        """
        Calculate markup_price, commission_fee, and final customer price.
        price = base_price + markup_price + commission_fee
        """
        if not base_price or base_price <= 0:
            return 0.0, 0.0, 0.0

        if base_price <= catalog_settings.MARKUP_THRESHOLD_LOW:
            markup_percent = catalog_settings.MARKUP_PERCENT_LOW
        elif base_price <= catalog_settings.MARKUP_THRESHOLD_MEDIUM:
            markup_percent = catalog_settings.MARKUP_PERCENT_MEDIUM
        else:
            markup_percent = catalog_settings.MARKUP_PERCENT_HIGH

        markup_price = base_price * (markup_percent / 100.0)
        commission_fee = base_price * (catalog_settings.COMMISSION_FEE_PERCENT / 100.0)
        price = base_price + markup_price + commission_fee

        return round(markup_price, 2), round(commission_fee, 2), round(price, 2)

    def _calculate_from_retail_price(self, price: float) -> tuple[float, float, float]:
        """
        Reverse calculate base_price (vendor payout), markup_price, and commission_fee from target retail price.
        """
        if not price or price <= 0:
            return 0.0, 0.0, 0.0

        low_threshold_price = catalog_settings.MARKUP_THRESHOLD_LOW * (
            1 + (catalog_settings.MARKUP_PERCENT_LOW + catalog_settings.COMMISSION_FEE_PERCENT) / 100.0
        )
        med_threshold_price = catalog_settings.MARKUP_THRESHOLD_MEDIUM * (
            1 + (catalog_settings.MARKUP_PERCENT_MEDIUM + catalog_settings.COMMISSION_FEE_PERCENT) / 100.0
        )

        if price <= low_threshold_price:
            markup_pct = catalog_settings.MARKUP_PERCENT_LOW
        elif price <= med_threshold_price:
            markup_pct = catalog_settings.MARKUP_PERCENT_MEDIUM
        else:
            markup_pct = catalog_settings.MARKUP_PERCENT_HIGH

        total_multiplier = 1.0 + (markup_pct + catalog_settings.COMMISSION_FEE_PERCENT) / 100.0
        base_price = price / total_multiplier
        markup_price = base_price * (markup_pct / 100.0)
        commission_fee = base_price * (catalog_settings.COMMISSION_FEE_PERCENT / 100.0)

        return round(base_price, 2), round(markup_price, 2), round(commission_fee, 2)

    def __init__(self, db: AsyncSession):
        self.db = db
        self.typesense = TypesenseClient()

    # ========================================================================
    # PRODUCT CRUD
    # ========================================================================

    async def create_product(self, vendor_id: str | uuid.UUID, name: str, **kwargs: Any) -> Product:
        """Create a new draft product."""
        # Clean legacy keys
        kwargs.pop("vendor_payout", None)
        val_vendor_id = (
            uuid.UUID(str(vendor_id)) if isinstance(vendor_id, (str, uuid.UUID)) and vendor_id else vendor_id
        )

        # Verify vendor exists
        vendor = await self.db.execute(select(VendorProfile).where(VendorProfile.id == val_vendor_id))
        if not vendor.scalar_one_or_none():
            raise ValueError("Vendor profile not found")

        # Check SKU uniqueness
        if "sku" in kwargs and kwargs["sku"]:
            sku_check = await self.db.execute(
                select(Product).where(Product.sku == kwargs["sku"], Product.is_deleted == False)
            )
            if sku_check.scalar_one_or_none():
                raise ValueError(f"Product with SKU '{kwargs['sku']}' already exists.")

        # Generate unique slug
        base_slug = generate_slug(name)
        slug = await self._ensure_unique_slug(base_slug)

        # Calculate pricing: bi-directional
        base_val = kwargs.get("base_price")
        price_val = kwargs.get("price")

        if base_val is not None and base_val > 0:
            markup, commission, calculated_price = self._calculate_pricing(base_val)
            kwargs["markup_price"] = kwargs.get("markup_price") or markup
            kwargs["commission_fee"] = kwargs.get("commission_fee") or commission
            kwargs["price"] = price_val or calculated_price
            kwargs["currency"] = kwargs.get("currency") or catalog_settings.DEFAULT_CURRENCY
        elif price_val is not None and price_val > 0:
            calc_base, markup, commission = self._calculate_from_retail_price(price_val)
            kwargs["base_price"] = calc_base
            kwargs["markup_price"] = kwargs.get("markup_price") or markup
            kwargs["commission_fee"] = kwargs.get("commission_fee") or commission
            kwargs["currency"] = kwargs.get("currency") or catalog_settings.DEFAULT_CURRENCY

        product = Product(
            vendor_id=val_vendor_id,
            name=name,
            slug=slug,
            status="draft",
            **{k: v for k, v in kwargs.items() if v is not None},
        )

        self.db.add(product)
        await self.db.flush()

        # Calculate initial completeness
        product.completeness_score = await self._calculate_completeness(product)

        await self.db.commit()
        product = await self._get_vendor_product(val_vendor_id, product.id)

        logger.info(f"Product created: {product.id} by vendor {val_vendor_id}")
        return product

    async def update_product(self, vendor_id: str | uuid.UUID | None, product_id: str, **kwargs) -> Product:
        """Update a product. Recalculates completeness."""
        kwargs.pop("vendor_payout", None)
        product = await self._get_vendor_product(vendor_id, product_id)

        # Check SKU uniqueness if updated
        if "sku" in kwargs and kwargs["sku"]:
            sku_check = await self.db.execute(
                select(Product).where(
                    Product.sku == kwargs["sku"], Product.id != product.id, Product.is_deleted == False
                )
            )
            if sku_check.scalar_one_or_none():
                raise ValueError(f"Product with SKU '{kwargs['sku']}' already exists.")

        # Recalculate pricing if base_price or price is updated
        base_val = kwargs.get("base_price")
        price_val = kwargs.get("price")

        if base_val is not None and base_val > 0:
            markup, commission, calculated_price = self._calculate_pricing(base_val)
            kwargs["markup_price"] = markup
            kwargs["commission_fee"] = commission
            if "price" not in kwargs or kwargs["price"] is None:
                kwargs["price"] = calculated_price
        elif price_val is not None and price_val > 0 and ("base_price" not in kwargs or kwargs["base_price"] is None):
            calc_base, markup, commission = self._calculate_from_retail_price(price_val)
            kwargs["base_price"] = calc_base
            kwargs["markup_price"] = markup
            kwargs["commission_fee"] = commission

        for key, value in kwargs.items():
            if value is not None and hasattr(product, key):
                setattr(product, key, value)

        # Handle name change -> slug update
        if "name" in kwargs and kwargs["name"] is not None:
            base_slug = generate_slug(kwargs["name"])
            product.slug = await self._ensure_unique_slug(base_slug, exclude_id=product_id)

        # Recalculate completeness
        product.completeness_score = await self._calculate_completeness(product)

        # If product was verified and substantial edits made, reset verification
        substantial_fields = {"name", "description", "base_price", "price", "category_id"}
        if product.is_verified and any(k in kwargs and kwargs[k] is not None for k in substantial_fields):
            product.is_verified = False
            product.verified_at = None
            if product.status == "published":
                product.status = "draft"
                logger.info(f"Product {product_id} unpublished due to substantial edit")

        await self.db.commit()
        product = await self._get_vendor_product(vendor_id, product_id)

        # Sync with Typesense
        if self.typesense.client is not None:
            if product.status == "published":
                await asyncio.to_thread(self.typesense.index_product, product)
            else:
                await asyncio.to_thread(self.typesense.delete_product, str(product.id))

        logger.info(f"Product updated: {product_id}")
        return product

    async def get_product(self, vendor_id: str | uuid.UUID | None, product_id: str) -> Product:
        """Get a single product owned by the vendor."""
        return await self._get_vendor_product(vendor_id, product_id)

    async def get_product_by_sku(self, sku: str) -> Product | None:
        """Get a product by SKU (admin use for bulk import)."""
        result = await self.db.execute(select(Product).where(Product.sku == sku, Product.is_deleted == False))
        return result.scalar_one_or_none()

    async def delete_product(self, vendor_id: str | uuid.UUID | None, product_id: str) -> None:
        """Delete a draft product. Only drafts can be deleted."""
        product = await self._get_vendor_product(vendor_id, product_id)
        if product.status != "draft":
            raise ValueError("Only draft products can be deleted. Archive published products instead.")

        # Perform soft delete
        product.is_deleted = True
        product.deleted_at = datetime.now(UTC)

        # Record domain event for outbox relay / consumers (e.g. cart/wishlist cleanup)
        from app.domains.shared.models.outbox import OutboxEvent, OutboxStatus

        outbox_event = OutboxEvent(
            aggregate_type="Product",
            aggregate_id=str(product.id),
            event_type="product.deleted",
            payload={"product_id": str(product.id), "vendor_id": str(vendor_id)},
            status=OutboxStatus.PENDING,
        )
        self.db.add(outbox_event)

        await self.db.commit()

        # Sync deletion with Typesense
        if self.typesense.client is not None:
            await asyncio.to_thread(self.typesense.delete_product, str(product.id))

        logger.info(f"Product soft deleted and outbox event emitted: {product_id}")

    # ========================================================================
    # PRODUCT LIFECYCLE
    # ========================================================================

    async def verify_product(self, vendor_id: str | uuid.UUID | None, product_id: str) -> Product:
        """Vendor verifies a product. Requires minimum completeness."""
        product = await self._get_vendor_product(vendor_id, product_id)

        # Recalculate completeness
        completeness = await self._calculate_completeness(product)
        product.completeness_score = completeness

        if completeness < self.MIN_COMPLETENESS:
            raise ValueError(
                f"Product completeness is {completeness}%. "
                f"Minimum {self.MIN_COMPLETENESS}% required to verify. "
                f"Please fill in more product details."
            )

        product.is_verified = True
        product.verified_at = datetime.now(UTC)
        product.status = "pending_review"

        await self.db.commit()
        product = await self._get_vendor_product(vendor_id, product_id)

        logger.info(f"Product verified: {product_id}")
        return product

    async def publish_product(self, vendor_id: str | uuid.UUID | None, product_id: str) -> Product:
        """Publish a verified product to the storefront."""
        product = await self._get_vendor_product(vendor_id, product_id)

        # Admin or direct publishing sets both is_verified and published status
        product.is_verified = True
        product.status = "published"
        if not product.verified_at:
            product.verified_at = datetime.now(UTC)

        await self.db.commit()
        product = await self._get_vendor_product(vendor_id, product_id)

        # Index in Typesense
        if self.typesense.client is not None:
            await asyncio.to_thread(self.typesense.index_product, product)

        logger.info(f"Product published: {product_id}")
        return product

    async def reject_product(self, vendor_id: str | None, product_id: str, reason: str) -> Product:
        """Reject a product under review with a reason."""
        product = await self._get_vendor_product(vendor_id, product_id)

        if product.status != "pending_review":
            raise ValueError(
                f"Only products in 'pending_review' status can be rejected. Current status: {product.status}"
            )

        product.status = "draft"
        product.is_verified = False
        product.verified_at = None
        product.rejection_reason = reason

        await self.db.commit()
        product = await self._get_vendor_product(vendor_id, product_id)

        logger.info(f"Product rejected: {product_id}. Reason: {reason}")
        return product

    async def archive_product(self, vendor_id: str | uuid.UUID | None, product_id: str) -> Product:
        """Archive a product (removes from storefront)."""
        product = await self._get_vendor_product(vendor_id, product_id)

        if product.status == "archived":
            raise ValueError("Product is already archived.")

        product.status = "archived"

        await self.db.commit()
        product = await self._get_vendor_product(vendor_id, product_id)

        # Delete from Typesense
        if self.typesense.client is not None:
            await asyncio.to_thread(self.typesense.delete_product, str(product.id))

        logger.info(f"Product archived: {product_id}")
        return product

    async def unarchive_product(self, vendor_id: str | uuid.UUID | None, product_id: str) -> Product:
        """Unarchive a product back to draft."""
        product = await self._get_vendor_product(vendor_id, product_id)

        if product.status != "archived":
            raise ValueError("Only archived products can be unarchived.")

        product.status = "draft"
        product.is_verified = False
        product.verified_at = None

        await self.db.commit()
        product = await self._get_vendor_product(vendor_id, product_id)

        logger.info(f"Product unarchived: {product_id}")
        return product

    # ========================================================================
    # PRODUCT LISTING & SEARCH
    # ========================================================================

    async def get_vendor_products(
        self,
        vendor_id: str | None,
        status_filter: str | None = None,
        category_id: str | None = None,
        search: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Product], int]:
        """List products for a vendor with filters. If vendor_id is None, lists all products (admin)."""
        conditions = [Product.is_deleted == False]
        # If vendor_id is provided, filter by vendor (for vendors)
        # If vendor_id is None, show all products (for admins)
        if vendor_id is not None:
            conditions.append(Product.vendor_id == vendor_id)

        query = (
            select(Product)
            .options(
                selectinload(Product.images),
                selectinload(Product.category),
                selectinload(Product.variants),
                selectinload(Product.bundle_items).selectinload(BundleItem.component_product),
                selectinload(Product.related_products).selectinload(RelatedProduct.related_product),
                selectinload(Product.brand_relation),
                selectinload(Product.tags_relation),
            )
            .where(*conditions)
        )

        if status_filter:
            query = query.where(Product.status == status_filter)
        if category_id:
            query = query.where(Product.category_id == category_id)
        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Product.name.ilike(search_term),
                    Product.sku.ilike(search_term),
                    Product.brand.ilike(search_term),
                )
            )

        # Count total
        count_query = select(func.count(Product.id)).where(*conditions)
        if status_filter:
            count_query = count_query.where(Product.status == status_filter)
        if category_id:
            count_query = count_query.where(Product.category_id == category_id)
        if search:
            search_term = f"%{search}%"
            count_query = count_query.where(
                or_(
                    Product.name.ilike(search_term),
                    Product.sku.ilike(search_term),
                    Product.brand.ilike(search_term),
                )
            )
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Paginate and order
        query = query.order_by(Product.updated_at.desc())
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        products = result.scalars().all()

        # Explicitly access category_name to trigger lazy loading before serialization
        for product in products:
            _ = product.category_name

        return list(products), total

    async def get_storefront_products(
        self,
        category_id: str | None = None,
        category_slug: str | None = None,
        search: str | None = None,
        price_min: float | None = None,
        price_max: float | None = None,
        is_featured: bool | None = None,
        is_clinical_pick: bool | None = None,
        care_setting: str | None = None,
        condition: str | None = None,
        is_on_sale: bool | None = None,
        in_stock: bool | None = None,
        sort_by: str = "newest",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Any], int]:
        """Get published products for the public storefront."""
        if self.typesense.client is not None:
            try:
                products, total = await asyncio.to_thread(
                    self.typesense.search_storefront,
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
                return products, total
            except Exception as e:
                logger.error(f"Typesense search failed, falling back to database: {e}")

        # Database Fallback
        query = (
            select(Product)
            .options(
                selectinload(Product.images),
                selectinload(Product.category),
                selectinload(Product.brand_relation),
                selectinload(Product.variants),
                selectinload(Product.bundle_items).selectinload(BundleItem.component_product),
                selectinload(Product.related_products).selectinload(RelatedProduct.related_product),
            )
            .where(Product.status == "published", Product.is_verified == True, Product.is_deleted == False)
        )

        # Filters
        if category_slug:
            cat_res = await self.db.execute(
                select(Category.id).where(Category.slug == category_slug, Category.is_deleted == False)
            )
            target_cat_id = cat_res.scalar_one_or_none()
            if target_cat_id:
                child_cats_res = await self.db.execute(
                    select(Category.id).where(Category.parent_id == target_cat_id, Category.is_deleted == False)
                )
                all_cat_ids = [target_cat_id] + list(child_cats_res.scalars().all())
                query = query.where(Product.category_id.in_(all_cat_ids))
            else:
                query = query.where(Product.category_id is None)
        elif category_id:
            try:
                target_uuid = uuid.UUID(str(category_id))
                child_cats_res = await self.db.execute(
                    select(Category.id).where(Category.parent_id == target_uuid, Category.is_deleted == False)
                )
                all_cat_ids = [target_uuid] + list(child_cats_res.scalars().all())
                query = query.where(Product.category_id.in_(all_cat_ids))
            except Exception:
                query = query.where(Product.category_id == category_id)
        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Product.name.ilike(search_term),
                    Product.brand.ilike(search_term),
                    Product.short_description.ilike(search_term),
                )
            )
        if price_min is not None:
            query = query.where(Product.price >= price_min)
        if price_max is not None:
            query = query.where(Product.price <= price_max)
        if is_featured is not None:
            query = query.where(Product.is_featured == is_featured)
        if is_clinical_pick is not None:
            query = query.where(Product.is_clinical_pick == is_clinical_pick)
        if care_setting:
            query = query.where(Product.tags.contains([care_setting]))
        if condition:
            query = query.where(Product.tags.contains([condition]))
        if is_on_sale is not None:
            query = query.where(Product.is_on_sale == is_on_sale)
        if in_stock is True:
            query = query.where(Product.stock_quantity > 0)

        # Count total
        count_query = select(func.count(Product.id)).where(
            Product.status == "published", Product.is_verified == True, Product.is_deleted == False
        )
        if category_id:
            count_query = count_query.where(Product.category_id == category_id)
        if category_slug:
            subq = select(Category.id).where(Category.slug == category_slug)
            count_query = count_query.where(Product.category_id.in_(subq))
        if search:
            search_term = f"%{search}%"
            count_query = count_query.where(
                or_(
                    Product.name.ilike(search_term),
                    Product.brand.ilike(search_term),
                    Product.short_description.ilike(search_term),
                )
            )
        if price_min is not None:
            count_query = count_query.where(Product.price >= price_min)
        if price_max is not None:
            count_query = count_query.where(Product.price <= price_max)
        if is_featured is not None:
            count_query = count_query.where(Product.is_featured == is_featured)
        if is_on_sale is not None:
            count_query = count_query.where(Product.is_on_sale == is_on_sale)
        if in_stock is True:
            count_query = count_query.where(Product.stock_quantity > 0)

        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Sorting
        if sort_by == "price_asc":
            query = query.order_by(Product.price.asc())
        elif sort_by == "price_desc":
            query = query.order_by(Product.price.desc())
        elif sort_by == "popular":
            query = query.order_by(Product.popularity_score.desc())
        elif sort_by == "name_asc":
            query = query.order_by(Product.name.asc())
        else:  # newest (default)
            query = query.order_by(Product.created_at.desc())

        # Paginate
        query = query.offset((page - 1) * page_size).limit(page_size)

        result = await self.db.execute(query)
        db_products = result.scalars().all()

        return list(db_products), total

    async def get_storefront_product_by_slug(self, slug: str) -> Product:
        """Get a single published product by slug. Increments view count."""
        result = await self.db.execute(
            select(Product)
            .options(
                selectinload(Product.images),
                selectinload(Product.category),
                selectinload(Product.variants),
                selectinload(Product.bundle_items).selectinload(BundleItem.component_product),
                selectinload(Product.related_products).selectinload(RelatedProduct.related_product),
                selectinload(Product.brand_relation),
            )
            .where(
                or_(Product.slug == slug, Product.sku == slug, cast(Product.id, String) == slug),
                Product.status == "published",
                Product.is_verified == True,
                Product.is_deleted == False,
            )
        )
        product = result.scalar_one_or_none()
        if not product:
            raise ValueError("Product not found")

        # Increment view count atomically without redundant reload
        current_view_count = product.view_count or 0
        await self.db.execute(
            sql_update(Product).where(Product.id == product.id).values(view_count=Product.view_count + 1)
        )
        await self.db.commit()
        product.view_count = current_view_count + 1
        return product

    # ========================================================================
    # IMAGE MANAGEMENT
    # ========================================================================

    async def add_product_image(
        self,
        vendor_id: str | None,
        product_id: str,
        url: str,
        alt_text: str | None = None,
        sort_order: int = 0,
        is_primary: bool = False,
    ) -> ProductImage:
        """Add an image to a product."""
        product = await self._get_vendor_product(vendor_id, product_id)

        # If marking as primary, unmark existing primary
        if is_primary:
            for img in product.images:
                img.is_primary = False

        image = ProductImage(
            product_id=product.id, url=url, alt_text=alt_text, sort_order=sort_order, is_primary=is_primary
        )

        self.db.add(image)

        # Recalculate completeness
        product.completeness_score = await self._calculate_completeness(product, image_count=len(product.images) + 1)

        await self.db.commit()
        await self.db.refresh(image)

        # Sync with Typesense if published
        if self.typesense.client is not None and product.status == "published":
            product = await self._get_vendor_product(vendor_id, product_id)
            await asyncio.to_thread(self.typesense.index_product, product)

        logger.info(f"Image added to product {product_id}")
        return image

    async def remove_product_image(self, vendor_id: str | None, product_id: str, image_id: str) -> None:
        """Remove an image from a product."""
        product = await self._get_vendor_product(vendor_id, product_id)

        image = await self.db.execute(
            select(ProductImage).where(ProductImage.id == image_id, ProductImage.product_id == product.id)
        )
        image_to_delete = image.scalar_one_or_none()
        if not image_to_delete:
            raise ValueError("Image not found")

        await self.db.delete(image_to_delete)

        # Recalculate completeness
        product.completeness_score = await self._calculate_completeness(
            product, image_count=max(0, len(product.images) - 1)
        )

        await self.db.commit()

        # Sync with Typesense if published
        if self.typesense.client is not None and product.status == "published":
            product = await self._get_vendor_product(vendor_id, product_id)
            await asyncio.to_thread(self.typesense.index_product, product)

        logger.info(f"Image {image_id} removed from product {product_id}")

    async def reorder_product_images(
        self, vendor_id: str | None, product_id: str, image_ids: list[str]
    ) -> list[ProductImage]:
        """Reorder product images."""
        product = await self._get_vendor_product(vendor_id, product_id)

        for order, image_id in enumerate(image_ids):
            image_result = await self.db.execute(
                select(ProductImage).where(ProductImage.id == image_id, ProductImage.product_id == product.id)
            )
            image = image_result.scalar_one_or_none()
            if image:
                image.sort_order = order
                image.is_primary = order == 0

        await self.db.commit()

        # Re-fetch ordered images
        result = await self.db.execute(
            select(ProductImage).where(ProductImage.product_id == product.id).order_by(ProductImage.sort_order)
        )
        images = list(result.scalars().all())

        # Sync with Typesense if published
        if self.typesense.client is not None and product.status == "published":
            product = await self._get_vendor_product(vendor_id, product_id)
            await asyncio.to_thread(self.typesense.index_product, product)

        return images

    # ========================================================================
    # CATEGORIES
    # ========================================================================

    async def get_categories(self, active_only: bool = True) -> list[Any]:
        """Get all root categories with children recursively built in memory with accurate product counts."""
        query = select(Category).where(Category.is_deleted == False)
        if active_only:
            query = query.where(Category.is_active == True)
        query = query.order_by(Category.sort_order)

        result = await self.db.execute(query)
        all_categories = result.scalars().all()

        # Compute direct product counts per category
        count_query = select(Product.category_id, func.count(Product.id)).where(Product.is_deleted == False)
        if active_only:
            count_query = count_query.where(Product.status == "published")
        count_query = count_query.group_by(Product.category_id)

        counts_res = await self.db.execute(count_query)
        direct_counts = {row[0]: row[1] for row in counts_res.all() if row[0] is not None}

        from app.domains.catalog.schemas.category_schemas import CategoryTreeResponse

        nodes: dict[uuid.UUID, CategoryTreeResponse] = {}
        for cat in all_categories:
            nodes[cat.id] = CategoryTreeResponse(
                id=cat.id,
                name=cat.name,
                slug=cat.slug,
                description=cat.description,
                permalink=cat.permalink,
                icon_url=cat.icon_url,
                tax_category_code=cat.tax_category_code or "STANDARD_VAT_16",
                min_warranty_months=cat.min_warranty_months or 0,
                parent_id=cat.parent_id,
                sort_order=cat.sort_order,
                is_active=cat.is_active,
                product_count=direct_counts.get(cat.id, 0),
                children=[],
            )

        roots = []
        for cat in all_categories:
            node = nodes[cat.id]
            if cat.parent_id is None:
                roots.append(node)
            else:
                parent_node = nodes.get(cat.parent_id)
                if parent_node is not None:
                    parent_node.children.append(node)
                else:
                    roots.append(node)

        # Rollup product counts from descendants to parent categories
        def rollup_counts(node: CategoryTreeResponse) -> int:
            children_total = sum(rollup_counts(child) for child in node.children)
            node.product_count = node.product_count + children_total
            return node.product_count

        for root in roots:
            rollup_counts(root)

        return roots

    async def get_category_by_slug(self, slug: str) -> Category | None:
        """Get a category by slug."""
        result = await self.db.execute(select(Category).where(Category.slug == slug, Category.is_deleted == False))
        category = result.scalar_one_or_none()
        if category:
            # Query product count for this category and any child categories
            child_ids_res = await self.db.execute(
                select(Category.id).where(Category.parent_id == category.id, Category.is_deleted == False)
            )
            cat_ids = [category.id] + list(child_ids_res.scalars().all())
            product_count_res = await self.db.execute(
                select(func.count(Product.id)).where(
                    Product.category_id.in_(cat_ids),
                    Product.is_deleted == False,
                    Product.status == "published",
                )
            )
            category.product_count = product_count_res.scalar() or 0
        return category

    async def create_category(self, **kwargs) -> Category:
        """Create a new category (admin only)."""
        if not kwargs.get("slug") and kwargs.get("name"):
            kwargs["slug"] = generate_slug(kwargs["name"])

        # Check slug uniqueness
        existing = await self.db.execute(select(Category).where(Category.slug == kwargs["slug"]))
        if existing.scalar_one_or_none():
            raise ValueError(f"Category with slug '{kwargs['slug']}' already exists")

        # Check parent_id exists
        if kwargs.get("parent_id"):
            val_parent_id = uuid.UUID(str(kwargs["parent_id"]))
            kwargs["parent_id"] = val_parent_id
            parent_exists = await self.db.execute(
                select(Category.id).where(Category.id == val_parent_id, Category.is_deleted == False)
            )
            if not parent_exists.scalar_one_or_none():
                raise ValueError("Parent category not found")

        category = Category(id=uuid.uuid4(), **kwargs)
        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)

        logger.info(f"Category created: {category.id} - {category.name}")
        return category

    async def update_category(self, category_id: str, **kwargs) -> Category:
        """Update a category (admin only)."""
        result = await self.db.execute(select(Category).where(Category.id == category_id))
        category = result.scalar_one_or_none()
        if not category:
            raise ValueError("Category not found")

        # Validate parent_id
        if "parent_id" in kwargs:
            new_parent_id = kwargs["parent_id"]
            if new_parent_id is not None:
                # 1. Check if parent exists
                parent_exists = await self.db.execute(
                    select(Category.id).where(Category.id == new_parent_id, Category.is_deleted == False)
                )
                if not parent_exists.scalar_one_or_none():
                    raise ValueError("Parent category not found")

                # 2. Check for self-reference
                if str(new_parent_id) == str(category_id):
                    raise ValueError("A category cannot be its own parent")

                # 3. Check for circular reference
                curr_parent_id = new_parent_id
                visited = {str(category_id)}
                while curr_parent_id:
                    if str(curr_parent_id) in visited:
                        raise ValueError(
                            "Circular reference detected: Parent category cannot be a descendant of this category"
                        )
                    visited.add(str(curr_parent_id))
                    parent_res = await self.db.execute(select(Category.parent_id).where(Category.id == curr_parent_id))
                    curr_parent_id = parent_res.scalar_one_or_none()

        for key, value in kwargs.items():
            if key == "parent_id":
                category.parent_id = value
            elif value is not None and hasattr(category, key):
                setattr(category, key, value)

        await self.db.commit()
        await self.db.refresh(category)

        logger.info(f"Category updated: {category_id}")
        return category

    async def delete_category(self, category_id: str) -> None:
        """Soft delete a category. Fails if products are assigned."""
        result = await self.db.execute(select(Category).where(Category.id == category_id))
        category = result.scalar_one_or_none()
        if not category:
            raise ValueError("Category not found")

        # Check for products
        product_count = await self.db.execute(
            select(func.count(Product.id)).where(Product.category_id == category_id, Product.is_deleted == False)
        )
        if (product_count.scalar() or 0) > 0:
            raise ValueError("Cannot delete category with assigned products. Reassign or delete products first.")

        # Check for children
        child_count = await self.db.execute(
            select(func.count(Category.id)).where(Category.parent_id == category_id, Category.is_deleted == False)
        )
        if (child_count.scalar() or 0) > 0:
            raise ValueError("Cannot delete category with sub-categories. Delete children first.")

        category.is_deleted = True
        await self.db.commit()
        logger.info(f"Category deleted: {category_id}")

    # ========================================================================
    # BRANDS
    # ========================================================================

    async def get_brands(
        self, active_only: bool = True, approval_status: str | None = None, page: int = 1, page_size: int = 20
    ) -> tuple[list[Brand], int]:
        """Get brands with pagination and dynamic product counts."""
        product_count_subq = (
            select(func.count(Product.id))
            .where(
                Product.is_deleted == False,
                or_(
                    Product.brand_id == Brand.id,
                    and_(
                        Product.brand_id.is_(None),
                        func.lower(Product.brand) == func.lower(Brand.name),
                    ),
                ),
            )
            .correlate(Brand)
            .scalar_subquery()
        )

        query = select(Brand, product_count_subq.label("product_count")).where(Brand.is_deleted == False)
        if active_only:
            query = query.where(Brand.is_active == True)
        if approval_status:
            query = query.where(Brand.approval_status == approval_status)

        # Get total count
        count_query = select(func.count(Brand.id)).where(Brand.is_deleted == False)
        if active_only:
            count_query = count_query.where(Brand.is_active == True)
        if approval_status:
            count_query = count_query.where(Brand.approval_status == approval_status)
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated results
        query = query.order_by(Brand.sort_order, Brand.name)
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        rows = result.all()
        brands = []
        for brand, count in rows:
            brand.product_count = count or 0
            brands.append(brand)

        return brands, total

    async def get_brand_by_id(self, brand_id: str | uuid.UUID) -> Brand | None:
        """Get a brand by ID with product count."""
        b_id = uuid.UUID(str(brand_id)) if not isinstance(brand_id, uuid.UUID) else brand_id
        result = await self.db.execute(select(Brand).where(Brand.id == b_id, Brand.is_deleted == False))
        brand = result.scalar_one_or_none()
        if brand:
            product_count_res = await self.db.execute(
                select(func.count(Product.id)).where(
                    Product.is_deleted == False,
                    or_(
                        Product.brand_id == brand.id,
                        and_(
                            Product.brand_id.is_(None),
                            func.lower(Product.brand) == func.lower(brand.name),
                        ),
                    ),
                )
            )
            brand.product_count = product_count_res.scalar() or 0
        return brand

    async def get_brand_by_slug(self, slug: str) -> Brand | None:
        """Get a brand by slug with product count."""
        result = await self.db.execute(select(Brand).where(Brand.slug == slug, Brand.is_deleted == False))
        brand = result.scalar_one_or_none()
        if brand:
            product_count_res = await self.db.execute(
                select(func.count(Product.id)).where(
                    Product.is_deleted == False,
                    or_(
                        Product.brand_id == brand.id,
                        and_(
                            Product.brand_id.is_(None),
                            func.lower(Product.brand) == func.lower(brand.name),
                        ),
                    ),
                )
            )
            brand.product_count = product_count_res.scalar() or 0
        return brand

    async def create_brand(self, **kwargs) -> Brand:
        """Create a new brand (admin only)."""
        # Generate slug if not provided
        if "slug" not in kwargs or not kwargs["slug"]:
            # Convert to lowercase, replace non-alphanumeric chars with single dashes, strip ends
            slug = re.sub(r"[^a-z0-9]+", "-", kwargs["name"].lower()).strip("-")
            # Collapse multiple dashes to single dashes
            slug = re.sub(r"-+", "-", slug)
            kwargs["slug"] = slug

        # Check slug uniqueness
        existing = await self.db.execute(select(Brand).where(Brand.slug == kwargs["slug"]))
        if existing.scalar_one_or_none():
            raise ValueError(f"Brand with slug '{kwargs['slug']}' already exists")

        brand = Brand(**kwargs)
        self.db.add(brand)
        await self.db.commit()
        await self.db.refresh(brand)
        brand.product_count = 0

        logger.info(f"Brand created: {brand.id} - {brand.name}")
        return brand

    async def update_brand(self, brand_id: str | uuid.UUID, **kwargs) -> Brand:
        """Update a brand (admin only)."""
        b_id = uuid.UUID(str(brand_id)) if not isinstance(brand_id, uuid.UUID) else brand_id
        result = await self.db.execute(select(Brand).where(Brand.id == b_id))
        brand = result.scalar_one_or_none()
        if not brand:
            raise ValueError("Brand not found")

        for key, value in kwargs.items():
            if value is not None and hasattr(brand, key):
                setattr(brand, key, value)

        await self.db.commit()
        await self.db.refresh(brand)

        product_count_res = await self.db.execute(
            select(func.count(Product.id)).where(
                Product.is_deleted == False,
                or_(
                    Product.brand_id == brand.id,
                    and_(
                        Product.brand_id.is_(None),
                        func.lower(Product.brand) == func.lower(brand.name),
                    ),
                ),
            )
        )
        brand.product_count = product_count_res.scalar() or 0

        logger.info(f"Brand updated: {brand_id}")
        return brand

    async def delete_brand(self, brand_id: str | uuid.UUID) -> None:
        """Soft delete a brand. Fails if products are assigned."""
        b_id = uuid.UUID(str(brand_id)) if not isinstance(brand_id, uuid.UUID) else brand_id
        result = await self.db.execute(select(Brand).where(Brand.id == b_id))
        brand = result.scalar_one_or_none()
        if not brand:
            raise ValueError("Brand not found")

        # Check for products
        product_count = await self.db.execute(
            select(func.count(Product.id)).where(Product.brand_id == b_id, Product.is_deleted == False)
        )
        if (product_count.scalar() or 0) > 0:
            raise ValueError("Cannot delete brand with assigned products. Reassign or delete products first.")

        brand.is_deleted = True
        await self.db.commit()
        logger.info(f"Brand deleted: {brand_id}")

    async def create_quick_brand(self, name: str) -> Brand:
        """
        Create a brand with minimal details (name only) as auto-approved and active.
        Used for quick brand creation during product creation.
        Checks for duplicate brand names (case-insensitive).
        """
        # Check for duplicate brand name (case-insensitive)
        existing = await self.db.execute(select(Brand).where(Brand.name.ilike(name), Brand.is_deleted == False))
        if existing.scalar_one_or_none():
            raise ValueError(f"Brand with name '{name}' already exists")

        # Auto-generate slug from name
        slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
        slug = re.sub(r"-+", "-", slug)

        # Ensure slug is unique
        counter = 1
        base_slug = slug
        while True:
            slug_exists = await self.db.execute(select(Brand).where(Brand.slug == slug))
            if not slug_exists.scalar_one_or_none():
                break
            slug = f"{base_slug}-{counter}"
            counter += 1

        # Create brand - auto-approved for vendors
        brand = Brand(name=name, slug=slug, approval_status="approved", is_active=True, sort_order=0)

        self.db.add(brand)
        await self.db.commit()
        await self.db.refresh(brand)
        brand.product_count = 0

        logger.info(f"Quick brand created and auto-approved: {brand.id} - {brand.name}")
        return brand

    async def approve_brand(self, brand_id: str | uuid.UUID) -> Brand:
        """
        Approve a pending brand.
        Sets approval_status to 'approved' and is_active to True.
        """
        b_id = uuid.UUID(str(brand_id)) if not isinstance(brand_id, uuid.UUID) else brand_id
        result = await self.db.execute(select(Brand).where(Brand.id == b_id, Brand.is_deleted == False))
        brand = result.scalar_one_or_none()
        if not brand:
            raise ValueError("Brand not found")

        if brand.approval_status == "approved":
            raise ValueError("Brand is already approved")

        brand.approval_status = "approved"
        brand.is_active = True

        await self.db.commit()
        await self.db.refresh(brand)

        product_count_res = await self.db.execute(
            select(func.count(Product.id)).where(
                Product.is_deleted == False,
                or_(
                    Product.brand_id == brand.id,
                    and_(
                        Product.brand_id.is_(None),
                        func.lower(Product.brand) == func.lower(brand.name),
                    ),
                ),
            )
        )
        brand.product_count = product_count_res.scalar() or 0

        logger.info(f"Brand approved: {brand_id} - {brand.name}")
        return brand

    # ========================================================================
    # TAGS
    # ========================================================================

    async def get_tags(self, active_only: bool = True, page: int = 1, page_size: int = 20) -> tuple[list[Tag], int]:
        """Get tags with pagination."""
        query = select(Tag).where(Tag.is_deleted == False)
        if active_only:
            query = query.where(Tag.is_active == True)

        # Get total count
        count_query = select(func.count(Tag.id)).where(Tag.is_deleted == False)
        if active_only:
            count_query = count_query.where(Tag.is_active == True)
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated results
        query = query.order_by(Tag.sort_order, Tag.name)
        query = query.offset((page - 1) * page_size).limit(page_size)
        result = await self.db.execute(query)
        tags = list(result.scalars().all())

        return tags, total

    async def get_tag_by_id(self, tag_id: str) -> Tag | None:
        """Get a tag by ID."""
        result = await self.db.execute(select(Tag).where(Tag.id == tag_id, Tag.is_deleted == False))
        return result.scalar_one_or_none()

    async def get_tag_by_slug(self, slug: str) -> Tag | None:
        """Get a tag by slug."""
        result = await self.db.execute(select(Tag).where(Tag.slug == slug, Tag.is_deleted == False))
        return result.scalar_one_or_none()

    async def create_tag(self, **kwargs) -> Tag:
        """Create a new tag (admin only)."""
        # Generate slug if not provided
        if "slug" not in kwargs or not kwargs["slug"]:
            slug = re.sub(r"[^a-z0-9]+", "-", kwargs["name"].lower()).strip("-")
            kwargs["slug"] = slug

        # Check slug uniqueness
        existing = await self.db.execute(select(Tag).where(Tag.slug == kwargs["slug"]))
        if existing.scalar_one_or_none():
            raise ValueError(f"Tag with slug '{kwargs['slug']}' already exists")

        tag = Tag(**kwargs)
        self.db.add(tag)
        await self.db.commit()
        await self.db.refresh(tag)

        logger.info(f"Tag created: {tag.id} - {tag.name}")
        return tag

    async def update_tag(self, tag_id: str, **kwargs) -> Tag:
        """Update a tag (admin only)."""
        result = await self.db.execute(select(Tag).where(Tag.id == tag_id))
        tag = result.scalar_one_or_none()
        if not tag:
            raise ValueError("Tag not found")

        for key, value in kwargs.items():
            if value is not None and hasattr(tag, key):
                setattr(tag, key, value)

        await self.db.commit()
        await self.db.refresh(tag)

        logger.info(f"Tag updated: {tag_id}")
        return tag

    async def delete_tag(self, tag_id: str) -> None:
        """Soft delete a tag. Products can remain untagged."""
        result = await self.db.execute(select(Tag).where(Tag.id == tag_id))
        tag = result.scalar_one_or_none()
        if not tag:
            raise ValueError("Tag not found")

        tag.is_deleted = True
        await self.db.commit()
        logger.info(f"Tag deleted: {tag_id}")

    # ========================================================================
    # COMPLETENESS SCORING
    # ========================================================================

    async def get_completeness_breakdown(self, vendor_id: str | uuid.UUID | None, product_id: str) -> dict:
        """Get detailed completeness breakdown for a product."""
        product = await self._get_vendor_product(vendor_id, product_id)
        image_count = len(product.images) if product.images else 0

        items = []
        total_score = 0
        missing_required = []

        for check in self.COMPLETENESS_CHECKS:
            is_complete = self._check_field_complete(product, check["field"], image_count)
            if is_complete:
                total_score += check["weight"]
            elif check["required"]:
                missing_required.append(check["label"])

            items.append(
                {
                    "field": check["field"],
                    "label": check["label"],
                    "weight": check["weight"],
                    "is_complete": is_complete,
                    "is_required": check["required"],
                }
            )

        return {
            "score": total_score,
            "minimum_required": self.MIN_COMPLETENESS,
            "is_ready_to_verify": total_score >= self.MIN_COMPLETENESS and len(missing_required) == 0,
            "items": items,
            "missing_required": missing_required,
        }

    # ========================================================================
    # PRIVATE HELPERS
    # ========================================================================

    async def _get_vendor_product(self, vendor_id: str | uuid.UUID | None, product_id: str | uuid.UUID) -> Product:
        """Get a product owned by the vendor (or any product if vendor_id is None for admins)."""
        val_product_id = uuid.UUID(str(product_id)) if isinstance(product_id, (str, uuid.UUID)) else product_id
        val_vendor_id = (
            uuid.UUID(str(vendor_id)) if isinstance(vendor_id, (str, uuid.UUID)) and vendor_id else vendor_id
        )

        conditions = [Product.id == val_product_id, Product.is_deleted == False]
        # If vendor_id is provided, enforce ownership check (for vendors)
        # If vendor_id is None, allow access to any product (for admins)
        if val_vendor_id is not None:
            conditions.append(Product.vendor_id == val_vendor_id)

        result = await self.db.execute(
            select(Product)
            .options(
                selectinload(Product.images),
                selectinload(Product.category),
                selectinload(Product.variants),
                selectinload(Product.bundle_items).selectinload(BundleItem.component_product),
                selectinload(Product.related_products).selectinload(RelatedProduct.related_product),
                selectinload(Product.brand_relation),
                selectinload(Product.tags_relation),
            )
            .where(*conditions)
        )
        product = result.scalar_one_or_none()
        if not product:
            raise ValueError("Product not found")
        return product

    async def _ensure_unique_slug(self, base_slug: str, exclude_id: str | None = None) -> str:
        """Ensure slug is unique, appending a number if needed."""
        slug = base_slug
        counter = 1
        while True:
            query = select(Product).where(Product.slug == slug)
            if exclude_id:
                query = query.where(Product.id != exclude_id)
            result = await self.db.execute(query)
            if not result.scalar_one_or_none():
                return slug
            slug = f"{base_slug}-{counter}"
            counter += 1

    async def _calculate_completeness(self, product: Product, image_count: int | None = None) -> int:
        """Calculate product completeness score (0-100)."""
        if image_count is None:
            if product.id:
                result = await self.db.execute(
                    select(func.count(ProductImage.id)).where(ProductImage.product_id == product.id)
                )
                image_count = result.scalar() or 0
            else:
                image_count = 0

        total = 0
        for check in self.COMPLETENESS_CHECKS:
            if self._check_field_complete(product, check["field"], image_count):
                total += check["weight"]
        return total

    def _check_field_complete(self, product: Product, field: str, image_count: int) -> bool:
        """Check if a specific field/group is complete."""
        if field == "name":
            return bool(product.name and len(product.name) >= 2)
        elif field == "category_id":
            return product.category_id is not None
        elif field == "description":
            return bool(product.description and len(product.description) >= 50)
        elif field == "price":
            # Check the selling price
            return product.price is not None and product.price > 0
        elif field == "has_images":
            return image_count > 0
        elif field == "short_description":
            return bool(product.short_description)
        elif field == "sku":
            return bool(product.sku)
        elif field == "brand":
            return bool(product.brand)
        elif field == "specifications":
            return bool(product.specifications and len(product.specifications) > 0)
        elif field == "weight_or_dimensions":
            return bool(product.weight_kg or product.dimensions)
        elif field == "seo":
            return bool(product.meta_title and product.meta_description)
        return False

    # ========================================================================
    # PRODUCT VARIANT OPERATIONS
    # ========================================================================

    async def _sync_variable_product_stock(self, product_id: uuid.UUID) -> None:
        """Auto-sum active variant stock for variable products."""
        product = await self.db.get(Product, product_id)
        if not product or product.product_type != "variable":
            return

        result = await self.db.execute(
            select(func.sum(ProductVariant.stock_quantity)).where(
                ProductVariant.product_id == product_id, ProductVariant.is_active == True
            )
        )
        total_stock = result.scalar() or 0
        product.stock_quantity = total_stock
        product.stock_status = "instock" if total_stock > 0 else "outofstock"
        await self.db.commit()

    async def get_variants(self, product_id: uuid.UUID) -> list[ProductVariant]:
        """Get all variants for a product ordered by sort_order."""
        result = await self.db.execute(
            select(ProductVariant)
            .where(ProductVariant.product_id == product_id)
            .order_by(ProductVariant.sort_order, ProductVariant.created_at)
        )
        return list(result.scalars().all())

    async def create_variant(
        self, vendor_id: str | uuid.UUID | None, product_id: uuid.UUID, **kwargs
    ) -> ProductVariant:
        """Create a new product variant with vendor ownership check."""
        product = await self._get_vendor_product(vendor_id, product_id)

        if product.product_type != "variable":
            product.product_type = "variable"

        # If marked default, unset other defaults
        if kwargs.get("is_default"):
            from sqlalchemy import update

            await self.db.execute(
                update(ProductVariant).where(ProductVariant.product_id == product.id).values(is_default=False)
            )

        variant = ProductVariant(product_id=product.id, **kwargs)
        self.db.add(variant)
        await self.db.commit()
        await self.db.refresh(variant)

        await self._sync_variable_product_stock(product.id)
        return variant

    async def create_variant_matrix(
        self,
        vendor_id: str | uuid.UUID | None,
        product_id: uuid.UUID,
        attribute_groups: dict[str, list[str]],
        base_sku_prefix: str | None = None,
        default_stock: int = 0,
    ) -> list[ProductVariant]:
        """Generate matrix combinations from attribute groups with vendor ownership check."""
        product = await self._get_vendor_product(vendor_id, product_id)

        import itertools

        keys = list(attribute_groups.keys())
        value_lists = [attribute_groups[k] for k in keys]
        combinations = list(itertools.product(*value_lists))

        created_variants = []
        sku_prefix = base_sku_prefix or product.sku or "VAR"

        for idx, combo in enumerate(combinations):
            attrs = {keys[i]: combo[i] for i in range(len(keys))}
            name_parts = [f"{combo[i]}" for i in range(len(keys))]
            variant_name = f"{product.name} - " + " / ".join(name_parts)
            sku_suffix = "-".join([str(c).upper().replace(" ", "") for c in combo])
            sku = f"{sku_prefix}-{sku_suffix}"

            variant = ProductVariant(
                product_id=product.id,
                name=variant_name,
                sku=sku,
                stock_quantity=default_stock,
                attributes=attrs,
                is_active=True,
                is_default=(idx == 0),
                sort_order=idx,
            )
            self.db.add(variant)
            created_variants.append(variant)

        product.product_type = "variable"
        await self.db.commit()
        await self._sync_variable_product_stock(product.id)

        for v in created_variants:
            await self.db.refresh(v)
        return created_variants

    async def update_variant(
        self, vendor_id: str | uuid.UUID | None, product_id: uuid.UUID, variant_id: uuid.UUID, **kwargs
    ) -> ProductVariant:
        """Update a product variant with vendor ownership check."""
        product = await self._get_vendor_product(vendor_id, product_id)
        variant = await self.db.get(ProductVariant, variant_id)
        if not variant or variant.product_id != product.id:
            raise ValueError("Variant not found")

        if kwargs.get("is_default"):
            from sqlalchemy import update

            await self.db.execute(
                update(ProductVariant).where(ProductVariant.product_id == variant.product_id).values(is_default=False)
            )

        for key, value in kwargs.items():
            if value is not None:
                setattr(variant, key, value)

        await self.db.commit()
        await self.db.refresh(variant)
        await self._sync_variable_product_stock(variant.product_id)
        return variant

    async def delete_variant(
        self, vendor_id: str | uuid.UUID | None, product_id: uuid.UUID, variant_id: uuid.UUID
    ) -> bool:
        """Delete a variant with vendor ownership check."""
        product = await self._get_vendor_product(vendor_id, product_id)
        variant = await self.db.get(ProductVariant, variant_id)
        if not variant or variant.product_id != product.id:
            return False
        prod_id = variant.product_id
        await self.db.delete(variant)
        await self.db.commit()
        await self._sync_variable_product_stock(prod_id)
        return True

    # ========================================================================
    # BUNDLE OPERATIONS
    # ========================================================================

    async def get_bundle_items(self, product_id: uuid.UUID) -> list[BundleItem]:
        """Get all component items for a bundle product."""
        result = await self.db.execute(
            select(BundleItem)
            .where(BundleItem.bundle_product_id == product_id)
            .options(selectinload(BundleItem.component_product))
            .order_by(BundleItem.sort_order)
        )
        return list(result.scalars().all())

    async def add_bundle_item(
        self,
        vendor_id: str | uuid.UUID | None,
        bundle_product_id: uuid.UUID,
        component_product_id: uuid.UUID,
        quantity: int = 1,
        sort_order: int = 0,
        is_optional: bool = False,
    ) -> BundleItem:
        """Add a component item to a bundle product with vendor ownership check."""
        bundle_product = await self._get_vendor_product(vendor_id, bundle_product_id)

        component_product = await self.db.get(Product, component_product_id)
        if not component_product:
            raise ValueError("Component product not found")

        if bundle_product.id == component_product_id:
            raise ValueError("A product cannot be a component of itself")

        bundle_product.product_type = "bundle"

        item = BundleItem(
            bundle_product_id=bundle_product.id,
            component_product_id=component_product_id,
            quantity=quantity,
            sort_order=sort_order,
            is_optional=is_optional,
        )
        self.db.add(item)
        await self.db.commit()

        # Reload item with component_product loaded
        res = await self.db.execute(
            select(BundleItem).where(BundleItem.id == item.id).options(selectinload(BundleItem.component_product))
        )
        return res.scalar_one()

    async def update_bundle_item(
        self, vendor_id: str | uuid.UUID | None, bundle_product_id: uuid.UUID, item_id: uuid.UUID, **kwargs
    ) -> BundleItem:
        """Update a bundle component item with vendor ownership check."""
        bundle_product = await self._get_vendor_product(vendor_id, bundle_product_id)
        item = await self.db.get(BundleItem, item_id)
        if not item or item.bundle_product_id != bundle_product.id:
            raise ValueError("Bundle item not found")

        for key, value in kwargs.items():
            if value is not None:
                setattr(item, key, value)

        await self.db.commit()
        res = await self.db.execute(
            select(BundleItem).where(BundleItem.id == item_id).options(selectinload(BundleItem.component_product))
        )
        return res.scalar_one()

    async def remove_bundle_item(
        self, vendor_id: str | uuid.UUID | None, bundle_product_id: uuid.UUID, item_id: uuid.UUID
    ) -> bool:
        """Remove a component item from a bundle with vendor ownership check."""
        bundle_product = await self._get_vendor_product(vendor_id, bundle_product_id)
        item = await self.db.get(BundleItem, item_id)
        if not item or item.bundle_product_id != bundle_product.id:
            return False
        await self.db.delete(item)
        await self.db.commit()
        return True

    # ========================================================================
    # RELATED PRODUCT OPERATIONS
    # ========================================================================

    async def get_related_products(
        self, product_id: uuid.UUID, relation_type: str | None = None
    ) -> list[RelatedProduct]:
        """Get related products linked to a product."""
        query = (
            select(RelatedProduct)
            .where(RelatedProduct.product_id == product_id)
            .options(selectinload(RelatedProduct.related_product))
            .order_by(RelatedProduct.sort_order)
        )
        if relation_type:
            query = query.where(RelatedProduct.relation_type == relation_type)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def add_related_product(
        self,
        vendor_id: str | uuid.UUID | None,
        product_id: uuid.UUID,
        related_product_id: uuid.UUID,
        relation_type: str,
        sort_order: int = 0,
        is_bidirectional: bool = True,
    ) -> RelatedProduct:
        """Link two products with vendor ownership check."""
        if product_id == related_product_id:
            raise ValueError("A product cannot be related to itself")

        p1 = await self._get_vendor_product(vendor_id, product_id)
        p2 = await self.db.get(Product, related_product_id)
        if not p1 or not p2:
            raise ValueError("Target products not found")

        rel = RelatedProduct(
            product_id=p1.id,
            related_product_id=related_product_id,
            relation_type=relation_type,
            sort_order=sort_order,
            is_bidirectional=is_bidirectional,
        )
        self.db.add(rel)

        # Bidirectional link logic: Yes for cross_sell and accessory; No for upsell
        if is_bidirectional and relation_type in ("cross_sell", "accessory"):
            reverse_rel = RelatedProduct(
                product_id=related_product_id,
                related_product_id=p1.id,
                relation_type=relation_type,
                sort_order=sort_order,
                is_bidirectional=True,
            )
            self.db.add(reverse_rel)

        await self.db.commit()

        res = await self.db.execute(
            select(RelatedProduct)
            .where(RelatedProduct.id == rel.id)
            .options(selectinload(RelatedProduct.related_product))
        )
        return res.scalar_one()

    async def remove_related_product(
        self, vendor_id: str | uuid.UUID | None, product_id: uuid.UUID, relation_id: uuid.UUID
    ) -> bool:
        """Remove a related product link with vendor ownership check."""
        product = await self._get_vendor_product(vendor_id, product_id)
        rel = await self.db.get(RelatedProduct, relation_id)
        if not rel or rel.product_id != product.id:
            return False

        # If bidirectional, remove reverse relationship if it exists
        if rel.is_bidirectional and rel.relation_type in ("cross_sell", "accessory"):
            reverse_result = await self.db.execute(
                select(RelatedProduct).where(
                    RelatedProduct.product_id == rel.related_product_id,
                    RelatedProduct.related_product_id == rel.product_id,
                    RelatedProduct.relation_type == rel.relation_type,
                )
            )
            reverse_rel = reverse_result.scalar_one_or_none()
            if reverse_rel:
                await self.db.delete(reverse_rel)

        await self.db.delete(rel)
        await self.db.commit()
        return True
