import uuid
from decimal import Decimal

import pytest
from httpx import AsyncClient

from app.core.security import get_password_hash
from app.domains.auth.models.user import User
from app.domains.auth.services.auth_service import AuthService
from app.domains.catalog.models.product import Product
from app.domains.customers.models.customer_profile import CustomerProfile
from app.domains.customers.models.review import Review
from app.domains.payments.models.vendor_ledger import LedgerTransaction, LedgerTransactionType, VendorLedger
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.fixture
async def vendor_suite_setup(db_session):
    """Fixture providing Vendor, Customer, Product, Review, and Ledger."""
    auth_service = AuthService(db_session)

    # Admin User
    admin = User(
        id=uuid.uuid4(),
        email="admin_vendor_test@test.com",
        password_hash=get_password_hash("AdminPass123!"),
        role="admin",
        is_active=True,
    )
    db_session.add(admin)

    # Vendor User
    vendor_user = User(
        id=uuid.uuid4(),
        email="vendor_analytics_test@test.com",
        password_hash=get_password_hash("VendorPass123!"),
        role="vendor",
        first_name="David",
        last_name="Otieno",
        phone="+254700112233",
        is_active=True,
    )
    db_session.add(vendor_user)
    await db_session.flush()

    vendor_profile = VendorProfile(
        id=uuid.uuid4(),
        user_id=vendor_user.id,
        store_name="Eldoret Surgical Center",
        store_description="Top tier surgical and diagnostic equipment in Rift Valley",
        business_email="contact@eldoretsurgical.com",
        business_phone="+254700112233",
        address_street="Uganda Road",
        address_city="Eldoret",
        address_country="KE",
        approval_status="approved",
    )
    db_session.add(vendor_profile)
    await db_session.flush()

    # Product
    product = Product(
        id=uuid.uuid4(),
        vendor_id=vendor_profile.id,
        name="Anesthesia Machine Model X",
        slug="anesthesia-machine-model-x",
        price=450000.00,
        stock_quantity=5,
        status="published",
        is_verified=True,
    )
    db_session.add(product)

    # Customer User & Profile
    customer = User(
        id=uuid.uuid4(),
        email="customer_vendor_review@test.com",
        password_hash=get_password_hash("CustomerPass123!"),
        role="customer",
        is_active=True,
    )
    db_session.add(customer)
    await db_session.flush()

    customer_profile = CustomerProfile(
        id=uuid.uuid4(),
        user_id=customer.id,
        loyalty_points=100,
    )
    db_session.add(customer_profile)
    await db_session.flush()

    # Review
    review = Review(
        id=uuid.uuid4(),
        customer_id=customer_profile.id,
        product_id=product.id,
        rating=5,
        comment="Reliable anesthesia delivery with precision monitoring.",
        moderation_status="approved",
    )
    db_session.add(review)

    # Vendor Ledger & Transaction
    ledger = VendorLedger(
        vendor_id=vendor_profile.id,
        balance=Decimal("405000.00"),
    )
    db_session.add(ledger)
    await db_session.flush()

    tx = LedgerTransaction(
        id=uuid.uuid4(),
        vendor_id=vendor_profile.id,
        transaction_type=LedgerTransactionType.CREDIT,
        gross_amount=Decimal("450000.00"),
        platform_fee_amount=Decimal("45000.00"),
        net_amount=Decimal("405000.00"),
        notes="Sale: Anesthesia Machine Model X",
    )
    db_session.add(tx)
    await db_session.commit()

    tokens_admin = await auth_service.create_tokens(admin)
    tokens_vendor = await auth_service.create_tokens(vendor_user)

    return {
        "admin": admin,
        "tokens_admin": tokens_admin,
        "vendor_user": vendor_user,
        "vendor_profile": vendor_profile,
        "tokens_vendor": tokens_vendor,
        "product": product,
        "review": review,
    }


@pytest.mark.asyncio
async def test_vendor_profile_self_service(client: AsyncClient, vendor_suite_setup):
    """VEN-001: Vendor status, profile retrieval, and profile update."""
    d = vendor_suite_setup
    headers = {"Authorization": f"Bearer {d['tokens_vendor'].access_token}"}

    # 1. Get vendor status
    status_res = await client.get("/api/v1/vendors/me/status", headers=headers)
    assert status_res.status_code == 200
    assert status_res.json()["data"]["approval_status"] == "approved"
    assert status_res.json()["data"]["store_name"] == "Eldoret Surgical Center"

    # 2. Get vendor profile
    prof_res = await client.get("/api/v1/vendors/me/profile", headers=headers)
    assert prof_res.status_code == 200
    assert prof_res.json()["data"]["business_email"] == "contact@eldoretsurgical.com"

    # 3. Update vendor profile via PATCH
    update_payload = {
        "store_info": {
            "store_name": "Eldoret Surgical Center",
            "store_description": "Updated: Premier surgical equipment provider in Western Kenya",
        },
        "payment_details": {
            "mpesa_phone": "+254700112233",
            "bank_name": "Equity Bank Kenya",
        },
    }
    patch_res = await client.patch("/api/v1/vendors/me/profile", json=update_payload, headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["approval_status"] == "approved"


@pytest.mark.asyncio
async def test_vendor_analytics_and_dashboard(client: AsyncClient, vendor_suite_setup):
    """VEN-002: Vendor analytics dashboard, sales, performance, and earnings."""
    d = vendor_suite_setup
    headers = {"Authorization": f"Bearer {d['tokens_vendor'].access_token}"}

    # 1. Analytics Dashboard
    dash_res = await client.get("/api/v1/vendor/analytics/dashboard", headers=headers)
    assert dash_res.status_code == 200
    assert "total_sales" in dash_res.json()["data"]

    # 2. Analytics Sales
    sales_res = await client.get("/api/v1/vendor/analytics/sales", headers=headers)
    assert sales_res.status_code == 200
    assert "items" in sales_res.json()["data"]

    # 3. Analytics Performance
    perf_res = await client.get("/api/v1/vendor/analytics/performance", headers=headers)
    assert perf_res.status_code == 200
    assert "fulfillment_rate" in perf_res.json()["data"]

    # 4. Analytics Earnings
    earn_res = await client.get("/api/v1/vendor/analytics/earnings", headers=headers)
    assert earn_res.status_code == 200


@pytest.mark.asyncio
async def test_vendor_earnings_summary_and_ledger(client: AsyncClient, vendor_suite_setup):
    """VEN-003: Vendor earnings summary and transactions ledger."""
    d = vendor_suite_setup
    headers = {"Authorization": f"Bearer {d['tokens_vendor'].access_token}"}

    # 1. Earnings Summary
    summary_res = await client.get("/api/v1/vendor/earnings/summary", headers=headers)
    assert summary_res.status_code == 200
    assert "available_for_payout" in summary_res.json()["data"]
    assert float(summary_res.json()["data"]["available_for_payout"]) == 405000.00

    # 2. Transactions
    tx_res = await client.get("/api/v1/vendor/earnings/transactions", headers=headers)
    assert tx_res.status_code == 200
    assert len(tx_res.json()["data"]["items"]) >= 1


@pytest.mark.asyncio
async def test_vendor_reviews_and_moderation(client: AsyncClient, vendor_suite_setup):
    """VEN-004: Vendor reviews retrieval, summary, and moderation status."""
    d = vendor_suite_setup
    headers = {"Authorization": f"Bearer {d['tokens_vendor'].access_token}"}
    r_id = str(d["review"].id)

    # 1. Get vendor reviews
    rev_res = await client.get("/api/v1/vendors/me/reviews", headers=headers)
    assert rev_res.status_code == 200
    assert any(r["id"] == r_id for r in rev_res.json()["data"]["reviews"])

    # 2. Get reviews summary
    summary_res = await client.get("/api/v1/vendors/me/reviews/summary", headers=headers)
    assert summary_res.status_code == 200
    assert "average_rating" in summary_res.json()["data"]

    # 3. Moderate review (vendor can hide review)
    mod_res = await client.put(
        f"/api/v1/vendors/me/reviews/{r_id}/moderate",
        json={"moderation_status": "hidden", "reason": "Requires investigation"},
        headers=headers,
    )
    assert mod_res.status_code == 200
    assert mod_res.json()["data"]["moderation_status"] == "hidden"
