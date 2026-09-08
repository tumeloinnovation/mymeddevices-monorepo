"""Tests for authenticated notification APIs."""

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.auth.models.user import User
from app.domains.auth.services.auth_service import AuthService
from app.domains.notifications.models.notification import NotificationType
from app.domains.notifications.services.notification_service import NotificationService


def make_user(email: str) -> User:
    return User(
        id=uuid.uuid4(),
        email=email,
        password_hash="test_hash",
        role="customer",
        is_active=True,
    )


@pytest.fixture
async def authed_customer(db_session: AsyncSession):
    user = make_user("notification-user@test.com")
    db_session.add(user)
    await db_session.commit()
    tokens = await AuthService(db_session).create_tokens(user)
    return user, {"Authorization": f"Bearer {tokens.access_token}"}


@pytest.mark.asyncio
async def test_notifications_are_scoped_and_markable(
    client: AsyncClient,
    db_session: AsyncSession,
    authed_customer,
):
    user, headers = authed_customer
    other_user = make_user("other-notification-user@test.com")
    db_session.add(other_user)
    await db_session.commit()

    service = NotificationService(db_session)
    await service.create_notification(
        user_id=user.id,
        notification_type=NotificationType.ORDER_SHIPPED,
        title="Order shipped",
        body="Tracking MMF-1",
        data={"order_id": "order-1", "status": "shipped"},
    )
    await service.create_notification(
        user_id=other_user.id,
        notification_type=NotificationType.SYSTEM,
        title="Other customer",
        body="Hidden",
    )
    await db_session.commit()

    response = await client.get("/api/v1/notifications/my", headers=headers)
    assert response.status_code == 200
    items = response.json()["data"]
    assert len(items) == 1
    assert items[0]["title"] == "Order shipped"
    assert items[0]["data"]["order_id"] == "order-1"

    unread = await client.get("/api/v1/notifications/unread-count", headers=headers)
    assert unread.status_code == 200
    assert unread.json()["data"]["count"] == 1

    marked = await client.post("/api/v1/notifications/read", json=None, headers=headers)
    assert marked.status_code == 200
    assert marked.json()["data"]["updated"] == 1

    after = await client.get("/api/v1/notifications/unread-count", headers=headers)
    assert after.json()["data"]["count"] == 0
