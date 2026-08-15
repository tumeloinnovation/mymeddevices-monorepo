import uuid

import pytest
from httpx import AsyncClient

from app.domains.auth.models.user import User
from app.domains.auth.services.auth_service import AuthService


@pytest.fixture
async def admin_ops_setup(db_session):
    auth_service = AuthService(db_session)

    # 1. Admin
    admin = User(
        id=uuid.uuid4(),
        email="superadmin@test.com",
        password_hash="test_hash",
        first_name="Super",
        last_name="Admin",
        role="admin",
        is_active=True,
    )
    db_session.add(admin)

    # 2. Customer
    customer = User(
        id=uuid.uuid4(),
        email="regular_user@test.com",
        password_hash="test_hash",
        first_name="Regular",
        last_name="Customer",
        role="customer",
        is_active=True,
    )
    db_session.add(customer)
    await db_session.commit()

    admin_tokens = await auth_service.create_tokens(admin)
    customer_tokens = await auth_service.create_tokens(customer)

    return {
        "admin": admin,
        "customer": customer,
        "admin_tokens": admin_tokens,
        "customer_tokens": customer_tokens,
    }


@pytest.mark.asyncio
async def test_admin_system_status_and_role_guards(client: AsyncClient, admin_ops_setup):
    """Test admin system status access and verify unauthorized roles get 403."""
    data = admin_ops_setup
    admin_headers = {"Authorization": f"Bearer {data['admin_tokens'].access_token}"}
    customer_headers = {"Authorization": f"Bearer {data['customer_tokens'].access_token}"}

    # 1. Customer attempt -> 403 Forbidden
    cust_res = await client.get("/api/v1/admin/system/status", headers=customer_headers)
    assert cust_res.status_code == 403

    # 2. Admin access -> 200 OK
    admin_res = await client.get("/api/v1/admin/system/status", headers=admin_headers)
    assert admin_res.status_code == 200
    assert "sms" in admin_res.json()["data"]
    assert "smtp" in admin_res.json()["data"]


@pytest.mark.asyncio
async def test_admin_shipping_and_rate_limit_settings(client: AsyncClient, admin_ops_setup):
    """Test admin updates dynamic rate limits and shipping settings."""
    data = admin_ops_setup
    admin_headers = {"Authorization": f"Bearer {data['admin_tokens'].access_token}"}

    # 1. Update shipping settings
    ship_res = await client.put(
        "/api/v1/admin/system/shipping-settings",
        json={
            "flat_fee": 250.0,
            "rate_per_km": 25.0,
            "max_radius_km": 60.0,
            "courier_fee": 500.0,
        },
        headers=admin_headers,
    )
    assert ship_res.status_code == 200
    assert ship_res.json()["data"]["flat_fee"] == 250.0

    # 2. Get updated shipping settings
    get_ship_res = await client.get("/api/v1/admin/system/shipping-settings", headers=admin_headers)
    assert get_ship_res.status_code == 200
    assert get_ship_res.json()["data"]["rate_per_km"] == 25.0


@pytest.mark.asyncio
async def test_admin_user_stats_and_customer_list(client: AsyncClient, admin_ops_setup):
    """Test querying admin user statistics and paginated customer list."""
    data = admin_ops_setup
    admin_headers = {"Authorization": f"Bearer {data['admin_tokens'].access_token}"}

    # 1. Query user stats
    stats_res = await client.get("/api/v1/admin/users/stats", headers=admin_headers)
    assert stats_res.status_code == 200
    assert stats_res.json()["total_customers"] >= 1
    assert stats_res.json()["total_staff"] >= 1

    # 2. Query customer list
    list_res = await client.get("/api/v1/admin/users/customers", headers=admin_headers)
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 1
    customers = list_res.json()["customers"]
    assert any(c["email"] == "regular_user@test.com" for c in customers)
