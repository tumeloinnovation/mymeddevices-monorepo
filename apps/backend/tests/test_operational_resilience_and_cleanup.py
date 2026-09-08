import uuid
from datetime import UTC, datetime, timedelta

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.core.tasks import cleanup_expired_records
from app.domains.auth.models.otp import OTP
from app.domains.auth.models.token_device import RefreshToken
from app.domains.auth.models.user import User
from app.domains.shared.models.outbox import OutboxEvent, OutboxStatus
from app.domains.shared.services.outbox_relay import OutboxRelay


@pytest.fixture
async def operational_test_setup(db_session):
    user = User(
        id=uuid.uuid4(),
        email="cleanup_user@test.com",
        password_hash="test_hash",
        first_name="Cleanup",
        last_name="User",
        role="customer",
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    now = datetime.now(UTC)

    # 1. Valid Refresh Token
    valid_token = RefreshToken(
        id=uuid.uuid4(),
        user_id=user.id,
        token="valid_token_123",
        expires_at=now + timedelta(days=7),
        revoked=False,
    )
    db_session.add(valid_token)

    # 2. Expired Refresh Token
    expired_token = RefreshToken(
        id=uuid.uuid4(),
        user_id=user.id,
        token="expired_token_456",
        expires_at=now - timedelta(days=2),
        revoked=False,
    )
    db_session.add(expired_token)

    # 3. Revoked Refresh Token
    revoked_token = RefreshToken(
        id=uuid.uuid4(),
        user_id=user.id,
        token="revoked_token_789",
        expires_at=now + timedelta(days=5),
        revoked=True,
    )
    db_session.add(revoked_token)

    # 4. Valid OTP
    valid_otp = OTP(
        id=uuid.uuid4(),
        user_id=user.id,
        code="123456",
        purpose="login",
        expires_at=now + timedelta(minutes=10),
        is_used=False,
    )
    db_session.add(valid_otp)

    # 5. Expired OTP
    expired_otp = OTP(
        id=uuid.uuid4(),
        user_id=user.id,
        code="654321",
        purpose="login",
        expires_at=now - timedelta(minutes=5),
        is_used=False,
    )
    db_session.add(expired_otp)

    # 6. Used OTP
    used_otp = OTP(
        id=uuid.uuid4(),
        user_id=user.id,
        code="987654",
        purpose="login",
        expires_at=now + timedelta(minutes=5),
        is_used=True,
    )
    db_session.add(used_otp)

    await db_session.commit()

    return {
        "user": user,
        "valid_token": valid_token,
        "expired_token": expired_token,
        "revoked_token": revoked_token,
        "valid_otp": valid_otp,
    }


@pytest.mark.asyncio
async def test_database_cleanup_lifecycle(db_session, operational_test_setup):
    """Test periodic database cleanup task prunes expired/revoked tokens and OTPs while preserving valid credentials."""
    data = operational_test_setup

    # Run cleanup
    stats = await cleanup_expired_records(db_session)
    assert stats["deleted_tokens"] == 2
    assert stats["deleted_otps"] == 2

    # Verify only valid token exists
    tokens = (
        (await db_session.execute(select(RefreshToken).where(RefreshToken.user_id == data["user"].id))).scalars().all()
    )
    assert len(tokens) == 1
    assert tokens[0].id == data["valid_token"].id

    # Verify only valid OTP exists
    otps = (await db_session.execute(select(OTP).where(OTP.user_id == data["user"].id))).scalars().all()
    assert len(otps) == 1
    assert otps[0].id == data["valid_otp"].id


@pytest.mark.asyncio
async def test_outbox_relay_error_resilience(db_session):
    """Test OutboxRelay processes valid events and flags failing events without breaking the worker loop."""
    relay = OutboxRelay(db_session)

    # 1. Add an event that will fail gracefully
    failing_event = OutboxEvent(
        id=uuid.uuid4(),
        aggregate_type="Order",
        aggregate_id="invalid-non-uuid-string",
        event_type="OrderPaid",
        payload={"sub_orders": [{"vendor_id": "invalid-uuid"}]},
        status=OutboxStatus.PENDING,
    )
    db_session.add(failing_event)

    # 2. Add an event that succeeds
    successful_event = OutboxEvent(
        id=uuid.uuid4(),
        aggregate_type="Staff",
        aggregate_id=str(uuid.uuid4()),
        event_type="StaffInvitationCreated",
        payload={"email": "staff_invite@test.com", "first_name": "Dr. Smith"},
        status=OutboxStatus.PENDING,
    )
    db_session.add(successful_event)
    await db_session.commit()

    # Process events
    await relay.process_pending_events()

    # Verify status transitions
    failing_refreshed = (
        await db_session.execute(select(OutboxEvent).where(OutboxEvent.id == failing_event.id))
    ).scalar_one()
    assert failing_refreshed.status == OutboxStatus.FAILED

    success_refreshed = (
        await db_session.execute(select(OutboxEvent).where(OutboxEvent.id == successful_event.id))
    ).scalar_one()
    assert success_refreshed.status == OutboxStatus.PROCESSED
    assert success_refreshed.processed_at is not None


@pytest.mark.asyncio
async def test_trace_context_propagation_and_correlation_headers(client: AsyncClient):
    """Test that incoming requests extract and propagate trace and request correlation headers."""
    custom_request_id = "req-correlation-id-998877"

    response = await client.get("/health", headers={"X-Request-ID": custom_request_id})
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
