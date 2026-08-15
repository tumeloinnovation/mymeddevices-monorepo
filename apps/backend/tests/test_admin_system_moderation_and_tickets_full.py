import uuid
from decimal import Decimal

import pytest
from httpx import AsyncClient

from app.core.security import get_password_hash
from app.domains.auth.models.user import User
from app.domains.auth.services.auth_service import AuthService
from app.domains.catalog.models.product import Product
from app.domains.shopping.models.order import Order, OrderItem, OrderStatus
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.fixture
async def admin_ticket_setup(db_session):
    """Fixture with Admin, Customer, Vendor, Product, and Order for returns/tickets."""
    auth_service = AuthService(db_session)

    # Admin
    admin = User(
        id=uuid.uuid4(),
        email="admin_system_ops@test.com",
        password_hash=get_password_hash("AdminPass123!"),
        role="admin",
        is_active=True,
    )
    db_session.add(admin)

    # Vendor
    vendor_user = User(
        id=uuid.uuid4(),
        email="vendor_ops_test@test.com",
        password_hash=get_password_hash("VendorPass123!"),
        role="vendor",
        is_active=True,
    )
    db_session.add(vendor_user)
    await db_session.flush()

    vendor_profile = VendorProfile(
        id=uuid.uuid4(),
        user_id=vendor_user.id,
        store_name="Precision BioMed KE",
        address_country="KE",
        approval_status="approved",
    )
    db_session.add(vendor_profile)
    await db_session.flush()

    product = Product(
        id=uuid.uuid4(),
        vendor_id=vendor_profile.id,
        name="Diagnostic Otoscope Pro",
        slug="diagnostic-otoscope-pro",
        price=18500.00,
        stock_quantity=40,
        status="published",
        is_verified=True,
    )
    db_session.add(product)

    # Customer
    customer = User(
        id=uuid.uuid4(),
        email="customer_ticket_test@test.com",
        password_hash=get_password_hash("CustomerPass123!"),
        role="customer",
        is_active=True,
    )
    db_session.add(customer)
    await db_session.flush()

    # Order
    order = Order(
        id=uuid.uuid4(),
        user_id=customer.id,
        order_number=88201,
        status=OrderStatus.DELIVERED,
        total_amount=Decimal("18500.00"),
    )
    db_session.add(order)
    await db_session.flush()

    order_item = OrderItem(
        id=uuid.uuid4(),
        order_id=order.id,
        product_id=product.id,
        vendor_id=vendor_profile.id,
        quantity=1.0,
        unit_price=Decimal("18500.00"),
        subtotal=Decimal("18500.00"),
        fulfillment_status="delivered",
    )
    db_session.add(order_item)
    await db_session.commit()

    tokens_admin = await auth_service.create_tokens(admin)
    tokens_customer = await auth_service.create_tokens(customer)

    return {
        "admin": admin,
        "tokens_admin": tokens_admin,
        "customer": customer,
        "tokens_customer": tokens_customer,
        "product": product,
        "order": order,
        "order_item": order_item,
    }


@pytest.mark.asyncio
async def test_admin_system_settings_and_rate_limits(client: AsyncClient, admin_ticket_setup):
    """ADM-001: System status, rate-limits update/get, shipping settings update/get."""
    d = admin_ticket_setup
    headers = {"Authorization": f"Bearer {d['tokens_admin'].access_token}"}

    # 1. System Status
    status_res = await client.get("/api/v1/admin/system/status", headers=headers)
    assert status_res.status_code == 200
    assert "sms" in status_res.json()["data"]

    # 2. Get rate limits
    rate_res = await client.get("/api/v1/admin/system/rate-limits", headers=headers)
    assert rate_res.status_code == 200

    # 3. Update rate limits -> 200
    update_rate_payload = {
        "login": [10, 300],
        "register": [5, 3600],
    }
    put_rate = await client.put("/api/v1/admin/system/rate-limits", json=update_rate_payload, headers=headers)
    assert put_rate.status_code == 200

    # 4. Get shipping settings
    ship_res = await client.get("/api/v1/admin/system/shipping-settings", headers=headers)
    assert ship_res.status_code == 200

    # 5. Update shipping settings
    update_ship_payload = {
        "flat_fee": 250.0,
        "rate_per_km": 25.0,
        "max_radius_km": 60.0,
        "courier_fee": 500.0,
    }
    put_ship = await client.put("/api/v1/admin/system/shipping-settings", json=update_ship_payload, headers=headers)
    assert put_ship.status_code == 200
    assert put_ship.json()["data"]["flat_fee"] == 250.0


@pytest.mark.asyncio
async def test_support_tickets_lifecycle(client: AsyncClient, admin_ticket_setup):
    """TCK-001: Support ticket creation, customer replies, admin management, and closing."""
    d = admin_ticket_setup
    cust_headers = {"Authorization": f"Bearer {d['tokens_customer'].access_token}"}
    admin_headers = {"Authorization": f"Bearer {d['tokens_admin'].access_token}"}

    # 1. Customer creates ticket -> 200
    ticket_payload = {
        "subject": "Inquiry regarding Otoscope warranty",
        "category": "warranty",
        "priority": "medium",
        "description": "Does the warranty cover accidental lens damage?",
    }
    create_t = await client.post("/api/v1/tickets", json=ticket_payload, headers=cust_headers)
    assert create_t.status_code == 200
    t_id = create_t.json()["data"]["id"]

    # 2. Customer list tickets
    list_t = await client.get("/api/v1/tickets", headers=cust_headers)
    assert list_t.status_code == 200
    assert any(t["id"] == t_id for t in list_t.json()["data"]["items"])

    # 3. Customer views ticket details
    get_t = await client.get(f"/api/v1/tickets/{t_id}", headers=cust_headers)
    assert get_t.status_code == 200
    assert get_t.json()["data"]["subject"] == "Inquiry regarding Otoscope warranty"

    # 4. Admin replies to ticket
    admin_reply_payload = {
        "content": "Hello, warranty covers manufacturer defects for 24 months.",
        "is_internal": "no",
    }
    reply_res = await client.post(f"/api/v1/tickets/{t_id}/replies", json=admin_reply_payload, headers=admin_headers)
    assert reply_res.status_code == 200

    # 5. Customer closes ticket
    close_res = await client.post(f"/api/v1/tickets/{t_id}/close", headers=cust_headers)
    assert close_res.status_code == 200
    assert close_res.json()["data"]["status"] == "closed"


@pytest.mark.asyncio
async def test_returns_and_refunds_lifecycle(client: AsyncClient, admin_ticket_setup):
    """RET-001: Return request creation, tracking, cancellation, and admin review."""
    d = admin_ticket_setup
    cust_headers = {"Authorization": f"Bearer {d['tokens_customer'].access_token}"}
    admin_headers = {"Authorization": f"Bearer {d['tokens_admin'].access_token}"}
    o_id = str(d["order"].id)
    item_id = str(d["order_item"].id)
    p_id = str(d["product"].id)

    # 1. Customer creates return request -> 200
    return_payload = {
        "order_id": o_id,
        "items": [
            {
                "order_item_id": item_id,
                "product_id": p_id,
                "product_name": d["product"].name,
                "quantity": 1,
                "reason": "defective",
                "condition": "unopened",
            }
        ],
        "reason": "Device power button unresponsive on arrival",
        "refund_method": "original",
    }
    create_ret = await client.post("/api/v1/returns", json=return_payload, headers=cust_headers)
    assert create_ret.status_code == 200
    ret_id = create_ret.json()["data"]["id"]

    # 2. Customer list returns
    list_ret = await client.get("/api/v1/returns", headers=cust_headers)
    assert list_ret.status_code == 200
    assert any(r["id"] == ret_id for r in list_ret.json()["data"]["items"])

    # 3. Get return details
    get_ret = await client.get(f"/api/v1/returns/{ret_id}", headers=cust_headers)
    assert get_ret.status_code == 200
    assert get_ret.json()["data"]["id"] == ret_id

    # 4. Customer cancels return request
    cancel_ret = await client.post(f"/api/v1/returns/{ret_id}/cancel", headers=cust_headers)
    assert cancel_ret.status_code == 200
    assert cancel_ret.json()["data"]["status"] == "rejected"
