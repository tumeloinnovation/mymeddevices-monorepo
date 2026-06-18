import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domains.catalog.models.product import Product
from app.domains.catalog.models.category import Category
from app.domains.auth.models.user import User
import uuid

@pytest.fixture
async def sample_category(db: AsyncSession) -> Category:
    # Check if category already exists
    stmt = select(Category).where(Category.slug == "diagnostics")
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    if existing:
        return existing

    category = Category(name="Diagnostics", slug="diagnostics", is_active=True)
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category

@pytest.mark.asyncio
async def test_catalog_status_visibility(client: AsyncClient, db: AsyncSession, sample_category: Category, vendor_user: User):
    # Fetch Vendor Profile ID
    from app.domains.vendor.models.vendor_profile import VendorProfile
    stmt = select(VendorProfile.id).where(VendorProfile.user_id == vendor_user.id)
    result = await db.execute(stmt)
    vendor_profile_id = result.scalar_one()

    # Create products with different statuses
    # 1. Published (should be visible)
    p_published = Product(
        name="Published Product",
        slug="published-product",
        vendor_id=vendor_profile_id,
        category_id=sample_category.id,
        status="published",
        is_verified=True,
        price=100.0,
        stock_quantity=10
    )
    # 2. Draft (should be hidden)
    p_draft = Product(
        name="Draft Product",
        slug="draft-product",
        vendor_id=vendor_profile_id,
        category_id=sample_category.id,
        status="draft",
        is_verified=False,
        price=100.0,
        stock_quantity=10
    )
    # 3. Pending Review (should be hidden)
    p_pending = Product(
        name="Pending Product",
        slug="pending-product",
        vendor_id=vendor_profile_id,
        category_id=sample_category.id,
        status="pending_review",
        is_verified=True,
        price=100.0,
        stock_quantity=10
    )
    # 4. Soft Deleted (should be hidden)
    p_deleted = Product(
        name="Deleted Product",
        slug="deleted-product",
        vendor_id=vendor_profile_id,
        category_id=sample_category.id,
        status="published",
        is_verified=True,
        is_deleted=True,
        price=100.0,
        stock_quantity=10
    )
    # 5. Archived (should be hidden)
    p_archived = Product(
        name="Archived Product",
        slug="archived-product",
        vendor_id=vendor_profile_id,
        category_id=sample_category.id,
        status="archived",
        is_verified=True,
        price=100.0,
        stock_quantity=10
    )

    db.add_all([p_published, p_draft, p_pending, p_deleted, p_archived])
    await db.commit()

    # Test Storefront List
    resp = await client.get("/api/v1/storefront/products")
    assert resp.status_code == 200
    products = resp.json()["products"]
    product_names = [p["name"] for p in products]
    
    assert "Published Product" in product_names
    assert "Draft Product" not in product_names
    assert "Pending Product" not in product_names
    assert "Deleted Product" not in product_names
    assert "Archived Product" not in product_names

    # Test Storefront Search
    resp = await client.get("/api/v1/storefront/products?search=Product")
    assert resp.status_code == 200
    products = resp.json()["products"]
    product_names = [p["name"] for p in products]
    
    assert "Published Product" in product_names
    assert "Draft Product" not in product_names
    assert "Pending Product" not in product_names
    assert "Deleted Product" not in product_names
    assert "Archived Product" not in product_names

    # Test Storefront Detail by Slug
    # Published - OK
    resp = await client.get("/api/v1/storefront/products/published-product")
    assert resp.status_code == 200

    # Draft - 404
    resp = await client.get("/api/v1/storefront/products/draft-product")
    assert resp.status_code == 404

    # Pending - 404
    resp = await client.get("/api/v1/storefront/products/pending-product")
    assert resp.status_code == 404

    # Deleted - 404
    resp = await client.get("/api/v1/storefront/products/deleted-product")
    assert resp.status_code == 404

    # Archived - 404
    resp = await client.get("/api/v1/storefront/products/archived-product")
    assert resp.status_code == 404
