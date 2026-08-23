import uuid
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.domains.auth.models.user import User
from app.domains.auth.services.auth_service import AuthService


@pytest.fixture
async def admin_auth(db_session: AsyncSession):
    auth_service = AuthService(db_session)
    admin = User(
        id=uuid.uuid4(),
        email=f"admin_marketing_{uuid.uuid4().hex[:6]}@test.com",
        password_hash=get_password_hash("AdminPass123!"),
        role="admin",
        is_active=True,
    )
    db_session.add(admin)
    await db_session.commit()
    tokens = await auth_service.create_tokens(admin)
    return {"Authorization": f"Bearer {tokens.access_token}"}


@pytest.mark.asyncio
async def test_general_settings_and_platform_fees_lifecycle(
    client: AsyncClient, admin_auth: dict
):
    # 1. Get default general settings
    res = await client.get("/api/v1/system/general-settings", headers=admin_auth)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "site_name" in data

    # 2. Update general settings
    new_general = {
        "site_name": "MyMedDevices Enterprise",
        "support_email": "ops@mymeddevices.co.ke",
        "currency": "KES",
        "maintenance_mode": False,
    }
    update_res = await client.put("/api/v1/system/general-settings", json=new_general, headers=admin_auth)
    assert update_res.status_code == 200
    assert update_res.json()["data"]["site_name"] == "MyMedDevices Enterprise"

    # 3. Get default platform fees
    fees_res = await client.get("/api/v1/system/platform-fees", headers=admin_auth)
    assert fees_res.status_code == 200
    fees = fees_res.json()["data"]
    assert "base_commission_percent" in fees

    # 4. Update platform fees
    new_fees = {
        "base_commission_percent": 12.5,
        "flat_transaction_fee": 60.0,
        "tax_vat_percent": 16.0,
        "minimum_payout_amount": 1500.0,
    }
    update_fees_res = await client.put("/api/v1/system/platform-fees", json=new_fees, headers=admin_auth)
    assert update_fees_res.status_code == 200
    assert update_fees_res.json()["data"]["base_commission_percent"] == 12.5


@pytest.mark.asyncio
async def test_admin_analytics_overview(
    client: AsyncClient, admin_auth: dict
):
    res = await client.get("/api/v1/admin/analytics", headers=admin_auth)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "overview" in data
    assert "total_revenue" in data["overview"]
    assert "total_orders" in data["overview"]
    assert "order_overview" in data
    assert "recent_orders" in data
    assert isinstance(data["recent_orders"], list)


@pytest.mark.asyncio
async def test_admin_promotions_crud(
    client: AsyncClient, admin_auth: dict
):
    # 1. Create Promotion
    promo_payload = {
        "title": "Ramadan Health Discount",
        "code": f"RAMADAN_{uuid.uuid4().hex[:4]}",
        "description": "20% off all diagnostics",
        "promotion_type": "percentage",
        "discount_value": "20.00",
        "min_order_amount": "5000.00",
        "is_active": True,
        "banner_text": "Special Ramadan discount on diagnostic equipment",
    }
    create_res = await client.post("/api/v1/admin/promotions", json=promo_payload, headers=admin_auth)
    assert create_res.status_code == 201
    promo_data = create_res.json()["data"]
    promo_id = promo_data["id"]
    assert promo_data["title"] == "Ramadan Health Discount"

    # 2. List Promotions
    list_res = await client.get("/api/v1/admin/promotions", headers=admin_auth)
    assert list_res.status_code == 200
    assert any(p["id"] == promo_id for p in list_res.json()["data"])

    # 3. Update Promotion
    patch_res = await client.patch(
        f"/api/v1/admin/promotions/{promo_id}",
        json={"discount_value": "25.00"},
        headers=admin_auth,
    )
    assert patch_res.status_code == 200
    assert float(patch_res.json()["data"]["discount_value"]) == 25.0

    # 4. Toggle Status
    toggle_res = await client.post(f"/api/v1/admin/promotions/{promo_id}/toggle-status", headers=admin_auth)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["data"]["is_active"] is False

    # 5. Delete Promotion
    del_res = await client.delete(f"/api/v1/admin/promotions/{promo_id}", headers=admin_auth)
    assert del_res.status_code == 200


@pytest.mark.asyncio
async def test_marketing_campaigns_sms_and_email(
    client: AsyncClient, admin_auth: dict
):
    # 1. Create SMS Campaign
    sms_payload = {
        "title": "Flash Sale Weekend",
        "message": "Exclusive 15% off hospital supplies this weekend! Visit mymeddevices.co.ke",
        "target_audience": "customers",
    }
    sms_res = await client.post("/api/v1/admin/marketing/sms-campaigns", json=sms_payload, headers=admin_auth)
    assert sms_res.status_code == 201
    sms_id = sms_res.json()["data"]["id"]

    # 2. Send SMS Campaign
    send_sms = await client.post(f"/api/v1/admin/marketing/sms-campaigns/{sms_id}/send", headers=admin_auth)
    assert send_sms.status_code == 200
    assert send_sms.json()["data"]["status"] == "sent"

    # 3. Create Email Campaign
    email_payload = {
        "title": "Monthly Diagnostic Spotlight",
        "subject": "New Ultrasound & ECG Machines Now In Stock",
        "preview_text": "Equip your facility with certified devices",
        "html_content": "<h1>Monthly Spotlight</h1><p>Check out the latest inventory.</p>",
        "target_audience": "all",
    }
    email_res = await client.post("/api/v1/admin/marketing/email-campaigns", json=email_payload, headers=admin_auth)
    assert email_res.status_code == 201
    email_id = email_res.json()["data"]["id"]

    # 4. Send Email Campaign
    send_email = await client.post(f"/api/v1/admin/marketing/email-campaigns/{email_id}/send", headers=admin_auth)
    assert send_email.status_code == 200
    assert send_email.json()["data"]["status"] == "sent"
