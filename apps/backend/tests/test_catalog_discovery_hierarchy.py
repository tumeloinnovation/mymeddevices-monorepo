import uuid

import pytest
from httpx import AsyncClient

from app.domains.auth.models.user import User
from app.domains.auth.services.auth_service import AuthService
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.fixture
async def catalog_setup(db_session):
    auth_service = AuthService(db_session)

    # 1. Admin
    admin = User(
        id=uuid.uuid4(),
        email="catalog_admin@test.com",
        password_hash="test_hash",
        first_name="Admin",
        last_name="Catalog",
        role="admin",
        is_active=True,
    )
    db_session.add(admin)

    # 2. Approved Vendor
    approved_vendor_user = User(
        id=uuid.uuid4(),
        email="approved_seller@test.com",
        password_hash="test_hash",
        first_name="Seller",
        last_name="Approved",
        role="vendor",
        is_active=True,
    )
    db_session.add(approved_vendor_user)
    await db_session.flush()

    approved_vendor = VendorProfile(
        id=uuid.uuid4(),
        user_id=approved_vendor_user.id,
        store_name="Approved MedTech",
        approval_status="approved",
    )
    db_session.add(approved_vendor)

    # 3. Pending Vendor
    pending_vendor_user = User(
        id=uuid.uuid4(),
        email="pending_seller@test.com",
        password_hash="test_hash",
        first_name="Seller",
        last_name="Pending",
        role="vendor",
        is_active=True,
    )
    db_session.add(pending_vendor_user)
    await db_session.flush()

    pending_vendor = VendorProfile(
        id=uuid.uuid4(),
        user_id=pending_vendor_user.id,
        store_name="Pending MedTech",
        approval_status="pending",
    )
    db_session.add(pending_vendor)
    await db_session.commit()

    admin_tokens = await auth_service.create_tokens(admin)
    approved_tokens = await auth_service.create_tokens(approved_vendor_user)
    pending_tokens = await auth_service.create_tokens(pending_vendor_user)

    return {
        "admin": admin,
        "approved_vendor": approved_vendor,
        "pending_vendor": pending_vendor,
        "admin_tokens": admin_tokens,
        "approved_tokens": approved_tokens,
        "pending_tokens": pending_tokens,
    }


@pytest.mark.asyncio
async def test_category_taxonomy_hierarchy(client: AsyncClient, catalog_setup, db_session):
    """Test creating parent category and child subcategory, verifying hierarchy."""
    data = catalog_setup
    admin_headers = {"Authorization": f"Bearer {data['admin_tokens'].access_token}"}

    # 1. Create Parent Category (Diagnostics)
    parent_res = await client.post(
        "/api/v1/catalog/categories",
        json={"name": "Diagnostic Equipment", "description": "Medical diagnostic devices"},
        headers=admin_headers,
    )
    assert parent_res.status_code == 201, f"Expected 201, got {parent_res.status_code}: {parent_res.text}"
    parent_id = parent_res.json()["id"]

    # 2. Create Child Category (Blood Pressure Monitors)
    child_res = await client.post(
        "/api/v1/catalog/categories",
        json={"name": "BP Monitors", "parent_id": parent_id, "description": "Digital & manual BP cuffs"},
        headers=admin_headers,
    )
    assert child_res.status_code == 201
    assert child_res.json()["parent_id"] == parent_id

    # 3. Retrieve category tree
    tree_res = await client.get("/api/v1/catalog/categories")
    assert tree_res.status_code == 200
    categories = tree_res.json()
    assert any(c["name"] == "Diagnostic Equipment" for c in categories)


@pytest.mark.asyncio
async def test_brand_quick_create_and_approval(client: AsyncClient, catalog_setup):
    """Test quick brand creation and admin approval."""
    data = catalog_setup
    seller_headers = {"Authorization": f"Bearer {data['approved_tokens'].access_token}"}

    # 1. Vendor quick-creates brand
    brand_res = await client.post(
        "/api/v1/catalog/brands/quick-create", json={"name": "Omron Healthcare"}, headers=seller_headers
    )
    assert brand_res.status_code == 201
    brand_data = brand_res.json()
    assert brand_data["name"] == "Omron Healthcare"
    assert brand_data["slug"] == "omron-healthcare"


@pytest.mark.asyncio
async def test_vendor_product_creation_permission(client: AsyncClient, catalog_setup):
    """Test that pending vendors cannot create products, but approved vendors can."""
    data = catalog_setup
    pending_headers = {"Authorization": f"Bearer {data['pending_tokens'].access_token}"}
    approved_headers = {"Authorization": f"Bearer {data['approved_tokens'].access_token}"}

    product_payload = {
        "name": "Professional Otoscope",
        "description": "LED diagnostic otoscope with optical lens",
        "price": 8500.00,
        "stock_quantity": 15,
        "status": "draft",
    }

    # 1. Pending vendor receives 403 Forbidden
    pend_res = await client.post("/api/v1/catalog/products", json=product_payload, headers=pending_headers)
    assert pend_res.status_code == 403

    # 2. Approved vendor succeeds
    appr_res = await client.post("/api/v1/catalog/products", json=product_payload, headers=approved_headers)
    assert appr_res.status_code == 201
    assert appr_res.json()["name"] == "Professional Otoscope"
    assert appr_res.json()["price"] == 8500.00
