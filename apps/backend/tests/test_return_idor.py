import uuid
from decimal import Decimal

import pytest
from httpx import AsyncClient

from app.domains.auth.models.user import User
from app.domains.auth.services.auth_service import AuthService
from app.domains.catalog.models.product import Product
from app.domains.shopping.models.order import Order, OrderItem, OrderStatus
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.fixture
async def return_test_setup(db_session):
    auth_service = AuthService(db_session)

    # 1. Customer A
    user_a = User(
        id=uuid.uuid4(),
        email="customer_a@test.com",
        password_hash="test_hash",
        first_name="Customer",
        last_name="A",
        role="customer",
        is_active=True,
    )
    db_session.add(user_a)

    # 2. Customer B (attacker)
    user_b = User(
        id=uuid.uuid4(),
        email="customer_b@test.com",
        password_hash="test_hash",
        first_name="Customer",
        last_name="B",
        role="customer",
        is_active=True,
    )
    db_session.add(user_b)

    # 3. Vendor & Product
    vendor = VendorProfile(
        id=uuid.uuid4(),
        user_id=user_a.id,
        store_name="Vendor A",
        approval_status="approved",
    )
    db_session.add(vendor)
    await db_session.flush()

    product_1 = Product(
        id=uuid.uuid4(),
        name="Wheelchair",
        slug=f"wheelchair-{uuid.uuid4().hex[:6]}",
        sku=f"SKU-WC-{uuid.uuid4().hex[:6]}",
        vendor_id=vendor.id,
        base_price=Decimal("15000.00"),
        price=Decimal("15000.00"),
        stock_quantity=5,
        status="published",
    )
    db_session.add(product_1)

    product_2 = Product(
        id=uuid.uuid4(),
        name="Crutches",
        slug=f"crutches-{uuid.uuid4().hex[:6]}",
        sku=f"SKU-CR-{uuid.uuid4().hex[:6]}",
        vendor_id=vendor.id,
        base_price=Decimal("3000.00"),
        price=Decimal("3000.00"),
        stock_quantity=10,
        status="published",
    )
    db_session.add(product_2)
    await db_session.flush()

    # 4. Order A (Delivered) with 2 Wheelchairs
    order_a = Order(
        id=uuid.uuid4(),
        order_number=1001,
        user_id=user_a.id,
        status=OrderStatus.DELIVERED,
        total_amount=Decimal("30000.00"),
        currency="KES",
    )
    db_session.add(order_a)
    await db_session.flush()

    order_item = OrderItem(
        id=uuid.uuid4(),
        order_id=order_a.id,
        product_id=product_1.id,
        vendor_id=vendor.id,
        quantity=2,
        unit_price=Decimal("15000.00"),
        subtotal=Decimal("30000.00"),
    )
    db_session.add(order_item)

    # 5. Order Pending (not delivered)
    order_pending = Order(
        id=uuid.uuid4(),
        order_number=1002,
        user_id=user_a.id,
        status=OrderStatus.PENDING,
        total_amount=Decimal("15000.00"),
        currency="KES",
    )
    db_session.add(order_pending)
    await db_session.flush()

    pending_item = OrderItem(
        id=uuid.uuid4(),
        order_id=order_pending.id,
        product_id=product_1.id,
        vendor_id=vendor.id,
        quantity=1,
        unit_price=Decimal("15000.00"),
        subtotal=Decimal("15000.00"),
    )
    db_session.add(pending_item)
    await db_session.commit()

    tokens_a = await auth_service.create_tokens(user_a)
    tokens_b = await auth_service.create_tokens(user_b)

    return {
        "user_a": user_a,
        "user_b": user_b,
        "tokens_a": tokens_a,
        "tokens_b": tokens_b,
        "order_a": order_a,
        "order_item": order_item,
        "order_pending": order_pending,
        "pending_item": pending_item,
        "product_1": product_1,
        "product_2": product_2,
    }


@pytest.mark.asyncio
async def test_return_request_idor_rejection(client: AsyncClient, return_test_setup):
    """Customer B cannot return Customer A's order."""
    data = return_test_setup
    headers_b = {"Authorization": f"Bearer {data['tokens_b'].access_token}"}

    payload = {
        "order_id": str(data["order_a"].id),
        "reason": "Defective item",
        "description": "Wheel broke",
        "items": [
            {
                "order_item_id": str(data["order_item"].id),
                "product_id": str(data["product_1"].id),
                "product_name": "Wheelchair",
                "quantity": 1,
            }
        ],
    }
    response = await client.post("/api/v1/returns", json=payload, headers=headers_b)
    assert response.status_code == 403, f"Expected 403 Forbidden, got {response.status_code}: {response.text}"


@pytest.mark.asyncio
async def test_return_request_nonexistent_order_rejection(client: AsyncClient, return_test_setup):
    """Cannot return a nonexistent order."""
    data = return_test_setup
    headers_a = {"Authorization": f"Bearer {data['tokens_a'].access_token}"}

    payload = {
        "order_id": str(uuid.uuid4()),
        "reason": "Defective item",
        "description": "Nonexistent",
        "items": [
            {
                "order_item_id": str(data["order_item"].id),
                "product_id": str(data["product_1"].id),
                "product_name": "Wheelchair",
                "quantity": 1,
            }
        ],
    }
    response = await client.post("/api/v1/returns", json=payload, headers=headers_a)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_return_request_pending_order_rejection(client: AsyncClient, return_test_setup):
    """Cannot return an order that is pending / not delivered."""
    data = return_test_setup
    headers_a = {"Authorization": f"Bearer {data['tokens_a'].access_token}"}

    payload = {
        "order_id": str(data["order_pending"].id),
        "reason": "Defective",
        "description": "Not yet delivered",
        "items": [
            {
                "order_item_id": str(data["pending_item"].id),
                "product_id": str(data["product_1"].id),
                "product_name": "Wheelchair",
                "quantity": 1,
            }
        ],
    }
    response = await client.post("/api/v1/returns", json=payload, headers=headers_a)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_return_request_product_not_in_order_rejection(client: AsyncClient, return_test_setup):
    """Cannot return a product that was not part of the order."""
    data = return_test_setup
    headers_a = {"Authorization": f"Bearer {data['tokens_a'].access_token}"}

    payload = {
        "order_id": str(data["order_a"].id),
        "reason": "Defective",
        "description": "Wrong product ID",
        "items": [
            {
                "order_item_id": str(data["order_item"].id),
                "product_id": str(data["product_2"].id),  # Crutches, but order has Wheelchair
                "product_name": "Crutches",
                "quantity": 1,
            }
        ],
    }
    response = await client.post("/api/v1/returns", json=payload, headers=headers_a)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_return_request_excessive_quantity_rejection(client: AsyncClient, return_test_setup):
    """Cannot return more items than purchased."""
    data = return_test_setup
    headers_a = {"Authorization": f"Bearer {data['tokens_a'].access_token}"}

    payload = {
        "order_id": str(data["order_a"].id),
        "reason": "Defective",
        "description": "Returning 5 wheelchairs when only 2 were purchased",
        "items": [
            {
                "order_item_id": str(data["order_item"].id),
                "product_id": str(data["product_1"].id),
                "product_name": "Wheelchair",
                "quantity": 5,  # purchased 2
            }
        ],
    }
    response = await client.post("/api/v1/returns", json=payload, headers=headers_a)
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_return_request_own_order_success_and_duplicate_rejection(client: AsyncClient, return_test_setup):
    """Customer A returning their own delivered order succeeds, but duplicate active return is rejected."""
    data = return_test_setup
    headers_a = {"Authorization": f"Bearer {data['tokens_a'].access_token}"}

    payload = {
        "order_id": str(data["order_a"].id),
        "reason": "Defective item",
        "description": "Wheel is stuck",
        "items": [
            {
                "order_item_id": str(data["order_item"].id),
                "product_id": str(data["product_1"].id),
                "product_name": "Wheelchair",
                "quantity": 1,
            }
        ],
    }

    # First request succeeds
    res1 = await client.post("/api/v1/returns", json=payload, headers=headers_a)
    assert res1.status_code == 200, f"Expected 200, got {res1.status_code}: {res1.text}"
    assert res1.json()["data"]["status"] == "pending"

    # Duplicate active return request for the same order is rejected with 409 Conflict
    res2 = await client.post("/api/v1/returns", json=payload, headers=headers_a)
    assert res2.status_code == 409, f"Expected 409 for duplicate return, got {res2.status_code}: {res2.text}"
