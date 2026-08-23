"""End-to-end tests for the auto-dispatch delivery flow.

When all order items are marked ``packed`` by a vendor, the system should
automatically create a Delivery and assign the best available driver. The
driver then confirms pickup (items -> shipped) and completes the delivery
(items -> delivered, capacity released).
"""

import uuid
from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.domains.auth.models.user import User
from app.domains.auth.services.auth_service import AuthService
from app.domains.catalog.models.product import Product
from app.domains.logistics.models.delivery_proof import DeliveryProof
from app.domains.logistics.models.driver_profile import DriverProfile, DriverStatus
from app.domains.shopping.models.order import Order, OrderItem, OrderStatus
from app.domains.shopping.models.sub_order import SubOrder, SubOrderStatus
from app.domains.vendor.models.vendor_profile import VendorProfile

OFFICE_LAT = -1.3011758537859464
OFFICE_LON = 36.800690681948126


@pytest.fixture
async def dispatch_setup(db_session):
    auth_service = AuthService(db_session)

    # Customer
    customer = User(
        id=uuid.uuid4(),
        email="dispatch-buyer@test.com",
        password_hash="test_hash",
        role="customer",
        is_active=True,
    )
    db_session.add(customer)

    # Vendor
    vendor_user = User(
        id=uuid.uuid4(),
        email="dispatch-vendor@test.com",
        password_hash="test_hash",
        role="vendor",
        is_active=True,
    )
    db_session.add(vendor_user)
    await db_session.flush()

    vendor = VendorProfile(
        id=uuid.uuid4(),
        user_id=vendor_user.id,
        store_name="Dispatch Vendor Supplies",
        approval_status="approved",
    )
    db_session.add(vendor)

    # Driver (available, near office)
    driver_user = User(
        id=uuid.uuid4(),
        email="dispatch-driver@test.com",
        password_hash="test_hash",
        role="driver",
        is_active=True,
        phone="+254700123456",
        first_name="Dara",
        last_name="Rider",
    )
    db_session.add(driver_user)
    await db_session.flush()

    driver_profile = DriverProfile(
        id=uuid.uuid4(),
        user_id=driver_user.id,
        status=DriverStatus.AVAILABLE,
        vehicle_type="motorcycle",
        vehicle_plate="KDX 234A",
        max_concurrent_deliveries=3,
        current_deliveries_count=0,
        current_latitude=OFFICE_LAT,
        current_longitude=OFFICE_LON,
        home_base_latitude=OFFICE_LAT,
        home_base_longitude=OFFICE_LON,
        verified_vehicle=True,
    )
    db_session.add(driver_profile)

    # Product
    product = Product(
        id=uuid.uuid4(),
        vendor_id=vendor.id,
        name="Dispatch Pulse Oximeter",
        slug="dispatch-pulse-oximeter",
        price=2500.00,
        stock_quantity=50,
        status="published",
    )
    db_session.add(product)

    # Order with company-rider logistics and a route: Office -> Customer
    order = Order(
        id=uuid.uuid4(),
        order_number=95001,
        user_id=customer.id,
        status=OrderStatus.PROCESSING,
        total_amount=Decimal("2500.00"),
        shipping_address={
            "logistics_type": "company_rider",
            "full_name": "Dispatch Buyer",
            "first_name": "Dispatch",
            "last_name": "Buyer",
            "phone": "+254711000000",
            "address": "45 River Road, Nairobi",
            "city": "Nairobi",
            "state": "Nairobi County",
            "route_coordinates": [[OFFICE_LAT, OFFICE_LON], [-1.286389, 36.817223]],
            "calculated_distance_km": 3.2,
            "estimated_duration_minutes": 18,
        },
    )
    db_session.add(order)
    await db_session.flush()

    sub_order = SubOrder(
        id=uuid.uuid4(),
        parent_order_id=order.id,
        vendor_id=vendor.id,
        subtotal_amount=Decimal("2500.00"),
        status=SubOrderStatus.PROCESSING,
    )
    db_session.add(sub_order)
    await db_session.flush()

    item = OrderItem(
        id=uuid.uuid4(),
        order_id=order.id,
        sub_order_id=sub_order.id,
        product_id=product.id,
        vendor_id=vendor.id,
        quantity=1,
        unit_price=Decimal("2500.00"),
        subtotal=Decimal("2500.00"),
        fulfillment_status="processing",
    )
    db_session.add(item)
    await db_session.commit()

    tokens_vendor = await auth_service.create_tokens(vendor_user)
    tokens_driver = await auth_service.create_tokens(driver_user)

    return {
        "order": order,
        "item": item,
        "vendor": vendor,
        "driver_user": driver_user,
        "tokens_vendor": tokens_vendor,
        "tokens_driver": tokens_driver,
    }


@pytest.mark.asyncio
async def test_auto_dispatch_when_all_items_packed(client: AsyncClient, dispatch_setup):
    """Packing the last item auto-creates a delivery and assigns the best driver."""
    data = dispatch_setup
    headers_vendor = {"Authorization": f"Bearer {data['tokens_vendor'].access_token}"}
    headers_driver = {"Authorization": f"Bearer {data['tokens_driver'].access_token}"}
    order_id = data["order"].id
    item_id = data["item"].id

    # No delivery before items are packed
    res = await client.patch(
        f"/api/v1/vendor/orders/{order_id}/items/{item_id}/status",
        json={"status": "packed"},
        headers=headers_vendor,
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"

    # Auto-dispatch should have created a delivery and assigned the driver
    get_res = await client.get(
        f"/api/v1/logistics/deliveries/driver/{data['driver_user'].id}",
        headers=headers_driver,
    )
    assert get_res.status_code == 200, get_res.text
    deliveries = get_res.json()
    assert deliveries, "Expected at least one assigned delivery after packing"

    delivery = deliveries[0]
    assert delivery["order_id"] == str(order_id)
    assert delivery["status"] == "assigned"
    assert delivery["assigned_driver_id"] == str(data["driver_user"].id)
    assert delivery["logistics_type"] == "company_rider"
    assert delivery["route_coordinates"]
    assert len(delivery["stops"]) >= 2, "Expected office and customer stops"


@pytest.mark.asyncio
async def test_pickup_and_delivery_lifecycle(client: AsyncClient, dispatch_setup):
    """Driver confirms pickup (items -> shipped) then delivers (order -> delivered)."""
    data = dispatch_setup
    headers_vendor = {"Authorization": f"Bearer {data['tokens_vendor'].access_token}"}
    headers_driver = {"Authorization": f"Bearer {data['tokens_driver'].access_token}"}
    order_id = data["order"].id
    item_id = data["item"].id

    # 1. Vendor packs the item -> auto dispatch
    res = await client.patch(
        f"/api/v1/vendor/orders/{order_id}/items/{item_id}/status",
        json={"status": "packed"},
        headers=headers_vendor,
    )
    assert res.status_code == 200

    deliveries = (
        await client.get(
            f"/api/v1/logistics/deliveries/driver/{data['driver_user'].id}",
            headers=headers_driver,
        )
    ).json()
    delivery_id = deliveries[0]["id"]

    # 2. Driver heads to pickup -> routed
    routed = await client.patch(
        f"/api/v1/logistics/deliveries/{delivery_id}/status",
        json={"status": "routed"},
        headers=headers_driver,
    )
    assert routed.status_code == 200, routed.text

    # 3. Driver confirms pickup -> in_transit, items -> shipped
    picked = await client.post(
        f"/api/v1/logistics/deliveries/{delivery_id}/pickup",
        headers=headers_driver,
    )
    assert picked.status_code == 200, picked.text
    assert picked.json()["new_status"] == "in_transit"

    shipped = await client.get(f"/api/v1/vendor/orders/{order_id}", headers=headers_vendor)
    assert shipped.status_code == 200
    shipped_items = shipped.json()["data"]["items"]
    assert all(it["status"] == "shipped" for it in shipped_items), shipped_items

    # 4. Medical-device completion requires photo and GPS evidence.
    blocked = await client.patch(
        f"/api/v1/logistics/deliveries/{delivery_id}/status",
        json={"status": "delivered"},
        headers=headers_driver,
    )
    assert blocked.status_code == 400
    assert "proof" in blocked.json()["detail"].lower()

    tiny_jpeg = b"\xff\xd8\xff\xe0" + b"\x00" * 256
    photo_proof = await client.post(
        f"/api/v1/logistics/deliveries/{delivery_id}/proof",
        files={"file": ("proof.jpg", tiny_jpeg, "image/jpeg")},
        headers=headers_driver,
    )
    assert photo_proof.status_code == 201, photo_proof.text

    gps_proof = await client.post(
        f"/api/v1/logistics/deliveries/{delivery_id}/proof",
        files={"file": ("gps.txt", b"ignored", "text/plain")},
        params={"proof_type": "gps_coordinate", "latitude": -1.2921, "longitude": 36.8219},
        headers=headers_driver,
    )
    assert gps_proof.status_code == 201, gps_proof.text

    # 5. Driver completes -> delivered, order rolled up, capacity released
    done = await client.patch(
        f"/api/v1/logistics/deliveries/{delivery_id}/status",
        json={"status": "delivered"},
        headers=headers_driver,
    )
    assert done.status_code == 200, done.text

    # Delivery is terminal
    detail = await client.get(
        f"/api/v1/logistics/deliveries/{delivery_id}",
        headers=headers_driver,
    )
    assert detail.status_code == 200
    assert detail.json()["status"] == "delivered"
    assert detail.json()["actual_delivery"] is not None

    # Order items and order status rolled up
    final_order = await client.get(f"/api/v1/vendor/orders/{order_id}", headers=headers_vendor)
    assert final_order.status_code == 200
    assert all(it["status"] == "delivered" for it in final_order.json()["data"]["items"])

    # Driver capacity released back to 0
    capacity = await client.get(
        f"/api/v1/logistics/driver-matching/driver-capacity/{data['driver_user'].id}",
        headers=headers_driver,
    )
    assert capacity.status_code == 200
    assert capacity.json()["current_deliveries"] == 0


@pytest.mark.asyncio
async def test_no_dispatch_for_courier_logistics(client: AsyncClient, dispatch_setup):
    """Courier orders must not get an auto-created delivery (no driver assignment)."""
    data = dispatch_setup
    headers_vendor = {"Authorization": f"Bearer {data['tokens_vendor'].access_token}"}
    headers_driver = {"Authorization": f"Bearer {data['tokens_driver'].access_token}"}
    order_id = data["order"].id
    item_id = data["item"].id

    # Switch logistics to courier for this scenario
    order = data["order"]
    shipping = dict(order.shipping_address)
    shipping["logistics_type"] = "courier"
    order.shipping_address = shipping

    res = await client.patch(
        f"/api/v1/vendor/orders/{order_id}/items/{item_id}/status",
        json={"status": "packed"},
        headers=headers_vendor,
    )
    assert res.status_code == 200

    # Auto-created delivery should exist (courier still gets a delivery record)
    get_res = await client.get(
        f"/api/v1/logistics/deliveries/driver/{data['driver_user'].id}",
        headers=headers_driver,
    )
    assert get_res.status_code == 200
    deliveries = get_res.json()
    # Courier deliveries are NOT assigned to a driver -> driver list stays empty
    assert deliveries == []


@pytest.mark.asyncio
async def test_proof_of_delivery_upload(client: AsyncClient, db_session, dispatch_setup):
    """Assigned driver uploads photo proof; invalid content is rejected."""
    data = dispatch_setup
    headers_vendor = {"Authorization": f"Bearer {data['tokens_vendor'].access_token}"}
    headers_driver = {"Authorization": f"Bearer {data['tokens_driver'].access_token}"}
    order_id = data["order"].id
    item_id = data["item"].id

    # Pack the item -> auto dispatch -> assigned delivery
    res = await client.patch(
        f"/api/v1/vendor/orders/{order_id}/items/{item_id}/status",
        json={"status": "packed"},
        headers=headers_vendor,
    )
    assert res.status_code == 200

    deliveries = (
        await client.get(
            f"/api/v1/logistics/deliveries/driver/{data['driver_user'].id}",
            headers=headers_driver,
        )
    ).json()
    delivery_id = deliveries[0]["id"]

    # Valid JPEG photo proof -> 201 with a served URL
    tiny_jpeg = b"\xff\xd8\xff\xe0" + b"\x00" * 256
    upload = await client.post(
        f"/api/v1/logistics/deliveries/{delivery_id}/proof",
        files={"file": ("proof.jpg", tiny_jpeg, "image/jpeg")},
        headers=headers_driver,
    )
    assert upload.status_code == 201, upload.text
    body = upload.json()
    assert body["proof_type"] == "photo"
    assert body["proof_url"].startswith("/static/uploads/delivery-proofs/")

    proof = (
        await db_session.execute(select(DeliveryProof).where(DeliveryProof.delivery_id == uuid.UUID(delivery_id)))
    ).scalar_one_or_none()
    assert proof is not None
    assert proof.captured_by_user_id == data["driver_user"].id
    assert proof.proof_data["photo_url"] == body["proof_url"]

    # Garbage bytes masquerading as an image -> 400
    bad = await client.post(
        f"/api/v1/logistics/deliveries/{delivery_id}/proof",
        files={"file": ("proof.jpg", b"definitely-not-an-image", "image/jpeg")},
        headers=headers_driver,
    )
    assert bad.status_code == 400
