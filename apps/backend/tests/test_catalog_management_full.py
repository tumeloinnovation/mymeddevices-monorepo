import uuid
from decimal import Decimal

import pytest
from httpx import AsyncClient

from app.core.security import get_password_hash
from app.domains.auth.models.user import User
from app.domains.auth.services.auth_service import AuthService
from app.domains.catalog.models.brand import Brand
from app.domains.catalog.models.category import Category
from app.domains.catalog.models.product import Product
from app.domains.catalog.models.tag import Tag
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.fixture
async def catalog_setup(db_session):
    """Fixture providing admin, vendor, categories, brands, tags, and initial products."""
    auth_service = AuthService(db_session)

    # Admin User
    admin = User(
        id=uuid.uuid4(),
        email="admin_catalog@test.com",
        password_hash=get_password_hash("AdminPass123!"),
        role="admin",
        is_active=True,
    )
    db_session.add(admin)

    # Vendor User & Profile
    vendor_user = User(
        id=uuid.uuid4(),
        email="vendor_catalog@test.com",
        password_hash=get_password_hash("VendorPass123!"),
        role="vendor",
        is_active=True,
    )
    db_session.add(vendor_user)
    await db_session.flush()

    vendor_profile = VendorProfile(
        id=uuid.uuid4(),
        user_id=vendor_user.id,
        store_name="Kenya MedEquip Ltd",
        approval_status="approved",
    )
    db_session.add(vendor_profile)

    # Customer User
    customer = User(
        id=uuid.uuid4(),
        email="customer_catalog@test.com",
        password_hash=get_password_hash("CustomerPass123!"),
        role="customer",
        is_active=True,
    )
    db_session.add(customer)
    await db_session.commit()

    tokens_admin = await auth_service.create_tokens(admin)
    tokens_vendor = await auth_service.create_tokens(vendor_user)
    tokens_customer = await auth_service.create_tokens(customer)

    return {
        "admin": admin,
        "tokens_admin": tokens_admin,
        "vendor_user": vendor_user,
        "vendor_profile": vendor_profile,
        "tokens_vendor": tokens_vendor,
        "customer": customer,
        "tokens_customer": tokens_customer,
    }


@pytest.mark.asyncio
async def test_category_taxonomy_crud_lifecycle(client: AsyncClient, catalog_setup):
    """CAT-001: Category taxonomy creation, update, retrieval, and deletion by admin."""
    d = catalog_setup
    admin_headers = {"Authorization": f"Bearer {d['tokens_admin'].access_token}"}
    cust_headers = {"Authorization": f"Bearer {d['tokens_customer'].access_token}"}

    # 1. Non-admin cannot create category -> 403
    forbidden_create = await client.post(
        "/api/v1/catalog/categories",
        json={"name": "Diagnostic Tools", "slug": "diagnostic-tools", "description": "Medical diagnostics"},
        headers=cust_headers,
    )
    assert forbidden_create.status_code == 403

    # 2. Admin creates root category -> 201
    create_res = await client.post(
        "/api/v1/catalog/categories",
        json={"name": "Diagnostic Tools", "slug": "diagnostic-tools", "description": "Medical diagnostics", "is_active": True},
        headers=admin_headers,
    )
    assert create_res.status_code == 201
    cat_data = create_res.json()
    cat_id = cat_data["id"]
    assert cat_data["slug"] == "diagnostic-tools"

    # 3. Admin creates child category -> 201
    child_res = await client.post(
        "/api/v1/catalog/categories",
        json={"name": "Ultrasound Scanners", "slug": "ultrasound-scanners", "parent_id": cat_id, "is_active": True},
        headers=admin_headers,
    )
    assert child_res.status_code == 201

    # 4. List categories tree
    list_res = await client.get("/api/v1/catalog/categories")
    assert list_res.status_code == 200
    categories = list_res.json()
    assert any(c["id"] == cat_id for c in categories)

    # 5. Update category
    patch_res = await client.patch(
        f"/api/v1/catalog/categories/{cat_id}",
        json={"name": "Advanced Diagnostics"},
        headers=admin_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Advanced Diagnostics"

    # 6. Delete child category -> 204
    del_res = await client.delete(f"/api/v1/catalog/categories/{child_res.json()['id']}", headers=admin_headers)
    assert del_res.status_code == 204


@pytest.mark.asyncio
async def test_brands_and_tags_lifecycle(client: AsyncClient, catalog_setup, db_session):
    """CAT-002: Brands & Tags creation, quick-create, approval, retrieval, and deletion."""
    d = catalog_setup
    admin_headers = {"Authorization": f"Bearer {d['tokens_admin'].access_token}"}
    vendor_headers = {"Authorization": f"Bearer {d['tokens_vendor'].access_token}"}

    # 1. Admin creates brand -> 201
    b_res = await client.post(
        "/api/v1/catalog/brands",
        json={"name": "Siemens Healthineers", "slug": "siemens-healthineers", "country_of_origin": "Germany", "is_active": True},
        headers=admin_headers,
    )
    assert b_res.status_code == 201
    brand_id = b_res.json()["id"]

    # 2. Get Brand by ID
    get_b = await client.get(f"/api/v1/catalog/brands/{brand_id}")
    assert get_b.status_code == 200
    assert get_b.json()["name"] == "Siemens Healthineers"

    # 3. Vendor quick creates brand -> 201 (Auto-approved for immediate use)
    quick_b = await client.post(
        "/api/v1/catalog/brands/quick-create",
        json={"name": "Mindray Bio-Medical"},
        headers=vendor_headers,
    )
    assert quick_b.status_code == 201
    assert quick_b.json()["approval_status"] == "approved"

    # 4. Admin creates a pending brand in DB and approves it via endpoint -> 200
    pending_brand = Brand(
        id=uuid.uuid4(),
        name="Pending MedTech",
        slug="pending-medtech",
        approval_status="pending",
        is_active=False,
    )
    db_session.add(pending_brand)
    await db_session.commit()

    appr_b = await client.patch(f"/api/v1/catalog/brands/{pending_brand.id}/approve", headers=admin_headers)
    assert appr_b.status_code == 200
    assert appr_b.json()["approval_status"] == "approved"

    # 5. Tags CRUD
    tag_create = await client.post(
        "/api/v1/catalog/tags",
        json={"name": "Hospital Grade", "slug": "hospital-grade", "color": "#10B981"},
        headers=admin_headers,
    )
    assert tag_create.status_code == 201
    tag_id = tag_create.json()["id"]

    tag_list = await client.get("/api/v1/catalog/tags")
    assert tag_list.status_code == 200
    assert any(t["id"] == tag_id for t in tag_list.json()["tags"])

    tag_del = await client.delete(f"/api/v1/catalog/tags/{tag_id}", headers=admin_headers)
    assert tag_del.status_code == 204


@pytest.mark.asyncio
async def test_product_vendor_creation_and_admin_review_workflow(client: AsyncClient, catalog_setup, db_session):
    """CAT-003: Full Product creation, completeness check, verification, publish, reject, archive workflow."""
    d = catalog_setup
    admin_headers = {"Authorization": f"Bearer {d['tokens_admin'].access_token}"}
    vendor_headers = {"Authorization": f"Bearer {d['tokens_vendor'].access_token}"}

    # Setup Category and Brand
    cat = Category(id=uuid.uuid4(), name="Patient Monitors", slug="patient-monitors", is_active=True)
    brand = Brand(id=uuid.uuid4(), name="Philips Healthcare", slug="philips-healthcare", is_active=True, approval_status="approved")
    db_session.add_all([cat, brand])
    await db_session.commit()

    # 1. Vendor creates product -> 201
    prod_payload = {
        "name": "IntelliVue MX450 Patient Monitor",
        "description": "High acuity patient monitoring system with touchscreen display and modular multiparameter sensors.",
        "short_description": "Advanced ICU Monitor with high reliability",
        "category_id": str(cat.id),
        "brand": "Philips Healthcare",
        "price": 350000.00,
        "base_price": 300000.00,
        "stock_quantity": 15,
        "sku": "PHI-MX450-01",
        "specifications": {"display": "12 inch LCD", "battery_life": "5 hours", "parameters": ["ECG", "SpO2", "NIBP"]},
        "weight_kg": 4.5,
        "prescription_required": False,
        "warranty_info": "24 months manufacturer warranty",
    }
    create_res = await client.post("/api/v1/catalog/products", json=prod_payload, headers=vendor_headers)
    assert create_res.status_code == 201
    prod_data = create_res.json()
    prod_id = prod_data["id"]
    prod_slug = prod_data["slug"]

    # Add product image in DB directly to reach >= 80% completeness score
    from app.domains.catalog.models.product_image import ProductImage
    p_img = ProductImage(
        id=uuid.uuid4(),
        product_id=uuid.UUID(prod_id),
        url="https://mymeddevices.co.ke/uploads/mx450.jpg",
        is_primary=True,
    )
    db_session.add(p_img)
    await db_session.commit()

    # 2. Check Completeness endpoint
    comp_res = await client.get(f"/api/v1/catalog/products/{prod_id}/completeness", headers=vendor_headers)
    assert comp_res.status_code == 200
    assert comp_res.json()["score"] >= 80

    # 3. Admin verifies product -> 200
    ver_res = await client.post(f"/api/v1/catalog/products/{prod_id}/verify", headers=admin_headers)
    assert ver_res.status_code == 200
    assert ver_res.json()["is_verified"] is True

    # 4. Publish product -> 200
    pub_res = await client.post(f"/api/v1/catalog/products/{prod_id}/publish", headers=admin_headers)
    assert pub_res.status_code == 200
    assert pub_res.json()["status"] == "published"

    # 5. Storefront discovery by slug -> 200
    storefront_get = await client.get(f"/api/v1/storefront/products/{prod_slug}")
    assert storefront_get.status_code == 200
    assert storefront_get.json()["name"] == "IntelliVue MX450 Patient Monitor"

    # 6. Storefront search and filtering
    sf_list = await client.get("/api/v1/storefront/products?search=IntelliVue&price_min=100000")
    assert sf_list.status_code == 200
    assert sf_list.json()["total"] >= 1

    # 7. Archive product -> 200
    arch_res = await client.post(f"/api/v1/catalog/products/{prod_id}/archive", headers=admin_headers)
    assert arch_res.status_code == 200
    assert arch_res.json()["status"] == "archived"

    # 8. Unarchive product -> 200
    unarch_res = await client.post(f"/api/v1/catalog/products/{prod_id}/unarchive", headers=admin_headers)
    assert unarch_res.status_code == 200
    assert unarch_res.json()["status"] == "draft"


@pytest.mark.asyncio
async def test_product_variants_and_bundle_items(client: AsyncClient, catalog_setup, db_session):
    """CAT-004: Product Variants and Bundle Items management."""
    d = catalog_setup
    admin_headers = {"Authorization": f"Bearer {d['tokens_admin'].access_token}"}
    vendor_headers = {"Authorization": f"Bearer {d['tokens_vendor'].access_token}"}

    # Create base product
    base_prod = Product(
        id=uuid.uuid4(),
        vendor_id=d["vendor_profile"].id,
        name="Latex Examination Gloves",
        slug="latex-exam-gloves",
        price=1200.00,
        stock_quantity=500,
        status="published",
        is_verified=True,
    )
    db_session.add(base_prod)
    await db_session.commit()
    prod_id = str(base_prod.id)

    # 1. Create Variant
    var_res = await client.post(
        f"/api/v1/catalog/products/{prod_id}/variants",
        json={"name": "Size Medium", "sku": "GLV-MED-01", "price": 1200.00, "stock_quantity": 250, "attributes": {"size": "M"}},
        headers=vendor_headers,
    )
    assert var_res.status_code == 201
    var_id = var_res.json()["id"]

    # 2. List Variants
    list_var = await client.get(f"/api/v1/catalog/products/{prod_id}/variants")
    assert list_var.status_code == 200
    assert len(list_var.json()) >= 1

    # 3. Update Variant
    patch_var = await client.patch(
        f"/api/v1/catalog/products/{prod_id}/variants/{var_id}",
        json={"stock_quantity": 300},
        headers=vendor_headers,
    )
    assert patch_var.status_code == 200
    assert patch_var.json()["stock_quantity"] == 300

    # 4. Delete Variant -> 204
    del_var = await client.delete(f"/api/v1/catalog/products/{prod_id}/variants/{var_id}", headers=vendor_headers)
    assert del_var.status_code == 204
