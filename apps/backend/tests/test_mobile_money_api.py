import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, get_password_hash
from app.domains.auth.models.user import User
from app.domains.shopping.models.order import Order, OrderStatus


@pytest.mark.asyncio
async def test_record_mobile_money_payment_as_admin_success(client: AsyncClient, db_session: AsyncSession):
    """Test recording mobile money payment as an admin user."""
    # Create admin user
    admin = User(
        id=uuid.uuid4(),
        email="admin@mymeddevices.co.ke",
        password_hash=get_password_hash("AdminPass123!"),
        role="admin",
        is_active=True,
        is_verified=True,
    )
    # Create customer user
    customer = User(
        id=uuid.uuid4(),
        email="customer@mymeddevices.co.ke",
        password_hash=get_password_hash("CustPass123!"),
        role="customer",
        is_active=True,
        is_verified=True,
    )
    # Create pending order
    order = Order(
        id=uuid.uuid4(),
        user_id=customer.id,
        status=OrderStatus.PENDING,
        total_amount=1500.0,
        currency="KES",
        shipping_address={"city": "Nairobi", "street": "Harambee Ave"},
        idempotency_key=str(uuid.uuid4()),
    )
    db_session.add_all([admin, customer, order])
    await db_session.commit()

    # Generate admin JWT
    admin_token = create_access_token({"sub": str(admin.id), "role": admin.role, "email": admin.email})
    headers = {"Authorization": f"Bearer {admin_token}"}

    payload = {
        "order_id": str(order.id),
        "transaction_id": "MPESA12345678",
        "provider": "mpesa",
        "phone_number": "+254712345678",
        "notes": "Verified via M-Pesa SMS",
    }

    response = await client.post("/api/v1/admin/shopping/mobile-money/record", json=payload, headers=headers)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert res_data["data"]["transaction_id"] == "MPESA12345678"
    assert res_data["data"]["status"] in ("verified", "completed")


@pytest.mark.asyncio
async def test_record_mobile_money_payment_customer_forbidden(client: AsyncClient, db_session: AsyncSession):
    """Test that customer users cannot access admin mobile money recording endpoint."""
    customer = User(
        id=uuid.uuid4(),
        email="regularcust@mymeddevices.co.ke",
        password_hash=get_password_hash("CustPass123!"),
        role="customer",
        is_active=True,
    )
    db_session.add(customer)
    await db_session.commit()

    customer_token = create_access_token({"sub": str(customer.id), "role": customer.role, "email": customer.email})
    headers = {"Authorization": f"Bearer {customer_token}"}

    payload = {"order_id": str(uuid.uuid4()), "transaction_id": "MPESA12345678", "provider": "mpesa"}

    response = await client.post("/api/v1/admin/shopping/mobile-money/record", json=payload, headers=headers)
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_record_mobile_money_payment_unauthenticated(client: AsyncClient):
    """Test unauthenticated request returns 401."""
    payload = {"order_id": str(uuid.uuid4()), "transaction_id": "MPESA12345678", "provider": "mpesa"}
    response = await client.post("/api/v1/admin/shopping/mobile-money/record", json=payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_record_mobile_money_payment_invalid_transaction_id(client: AsyncClient, db_session: AsyncSession):
    """Test recording payment with invalid short transaction ID format returns validation error."""
    admin = User(
        id=uuid.uuid4(),
        email="admin2@mymeddevices.co.ke",
        password_hash=get_password_hash("AdminPass123!"),
        role="admin",
        is_active=True,
    )
    db_session.add(admin)
    await db_session.commit()

    admin_token = create_access_token({"sub": str(admin.id), "role": admin.role, "email": admin.email})
    headers = {"Authorization": f"Bearer {admin_token}"}

    payload = {
        "order_id": str(uuid.uuid4()),
        "transaction_id": "SHORT",  # Invalid: less than 8 chars
        "provider": "mpesa",
    }

    response = await client.post("/api/v1/admin/shopping/mobile-money/record", json=payload, headers=headers)
    assert response.status_code in (400, 422)


@pytest.mark.asyncio
async def test_record_mobile_money_payment_order_not_found(client: AsyncClient, db_session: AsyncSession):
    """Test recording payment for non-existent order UUID returns 404."""
    admin = User(
        id=uuid.uuid4(),
        email="admin3@mymeddevices.co.ke",
        password_hash=get_password_hash("AdminPass123!"),
        role="admin",
        is_active=True,
    )
    db_session.add(admin)
    await db_session.commit()

    admin_token = create_access_token({"sub": str(admin.id), "role": admin.role, "email": admin.email})
    headers = {"Authorization": f"Bearer {admin_token}"}

    payload = {"order_id": str(uuid.uuid4()), "transaction_id": "MPESA88888888", "provider": "mpesa"}

    response = await client.post("/api/v1/admin/shopping/mobile-money/record", json=payload, headers=headers)
    assert response.status_code == 404
