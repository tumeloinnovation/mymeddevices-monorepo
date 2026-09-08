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


@pytest.mark.asyncio
async def test_permissions_matrix_operations(client: AsyncClient, admin_ops_setup):
    """Test getting, updating, and resetting permissions matrix."""
    data = admin_ops_setup
    admin_headers = {"Authorization": f"Bearer {data['admin_tokens'].access_token}"}
    customer_headers = {"Authorization": f"Bearer {data['customer_tokens'].access_token}"}

    # 1. Customer forbidden
    cust_res = await client.get("/api/v1/admin/system/permissions", headers=customer_headers)
    assert cust_res.status_code == 403

    # 2. Admin get permissions
    res = await client.get("/api/v1/admin/system/permissions", headers=admin_headers)
    assert res.status_code == 200
    res_data = res.json()["data"]
    assert "categories" in res_data
    assert "roles" in res_data
    assert "matrix" in res_data
    assert "admin" in res_data["matrix"]
    assert "worker" in res_data["matrix"]

    # 3. Update permissions matrix
    updated_matrix = dict(res_data["matrix"])
    updated_matrix["worker"] = ["users:view", "catalog:view", "orders:view", "system:view_settings"]
    put_res = await client.put(
        "/api/v1/admin/system/permissions",
        json={"matrix": updated_matrix, "custom_roles": []},
        headers=admin_headers,
    )
    assert put_res.status_code == 200

    # 4. Verify updated matrix persisted
    get_res2 = await client.get("/api/v1/admin/system/permissions", headers=admin_headers)
    assert get_res2.status_code == 200
    assert "system:view_settings" in get_res2.json()["data"]["matrix"]["worker"]

    # 5. Reset to defaults
    reset_res = await client.post("/api/v1/admin/system/permissions/reset", headers=admin_headers)
    assert reset_res.status_code == 200
    assert reset_res.json()["data"]["is_customized"] is False


@pytest.mark.asyncio
async def test_staff_permissions_and_custom_overrides(client: AsyncClient, admin_ops_setup, db_session):
    """Test staff list dynamic permission count and staff-specific permission overrides."""
    data = admin_ops_setup
    data["admin"]
    admin_headers = {"Authorization": f"Bearer {data['admin_tokens'].access_token}"}

    # 1. Create a worker staff member
    worker = User(
        id=uuid.uuid4(),
        email="ops_worker@test.com",
        password_hash="test_hash",
        first_name="Operations",
        last_name="Worker",
        role="worker",
        is_active=True,
        is_verified=True,
    )
    db_session.add(worker)
    await db_session.commit()

    # 2. Query staff list -> verify worker permissions_count > 0
    staff_list_res = await client.get("/api/v1/admin/users/staff", headers=admin_headers)
    assert staff_list_res.status_code == 200
    staff_items = staff_list_res.json()["staff"]
    worker_item = next((s for s in staff_items if s["id"] == str(worker.id)), None)
    assert worker_item is not None
    assert worker_item["permissions_count"] > 0
    worker_item["permissions_count"]

    # 3. Query staff detail permissions
    perm_res = await client.get(f"/api/v1/admin/users/staff/{worker.id}/permissions", headers=admin_headers)
    assert perm_res.status_code == 200
    perm_data = perm_res.json()["data"]
    assert perm_data["staff_id"] == str(worker.id)
    assert perm_data["role"] == "worker"
    assert perm_data["is_customized"] is False

    # 4. Update staff custom overrides (grant finance:view_ledger, revoke marketing:view)
    override_res = await client.put(
        f"/api/v1/admin/users/staff/{worker.id}/permissions",
        json={
            "granted": ["finance:view_ledger"],
            "revoked": ["marketing:view"],
        },
        headers=admin_headers,
    )
    assert override_res.status_code == 200
    assert override_res.json()["data"]["is_customized"] is True
    assert "finance:view_ledger" in override_res.json()["data"]["effective_permissions"]
    assert "marketing:view" not in override_res.json()["data"]["effective_permissions"]

    # 5. Check staff list reflects updated count
    staff_list_res2 = await client.get("/api/v1/admin/users/staff", headers=admin_headers)
    assert staff_list_res2.status_code == 200
    worker_item2 = next((s for s in staff_list_res2.json()["staff"] if s["id"] == str(worker.id)), None)
    assert worker_item2 is not None

    # 6. Reset staff custom overrides
    del_override = await client.delete(f"/api/v1/admin/users/staff/{worker.id}/permissions/overrides", headers=admin_headers)
    assert del_override.status_code == 200
    assert del_override.json()["data"]["is_customized"] is False

