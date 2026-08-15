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
async def return_refund_setup(db_session):
    auth_service = AuthService(db_session)

    # 1. Admin
    admin = User(
        id=uuid.uuid4(),
        email="returns_admin@test.com",
        password_hash="test_hash",
        first_name="Returns",
        last_name="Admin",
        role="admin",
        is_active=True,
    )
    db_session.add(admin)

    # 2. Customer
    customer = User(
        id=uuid.uuid4(),
        email="return_patient@test.com",
        password_hash="test_hash",
        first_name="Patient",
        last_name="Return",
        role="customer",
        is_active=True,
    )
    db_session.add(customer)

    # 3. Vendor
    vendor_user = User(
        id=uuid.uuid4(),
        email="vendor_returns@test.com",
        password_hash="test_hash",
        role="vendor",
        is_active=True,
    )
    db_session.add(vendor_user)
    await db_session.flush()

    vendor = VendorProfile(
        id=uuid.uuid4(),
        user_id=vendor_user.id,
        store_name="Medical Return Vendor",
        approval_status="approved",
    )
    db_session.add(vendor)

    # 4. Product
    product = Product(
        id=uuid.uuid4(),
        vendor_id=vendor.id,
        name="Digital Thermometer Pro",
        slug="digital-thermometer-pro",
        price=1500.00,
        stock_quantity=40,
        status="published",
    )
    db_session.add(product)

    # 5. Delivered Order
    order = Order(
        id=uuid.uuid4(),
        order_number=90002,
        user_id=customer.id,
        status=OrderStatus.DELIVERED,
        total_amount=Decimal("1500.00"),
        shipping_address={"full_name": "Patient Return", "city": "Nairobi"},
    )
    db_session.add(order)
    await db_session.flush()

    item = OrderItem(
        id=uuid.uuid4(),
        order_id=order.id,
        product_id=product.id,
        vendor_id=vendor.id,
        quantity=1,
        unit_price=Decimal("1500.00"),
        subtotal=Decimal("1500.00"),
        fulfillment_status="delivered",
    )
    db_session.add(item)
    await db_session.commit()

    admin_tokens = await auth_service.create_tokens(admin)
    customer_tokens = await auth_service.create_tokens(customer)

    return {
        "admin": admin,
        "customer": customer,
        "product": product,
        "order": order,
        "item": item,
        "admin_tokens": admin_tokens,
        "customer_tokens": customer_tokens,
    }


@pytest.mark.asyncio
async def test_full_return_to_refund_lifecycle(client: AsyncClient, return_refund_setup, db_session):
    """Test full return flow: customer create return -> admin approves -> refund triggers order refund status."""
    data = return_refund_setup
    customer_headers = {"Authorization": f"Bearer {data['customer_tokens'].access_token}"}
    admin_headers = {"Authorization": f"Bearer {data['admin_tokens'].access_token}"}

    # 1. Customer creates return request
    create_res = await client.post(
        "/api/v1/returns",
        json={
            "order_id": str(data["order"].id),
            "reason": "defective",
            "description": "Thermometer sensor calibration error.",
            "refund_method": "original_payment",
            "items": [
                {
                    "order_item_id": str(data["item"].id),
                    "product_id": str(data["product"].id),
                    "product_name": data["product"].name,
                    "quantity": 1,
                    "unit_price": 1500.00,
                    "reason": "defective",
                    "condition": "opened",
                }
            ],
        },
        headers=customer_headers,
    )
    assert create_res.status_code == 200, f"Expected 200, got {create_res.status_code}: {create_res.text}"
    return_id = create_res.json()["data"]["id"]
    assert create_res.json()["data"]["status"] == "pending"

    # 2. Admin approves return request
    approve_res = await client.put(
        f"/api/v1/returns/{return_id}/status", json={"status": "approved"}, headers=admin_headers
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["data"]["status"] == "approved"

    # 3. Admin processes refund
    refund_res = await client.put(
        f"/api/v1/returns/{return_id}/status", json={"status": "refunded"}, headers=admin_headers
    )
    assert refund_res.status_code == 200
    assert refund_res.json()["data"]["status"] == "refunded"

    # 4. Check order status in DB was updated to refunded
    from sqlalchemy import select

    order_in_db = (await db_session.execute(select(Order).where(Order.id == data["order"].id))).scalar_one()
    assert order_in_db.status == OrderStatus.REFUNDED
