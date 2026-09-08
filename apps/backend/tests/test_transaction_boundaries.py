import uuid
from decimal import Decimal

import pytest
from sqlalchemy import select

from app.domains.auth.models.user import User
from app.domains.shopping.services.coupon_service import CouponService


@pytest.mark.asyncio
async def test_service_write_after_read_query_does_not_crash_transaction(db_session):
    """
    Test that calling a service write method after a SELECT query on the session
    does not raise 'InvalidRequestError: A transaction is already begun on this Session'.
    """
    # 1. Execute a read query to autobegin a transaction (mimicking get_current_user)
    user = User(
        id=uuid.uuid4(),
        email="tx_test@test.com",
        password_hash="test_hash",
        first_name="Tx",
        last_name="Test",
        role="customer",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()

    # Read query puts session into transaction state
    await db_session.execute(select(User).where(User.id == user.id))
    assert db_session.in_transaction()

    # 2. Call CouponService.create_coupon inside active transaction
    coupon_service = CouponService(db_session)
    coupon = await coupon_service.create_coupon(
        code=f"DISCOUNT{uuid.uuid4().hex[:4]}",
        coupon_type="percentage",
        discount_value=15.0,
        description="15% off",
    )

    assert coupon is not None
    assert coupon.discount_value == Decimal("15.0")
