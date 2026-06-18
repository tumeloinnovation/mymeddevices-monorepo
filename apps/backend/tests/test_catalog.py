import os
import pytest
import shutil
from io import BytesIO
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.domains.auth.models.user import User
from app.domains.vendor.models.vendor_profile import VendorProfile
from app.domains.catalog.models.category import Category
from app.domains.catalog.models.product import Product
from app.domains.catalog.models.product_image import ProductImage
from app.core.security import get_password_hash, create_access_token
from app.domains.catalog.config import settings as catalog_settings


@pytest.fixture
async def vendor_user(db: AsyncSession) -> User:
    # Check if user already exists (idempotency across tests)
    stmt = select(User).where(User.email == "vendor@example.com")
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    if existing_user:
        # Ensure they have an approved vendor profile
        stmt_p = select(VendorProfile).where(VendorProfile.user_id == existing_user.id)
        res_p = await db.execute(stmt_p)
        profile = res_p.scalar_one_or_none()
        if not profile:
            profile = VendorProfile(
                user_id=existing_user.id,
                store_name="Vendor Store",
                approval_status="approved"
            )
            db.add(profile)
            await db.commit()
        elif profile.approval_status != "approved":
            profile.approval_status = "approved"
            await db.commit()
        return existing_user

    # Create vendor user
    user = User(
        email="vendor@example.com",
        password_hash=get_password_hash("Test123!"),
        role="vendor",
        first_name="Vendor",
        last_name="One",
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Create approved vendor profile
    profile = VendorProfile(
        user_id=user.id,
        store_name="Vendor Store",
        approval_status="approved"
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)

    return user


@pytest.fixture
async def vendor_token(vendor_user: User) -> str:
    return create_access_token({"sub": str(vendor_user.id)})


@pytest.fixture
async def admin_user(db: AsyncSession) -> User:
    # Check if admin user already exists
    stmt = select(User).where(User.email == "admin@example.com")
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    if existing_user:
        return existing_user

    user = User(
        email="admin@example.com",
        password_hash=get_password_hash("Test123!"),
        role="admin",
        first_name="Admin",
        last_name="User",
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@pytest.fixture
async def admin_token(admin_user: User) -> str:
    return create_access_token({"sub": str(admin_user.id)})


@pytest.fixture
async def sample_category(db: AsyncSession) -> Category:
    # Check if category already exists
    stmt = select(Category).where(Category.slug == "diagnostics")
    result = await db.execute(stmt)
    existing_cat = result.scalar_one_or_none()
    if existing_cat:
        return existing_cat

    category = Category(
        name="Diagnostics",
        slug="diagnostics",
        description="Diagnostic medical devices",
        sort_order=1,
        is_active=True
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


# ============================================================================
# CATEGORY TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_admin_manage_categories(client: AsyncClient, admin_token: str, db: AsyncSession):
    # 1. Create root category
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "name": "Surgical Instruments",
        "slug": "surgical-instruments",
        "description": "Surgical tools",
        "sort_order": 1,
        "is_active": True
    }
    response = await client.post("/api/v1/catalog/categories", json=payload, headers=headers)
    assert response.status_code == 201
    cat_data = response.json()
    assert cat_data["name"] == "Surgical Instruments"
    assert cat_data["slug"] == "surgical-instruments"

    # 2. Create subcategory
    sub_payload = {
        "name": "Scalpels",
        "slug": "scalpels",
        "parent_id": str(cat_data["id"]),
        "sort_order": 1,
        "is_active": True
    }
    sub_resp = await client.post("/api/v1/catalog/categories", json=sub_payload, headers=headers)
    assert sub_resp.status_code == 201
    sub_data = sub_resp.json()
    assert sub_data["parent_id"] == cat_data["id"]

    # 3. List categories (storefront navigation tree)
    list_resp = await client.get("/api/v1/storefront/categories")
    assert list_resp.status_code == 200
    tree = list_resp.json()
    assert len(tree) > 0
    # Verify subcategory is nested inside parent
    root_cats = [c for c in tree if c["id"] == cat_data["id"]]
    assert len(root_cats) == 1
    assert len(root_cats[0]["children"]) == 1
    assert root_cats[0]["children"][0]["id"] == sub_data["id"]


# ============================================================================
# PRODUCT CRUD & PRICING TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_product_crud_and_pricing(client: AsyncClient, vendor_token: str, sample_category: Category):
    headers = {"Authorization": f"Bearer {vendor_token}"}
    
    # 1. Create draft product
    product_data = {
        "name": "Stethoscope Professional",
        "category_id": str(sample_category.id),
        "base_price": 5000.0, # Range 0-10000 = 5% markup
        "sku": "STETH-001"
    }
    response = await client.post("/api/v1/catalog/products", json=product_data, headers=headers)
    assert response.status_code == 201
    res_data = response.json()
    assert res_data["name"] == "Stethoscope Professional"
    assert res_data["status"] == "draft"
    
    # Verify range-based markup calculations
    # base_price = 5000
    # markup = 5% of 5000 = 250
    # commission = 2% of 5000 = 100
    # price = 5000 + 250 = 5250
    assert res_data["base_price"] == 5000.0
    assert res_data["markup_price"] == 250.0
    assert res_data["commission_fee"] == 100.0
    assert res_data["price"] == 5250.0
    assert res_data["currency"] == "KES"

    product_id = res_data["id"]

    # 2. Update product and verify pricing updates
    update_payload = {
        "base_price": 20000.0, # Range 10001-50000 = 3% markup
        "short_description": "A professional stethoscope.",
        "kmpdb_registration_number": "KMPDB-9988",
        "ppb_classification": "Class B",
        "ce_marking_or_fda_clearance": "CE-0123"
    }
    up_resp = await client.patch(f"/api/v1/catalog/products/{product_id}", json=update_payload, headers=headers)
    assert up_resp.status_code == 200
    up_data = up_resp.json()
    
    # base_price = 20000
    # markup = 3% of 20000 = 600
    # commission = 2% of 20000 = 400
    # price = 20600
    assert up_data["base_price"] == 20000.0
    assert up_data["markup_price"] == 600.0
    assert up_data["commission_fee"] == 400.0
    assert up_data["price"] == 20600.0
    assert up_data["kmpdb_registration_number"] == "KMPDB-9988"
    assert up_data["ppb_classification"] == "Class B"
    assert up_data["ce_marking_or_fda_clearance"] == "CE-0123"


# ============================================================================
# VERIFICATION & COMPLETENESS TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_product_completeness_and_verification(client: AsyncClient, vendor_token: str, sample_category: Category, db: AsyncSession):
    headers = {"Authorization": f"Bearer {vendor_token}"}
    
    # 1. Create a product with missing required fields
    product_data = {
        "name": "Digital Thermometer",
        "category_id": str(sample_category.id),
        "base_price": 800.0
    }
    response = await client.post("/api/v1/catalog/products", json=product_data, headers=headers)
    assert response.status_code == 201
    product_id = response.json()["id"]

    # 2. Try to verify -> Should fail due to completeness score < 80% (and missing required short_desc, SKU, spec, image)
    verify_resp = await client.post(f"/api/v1/catalog/products/{product_id}/verify", headers=headers)
    assert verify_resp.status_code == 400
    assert "Product completeness is" in verify_resp.json()["detail"]

    # 3. Get completeness breakdown
    breakdown_resp = await client.get(f"/api/v1/catalog/products/{product_id}/completeness", headers=headers)
    assert breakdown_resp.status_code == 200
    breakdown = breakdown_resp.json()
    assert breakdown["is_ready_to_verify"] == False
    assert "Short Description" in breakdown["missing_required"]
    assert "SKU" in breakdown["missing_required"]
    assert "Specifications" in breakdown["missing_required"]
    assert "At least 1 image" in breakdown["missing_required"]

    # 4. Update the required fields
    update_payload = {
        "description": "This is a detailed description of the digital thermometer for healthcare applications that spans over fifty characters to satisfy the minimum length check.",
        "short_description": "Digital medical thermometer",
        "sku": "THERM-001",
        "specifications": {"Accuracy": "+/- 0.1C", "Range": "32C - 42C"}
    }
    await client.patch(f"/api/v1/catalog/products/{product_id}", json=update_payload, headers=headers)

    # 5. Add an image
    # Mock upload file
    file_content = b"fake image bytes"
    file = io_file = BytesIO(file_content)
    files = {"file": ("thermometer.png", io_file, "image/png")}
    img_resp = await client.post(f"/api/v1/catalog/products/{product_id}/images", files=files, headers=headers)
    assert img_resp.status_code == 201

    # Clean up local file created by test
    img_data = img_resp.json()
    local_filename = img_data["url"].split("/")[-1]
    local_filepath = os.path.join(catalog_settings.UPLOAD_DIR, local_filename)
    if os.path.exists(local_filepath):
        os.remove(local_filepath)

    # 6. Recheck completeness -> Should be ready now!
    breakdown_resp2 = await client.get(f"/api/v1/catalog/products/{product_id}/completeness", headers=headers)
    assert breakdown_resp2.status_code == 200
    assert breakdown_resp2.json()["is_ready_to_verify"] == True
    assert len(breakdown_resp2.json()["missing_required"]) == 0

    # 7. Verify product -> Success (sets status to pending_review)
    verify_resp2 = await client.post(f"/api/v1/catalog/products/{product_id}/verify", headers=headers)
    assert verify_resp2.status_code == 200
    assert verify_resp2.json()["is_verified"] == True
    assert verify_resp2.json()["status"] == "pending_review"

    # 8. Publish product -> Success (sets status to published)
    publish_resp = await client.post(f"/api/v1/catalog/products/{product_id}/publish", headers=headers)
    assert publish_resp.status_code == 200
    assert publish_resp.json()["status"] == "published"


# ============================================================================
# STOREFRONT TESTS (NO VENDOR DETAILS LEAK)
# ============================================================================

@pytest.mark.asyncio
async def test_storefront_privacy_and_filtering(client: AsyncClient, vendor_token: str, sample_category: Category, db: AsyncSession):
    headers = {"Authorization": f"Bearer {vendor_token}"}
    
    # 1. Create, verify, and publish a product
    product_data = {
        "name": "Blood Pressure Monitor Pro",
        "category_id": str(sample_category.id),
        "base_price": 8000.0,
        "description": "This is a detailed description of the blood pressure monitor for clinical and personal healthcare environments.",
        "short_description": "BP Monitor Pro",
        "sku": "BP-001",
        "specifications": {"Type": "Upper Arm"},
        "is_featured": True,
        "kmpdb_registration_number": "KMPDB-123",
        "ppb_classification": "Class A",
        "ce_marking_or_fda_clearance": "CE-987"
    }
    response = await client.post("/api/v1/catalog/products", json=product_data, headers=headers)
    product_id = response.json()["id"]

    # Add image
    files = {"file": ("bp.png", BytesIO(b"fake image"), "image/png")}
    img_resp = await client.post(f"/api/v1/catalog/products/{product_id}/images", files=files, headers=headers)
    local_filename = img_resp.json()["url"].split("/")[-1]
    local_filepath = os.path.join(catalog_settings.UPLOAD_DIR, local_filename)

    # Verify and Publish
    await client.post(f"/api/v1/catalog/products/{product_id}/verify", headers=headers)
    pub_resp = await client.post(f"/api/v1/catalog/products/{product_id}/publish", headers=headers)
    slug = pub_resp.json()["slug"]

    # 2. Get product on public storefront
    storefront_resp = await client.get(f"/api/v1/storefront/products/{slug}")
    assert storefront_resp.status_code == 200
    storefront_data = storefront_resp.json()

    # Ensure vendor details and internal pricing are HIDDEN
    assert "vendor_id" not in storefront_data
    assert "base_price" not in storefront_data
    assert "markup_price" not in storefront_data
    assert "commission_fee" not in storefront_data
    assert "cost_price" not in storefront_data
    
    # Ensure public fields are visible
    assert storefront_data["name"] == "Blood Pressure Monitor Pro"
    assert storefront_data["price"] == 8400.0 # base (8000) + markup (5% = 400)
    assert storefront_data["kmpdb_registration_number"] == "KMPDB-123"
    assert storefront_data["ppb_classification"] == "Class A"
    assert storefront_data["ce_marking_or_fda_clearance"] == "CE-987"

    # Clean up local file
    if os.path.exists(local_filepath):
        os.remove(local_filepath)
