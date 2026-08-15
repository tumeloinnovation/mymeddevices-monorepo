"""
M-Pesa Daraja STK Push API Endpoints
"""

import hmac
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user_optional
from app.core.logging import logger
from app.core.rate_limiting import RateLimiterDependency
from app.core.responses import ApiSuccessResponse, success_response
from app.domains.auth.models.user import User
from app.domains.shopping.models.mobile_money_payment import MobileMoneyPayment
from app.domains.shopping.models.order import Order
from app.domains.shopping.schemas.mpesa_schemas import (
    MpesaStatusResponse,
    MpesaStkPushRequest,
    MpesaStkPushResponse,
)
from app.domains.shopping.services.daraja_service import DarajaService

router = APIRouter(prefix="/shopping/mpesa", tags=["M-Pesa Payments"])


@router.post(
    "/stk-push",
    response_model=ApiSuccessResponse[MpesaStkPushResponse],
    dependencies=[Depends(RateLimiterDependency("stk_push"))],
)
async def initiate_mpesa_stk_push(
    data: MpesaStkPushRequest,
    current_user: Annotated[User | None, Depends(get_current_user_optional)],
    db: AsyncSession = Depends(get_db),
):
    """
    Initiate Safaricom Daraja STK Push prompt on customer phone.
    """
    # 1. Fetch order
    order_stmt = select(Order).where(Order.id == data.order_id)
    order_result = await db.execute(order_stmt)
    order = order_result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # 2. Authorization check: if authenticated user, ensure they own the order unless admin/worker
    if current_user and current_user.role not in ("admin", "worker"):
        if order.user_id and order.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to pay for this order")

    # 3. Call Daraja Service
    daraja_service = DarajaService(db)
    try:
        result = await daraja_service.initiate_stk_push(
            order_id=order.id,
            phone_number=data.phone_number,
            amount=data.amount,
        )
        return success_response(
            data=MpesaStkPushResponse(
                merchant_request_id=result.get("MerchantRequestID"),
                checkout_request_id=result.get("CheckoutRequestID"),
                response_code=str(result.get("ResponseCode", "")),
                response_description=result.get("ResponseDescription"),
                customer_message=result.get("CustomerMessage"),
            )
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"M-Pesa payment gateway error: {str(e)}")


@router.post(
    "/callback",
    dependencies=[Depends(RateLimiterDependency("mpesa_callback"))],
)
async def mpesa_stk_callback(
    request: Request,
    secret: str | None = Query(None),
    x_callback_secret: str | None = Header(None, alias="X-Callback-Secret"),
    db: AsyncSession = Depends(get_db),
):
    """
    Public webhook receiver for Safaricom Daraja STK Push callbacks.
    Guarded with optional callback secret validation, rate limiting, and integrity checks.
    """
    # Verify shared secret if configured in settings
    if settings.MPESA_CALLBACK_SECRET:
        provided_secret = secret or x_callback_secret
        if not provided_secret or not hmac.compare_digest(provided_secret, settings.MPESA_CALLBACK_SECRET):
            client_ip = request.client.host if request.client else "unknown"
            logger.warning(f"Rejected unauthenticated M-Pesa callback from IP {client_ip}: Invalid secret")
            return {"ResultCode": 1, "ResultDesc": "Unauthorized: Invalid callback secret"}

    try:
        body = await request.json()
    except Exception:
        return {"ResultCode": 1, "ResultDesc": "Invalid JSON body"}

    daraja_service = DarajaService(db)
    try:
        res = await daraja_service.process_stk_callback(body)
        if res.get("status") == "amount_mismatch":
            return {"ResultCode": 1, "ResultDesc": "Amount mismatch"}
    except Exception as e:
        logger.error(f"Error handling M-Pesa STK callback: {e}")
        # We still acknowledge 0 to Safaricom to prevent callback storms
        pass

    return {"ResultCode": 0, "ResultDesc": "Accepted"}


@router.get(
    "/status/{checkout_request_id}",
    response_model=ApiSuccessResponse[MpesaStatusResponse],
    dependencies=[Depends(RateLimiterDependency("mpesa_status"))],
)
async def get_mpesa_payment_status(
    checkout_request_id: str,
    guest_token: str | None = Query(None),
    current_user: Annotated[User | None, Depends(get_current_user_optional)] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Poll status of an M-Pesa STK push payment by CheckoutRequestID.
    Guarded with authorization verification and rate limiting.
    """
    stmt = select(MobileMoneyPayment).where(MobileMoneyPayment.transaction_id == checkout_request_id)
    result = await db.execute(stmt)
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="M-Pesa payment record not found")

    # Check order ownership to protect PII and order payment status
    order = await db.get(Order, payment.order_id)
    if order:
        if order.user_id:
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required to view payment status"
                )
            if current_user.id != order.user_id and current_user.role not in ("admin", "worker"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to view this payment status",
                )
        elif order.guest_token:
            if not guest_token or guest_token != order.guest_token:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, detail="Invalid or missing guest token for order"
                )

    # Mask phone number for privacy
    phone = payment.phone_number
    masked_phone = f"{phone[:4]}****{phone[-4:]}" if phone and len(phone) >= 8 else phone

    return success_response(
        data=MpesaStatusResponse(
            checkout_request_id=checkout_request_id,
            status=payment.status.value if hasattr(payment.status, "value") else str(payment.status),
            amount=payment.amount,
            phone_number=masked_phone,
            notes=payment.notes,
        )
    )
