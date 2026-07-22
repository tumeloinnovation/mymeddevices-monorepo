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
    # 4. Clear parent_id (make it root category)
    update_payload = {
        "parent_id": None
    }
    update_resp = await client.patch(f"/api/v1/catalog/categories/{sub_data['id']}", json=update_payload, headers=headers)
    assert update_resp.status_code == 200
    updated_data = update_resp.json()
    assert updated_data["parent_id"] is None


@pytest.mark.asyncio
async def test_category_validation_and_cycles(client: AsyncClient, admin_token: str, db: AsyncSession):
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 1. Create a root category A
    resp_a = await client.post("/api/v1/catalog/categories", json={
        "name": "Category A",
        "slug": "category-a",
        "is_active": True
    }, headers=headers)
    assert resp_a.status_code == 201
    cat_a = resp_a.json()

    # 2. Create subcategory B with parent A
    resp_b = await client.post("/api/v1/catalog/categories", json={
        "name": "Category B",
        "slug": "category-b",
        "parent_id": cat_a["id"],
        "is_active": True
    }, headers=headers)
    assert resp_b.status_code == 201
    cat_b = resp_b.json()

    # 3. Create sub-subcategory C with parent B
    resp_c = await client.post("/api/v1/catalog/categories", json={
        "name": "Category C",
        "slug": "category-c",
        "parent_id": cat_b["id"],
        "is_active": True
    }, headers=headers)
    assert resp_c.status_code == 201
    cat_c = resp_c.json()

    # 4. Attempt to create category with invalid parent UUID -> 400
    import uuid
    invalid_uuid = str(uuid.uuid4())
    resp_invalid = await client.post("/api/v1/catalog/categories", json={
        "name": "Category Invalid Parent",
        "slug": "cat-invalid-parent",
        "parent_id": invalid_uuid,
        "is_active": True
    }, headers=headers)
    assert resp_invalid.status_code == 400
    assert "Parent category not found" in resp_invalid.json()["detail"]

    # 5. Attempt to update category parent to invalid UUID -> 400
    resp_invalid_update = await client.patch(f"/api/v1/catalog/categories/{cat_c['id']}", json={
        "parent_id": invalid_uuid
    }, headers=headers)
    assert resp_invalid_update.status_code == 400
    assert "Parent category not found" in resp_invalid_update.json()["detail"]

    # 6. Attempt to make a category its own parent -> 400
    resp_self_parent = await client.patch(f"/api/v1/catalog/categories/{cat_a['id']}", json={
        "parent_id": cat_a["id"]
    }, headers=headers)
    assert resp_self_parent.status_code == 400
    assert "cannot be its own parent" in resp_self_parent.json()["detail"]

    # 7. Attempt to create cycle (set A's parent to C, when C is descendant of A) -> 400
    resp_cycle = await client.patch(f"/api/v1/catalog/categories/{cat_a['id']}", json={
        "parent_id": cat_c["id"]
    }, headers=headers)
    assert resp_cycle.status_code == 400
    assert "Circular reference detected" in resp_cycle.json()["detail"]
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


@pytest.mark.asyncio
async def test_admin_publish_on_behalf_of_vendor(client: AsyncClient, admin_token: str, vendor_user: User, sample_category: Category, db: AsyncSession):
    # Get vendor profile to have a valid vendor_id
    stmt = select(VendorProfile).where(VendorProfile.user_id == vendor_user.id)
    res = await db.execute(stmt)
    vendor_profile = res.scalar_one()
    vendor_id = str(vendor_profile.id)

    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Admin creates a draft product on behalf of vendor (must specify vendor_id)
    product_data = {
        "name": "Surgical Stapler Pro",
        "vendor_id": vendor_id,
        "category_id": str(sample_category.id),
        "base_price": 12000.0,
        "description": "High quality surgical stapler designed for minimal tissue injury and fast healing.",
        "short_description": "Pro Surgical Stapler",
        "sku": "SURG-STAPLE-001",
        "specifications": {"Size": "Medium", "Staple Count": "35"}
    }
    
    response = await client.post("/api/v1/catalog/products", json=product_data, headers=admin_headers)
    assert response.status_code == 201
    prod_data = response.json()
    assert prod_data["name"] == "Surgical Stapler Pro"
    assert prod_data["vendor_id"] == vendor_id
    assert prod_data["status"] == "draft"
    product_id = prod_data["id"]

    # 2. Admin tries to create a product without specifying vendor_id -> Should fail
    invalid_product_data = {
        "name": "Surgical Stapler Pro No Vendor",
        "category_id": str(sample_category.id),
        "base_price": 12000.0
    }
    err_response = await client.post("/api/v1/catalog/products", json=invalid_product_data, headers=admin_headers)
    assert err_response.status_code == 400
    assert "vendor_id is required" in err_response.json()["detail"]

    # 3. Admin adds an image on behalf of vendor
    files = {"file": ("stapler.png", BytesIO(b"fake surgical stapler image content"), "image/png")}
    img_resp = await client.post(f"/api/v1/catalog/products/{product_id}/images", files=files, headers=admin_headers)
    assert img_resp.status_code == 201
    img_data = img_resp.json()
    
    local_filename = img_data["url"].split("/")[-1]
    local_filepath = os.path.join(catalog_settings.UPLOAD_DIR, local_filename)

    try:
        # 4. Admin verifies the product on behalf of vendor -> should set status to pending_review
        verify_resp = await client.post(f"/api/v1/catalog/products/{product_id}/verify", headers=admin_headers)
        assert verify_resp.status_code == 200
        assert verify_resp.json()["is_verified"] == True
        assert verify_resp.json()["status"] == "pending_review"

        # 5. Admin publishes the product on behalf of vendor -> should set status to published
        publish_resp = await client.post(f"/api/v1/catalog/products/{product_id}/publish", headers=admin_headers)
        assert publish_resp.status_code == 200
        assert publish_resp.json()["status"] == "published"
    finally:
        # Clean up local file created by test
        if os.path.exists(local_filepath):
            os.remove(local_filepath)


@pytest.mark.asyncio
async def test_delete_product_restrictions(client: AsyncClient, vendor_token: str, sample_category: Category):
    headers = {"Authorization": f"Bearer {vendor_token}"}
    
    # 1. Create a draft product and verify it can be deleted
    product_data = {
        "name": "Product for Deletion",
        "category_id": str(sample_category.id),
        "base_price": 1000.0,
        "sku": "DEL-SKU-1"
    }
    response = await client.post("/api/v1/catalog/products", json=product_data, headers=headers)
    assert response.status_code == 201
    product_id = response.json()["id"]

    # 2. Deletion should succeed for draft
    del_resp = await client.delete(f"/api/v1/catalog/products/{product_id}", headers=headers)
    assert del_resp.status_code == 204

    # 3. Trying to delete a non-existent product should return 404 Not Found
    del_non_existent = await client.delete(f"/api/v1/catalog/products/{product_id}", headers=headers)
    assert del_non_existent.status_code == 404

    # 4. Create a published product
    pub_product_data = {
        "name": "Published Product for Delete Test",
        "category_id": str(sample_category.id),
        "base_price": 2000.0,
        "description": "This is a detailed description of the published product for testing deletion restrictions.",
        "short_description": "Published delete test",
        "sku": "DEL-SKU-2",
        "specifications": {"type": "test"}
    }
    response = await client.post("/api/v1/catalog/products", json=pub_product_data, headers=headers)
    pub_product_id = response.json()["id"]

    # Add mock image
    from io import BytesIO
    files = {"file": ("test.png", BytesIO(b"fake image bytes"), "image/png")}
    img_resp = await client.post(f"/api/v1/catalog/products/{pub_product_id}/images", files=files, headers=headers)
    local_filename = img_resp.json()["url"].split("/")[-1]
    local_filepath = os.path.join(catalog_settings.UPLOAD_DIR, local_filename)

    try:
        # Verify & Publish
        await client.post(f"/api/v1/catalog/products/{pub_product_id}/verify", headers=headers)
        await client.post(f"/api/v1/catalog/products/{pub_product_id}/publish", headers=headers)

        # 5. Trying to delete the published product should return 400 Bad Request
        del_pub_resp = await client.delete(f"/api/v1/catalog/products/{pub_product_id}", headers=headers)
        assert del_pub_resp.status_code == 400
        assert "Only draft products can be deleted" in del_pub_resp.json()["detail"]
    finally:
        if os.path.exists(local_filepath):
            os.remove(local_filepath)


@pytest.mark.asyncio
async def test_sku_uniqueness(client: AsyncClient, vendor_token: str, sample_category: Category):
    headers = {"Authorization": f"Bearer {vendor_token}"}
    
    # 1. Create a product with SKU "SKU-UNIQUE-1"
    product_data_1 = {
        "name": "Product SKU One",
        "category_id": str(sample_category.id),
        "base_price": 1000.0,
        "sku": "SKU-UNIQUE-1"
    }
    response = await client.post("/api/v1/catalog/products", json=product_data_1, headers=headers)
    assert response.status_code == 201

    # 2. Try to create another product with the same SKU "SKU-UNIQUE-1" -> Should fail with 400
    product_data_2 = {
        "name": "Product SKU Two",
        "category_id": str(sample_category.id),
        "base_price": 1500.0,
        "sku": "SKU-UNIQUE-1"
    }
    response2 = await client.post("/api/v1/catalog/products", json=product_data_2, headers=headers)
    assert response2.status_code == 400
    assert "already exists" in response2.json()["detail"]

    # 3. Create a product with different SKU "SKU-UNIQUE-2"
    product_data_3 = {
        "name": "Product SKU Three",
        "category_id": str(sample_category.id),
        "base_price": 2000.0,
        "sku": "SKU-UNIQUE-2"
    }
    response3 = await client.post("/api/v1/catalog/products", json=product_data_3, headers=headers)
    assert response3.status_code == 201
    prod_3_id = response3.json()["id"]

    # 4. Try to update product 3's SKU to "SKU-UNIQUE-1" -> Should fail with 400
    update_payload = {"sku": "SKU-UNIQUE-1"}
    up_resp = await client.patch(f"/api/v1/catalog/products/{prod_3_id}", json=update_payload, headers=headers)
    assert up_resp.status_code == 400
    assert "already exists" in up_resp.json()["detail"]


@pytest.mark.asyncio
async def test_products_rate_limiting(client: AsyncClient):
    from app.core.rate_limiting import rate_limiter
    rate_limiter.clear()
    
    original_limit = rate_limiter._limits.get("products_get")
    rate_limiter._limits["products_get"] = (5, 60)

    try:
        # Send 5 storefront product list requests
        for _ in range(5):
            response = await client.get("/api/v1/storefront/products")
            assert response.status_code == 200

        # 6th request should fail with 429 Too Many Requests
        response = await client.get("/api/v1/storefront/products")
        assert response.status_code == 429
        data = response.json()
        assert "Rate limit exceeded" in data["detail"]["error"]
    finally:
        if original_limit:
            rate_limiter._limits["products_get"] = original_limit
        else:
            rate_limiter._limits.pop("products_get", None)
        rate_limiter.clear()

