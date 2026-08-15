import uuid
from decimal import Decimal

import pytest
from httpx import AsyncClient

from app.domains.auth.models.user import User
from app.domains.auth.services.auth_service import AuthService
from app.domains.shopping.models.vendor_ledger import VendorLedger
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.fixture
async def vendor_payout_setup(db_session):
    auth_service = AuthService(db_session)

    # 1. Approved vendor
    user_appr = User(
        id=uuid.uuid4(),
        email="vendor_approved@test.com",
        password_hash="test_hash",
        first_name="Approved",
        last_name="Vendor",
        role="vendor",
        is_active=True,
    )
    db_session.add(user_appr)
    await db_session.flush()

    vendor_appr = VendorProfile(
        id=uuid.uuid4(),
        user_id=user_appr.id,
        store_name="Approved Medical Supplies",
        approval_status="approved",
        mpesa_phone="254712345678",
    )
    db_session.add(vendor_appr)
    await db_session.flush()

    ledger = VendorLedger(
        vendor_id=vendor_appr.id,
        balance=Decimal("15000.00"),
    )
    db_session.add(ledger)

    # 2. Pending vendor
    user_pend = User(
        id=uuid.uuid4(),
        email="vendor_pending@test.com",
        password_hash="test_hash",
        first_name="Pending",
        last_name="Vendor",
        role="vendor",
        is_active=True,
    )
    db_session.add(user_pend)
    await db_session.flush()

    vendor_pend = VendorProfile(
        id=uuid.uuid4(),
        user_id=user_pend.id,
        store_name="Pending Medical",
        approval_status="pending",
    )
    db_session.add(vendor_pend)
    await db_session.commit()

    tokens_appr = await auth_service.create_tokens(user_appr)
    tokens_pend = await auth_service.create_tokens(user_pend)

    return {
        "vendor_appr": vendor_appr,
        "vendor_pend": vendor_pend,
        "ledger": ledger,
        "tokens_appr": tokens_appr,
        "tokens_pend": tokens_pend,
    }


@pytest.mark.asyncio
async def test_vendor_payout_successful(client: AsyncClient, vendor_payout_setup, db_session):
    """Approved vendor with sufficient balance can request payout."""
    data = vendor_payout_setup
    headers = {"Authorization": f"Bearer {data['tokens_appr'].access_token}"}

    res = await client.post(
        "/api/v1/vendor/earnings/payouts/request", json={"amount": 5000, "type": "mpesa"}, headers=headers
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    assert res.json()["data"]["amount"] == 5000.0

    await db_session.refresh(data["ledger"])
    assert data["ledger"].balance == Decimal("10000.00")


@pytest.mark.asyncio
async def test_vendor_payout_insufficient_balance(client: AsyncClient, vendor_payout_setup):
    """Vendor attempting to withdraw more than available balance gets 400."""
    data = vendor_payout_setup
    headers = {"Authorization": f"Bearer {data['tokens_appr'].access_token}"}

    res = await client.post(
        "/api/v1/vendor/earnings/payouts/request", json={"amount": 50000, "type": "mpesa"}, headers=headers
    )
    assert res.status_code == 400
    assert "Insufficient balance" in res.json()["detail"]


@pytest.mark.asyncio
async def test_vendor_payout_below_minimum_threshold(client: AsyncClient, vendor_payout_setup):
    """Payout below KES 5,000 threshold gets rejected."""
    data = vendor_payout_setup
    headers = {"Authorization": f"Bearer {data['tokens_appr'].access_token}"}

    res = await client.post(
        "/api/v1/vendor/earnings/payouts/request", json={"amount": 2000, "type": "mpesa"}, headers=headers
    )
    assert res.status_code == 400
    assert "Minimum payout" in res.json()["detail"]


@pytest.mark.asyncio
async def test_pending_vendor_payout_forbidden(client: AsyncClient, vendor_payout_setup):
    """Pending/unapproved vendor cannot request payout (403 Forbidden)."""
    data = vendor_payout_setup
    headers = {"Authorization": f"Bearer {data['tokens_pend'].access_token}"}

    res = await client.post(
        "/api/v1/vendor/earnings/payouts/request", json={"amount": 5000, "type": "mpesa"}, headers=headers
    )
    assert res.status_code == 403
    assert "not approved" in res.json()["detail"]
