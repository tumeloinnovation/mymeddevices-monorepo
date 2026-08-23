"""
M-Pesa Daraja STK Push Integration Service

Provides production-grade, resilient integration with Safaricom Daraja API:
- Dual-environment support (Sandbox vs Production)
- OAuth token caching with automatic expiry renewal
- Phone number normalization (Kenyan MSISDN 254...)
- STK Push initiation & STK status polling
- Idempotent callback processing with Outbox event emission
"""

import base64
import re
import uuid
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.domains.shared.models.outbox import OutboxEvent, OutboxStatus
from app.domains.shopping.models.mobile_money_payment import (
    MobileMoneyPayment,
    MobileMoneyPaymentStatus,
)
from app.domains.shopping.models.order import Order, OrderStatus, OrderTimelineEvent


class DarajaService:
    """Service handling all Safaricom Daraja API communication."""

    # In-memory OAuth token cache: (token, expiry_datetime_utc)
    _cached_token: tuple[str, datetime] | None = None

    def __init__(self, db: AsyncSession):
        self.db = db
        self.env = (settings.MPESA_ENVIRONMENT or "sandbox").lower()
        if self.env == "production":
            self.base_url = "https://api.safaricom.co.ke"
        else:
            self.base_url = "https://sandbox.safaricom.co.ke"

        self.consumer_key = settings.MPESA_CONSUMER_KEY or ""
        self.consumer_secret = settings.MPESA_CONSUMER_SECRET or ""
        self.passkey = settings.MPESA_PASSKEY or "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
        self.shortcode = settings.MPESA_SHORTCODE or "174379"
        self.callback_url = settings.MPESA_CALLBACK_URL or "https://api.mymeddevices.com/api/v1/shopping/mpesa/callback"
        self.timeout = getattr(settings, "MPESA_TIMEOUT_SECONDS", 15.0)

    @classmethod
    def normalize_phone_number(cls, phone: str) -> str:
        """
        Normalize Kenyan phone numbers to standard 254XXXXXXXXX format.
        Supports:
        - 0712345678 -> 254712345678
        - 0112345678 -> 254112345678
        - +254712345678 -> 254712345678
        - 254712345678 -> 254712345678
        - 712345678 -> 254712345678
        """
        cleaned = re.sub(r"[\s\-\+]", "", str(phone))
        if cleaned.startswith("0") and len(cleaned) == 10:
            return "254" + cleaned[1:]
        elif cleaned.startswith("254") and len(cleaned) == 12:
            return cleaned
        elif len(cleaned) == 9 and (cleaned.startswith("7") or cleaned.startswith("1")):
            return "254" + cleaned
        elif cleaned.startswith("+254"):
            return cleaned[1:]
        return cleaned

    @classmethod
    def generate_password(cls, shortcode: str, passkey: str, timestamp_str: str) -> str:
        """Generate base64 encoded password for Daraja STK Push."""
        data_to_encode = f"{shortcode}{passkey}{timestamp_str}"
        return base64.b64encode(data_to_encode.encode("utf-8")).decode("utf-8")

    async def get_oauth_token(self) -> str:
        """
        Fetch OAuth access token from Daraja API with automatic caching.
        """
        now = datetime.now(UTC)
        if DarajaService._cached_token:
            token, expiry = DarajaService._cached_token
            if now < expiry:
                return token

        auth_url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.get(
                    auth_url,
                    auth=(self.consumer_key, self.consumer_secret),
                )
                response.raise_for_status()
                data = response.json()
                access_token = data.get("access_token")
                expires_in = int(data.get("expires_in", 3599))
                # Cache token with 60 second safety buffer
                from datetime import timedelta

                expiry = now + timedelta(seconds=max(expires_in - 60, 60))
                DarajaService._cached_token = (access_token, expiry)
                return access_token
            except Exception as e:
                logger.error(f"Daraja OAuth authentication failed: {e}")
                raise

    async def initiate_stk_push(
        self,
        order_id: uuid.UUID,
        phone_number: str,
        amount: Decimal | None = None,
        account_reference: str | None = None,
    ) -> dict[str, Any]:
        """
        Initiate an STK Push payment prompt on the customer's phone.
        """
        order_stmt = select(Order).where(Order.id == order_id)
        order_result = await self.db.execute(order_stmt)
        order = order_result.scalar_one_or_none()

        if not order:
            raise ValueError("Order not found")

        final_amount = amount if amount is not None else order.total_amount
        # Amount must be integer KES for Safaricom Daraja STK Push
        numeric_amount = int(round(float(final_amount)))
        if numeric_amount <= 0:
            raise ValueError("Payment amount must be greater than zero")

        normalized_phone = self.normalize_phone_number(phone_number)
        if not re.match(r"^254[71]\d{8}$", normalized_phone):
            raise ValueError(f"Invalid Kenyan phone number for M-Pesa: {phone_number}")

        timestamp_str = datetime.now(UTC).strftime("%Y%m%d%H%M%S")
        password = self.generate_password(self.shortcode, self.passkey, timestamp_str)
        ref = account_reference or f"ORD-{order.order_number or str(order.id)[:8]}"

        token = await self.get_oauth_token()
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        callback_url = self.callback_url
        if settings.MPESA_CALLBACK_SECRET and "secret=" not in callback_url:
            separator = "&" if "?" in callback_url else "?"
            callback_url = f"{callback_url}{separator}secret={settings.MPESA_CALLBACK_SECRET}"

        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp_str,
            "TransactionType": "CustomerPayBillOnline",
            "Amount": numeric_amount,
            "PartyA": normalized_phone,
            "PartyB": self.shortcode,
            "PhoneNumber": normalized_phone,
            "CallBackURL": callback_url,
            "AccountReference": ref[:12],
            "TransactionDesc": f"Payment for Order {ref}"[:13],
        }

        stk_url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                resp = await client.post(stk_url, json=payload, headers=headers)
                resp_data = resp.json()

                checkout_req_id = resp_data.get("CheckoutRequestID")
                merchant_req_id = resp_data.get("MerchantRequestID")
                response_code = str(resp_data.get("ResponseCode", "1"))

                if response_code == "0" and checkout_req_id:
                    # Record pending payment in database
                    payment = MobileMoneyPayment(
                        id=uuid.uuid4(),
                        order_id=order.id,
                        transaction_id=checkout_req_id,
                        amount=Decimal(str(numeric_amount)),
                        currency="KES",
                        provider="mpesa",
                        phone_number=normalized_phone,
                        status=MobileMoneyPaymentStatus.PENDING,
                        notes=f"STK Push initiated: MerchantReq={merchant_req_id}",
                    )
                    self.db.add(payment)
                    await self.db.commit()

                return resp_data
            except Exception as e:
                logger.error(f"Failed to initiate Daraja STK Push: {e}")
                raise

    async def query_stk_status(self, checkout_request_id: str) -> dict[str, Any]:
        """
        Query Daraja STK Push status by CheckoutRequestID.
        """
        timestamp_str = datetime.now(UTC).strftime("%Y%m%d%H%M%S")
        password = self.generate_password(self.shortcode, self.passkey, timestamp_str)
        token = await self.get_oauth_token()

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        payload = {
            "BusinessShortCode": self.shortcode,
            "Password": password,
            "Timestamp": timestamp_str,
            "CheckoutRequestID": checkout_request_id,
        }

        query_url = f"{self.base_url}/mpesa/stkpushquery/v1/query"
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(query_url, json=payload, headers=headers)
            return resp.json()

    async def process_stk_callback(self, callback_body: dict[str, Any]) -> dict[str, Any]:
        """
        Process incoming webhook callback from Safaricom Daraja STK push.
        Idempotent: Re-receiving callback returns success without re-crediting.
        """
        stk_callback = callback_body.get("Body", {}).get("stkCallback", {})
        stk_callback.get("MerchantRequestID")
        checkout_req_id = stk_callback.get("CheckoutRequestID")
        result_code = stk_callback.get("ResultCode")
        result_desc = stk_callback.get("ResultDesc", "")

        if not checkout_req_id:
            logger.warning("Daraja callback received without CheckoutRequestID")
            return {"status": "ignored", "reason": "Missing CheckoutRequestID"}

        # Find associated payment record with row lock to serialize concurrent callbacks
        stmt = (
            select(MobileMoneyPayment)
            .where(MobileMoneyPayment.transaction_id == checkout_req_id)
            .with_for_update()
        )
        result = await self.db.execute(stmt)
        payment = result.scalar_one_or_none()

        if not payment:
            logger.warning(f"No payment record found for CheckoutRequestID: {checkout_req_id}")
            return {"status": "not_found", "checkout_request_id": checkout_req_id}

        # 1. Success case (ResultCode == 0)
        if result_code == 0:
            if payment.status == MobileMoneyPaymentStatus.VERIFIED:
                return {"status": "already_verified", "checkout_request_id": checkout_req_id}

            metadata_items = stk_callback.get("CallbackMetadata", {}).get("Item", [])
            metadata = {item.get("Name"): item.get("Value") for item in metadata_items if "Name" in item}
            mpesa_receipt = str(metadata.get("MpesaReceiptNumber", checkout_req_id))

            # Validate Amount if present in CallbackMetadata
            if "Amount" in metadata and metadata["Amount"] is not None:
                try:
                    cb_amount = Decimal(str(metadata["Amount"]))
                    if abs(cb_amount - payment.amount) > Decimal("0.01"):
                        logger.error(
                            f"M-Pesa payment amount mismatch for {checkout_req_id}: "
                            f"expected {payment.amount}, received {cb_amount}"
                        )
                        payment.status = MobileMoneyPaymentStatus.REVERSED
                        payment.notes = f"Amount mismatch: expected {payment.amount}, got {cb_amount}"
                        await self.db.commit()
                        return {"status": "amount_mismatch", "checkout_request_id": checkout_req_id}
                except (ValueError, TypeError) as e:
                    logger.warning(f"Could not parse callback amount: {e}")

            payment.status = MobileMoneyPaymentStatus.VERIFIED
            payment.notes = f"M-Pesa Verified: {mpesa_receipt} ({result_desc})"

            # Update Order status under row lock
            order_stmt = select(Order).where(Order.id == payment.order_id).with_for_update()
            order_res = await self.db.execute(order_stmt)
            order = order_res.scalar_one_or_none()

            if order and order.status != OrderStatus.PROCESSING:
                order.status = OrderStatus.PROCESSING
                timeline = OrderTimelineEvent(
                    id=uuid.uuid4(),
                    order_id=order.id,
                    status=OrderStatus.PROCESSING.value,
                    message=f"M-Pesa payment received: {mpesa_receipt}",
                )
                self.db.add(timeline)

                # Emit OrderPaid event for vendor ledger processing
                from app.domains.shopping.models.sub_order import SubOrder

                sub_orders_stmt = select(SubOrder).where(SubOrder.parent_order_id == order.id)
                sub_orders = (await self.db.execute(sub_orders_stmt)).scalars().all()

                outbox_event = OutboxEvent(
                    id=uuid.uuid4(),
                    aggregate_type="Order",
                    aggregate_id=str(order.id),
                    event_type="OrderPaid",
                    payload={
                        "order_id": str(order.id),
                        "total_amount": float(order.total_amount),
                        "sub_orders": [
                            {
                                "sub_order_id": str(so.id),
                                "vendor_id": str(so.vendor_id),
                                "subtotal_amount": float(so.subtotal_amount),
                                "items": [],
                            }
                            for so in sub_orders
                        ],
                    },
                    status=OutboxStatus.PENDING,
                )
                self.db.add(outbox_event)

            await self.db.commit()
            return {"status": "verified", "mpesa_receipt": mpesa_receipt}

        # 2. Failed / Cancelled by user
        else:
            payment.status = MobileMoneyPaymentStatus.REVERSED
            payment.notes = f"M-Pesa STK Failed (Code {result_code}): {result_desc}"
            await self.db.commit()
            return {"status": "failed", "result_code": result_code, "result_desc": result_desc}
