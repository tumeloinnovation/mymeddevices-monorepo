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
async def order_setup(db_session):
    """Fixture providing Admin, Vendor, Customer, Product, and Cart."""
    auth_service = AuthService(db_session)

    admin = User(
        id=uuid.uuid4(),
        email="admin_orders@test.com",
        password_hash=get_password_hash("AdminPass123!"),
        role="admin",
        is_active=True,
    )
    db_session.add(admin)

    vendor_user = User(
        id=uuid.uuid4(),
        email="vendor_orders@test.com",
        password_hash=get_password_hash("VendorPass123!"),
        role="vendor",
        is_active=True,
    )
    db_session.add(vendor_user)
    await db_session.flush()

    vendor_profile = VendorProfile(
        id=uuid.uuid4(),
        user_id=vendor_user.id,
        store_name="MedEquip Nairobi",
        approval_status="approved",
    )
    db_session.add(vendor_profile)
    await db_session.flush()

    product = Product(
        id=uuid.uuid4(),
        vendor_id=vendor_profile.id,
        name="Infusion Pump Pro",
        slug="infusion-pump-pro",
        price=75000.00,
        stock_quantity=20,
        status="published",
        is_verified=True,
    )
    db_session.add(product)

    customer = User(
        id=uuid.uuid4(),
        email="customer_orders@test.com",
        password_hash=get_password_hash("CustomerPass123!"),
        role="customer",
        is_active=True,
    )
    db_session.add(customer)
    await db_session.commit()

    tokens_admin = await auth_service.create_tokens(admin)
    tokens_vendor = await auth_service.create_tokens(vendor_user)
    tokens_customer = await auth_service.create_tokens(customer)

    return {
        "admin": admin,
        "tokens_admin": tokens_admin,
        "vendor_user": vendor_user,
        "vendor_profile": vendor_profile,
        "tokens_vendor": tokens_vendor,
        "customer": customer,
        "tokens_customer": tokens_customer,
        "product": product,
    }


@pytest.mark.asyncio
async def test_full_checkout_and_customer_order_lifecycle(client: AsyncClient, order_setup):
    """ORD-001: End-to-end checkout, status, tracking, and cancellation."""
    d = order_setup
    cust_headers = {"Authorization": f"Bearer {d['tokens_customer'].access_token}"}
    p_id = str(d["product"].id)

    # 1. Add product to cart
    add_res = await client.post(
        "/api/v1/shopping/cart/items",
        json={"product_id": p_id, "quantity": 1},
        headers=cust_headers,
    )
    assert add_res.status_code == 200
    cart_id = add_res.json()["data"]["id"]

    # 2. Checkout -> Create Order
    checkout_payload = {
        "cart_id": cart_id,
        "shipping_address": {
            "full_name": "Jane Customer",
            "phone": "+254712345678",
            "address_line1": "Upper Hill Medical Suites",
            "city": "Nairobi",
            "country": "Kenya",
        },
        "notes": "Deliver during clinic hours 8am-5pm",
    }
    order_res = await client.post("/api/v1/shopping/checkout", json=checkout_payload, headers=cust_headers)
    assert order_res.status_code == 201
    order_data = order_res.json()["data"]
    order_id = order_data["id"]
    order_number = order_data["order_number"]

    # 3. List my orders
    list_res = await client.get("/api/v1/shopping/orders", headers=cust_headers)
    assert list_res.status_code == 200
    assert any(o["id"] == order_id for o in list_res.json()["data"]["items"])

    # 4. Get order details by ID
    get_res = await client.get(f"/api/v1/shopping/orders/{order_id}", headers=cust_headers)
    assert get_res.status_code == 200
    assert get_res.json()["data"]["id"] == order_id

    # 5. Get order details by order_number (Public lookup with auth)
    pub_res = await client.get(f"/api/v1/shopping/orders/public/{order_number}", headers=cust_headers)
    assert pub_res.status_code == 200
    assert pub_res.json()["data"]["order_number"] == order_number

    # 6. Check order status
    status_res = await client.get(f"/api/v1/shopping/orders/{order_id}/status", headers=cust_headers)
    assert status_res.status_code == 200
    assert status_res.json()["data"]["status"] == "pending"

    # 7. Check order tracking
    track_res = await client.get(f"/api/v1/shopping/orders/{order_id}/tracking", headers=cust_headers)
    assert track_res.status_code == 200

    # 8. Cancel pending order
    cancel_res = await client.post(f"/api/v1/shopping/orders/{order_id}/cancel", headers=cust_headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["data"]["status"] == "cancelled"


@pytest.mark.asyncio
async def test_admin_and_vendor_order_management(client: AsyncClient, order_setup, db_session):
    """ORD-002: Admin order status transitions, internal notes, and vendor order fulfillment tracking."""
    d = order_setup
    admin_headers = {"Authorization": f"Bearer {d['tokens_admin'].access_token}"}
    vendor_headers = {"Authorization": f"Bearer {d['tokens_vendor'].access_token}"}

    # Create Order directly in DB with order items
    order = Order(
        id=uuid.uuid4(),
        user_id=d["customer"].id,
        order_number=77001,
        status=OrderStatus.PENDING,
        total_amount=Decimal("75000.00"),
        shipping_address={"full_name": "Dr. Smith", "city": "Nairobi"},
    )
    db_session.add(order)
    await db_session.flush()

    order_item = OrderItem(
        id=uuid.uuid4(),
        order_id=order.id,
        product_id=d["product"].id,
        vendor_id=d["vendor_profile"].id,
        quantity=1.0,
        unit_price=Decimal("75000.00"),
        subtotal=Decimal("75000.00"),
        fulfillment_status="pending",
    )
    db_session.add(order_item)
    await db_session.commit()

    order_id = str(order.id)
    item_id = str(order_item.id)

    # 1. Admin list orders
    adm_list = await client.get("/api/v1/admin/shopping/orders", headers=admin_headers)
    assert adm_list.status_code == 200
    assert any(o["id"] == order_id for o in adm_list.json()["data"]["orders"])

    # 2. Admin update internal notes
    notes_res = await client.patch(
        f"/api/v1/admin/shopping/orders/{order_id}/internal-notes",
        json={"internal_notes": "VIP customer - priority handling required"},
        headers=admin_headers,
    )
    assert notes_res.status_code == 200
    assert notes_res.json()["data"]["internal_notes"] == "VIP customer - priority handling required"

    # 3. Admin updates status to PROCESSING
    status_processing = await client.patch(
        f"/api/v1/admin/shopping/orders/{order_id}/status",
        json={"status": "processing"},
        headers=admin_headers,
    )
    assert status_processing.status_code == 200
    assert status_processing.json()["data"]["status"] == "processing"

    # 4. Vendor lists vendor orders
    ven_orders = await client.get("/api/v1/vendor/orders", headers=vendor_headers)
    assert ven_orders.status_code == 200

    # 5. Vendor updates item status to 'packed'
    ven_pack = await client.patch(
        f"/api/v1/vendor/orders/{order_id}/items/{item_id}/status",
        json={"status": "packed"},
        headers=vendor_headers,
    )
    assert ven_pack.status_code == 200

    # 6. Vendor adds tracking info
    tracking_res = await client.post(
        f"/api/v1/vendor/orders/{order_id}/items/{item_id}/tracking",
        json={"tracking_number": "TRK-KE-998822", "carrier": "Fargo Courier"},
        headers=vendor_headers,
    )
    assert tracking_res.status_code == 200
