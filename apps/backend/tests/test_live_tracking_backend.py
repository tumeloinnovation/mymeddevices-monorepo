"""Focused backend coverage for live tracking, routing, and secure guest links."""

import uuid

import pytest

from app.domains.auth.models.user import User
from app.domains.logistics.models.delivery import Delivery, DeliveryStatus, LogisticsType
from app.domains.logistics.models.driver_profile import DriverProfile, DriverStatus
from app.domains.logistics.services.routing_service import RoutingService
from app.domains.logistics.services.tracking_service import TrackingService


@pytest.mark.asyncio
async def test_routing_haversine_fallback(db_session):
    service = RoutingService(db_session)
    result = await service.calculate_delivery_route((-1.2921, 36.8219))
    assert result.provider == "haversine"
    assert result.distance > 0
    assert result.route[0] == [pytest.approx(-1.3011758537859464), pytest.approx(36.800690681948126)]


@pytest.mark.asyncio
async def test_location_history_and_tracking_snapshot(client, db_session):
    driver_user = User(id=uuid.uuid4(), email=f"{uuid.uuid4()}@test.com", password_hash="x", role="driver", is_active=True)
    customer = User(id=uuid.uuid4(), email=f"{uuid.uuid4()}@test.com", password_hash="x", role="customer", is_active=True)
    db_session.add_all([driver_user, customer])
    await db_session.flush()
    profile = DriverProfile(
        id=uuid.uuid4(), user_id=driver_user.id, status=DriverStatus.AVAILABLE, max_concurrent_deliveries=2
    )
    from decimal import Decimal

    from app.domains.shopping.models.order import Order, OrderStatus

    order = Order(
        id=uuid.uuid4(),
        user_id=customer.id,
        status=OrderStatus.PROCESSING,
        total_amount=Decimal("1500.00"),
        currency="KES",
    )
    db_session.add(order)
    await db_session.flush()

    delivery = Delivery(
        id=uuid.uuid4(),
        order_id=order.id,
        logistics_type=LogisticsType.COMPANY_RIDER,
        status=DeliveryStatus.IN_TRANSIT,
        assigned_driver_id=driver_user.id,
    )
    db_session.add_all([profile, delivery])
    await db_session.commit()

    from app.domains.logistics.services.driver_assignment_service import DriverAssignmentService

    await DriverAssignmentService(db_session).update_driver_location(
        driver_id=driver_user.id,
        latitude=-1.2921,
        longitude=36.8219,
        delivery_id=delivery.id,
        accuracy_m=5,
        speed_kmh=22,
    )
    snapshot = await TrackingService(db_session).get_tracking(delivery.id)
    assert snapshot is not None
    assert snapshot["status"] == "in_transit"
    assert snapshot["driver_location"] == [-1.2921, 36.8219]

    token = await TrackingService(db_session).issue_guest_token(delivery.id, customer.id, ttl_hours=1)
    guest_snapshot = await TrackingService(db_session).get_tracking_by_token(token)
    assert guest_snapshot and guest_snapshot["delivery_id"] == str(delivery.id)
    assert await TrackingService(db_session).get_tracking_by_token("invalid") is None
