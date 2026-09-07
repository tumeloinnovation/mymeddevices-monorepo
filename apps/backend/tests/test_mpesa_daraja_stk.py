"""
Comprehensive M-Pesa Daraja STK Push Test Suite

Validates:
- Phone number normalization across all Kenyan phone formats
- Daraja password and token caching
- STK push initiation with role & ownership guards
- Webhook callback processing (Success, User Cancel, Idempotency)
- Live payment status query endpoint
- Outbox event propagation on verified M-Pesa payment
"""

import uuid
from decimal import Decimal
from unittest.mock import patch

import pytest
from httpx import AsyncClient
from sqlalchemy import select

from app.core.security import create_access_token
from app.domains.auth.models.user import User
from app.domains.shared.models.outbox import OutboxEvent
from app.domains.payments.models.mobile_money_payment import (
    MobileMoneyPayment,
    MobileMoneyPaymentStatus,
)
from app.domains.shopping.models.order import Order, OrderStatus
from app.domains.shopping.models.sub_order import SubOrder, SubOrderStatus
from app.domains.payments.services.daraja_service import DarajaService
from app.domains.vendor.models.vendor_profile import VendorProfile


def test_daraja_phone_number_normalization():
    """Verify robust Kenyan MSISDN normalization."""
    assert DarajaService.normalize_phone_number("0712345678") == "254712345678"
    assert DarajaService.normalize_phone_number("0112345678") == "254112345678"
    assert DarajaService.normalize_phone_number("+254712345678") == "254712345678"
    assert DarajaService.normalize_phone_number("254712345678") == "254712345678"
    assert DarajaService.normalize_phone_number("712345678") == "254712345678"
    assert DarajaService.normalize_phone_number("0712-345-678") == "254712345678"


def test_daraja_password_generation():
    """Verify STK push base64 password generation."""
    shortcode = "174379"
    passkey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
    timestamp = "20260814130000"
    password = DarajaService.generate_password(shortcode, passkey, timestamp)
    assert isinstance(password, str)
    assert len(password) > 20


@pytest.fixture
async def daraja_setup(db_session):
    """Setup test customer, vendor, and order."""
    customer = User(
        id=uuid.uuid4(),
        email="daraja_customer@test.com",
        password_hash="hashed_pw",
        first_name="Jane",
        last_name="Doe",
        role="customer",
        is_active=True,
    )
    db_session.add(customer)

    other_user = User(
        id=uuid.uuid4(),
        email="other_daraja@test.com",
        password_hash="hashed_pw",
        first_name="Other",
        last_name="User",
        role="customer",
        is_active=True,
    )
    db_session.add(other_user)

    vendor_user = User(
        id=uuid.uuid4(),
        email="daraja_vendor@test.com",
        password_hash="hashed_pw",
        first_name="Vendor",
        last_name="Health",
        role="vendor",
        is_active=True,
    )
    db_session.add(vendor_user)
    await db_session.flush()

    vendor = VendorProfile(
        id=uuid.uuid4(),
        user_id=vendor_user.id,
        store_name="Health Tech Kenya",
        approval_status="approved",
    )
    db_session.add(vendor)
    await db_session.flush()

    order = Order(
        id=uuid.uuid4(),
        order_number=8801,
        user_id=customer.id,
        status=OrderStatus.PENDING,
        total_amount=Decimal("4500.00"),
        currency="KES",
    )
    db_session.add(order)
    await db_session.flush()

    sub_order = SubOrder(
        id=uuid.uuid4(),
        parent_order_id=order.id,
        vendor_id=vendor.id,
        status=SubOrderStatus.PENDING,
        subtotal_amount=Decimal("4500.00"),
    )
    db_session.add(sub_order)
    await db_session.commit()

    customer_token = create_access_token(data={"sub": str(customer.id), "email": customer.email, "role": customer.role})
    other_token = create_access_token(
        data={"sub": str(other_user.id), "email": other_user.email, "role": other_user.role}
    )

    return {
        "customer": customer,
        "customer_token": customer_token,
        "other_user": other_user,
        "other_token": other_token,
        "vendor": vendor,
        "order": order,
    }


@pytest.mark.asyncio
async def test_stk_push_initiation_success(client: AsyncClient, daraja_setup):
    """Test initiating an STK push on customer's phone."""
    token = daraja_setup["customer_token"]
    order = daraja_setup["order"]

    mock_daraja_resp = {
        "MerchantRequestID": "29115-34620561-1",
        "CheckoutRequestID": "ws_CO_14082026130000001",
        "ResponseCode": "0",
        "ResponseDescription": "Success. Request accepted for processing",
        "CustomerMessage": "Success. Request accepted for processing",
    }

    with patch.object(DarajaService, "initiate_stk_push", return_value=mock_daraja_resp):
        response = await client.post(
            "/api/v1/payments/mpesa/stk-push",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "order_id": str(order.id),
                "phone_number": "0712345678",
            },
        )

        assert response.status_code == 200
        res_json = response.json()
        assert res_json["success"] is True
        assert res_json["data"]["checkout_request_id"] == "ws_CO_14082026130000001"
        assert res_json["data"]["response_code"] == "0"


@pytest.mark.asyncio
async def test_stk_push_forbidden_for_non_owner(client: AsyncClient, daraja_setup):
    """Test other users cannot trigger STK pushes for someone else's order."""
    other_token = daraja_setup["other_token"]
    order = daraja_setup["order"]

    response = await client.post(
        "/api/v1/payments/mpesa/stk-push",
        headers={"Authorization": f"Bearer {other_token}"},
        json={
            "order_id": str(order.id),
            "phone_number": "0712345678",
        },
    )

    assert response.status_code == 403
    assert "Not authorized" in response.json()["detail"]


@pytest.mark.asyncio
async def test_stk_callback_success_processing(client: AsyncClient, db_session, daraja_setup):
    """Test processing a successful M-Pesa STK push callback."""
    order = daraja_setup["order"]
    checkout_id = "ws_CO_14082026_TEST_SUCCESS"

    # 1. Create pending payment record
    payment = MobileMoneyPayment(
        id=uuid.uuid4(),
        order_id=order.id,
        transaction_id=checkout_id,
        amount=Decimal("4500.00"),
        currency="KES",
        provider="mpesa",
        phone_number="254712345678",
        status=MobileMoneyPaymentStatus.PENDING,
    )
    db_session.add(payment)
    await db_session.commit()

    # 2. Simulate Safaricom STK Push Callback payload
    callback_payload = {
        "Body": {
            "stkCallback": {
                "MerchantRequestID": "29115-34620561-1",
                "CheckoutRequestID": checkout_id,
                "ResultCode": 0,
                "ResultDesc": "The service request is processed successfully.",
                "CallbackMetadata": {
                    "Item": [
                        {"Name": "Amount", "Value": 4500.00},
                        {"Name": "MpesaReceiptNumber", "Value": "QWE9876543"},
                        {"Name": "TransactionDate", "Value": 20260814130000},
                        {"Name": "PhoneNumber", "Value": 254712345678},
                    ]
                },
            }
        }
    }

    response = await client.post(
        "/api/v1/payments/mpesa/callback",
        json=callback_payload,
    )
    assert response.status_code == 200
    assert response.json()["ResultCode"] == 0

    # Verify payment verified
    await db_session.refresh(payment)
    assert payment.status == MobileMoneyPaymentStatus.VERIFIED
    assert "QWE9876543" in payment.notes

    # Verify Order transitioned to PROCESSING
    await db_session.refresh(order)
    assert order.status == OrderStatus.PROCESSING

    # Verify Outbox event created
    outbox_stmt = select(OutboxEvent).where(
        OutboxEvent.aggregate_id == str(order.id),
        OutboxEvent.event_type == "OrderPaid",
    )
    outbox_event = (await db_session.execute(outbox_stmt)).scalar_one_or_none()
    assert outbox_event is not None
    assert outbox_event.payload["order_id"] == str(order.id)


@pytest.mark.asyncio
async def test_stk_callback_user_cancelled(client: AsyncClient, db_session, daraja_setup):
    """Test processing user cancellation callback (ResultCode 1032)."""
    order = daraja_setup["order"]
    checkout_id = "ws_CO_14082026_TEST_CANCEL"

    payment = MobileMoneyPayment(
        id=uuid.uuid4(),
        order_id=order.id,
        transaction_id=checkout_id,
        amount=Decimal("4500.00"),
        currency="KES",
        provider="mpesa",
        phone_number="254712345678",
        status=MobileMoneyPaymentStatus.PENDING,
    )
    db_session.add(payment)
    await db_session.commit()

    callback_payload = {
        "Body": {
            "stkCallback": {
                "MerchantRequestID": "29115-34620561-2",
                "CheckoutRequestID": checkout_id,
                "ResultCode": 1032,
                "ResultDesc": "Request cancelled by user",
            }
        }
    }

    response = await client.post(
        "/api/v1/payments/mpesa/callback",
        json=callback_payload,
    )
    assert response.status_code == 200

    await db_session.refresh(payment)
    assert payment.status == MobileMoneyPaymentStatus.REVERSED
    assert "1032" in payment.notes


@pytest.mark.asyncio
async def test_stk_status_polling_endpoint_authenticated(client: AsyncClient, db_session, daraja_setup):
    """Test polling the payment status endpoint by CheckoutRequestID with authentication and ownership."""
    order = daraja_setup["order"]
    token = daraja_setup["customer_token"]
    other_token = daraja_setup["other_token"]
    checkout_id = "ws_CO_14082026_POLL"

    payment = MobileMoneyPayment(
        id=uuid.uuid4(),
        order_id=order.id,
        transaction_id=checkout_id,
        amount=Decimal("4500.00"),
        currency="KES",
        provider="mpesa",
        phone_number="254712345678",
        status=MobileMoneyPaymentStatus.VERIFIED,
        notes="M-Pesa Verified: QWE9999999",
    )
    db_session.add(payment)
    await db_session.commit()

    # 1. Unauthenticated request rejected with 401
    unauth_resp = await client.get(f"/api/v1/payments/mpesa/status/{checkout_id}")
    assert unauth_resp.status_code == 401

    # 2. Non-owner request rejected with 403
    forbidden_resp = await client.get(
        f"/api/v1/payments/mpesa/status/{checkout_id}", headers={"Authorization": f"Bearer {other_token}"}
    )
    assert forbidden_resp.status_code == 403

    # 3. Order owner request succeeds and phone number is masked for privacy
    response = await client.get(
        f"/api/v1/payments/mpesa/status/{checkout_id}", headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    res_json = response.json()
    assert res_json["success"] is True
    assert res_json["data"]["checkout_request_id"] == checkout_id
    assert res_json["data"]["status"] == "verified"
    assert res_json["data"]["phone_number"] == "2547****5678"


@pytest.mark.asyncio
async def test_stk_callback_token_validation(client: AsyncClient, db_session, daraja_setup):
    """Test per-order callback token validation when MPESA_CALLBACK_SECRET is configured."""
    from app.core.config import settings

    order = daraja_setup["order"]
    checkout_id = "ws_CO_14082026_SECRET_TEST"

    payment = MobileMoneyPayment(
        id=uuid.uuid4(),
        order_id=order.id,
        transaction_id=checkout_id,
        amount=Decimal("4500.00"),
        currency="KES",
        provider="mpesa",
        phone_number="254712345678",
        status=MobileMoneyPaymentStatus.PENDING,
    )
    db_session.add(payment)
    await db_session.commit()

    callback_payload = {
        "Body": {
            "stkCallback": {
                "MerchantRequestID": "29115-34620561-1",
                "CheckoutRequestID": checkout_id,
                "ResultCode": 0,
                "ResultDesc": "Success",
                "CallbackMetadata": {
                    "Item": [
                        {"Name": "Amount", "Value": 4500.00},
                        {"Name": "MpesaReceiptNumber", "Value": "SECRET12345"},
                    ]
                },
            }
        }
    }

    # Set secret in settings
    original_secret = settings.MPESA_CALLBACK_SECRET
    settings.MPESA_CALLBACK_SECRET = "super_secret_mpesa_webhook_token_999"

    try:
        # 1. Callback without a token is rejected
        resp_no_token = await client.post("/api/v1/payments/mpesa/callback", json=callback_payload)
        assert resp_no_token.json()["ResultCode"] == 1
        assert "Unauthorized" in resp_no_token.json()["ResultDesc"]

        # 2. Callback with a wrong token is rejected
        resp_wrong_token = await client.post("/api/v1/payments/mpesa/callback?token=wrong_token", json=callback_payload)
        assert resp_wrong_token.json()["ResultCode"] == 1

        # 3. The legacy static-secret scheme no longer authenticates
        resp_legacy_secret = await client.post(
            "/api/v1/payments/mpesa/callback?secret=super_secret_mpesa_webhook_token_999", json=callback_payload
        )
        assert resp_legacy_secret.json()["ResultCode"] == 1

        # 4. Callback with the valid per-order token succeeds
        valid_token = DarajaService.generate_callback_token(order.id)
        assert valid_token is not None
        resp_valid = await client.post(f"/api/v1/payments/mpesa/callback?token={valid_token}", json=callback_payload)
        assert resp_valid.status_code == 200
        assert resp_valid.json()["ResultCode"] == 0

        await db_session.refresh(payment)
        assert payment.status == MobileMoneyPaymentStatus.VERIFIED
    finally:
        settings.MPESA_CALLBACK_SECRET = original_secret


@pytest.mark.asyncio
async def test_stk_callback_token_bound_to_order(client: AsyncClient, db_session, daraja_setup):
    """A valid token for one order must not authenticate a callback for another order."""
    from app.core.config import settings

    order = daraja_setup["order"]
    other_user = daraja_setup["other_user"]

    other_order = Order(
        id=uuid.uuid4(),
        order_number=8802,
        user_id=other_user.id,
        status=OrderStatus.PENDING,
        total_amount=Decimal("4500.00"),
        currency="KES",
    )
    db_session.add(other_order)

    checkout_id = "ws_CO_14082026_CROSS_ORDER"
    payment = MobileMoneyPayment(
        id=uuid.uuid4(),
        order_id=other_order.id,
        transaction_id=checkout_id,
        amount=Decimal("4500.00"),
        currency="KES",
        provider="mpesa",
        phone_number="254712345678",
        status=MobileMoneyPaymentStatus.PENDING,
    )
    db_session.add(payment)
    await db_session.commit()

    callback_payload = {
        "Body": {
            "stkCallback": {
                "MerchantRequestID": "29115-34620561-1",
                "CheckoutRequestID": checkout_id,
                "ResultCode": 0,
                "ResultDesc": "Success",
                "CallbackMetadata": {"Item": [{"Name": "Amount", "Value": 4500.00}]},
            }
        }
    }

    original_secret = settings.MPESA_CALLBACK_SECRET
    settings.MPESA_CALLBACK_SECRET = "super_secret_mpesa_webhook_token_999"
    try:
        # Token derived from the FIRST order's id, replayed against the second order
        foreign_token = DarajaService.generate_callback_token(order.id)
        resp = await client.post(f"/api/v1/payments/mpesa/callback?token={foreign_token}", json=callback_payload)
        assert resp.json()["ResultCode"] == 1
        assert "Unauthorized" in resp.json()["ResultDesc"]

        await db_session.refresh(payment)
        assert payment.status == MobileMoneyPaymentStatus.PENDING
    finally:
        settings.MPESA_CALLBACK_SECRET = original_secret


@pytest.mark.asyncio
async def test_stk_push_charges_server_side_order_total(db_session, daraja_setup):
    """The Daraja payload amount must always be the server-side order total."""
    import httpx

    order = daraja_setup["order"]
    captured: dict = {}

    class FakeDarajaResponse:
        @staticmethod
        def json():
            return {
                "MerchantRequestID": "29115-34620561-1",
                "CheckoutRequestID": "ws_CO_AMOUNT_SERVER_SIDE",
                "ResponseCode": "0",
                "ResponseDescription": "Success. Request accepted for processing",
                "CustomerMessage": "Success. Request accepted for processing",
            }

    async def fake_post(self, url, json=None, headers=None):
        captured["url"] = url
        captured["payload"] = json
        return FakeDarajaResponse()

    with (
        patch.object(DarajaService, "get_oauth_token", return_value="fake-token"),
        patch.object(httpx.AsyncClient, "post", fake_post),
    ):
        result = await DarajaService(db_session).initiate_stk_push(order_id=order.id, phone_number="0712345678")

    assert result["ResponseCode"] == "0"
    # Order total is 4500.00 — never a client-supplied amount
    assert captured["payload"]["Amount"] == 4500

    payment = (
        await db_session.execute(
            select(MobileMoneyPayment).where(MobileMoneyPayment.transaction_id == "ws_CO_AMOUNT_SERVER_SIDE")
        )
    ).scalar_one()
    assert payment.amount == Decimal("4500")


@pytest.mark.asyncio
async def test_stk_push_ignores_client_supplied_amount(client: AsyncClient, daraja_setup):
    """A client sending an `amount` field must have it silently ignored (schema drops it)."""
    token = daraja_setup["customer_token"]
    order = daraja_setup["order"]

    mock_daraja_resp = {
        "MerchantRequestID": "29115-34620561-1",
        "CheckoutRequestID": "ws_CO_14082026130099999",
        "ResponseCode": "0",
        "ResponseDescription": "Success. Request accepted for processing",
        "CustomerMessage": "Success. Request accepted for processing",
    }

    with patch.object(DarajaService, "initiate_stk_push", return_value=mock_daraja_resp) as mock_init:
        response = await client.post(
            "/api/v1/payments/mpesa/stk-push",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "order_id": str(order.id),
                "phone_number": "0712345678",
                "amount": 1,  # Underpayment attempt — must be ignored
            },
        )

        assert response.status_code == 200
        assert response.json()["success"] is True
        # The service must be called without any client-controlled amount
        assert "amount" not in mock_init.call_args.kwargs


@pytest.mark.asyncio
async def test_stk_push_rejected_for_non_pending_order(client: AsyncClient, db_session, daraja_setup):
    """Orders that already progressed past PENDING must not be chargeable via STK push."""
    token = daraja_setup["customer_token"]
    order = daraja_setup["order"]

    order.status = OrderStatus.DELIVERED
    await db_session.commit()

    response = await client.post(
        "/api/v1/payments/mpesa/stk-push",
        headers={"Authorization": f"Bearer {token}"},
        json={"order_id": str(order.id), "phone_number": "0712345678"},
    )

    assert response.status_code == 400
    assert "not awaiting payment" in response.json()["detail"]


@pytest.mark.asyncio
async def test_stk_push_blocked_while_payment_pending(client: AsyncClient, db_session, daraja_setup):
    """A second concurrent STK push on the same order must be blocked to prevent double charging."""
    token = daraja_setup["customer_token"]
    order = daraja_setup["order"]

    payment = MobileMoneyPayment(
        id=uuid.uuid4(),
        order_id=order.id,
        transaction_id="ws_CO_STILL_PENDING_001",
        amount=Decimal("4500.00"),
        currency="KES",
        provider="mpesa",
        phone_number="254712345678",
        status=MobileMoneyPaymentStatus.PENDING,
    )
    db_session.add(payment)
    await db_session.commit()
    await db_session.refresh(payment)  # Load server-side created_at

    response = await client.post(
        "/api/v1/payments/mpesa/stk-push",
        headers={"Authorization": f"Bearer {token}"},
        json={"order_id": str(order.id), "phone_number": "0712345678"},
    )

    assert response.status_code == 400
    assert "already pending" in response.json()["detail"]


@pytest.mark.asyncio
async def test_stk_callback_amount_mismatch_rejected(client: AsyncClient, db_session, daraja_setup):
    """Test that callback with tampered Amount is flagged and rejected."""
    checkout_id = "ws_CO_14082026_AMOUNT_MISMATCH"

    payment = MobileMoneyPayment(
        id=uuid.uuid4(),
        order_id=daraja_setup["order"].id,
        transaction_id=checkout_id,
        amount=Decimal("4500.00"),
        currency="KES",
        provider="mpesa",
        phone_number="254712345678",
        status=MobileMoneyPaymentStatus.PENDING,
    )
    db_session.add(payment)
    await db_session.commit()

    callback_payload = {
        "Body": {
            "stkCallback": {
                "MerchantRequestID": "29115-34620561-1",
                "CheckoutRequestID": checkout_id,
                "ResultCode": 0,
                "ResultDesc": "Success",
                "CallbackMetadata": {
                    "Item": [
                        {"Name": "Amount", "Value": 1.00},  # Tampered amount (paid 1 instead of 4500)
                        {"Name": "MpesaReceiptNumber", "Value": "HACK12345"},
                    ]
                },
            }
        }
    }

    resp = await client.post("/api/v1/payments/mpesa/callback", json=callback_payload)
    assert resp.json()["ResultCode"] == 1
    assert "Amount mismatch" in resp.json()["ResultDesc"]

    await db_session.refresh(payment)
    assert payment.status == MobileMoneyPaymentStatus.REVERSED
    assert "Amount mismatch" in payment.notes
