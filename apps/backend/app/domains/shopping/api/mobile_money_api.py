"""
Mobile Money Payment API

Admin-only endpoints for recording and managing mobile money payments.
"""

import uuid
from datetime import UTC, datetime
from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import require_role
from app.core.responses import ApiSuccessResponse, success_response
from app.domains.auth.models.user import User
from app.domains.shared.models.outbox import OutboxEvent, OutboxStatus
from app.domains.shopping.models.mobile_money_payment import MobileMoneyPayment, MobileMoneyPaymentStatus
from app.domains.shopping.models.order import Order, OrderStatus
from app.domains.shopping.models.sub_order import SubOrder
from app.domains.shopping.schemas.mobile_money_schemas import (
    MobileMoneyPaymentListResponse,
    MobileMoneyPaymentRecord,
    MobileMoneyPaymentResponse,
    MobileMoneyRefundCreate,
)

router = APIRouter(prefix="/admin/shopping/mobile-money", tags=["Mobile Money Payments"])


def validate_transaction_id_format(transaction_id: str) -> str:
    """
    Validate and clean transaction ID format.

    Based on research of African mobile money providers:
    - M-Pesa: 10 alphanumeric characters
    - Others: 8-20 alphanumeric characters

    This provides flexible validation for multiple providers.
    """
    import re

    # Remove spaces and hyphens, convert to uppercase
    cleaned = re.sub(r"[\s\-]", "", transaction_id.upper())

    # Validate: 8-50 alphanumeric characters
    if not re.match(r"^[A-Z0-9]{8,50}$", cleaned):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transaction ID must be 8-50 alphanumeric characters (letters and numbers only)",
        )

    return cleaned


@router.post("/record", response_model=ApiSuccessResponse[MobileMoneyPaymentResponse])
async def record_mobile_money_payment(
    data: MobileMoneyPaymentRecord,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db),
):
    """
    Record that a customer has paid via mobile money.

    This endpoint is used by admins to mark an order as paid when
    a customer has paid via mobile money (M-Pesa, Airtel, MTN, etc.)

    Flow:
    1. Customer pays via mobile money to company phone
    2. Customer shares transaction ID with company
    3. Admin verifies payment (via SMS/app)
    4. Admin records payment with transaction ID
    5. Order is marked as paid

    The transaction ID is stored for:
    - Reconciliation and audit trail
    - Future refund processing
    - Dispute resolution
    """
    # Validate transaction ID format
    cleaned_transaction_id = validate_transaction_id_format(data.transaction_id)

    # Check if order exists (with sub_orders and items loaded for financial ledger crediting)
    order_stmt = (
        select(Order)
        .where(Order.id == data.order_id)
        .options(selectinload(Order.sub_orders).selectinload(SubOrder.items))
    )
    order_result = await db.execute(order_stmt)
    order = order_result.scalar_one_or_none()

    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.status in (OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order is already in status '{order.status.value}' and cannot receive another payment.",
        )

    # Check if order already has a mobile money payment
    existing_payment_stmt = select(MobileMoneyPayment).where(
        MobileMoneyPayment.order_id == data.order_id, MobileMoneyPayment.status != MobileMoneyPaymentStatus.REFUNDED
    )
    existing_result = await db.execute(existing_payment_stmt)
    existing_payment = existing_result.scalar_one_or_none()

    if existing_payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Order already has an active mobile money payment: {existing_payment.transaction_id}",
        )

    # Check if transaction ID was already used (prevent duplicate recording)
    duplicate_stmt = select(MobileMoneyPayment).where(
        MobileMoneyPayment.transaction_id == cleaned_transaction_id,
        MobileMoneyPayment.status != MobileMoneyPaymentStatus.REVERSED,
    )
    duplicate_result = await db.execute(duplicate_stmt)
    duplicate_payment = duplicate_result.scalar_one_or_none()

    if duplicate_payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transaction ID {cleaned_transaction_id} is already linked to order {duplicate_payment.order_id}",
        )

    # Create mobile money payment record
    payment = MobileMoneyPayment(
        id=uuid.uuid4(),
        order_id=data.order_id,
        transaction_id=cleaned_transaction_id,
        amount=Decimal(str(order.total_amount)),
        currency=order.currency,
        provider=data.provider.lower(),
        phone_number=data.phone_number,
        status=MobileMoneyPaymentStatus.VERIFIED,
        notes=data.notes,
    )
    db.add(payment)

    # Create outbox event for payment recording
    outbox_event = OutboxEvent(
        id=uuid.uuid4(),
        aggregate_type="MobileMoneyPayment",
        aggregate_id=str(payment.id),
        event_type="MobileMoneyPaymentRecorded",
        payload={
            "payment_id": str(payment.id),
            "order_id": str(order.id),
            "transaction_id": payment.transaction_id,
            "amount": float(payment.amount),
            "provider": payment.provider,
            "recorded_by": str(current_user.id),
        },
        status=OutboxStatus.PENDING,
    )
    db.add(outbox_event)

    # Build sub-order events payload for domain OrderPaid event
    sub_orders_payload = []
    if order.sub_orders:
        for so in order.sub_orders:
            sub_orders_payload.append(
                {
                    "sub_order_id": str(so.id),
                    "vendor_id": str(so.vendor_id),
                    "subtotal_amount": float(so.subtotal_amount),
                    "items": [
                        {
                            "product_id": str(item.product_id),
                            "quantity": int(item.quantity),
                            "unit_price": float(item.unit_price),
                        }
                        for item in so.items
                    ],
                }
            )

    order_paid_event = OutboxEvent(
        id=uuid.uuid4(),
        aggregate_type="Order",
        aggregate_id=str(order.id),
        event_type="OrderPaid",
        payload={
            "order_id": str(order.id),
            "customer_id": str(order.user_id) if order.user_id else None,
            "total_amount": float(order.total_amount),
            "payment_method": f"mobile_money_{data.provider.lower()}",
            "mpesa_receipt": cleaned_transaction_id,
            "sub_orders": sub_orders_payload,
            "created_at": datetime.now(UTC).isoformat(),
        },
        status=OutboxStatus.PENDING,
    )
    db.add(order_paid_event)

    # Update order status to processing (paid orders move forward)
    if order.status == OrderStatus.PENDING:
        order.status = OrderStatus.PROCESSING

        # Create timeline event
        from app.domains.shopping.models.order import OrderTimelineEvent

        timeline_event = OrderTimelineEvent(
            id=uuid.uuid4(),
            order_id=order.id,
            status=OrderStatus.PROCESSING.value,
            message=f"Mobile money payment received via {data.provider}: {cleaned_transaction_id}",
            created_by=current_user.id,
        )
        db.add(timeline_event)

    await db.commit()
    await db.refresh(payment)

    return success_response(payment)


@router.post("/{payment_id}/refund", response_model=ApiSuccessResponse[MobileMoneyPaymentResponse])
async def refund_mobile_money_payment(
    payment_id: uuid.UUID,
    data: MobileMoneyRefundCreate,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db),
):
    """
    Process a refund for a mobile money payment.

    Manual refund flow:
    1. Admin verifies refund request
    2. Admin sends refund via their mobile money
    3. Admin gets new transaction ID for the refund
    4. Admin records refund with the new transaction ID
    5. System stores both original and refund transaction IDs

    This creates a full audit trail for:
    - Original payment (transaction_id)
    - Refund payment (refund_transaction_id)
    - Refund amount (may differ from original)
    - Refund reason
    - Who processed the refund
    """
    # Validate refund transaction ID format
    cleaned_refund_id = validate_transaction_id_format(data.refund_transaction_id)

    # Get the payment
    payment_stmt = select(MobileMoneyPayment).where(MobileMoneyPayment.id == payment_id)
    payment_result = await db.execute(payment_stmt)
    payment = payment_result.scalar_one_or_none()

    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mobile money payment not found")

    if payment.status == MobileMoneyPaymentStatus.REFUNDED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment has already been refunded")

    if payment.status == MobileMoneyPaymentStatus.REVERSED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Payment has been reversed and cannot be refunded"
        )

    # Check if refund transaction ID was already used
    duplicate_refund_stmt = select(MobileMoneyPayment).where(
        MobileMoneyPayment.refund_transaction_id == cleaned_refund_id
    )
    duplicate_refund_result = await db.execute(duplicate_refund_stmt)
    duplicate_refund = duplicate_refund_result.scalar_one_or_none()

    if duplicate_refund:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Refund transaction ID {cleaned_refund_id} is already linked to another refund",
        )

    # Determine refund amount (default to original amount)
    refund_amount = data.refund_amount if data.refund_amount is not None else float(payment.amount)

    if refund_amount > float(payment.amount):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Refund amount cannot exceed original payment amount ({payment.amount})",
        )

    # Update payment with refund details
    payment.refund_transaction_id = cleaned_refund_id
    payment.refund_amount = Decimal(str(refund_amount))
    payment.refund_reason = data.refund_reason
    payment.refunded_at = datetime.now(UTC)
    payment.refunded_by_id = current_user.id
    payment.status = MobileMoneyPaymentStatus.REFUNDED

    # Get the associated order
    order_stmt = select(Order).where(Order.id == payment.order_id)
    order_result = await db.execute(order_stmt)
    order = order_result.scalar_one_or_none()

    # Update order status if applicable
    if order and order.status != OrderStatus.REFUNDED:
        order.status = OrderStatus.REFUNDED

        # Create timeline event
        from app.domains.shopping.models.order import OrderTimelineEvent

        timeline_event = OrderTimelineEvent(
            id=uuid.uuid4(),
            order_id=order.id,
            status=OrderStatus.REFUNDED.value,
            message=f"Refund processed via {payment.provider}: {cleaned_refund_id} (amount: {refund_amount})",
            created_by=current_user.id,
        )
        db.add(timeline_event)

    # Create outbox event for refund
    outbox_event = OutboxEvent(
        id=uuid.uuid4(),
        aggregate_type="MobileMoneyPayment",
        aggregate_id=str(payment.id),
        event_type="MobileMoneyPaymentRefunded",
        payload={
            "payment_id": str(payment.id),
            "order_id": str(payment.order_id),
            "original_transaction_id": payment.transaction_id,
            "refund_transaction_id": cleaned_refund_id,
            "refund_amount": refund_amount,
            "refund_reason": data.refund_reason,
            "refunded_by": str(current_user.id),
        },
        status=OutboxStatus.PENDING,
    )
    db.add(outbox_event)

    await db.commit()
    await db.refresh(payment)

    return success_response(payment)


@router.get("", response_model=ApiSuccessResponse[MobileMoneyPaymentListResponse])
async def list_mobile_money_payments(
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    order_id: uuid.UUID | None = Query(None),
    status: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    List all mobile money payments with optional filters.

    Admins can view all mobile money payments for reconciliation and audit purposes.
    """
    # Build base query
    conditions = []

    if order_id:
        conditions.append(MobileMoneyPayment.order_id == order_id)

    if status:
        conditions.append(MobileMoneyPayment.status == status)

    # Count query
    count_stmt = select(func.count(MobileMoneyPayment.id))
    for condition in conditions:
        count_stmt = count_stmt.where(condition)

    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one()

    # Main query with pagination
    stmt = select(MobileMoneyPayment).order_by(MobileMoneyPayment.created_at.desc())

    for condition in conditions:
        stmt = stmt.where(condition)

    stmt = stmt.offset((page - 1) * limit).limit(limit)
    result = await db.execute(stmt)
    payments = result.scalars().all()

    return success_response({"payments": payments, "total": total, "page": page, "limit": limit})


@router.get("/{payment_id}", response_model=ApiSuccessResponse[MobileMoneyPaymentResponse])
async def get_mobile_money_payment(
    payment_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db),
):
    """Get details of a specific mobile money payment."""
    stmt = select(MobileMoneyPayment).where(MobileMoneyPayment.id == payment_id)
    result = await db.execute(stmt)
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mobile money payment not found")

    return success_response(payment)


@router.post("/{payment_id}/reverse", response_model=ApiSuccessResponse[MobileMoneyPaymentResponse])
async def reverse_mobile_money_payment(
    payment_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role("admin", "worker"))],
    db: AsyncSession = Depends(get_db),
):
    """
    Reverse a mobile money payment record.

    Use this when a payment was recorded incorrectly (e.g., wrong transaction ID,
    wrong order, or payment verification failed).

    This marks the payment as reversed so it can be corrected.
    """
    stmt = select(MobileMoneyPayment).where(MobileMoneyPayment.id == payment_id)
    result = await db.execute(stmt)
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mobile money payment not found")

    if payment.status == MobileMoneyPaymentStatus.REVERSED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment has already been reversed")

    if payment.status == MobileMoneyPaymentStatus.REFUNDED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot reverse a refunded payment")

    # Mark as reversed
    payment.status = MobileMoneyPaymentStatus.REVERSED

    await db.commit()
    await db.refresh(payment)

    return success_response(payment)
