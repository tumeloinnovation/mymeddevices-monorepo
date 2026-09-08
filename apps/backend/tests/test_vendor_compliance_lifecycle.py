import uuid

import pytest
from httpx import AsyncClient

from app.domains.auth.models.user import User
from app.domains.auth.services.auth_service import AuthService
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.fixture
async def vendor_compliance_setup(db_session):
    auth_service = AuthService(db_session)

    # 1. Admin
    admin = User(
        id=uuid.uuid4(),
        email="admin_compliance@test.com",
        password_hash="test_hash",
        first_name="Admin",
        last_name="Compliance",
        role="admin",
        is_active=True,
    )
    db_session.add(admin)

    # 2. Vendor applicant user
    vendor_user = User(
        id=uuid.uuid4(),
        email="applicant_med@test.com",
        password_hash="test_hash",
        first_name="Med",
        last_name="Vendor",
        role="vendor",
        is_active=True,
    )
    db_session.add(vendor_user)
    await db_session.flush()

    # 3. Initial pending profile with regulatory documents
    profile = VendorProfile(
        id=uuid.uuid4(),
        user_id=vendor_user.id,
        store_name="Nairobi BioMed Ltd",
        company_name="Nairobi BioMed Limited",
        vat_number="P051234567Z",
        approval_status="pending",
        document_urls=[
            "https://cdn.mymeddevices.com/compliance/ppb_cert_102.pdf",
            "https://cdn.mymeddevices.com/compliance/kra_pin_cert.pdf",
            "https://cdn.mymeddevices.com/compliance/business_permit_2026.pdf",
        ],
    )
    db_session.add(profile)
    await db_session.commit()

    admin_tokens = await auth_service.create_tokens(admin)
    vendor_tokens = await auth_service.create_tokens(vendor_user)

    return {
        "admin": admin,
        "vendor_user": vendor_user,
        "profile": profile,
        "admin_tokens": admin_tokens,
        "vendor_tokens": vendor_tokens,
    }


@pytest.mark.asyncio
async def test_vendor_status_and_pending_update_lock(client: AsyncClient, vendor_compliance_setup):
    """Test vendor status query and verify pending profile update is locked."""
    data = vendor_compliance_setup
    vendor_headers = {"Authorization": f"Bearer {data['vendor_tokens'].access_token}"}

    # 1. Check status
    res = await client.get("/api/v1/vendors/me/status", headers=vendor_headers)
    assert res.status_code == 200
    assert res.json()["data"]["approval_status"] == "pending"
    assert res.json()["data"]["store_name"] == "Nairobi BioMed Ltd"

    # 2. Attempting to update profile while pending should be rejected (403)
    update_res = await client.patch(
        "/api/v1/vendors/me/profile", json={"store_info": {"store_name": "Renamed Store"}}, headers=vendor_headers
    )
    assert update_res.status_code == 403
    assert "pending approval" in update_res.json()["detail"]


@pytest.mark.asyncio
async def test_admin_vendor_approval_and_profile_updates(client: AsyncClient, vendor_compliance_setup, db_session):
    """Test admin approves vendor, enabling profile and catalog management."""
    data = vendor_compliance_setup
    admin_headers = {"Authorization": f"Bearer {data['admin_tokens'].access_token}"}
    vendor_headers = {"Authorization": f"Bearer {data['vendor_tokens'].access_token}"}

    # 1. Admin approves vendor
    approve_res = await client.post(f"/api/v1/vendors/admin/{data['profile'].id}/approve", headers=admin_headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["data"]["approval_status"] == "approved"

    # 2. Approved vendor can now update store profile
    update_res = await client.patch(
        "/api/v1/vendors/me/profile",
        json={
            "store_info": {
                "store_name": "Nairobi BioMed Pro",
                "store_description": "Certified medical device importer",
            },
            "document_urls": [
                "https://cdn.mymeddevices.com/compliance/ppb_cert_102.pdf",
                "https://cdn.mymeddevices.com/compliance/iso_13485.pdf",
            ],
        },
        headers=vendor_headers,
    )
    assert update_res.status_code == 200


@pytest.mark.asyncio
async def test_admin_vendor_rejection_and_suspension_lifecycle(client: AsyncClient, vendor_compliance_setup):
    """Test full administrative moderation lifecycle: reject -> resubmit -> approve -> suspend -> reactivate."""
    data = vendor_compliance_setup
    admin_headers = {"Authorization": f"Bearer {data['admin_tokens'].access_token}"}

    # 1. Admin rejects vendor with reason
    reject_res = await client.post(
        f"/api/v1/vendors/admin/{data['profile'].id}/reject",
        json={"action": "reject", "reason": "PPB certificate expired, please upload current valid license."},
        headers=admin_headers,
    )
    assert reject_res.status_code == 200
    assert reject_res.json()["data"]["approval_status"] == "rejected"
    assert "PPB certificate expired" in reject_res.json()["data"]["rejection_reason"]

    # 2. Admin approves after revision
    approve_res = await client.post(f"/api/v1/vendors/admin/{data['profile'].id}/approve", headers=admin_headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["data"]["approval_status"] == "approved"

    # 3. Admin suspends vendor
    suspend_res = await client.post(
        f"/api/v1/vendors/admin/{data['profile'].id}/suspend",
        json={"action": "suspend", "reason": "Audit discrepancy reported."},
        headers=admin_headers,
    )
    assert suspend_res.status_code == 200
    assert suspend_res.json()["data"]["approval_status"] == "suspended"

    # 4. Admin reactivates vendor
    reactivate_res = await client.post(f"/api/v1/vendors/admin/{data['profile'].id}/reactivate", headers=admin_headers)
    assert reactivate_res.status_code == 200
    assert reactivate_res.json()["data"]["approval_status"] == "approved"
