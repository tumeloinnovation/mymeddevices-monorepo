import uuid
from decimal import Decimal

import pytest
from httpx import AsyncClient

from app.domains.auth.models.user import User
from app.domains.auth.services.auth_service import AuthService
from app.domains.catalog.models.product import Product
from app.domains.shopping.models.order import Order, OrderItem, OrderStatus
from app.domains.shopping.models.sub_order import SubOrder, SubOrderStatus
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.fixture
async def order_fulfillment_setup(db_session):
    auth_service = AuthService(db_session)

    # 1. Customer
    customer = User(
        id=uuid.uuid4(),
        email="buyer@test.com",
        password_hash="test_hash",
        role="customer",
        is_active=True,
    )
    db_session.add(customer)

    # 2. Vendor 1
    vendor1_user = User(
        id=uuid.uuid4(),
        email="vendor1@test.com",
        password_hash="test_hash",
        role="vendor",
        is_active=True,
    )
    db_session.add(vendor1_user)
    await db_session.flush()

    vendor1 = VendorProfile(
        id=uuid.uuid4(),
        user_id=vendor1_user.id,
        store_name="Vendor One Supplies",
        approval_status="approved",
    )
    db_session.add(vendor1)

    # 3. Vendor 2 (Attacker / Unrelated vendor)
    vendor2_user = User(
        id=uuid.uuid4(),
        email="vendor2@test.com",
        password_hash="test_hash",
        role="vendor",
        is_active=True,
    )
    db_session.add(vendor2_user)
    await db_session.flush()

    vendor2 = VendorProfile(
        id=uuid.uuid4(),
        user_id=vendor2_user.id,
        store_name="Vendor Two Tech",
        approval_status="approved",
    )
    db_session.add(vendor2)

    # 4. Products
    p1 = Product(
        id=uuid.uuid4(),
        vendor_id=vendor1.id,
        name="Stethoscope Pro",
        slug="stethoscope-pro",
        price=4500.00,
        stock_quantity=20,
        status="published",
    )
    db_session.add(p1)

    # 5. Order with items and suborders
    order = Order(
        id=uuid.uuid4(),
        order_number=90001,
        user_id=customer.id,
        status=OrderStatus.PROCESSING,
        total_amount=Decimal("4500.00"),
        shipping_address={"full_name": "Buyer Customer", "phone": "+254700000000", "city": "Nairobi"},
    )
    db_session.add(order)
    await db_session.flush()

    sub_order = SubOrder(
        id=uuid.uuid4(),
        parent_order_id=order.id,
        vendor_id=vendor1.id,
        subtotal_amount=Decimal("4500.00"),
        status=SubOrderStatus.PROCESSING,
    )
    db_session.add(sub_order)
    await db_session.flush()

    item1 = OrderItem(
        id=uuid.uuid4(),
        order_id=order.id,
        sub_order_id=sub_order.id,
        product_id=p1.id,
        vendor_id=vendor1.id,
        quantity=1,
        unit_price=Decimal("4500.00"),
        subtotal=Decimal("4500.00"),
        fulfillment_status="processing",
    )
    db_session.add(item1)
    await db_session.commit()

    tokens_v1 = await auth_service.create_tokens(vendor1_user)
    tokens_v2 = await auth_service.create_tokens(vendor2_user)

    return {
        "order": order,
        "sub_order": sub_order,
        "item1": item1,
        "vendor1": vendor1,
        "vendor2": vendor2,
        "tokens_v1": tokens_v1,
        "tokens_v2": tokens_v2,
    }


@pytest.mark.asyncio
async def test_vendor_item_fulfillment_lifecycle(client: AsyncClient, order_fulfillment_setup):
    """Test valid fulfillment lifecycle transition: processing -> packed -> shipped -> delivered."""
    data = order_fulfillment_setup
    headers_v1 = {"Authorization": f"Bearer {data['tokens_v1'].access_token}"}
    order_id = data["order"].id
    item_id = data["item1"].id

    # 1. Update to 'packed'
    res1 = await client.patch(
        f"/api/v1/vendor/orders/{order_id}/items/{item_id}/status", json={"status": "packed"}, headers=headers_v1
    )
    assert res1.status_code == 200, f"Expected 200, got {res1.status_code}: {res1.text}"
    items = res1.json()["data"]["items"]
    assert any(it["id"] == str(item_id) and it["status"] == "packed" for it in items)

    # 2. Update to 'shipped'
    res2 = await client.patch(
        f"/api/v1/vendor/orders/{order_id}/items/{item_id}/status", json={"status": "shipped"}, headers=headers_v1
    )
    assert res2.status_code == 200
    items2 = res2.json()["data"]["items"]
    assert any(it["id"] == str(item_id) and it["status"] == "shipped" for it in items2)

    # 3. Update to 'delivered'
    res3 = await client.patch(
        f"/api/v1/vendor/orders/{order_id}/items/{item_id}/status", json={"status": "delivered"}, headers=headers_v1
    )
    assert res3.status_code == 200
    items3 = res3.json()["data"]["items"]
    assert any(it["id"] == str(item_id) and it["status"] == "delivered" for it in items3)


@pytest.mark.asyncio
async def test_vendor_cross_tenant_isolation(client: AsyncClient, order_fulfillment_setup):
    """Test that Vendor 2 cannot view or mutate Vendor 1's order item."""
    data = order_fulfillment_setup
    headers_v2 = {"Authorization": f"Bearer {data['tokens_v2'].access_token}"}
    order_id = data["order"].id
    item_id = data["item1"].id

    # 1. Vendor 2 queries order - 404 since no items belong to Vendor 2
    get_res = await client.get(f"/api/v1/vendor/orders/{order_id}", headers=headers_v2)
    assert get_res.status_code == 404

    # 2. Vendor 2 attempts to change status of Vendor 1's item - rejected
    patch_res = await client.patch(
        f"/api/v1/vendor/orders/{order_id}/items/{item_id}/status", json={"status": "packed"}, headers=headers_v2
    )
    assert patch_res.status_code in [403, 404]
