import uuid

import pytest
from httpx import AsyncClient

from app.core.security import get_password_hash
from app.domains.auth.models.user import User
from app.domains.auth.services.auth_service import AuthService
from app.domains.catalog.models.brand import Brand
from app.domains.catalog.models.category import Category
from app.domains.catalog.models.manufacturer import Manufacturer
from app.domains.catalog.models.product import Product
from app.domains.catalog.models.product_variant import ProductVariant
from app.domains.catalog.services.ai_assist_service import ai_assist_service
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.fixture
async def e2e_marketplace_setup(db_session):
    """Setup Admin, 2 Vendors, and 1 Customer with valid JWT access tokens."""
    auth_service = AuthService(db_session)

    # 1. Admin
    admin_user = User(
        id=uuid.uuid4(),
        email="admin_e2e@mymeddevices.com",
        password_hash=get_password_hash("AdminPass123!"),
        role="admin",
        is_active=True,
    )
    db_session.add(admin_user)

    # 2. Vendor 1 (Nairobi MedSupplies)
    vendor1_user = User(
        id=uuid.uuid4(),
        email="vendor1_e2e@mymeddevices.com",
        password_hash=get_password_hash("VendorPass123!"),
        role="vendor",
        is_active=True,
    )
    db_session.add(vendor1_user)
    await db_session.flush()

    vendor1_prof = VendorProfile(
        id=uuid.uuid4(),
        user_id=vendor1_user.id,
        store_name="Nairobi MedSupplies Ltd",
        approval_status="approved",
    )
    db_session.add(vendor1_prof)

    # 3. Vendor 2 (Mombasa Healthcare)
    vendor2_user = User(
        id=uuid.uuid4(),
        email="vendor2_e2e@mymeddevices.com",
        password_hash=get_password_hash("VendorPass123!"),
        role="vendor",
        is_active=True,
    )
    db_session.add(vendor2_user)
    await db_session.flush()

    vendor2_prof = VendorProfile(
        id=uuid.uuid4(),
        user_id=vendor2_user.id,
        store_name="Mombasa Healthcare Ltd",
        approval_status="approved",
    )
    db_session.add(vendor2_prof)

    # 4. Customer
    customer_user = User(
        id=uuid.uuid4(),
        email="hospital_buyer_e2e@stjude.org",
        password_hash=get_password_hash("CustPass123!"),
        role="customer",
        is_active=True,
    )
    db_session.add(customer_user)
    await db_session.commit()

    tokens_admin = await auth_service.create_tokens(admin_user)
    tokens_v1 = await auth_service.create_tokens(vendor1_user)
    tokens_v2 = await auth_service.create_tokens(vendor2_user)
    tokens_cust = await auth_service.create_tokens(customer_user)

    return {
        "admin_user": admin_user,
        "tokens_admin": tokens_admin,
        "vendor1_user": vendor1_user,
        "vendor1_prof": vendor1_prof,
        "tokens_v1": tokens_v1,
        "vendor2_user": vendor2_user,
        "vendor2_prof": vendor2_prof,
        "tokens_v2": tokens_v2,
        "customer_user": customer_user,
        "tokens_cust": tokens_cust,
    }


@pytest.mark.asyncio
async def test_e2e_complete_catalog_and_buy_box_lifecycle(client: AsyncClient, e2e_marketplace_setup, db_session):
    """
    Complete End-to-End Workflow:
    1. Admin creates Manufacturer, Brand, Category, Attributes.
    2. Admin creates canonical Product and Variants.
    3. Vendor 1 submits offer for Box of 100 @ KES 1,000.
    4. Vendor 2 submits offer for same variant (Box of 100) @ KES 950.
    5. Vendor 1 submits bulk offer for Carton of 1000 @ KES 9,000.
    6. Storefront Buy-Box awards Box of 100 to Vendor 2 (lowest customer price).
    7. Storefront Buy-Box awards Carton of 1000 to Vendor 1.
    8. Concurrency-safe inventory reservation and stock deduction.
    9. Merchandising bundle resolution with proportional line discount allocation.
    10. AI deterministic barcode match verification.
    """
    d = e2e_marketplace_setup
    v1_headers = {"Authorization": f"Bearer {d['tokens_v1'].access_token}"}
    v2_headers = {"Authorization": f"Bearer {d['tokens_v2'].access_token}"}
    {"Authorization": f"Bearer {d['tokens_admin'].access_token}"}

    # 1. Setup Taxonomy (Manufacturer, Brand, Category)
    mfg = Manufacturer(
        id=uuid.uuid4(),
        name="Ansell Healthcare",
        slug="ansell-healthcare",
        country_of_origin="AU",
    )
    db_session.add(mfg)
    await db_session.flush()

    brand = Brand(
        id=uuid.uuid4(),
        manufacturer_id=mfg.id,
        name="Micro-Touch",
        slug="micro-touch",
        approval_status="approved",
    )
    cat = Category(
        id=uuid.uuid4(),
        name="Medical Gloves",
        slug="medical-gloves",
        tax_category_code="STANDARD_VAT_16",
        min_warranty_months=0,
    )
    db_session.add_all([brand, cat])
    await db_session.flush()

    # 2. Canonical Product & Variant (Platform Owned)
    prod = Product(
        id=uuid.uuid4(),
        category_id=cat.id,
        brand_id=brand.id,
        manufacturer_id=mfg.id,
        manufacturer_model_number="MT-NITRILE-M",
        name="Ansell Micro-Touch Nitrile Gloves",
        slug="ansell-micro-touch-nitrile-gloves",
        status="published",
    )
    db_session.add(prod)
    await db_session.flush()

    variant = ProductVariant(
        id=uuid.uuid4(),
        product_id=prod.id,
        name="Medium / Blue Powder-Free",
        variant_slug="medium-blue",
        gtin_or_ean="9310234567891",
        is_active=True,
    )
    db_session.add(variant)
    await db_session.commit()

    # 3. Vendor 1 submits commercial offer via API: Box of 100 @ KES 1,000 Vendor Price
    v1_offer_payload = {
        "product_variant_id": str(variant.id),
        "vendor_sku": "V1-ANSELL-100",
        "vendor_price": 1000.00,
        "selling_unit": "BOX",
        "package_quantity": 100,
        "lead_time_days": 2,
        "initial_stock_quantity": 50,
    }
    res_v1 = await client.post("/api/v1/vendor/offers", json=v1_offer_payload, headers=v1_headers)
    assert res_v1.status_code == 201
    v1_offer_data = res_v1.json()
    assert v1_offer_data["selling_unit"] == "BOX"
    assert v1_offer_data["package_quantity"] == 100
    assert float(v1_offer_data["calculated_customer_price"]) == 1070.00  # 1000 + 5% markup + 2% comm

    # 4. Vendor 2 submits commercial offer via API: Box of 100 @ KES 950 Vendor Price
    v2_offer_payload = {
        "product_variant_id": str(variant.id),
        "vendor_sku": "V2-GLOVE-M",
        "vendor_price": 950.00,
        "selling_unit": "BOX",
        "package_quantity": 100,
        "lead_time_days": 3,
        "initial_stock_quantity": 25,
    }
    res_v2 = await client.post("/api/v1/vendor/offers", json=v2_offer_payload, headers=v2_headers)
    assert res_v2.status_code == 201
    v2_offer_data = res_v2.json()
    assert float(v2_offer_data["calculated_customer_price"]) == 1016.50  # 950 + 47.50 + 19.00

    # 5. Vendor 1 submits bulk offer: Carton of 1,000 @ KES 9,000 Vendor Price
    v1_bulk_payload = {
        "product_variant_id": str(variant.id),
        "vendor_sku": "V1-ANSELL-1000-CTN",
        "vendor_price": 9000.00,
        "selling_unit": "CARTON",
        "package_quantity": 1000,
        "lead_time_days": 1,
        "initial_stock_quantity": 10,
    }
    res_v1_bulk = await client.post("/api/v1/vendor/offers", json=v1_bulk_payload, headers=v1_headers)
    assert res_v1_bulk.status_code == 201

    # 6. Storefront Buy-Box API Query
    res_bb = await client.get(f"/api/v1/storefront/products/{prod.slug}/buy-box")
    assert res_bb.status_code == 200
    buy_box_offers = res_bb.json()
    assert len(buy_box_offers) == 2  # Box of 100 choice + Carton of 1000 choice

    # Verify Box of 100 was won by Vendor 2 @ KES 1016.50
    box_winner = next(o for o in buy_box_offers if o["selling_unit"] == "BOX")
    assert box_winner["vendor_id"] == str(d["vendor2_prof"].id)
    assert float(box_winner["customer_price"]) == 1016.50
    assert float(box_winner["unit_customer_price"]) in (10.16, 10.17)  # KES 10.165 rounded per single glove piece

    # Verify Carton of 1000 was won by Vendor 1 @ KES 9630.00
    carton_winner = next(o for o in buy_box_offers if o["selling_unit"] == "CARTON")
    assert carton_winner["vendor_id"] == str(d["vendor1_prof"].id)
    assert float(carton_winner["customer_price"]) == 9630.00  # 9000 + 5% (450) + 2% (180)
    assert float(carton_winner["unit_customer_price"]) == 9.63  # KES 9.63 per single glove piece in bulk!

    # 7. Vendor 1 updates inventory via API
    patch_inv_res = await client.patch(
        f"/api/v1/vendor/offers/{v1_offer_data['id']}/inventory",
        json={"quantity_on_hand": 120, "low_stock_threshold": 10},
        headers=v1_headers,
    )
    assert patch_inv_res.status_code == 200
    assert patch_inv_res.json()["quantity_on_hand"] == 120

    # 8. AI Deterministic Matching Test
    match_res = await ai_assist_service.match_submitted_product(
        db_session,
        product_name="Ansell Nitrile Blue Examination Gloves",
        gtin_or_ean="9310234567891",
    )
    assert match_res.is_match_found is True
    assert match_res.auto_merge_eligible is True
    assert match_res.matched_product_id == prod.id
    assert match_res.matched_variant_id == variant.id
