import uuid
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status as http_status, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.logging import logger
from app.domains.payments.services import PaymentService
from app.domains.payments.schemas import (
    # Payment methods
    PaymentMethodCreate,
    PaymentMethodUpdate,
    PaymentMethodResponse,
    PaymentMethodListResponse,

    # STK Push
    STKPushRequest,
    STKPushResponse,
    STKPushStatusRequest,
    STKPushStatusResponse,

    # Transactions
    TransactionDetailResponse,
    TransactionListResponse,

    # Callbacks
    CallbackRequest,

    # Refunds
    RefundCreate,
    RefundUpdate,
    RefundResponse,
    RefundListResponse,
    RefundApproval,

    # Analytics
    PaymentAnalyticsResponse,
    PaymentSummaryResponse,
)

router = APIRouter(prefix="/payments", tags=["Payments"])


# ============================================================================
# DEPENDENCIES
# ============================================================================

async def get_payment_service(db: AsyncSession = Depends(get_db)) -> PaymentService:
    """Get payment service instance"""
    return PaymentService(db)


# ============================================================================
# PAYMENT METHODS
# ============================================================================

@router.get("/methods", response_model=PaymentMethodListResponse)
async def get_payment_methods(
    skip: int = 0,
    limit: int = 100,
    is_enabled: Optional[bool] = None,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """Get all payment methods (public/admin endpoint)"""
    try:
        payment_methods, total = await payment_service.get_payment_methods(
            skip=skip,
            limit=limit,
            is_enabled=is_enabled,
        )

        return PaymentMethodListResponse(
            payment_methods=[
                PaymentMethodResponse.model_validate(pm)
                for pm in payment_methods
            ],
            total=total,
            page=skip // limit + 1 if limit > 0 else 1,
            page_size=limit,
        )
    except Exception as e:
        logger.error(f"Error getting payment methods: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get payment methods",
        )


@router.get("/methods/default", response_model=PaymentMethodResponse)
async def get_default_payment_method(
    payment_service: PaymentService = Depends(get_payment_service),
):
    """Get default payment method"""
    try:
        payment_method = await payment_service.get_default_payment_method()
        if not payment_method:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="No default payment method configured",
            )

        return PaymentMethodResponse.model_validate(payment_method)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting default payment method: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get default payment method",
        )


@router.post("/methods", response_model=PaymentMethodResponse, status_code=201)
async def create_payment_method(
    payment_method: PaymentMethodCreate,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """Create a new payment method (admin only)"""
    try:
        new_method = await payment_service.create_payment_method(
            name=payment_method.name,
            provider=payment_method.provider,
            description=payment_method.description,
            is_enabled=payment_method.is_enabled,
            is_default=payment_method.is_default,
            status=payment_method.status,
            mpesa_shortcode=payment_method.mpesa_shortcode,
            mpesa_business_name=payment_method.mpesa_business_name,
            mpesa_environment=payment_method.mpesa_environment,
            fee_type=payment_method.fee_type,
            fee_value=payment_method.fee_value,
            fee_min=payment_method.fee_min,
            fee_max=payment_method.fee_max,
            min_amount=payment_method.min_amount,
            max_amount=payment_method.max_amount,
            processing_time_seconds=payment_method.processing_time_seconds,
            retry_count=payment_method.retry_count,
            display_order=payment_method.display_order,
            icon_url=payment_method.icon_url,
            display_label=payment_method.display_label,
            provider_metadata=payment_method.provider_metadata,
        )

        return PaymentMethodResponse.model_validate(new_method)
    except Exception as e:
        logger.error(f"Error creating payment method: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create payment method",
        )


@router.put("/methods/{method_id}", response_model=PaymentMethodResponse)
async def update_payment_method(
    method_id: uuid.UUID,
    payment_method: PaymentMethodUpdate,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """Update a payment method (admin only)"""
    try:
        updated_method = await payment_service.update_payment_method(
            method_id=method_id,
            **payment_method.model_dump(exclude_unset=True),
        )

        if not updated_method:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Payment method not found",
            )

        return PaymentMethodResponse.model_validate(updated_method)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating payment method: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update payment method",
        )


@router.delete("/methods/{method_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def delete_payment_method(
    method_id: uuid.UUID,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """Delete a payment method (admin only) - soft delete"""
    try:
        deleted_method = await payment_service.delete_payment_method(method_id)

        if not deleted_method:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Payment method not found",
            )

        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting payment method: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete payment method",
        )


# ============================================================================
# STK PUSH (M-PESA)
# ============================================================================

@router.post("/stkpush/initiate", response_model=STKPushResponse)
async def initiate_stk_push(
    request: STKPushRequest,
    http_request: Request,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """
    Initiate M-Pesa STK Push payment.

    This endpoint simulates the Daraja API STK Push flow:
    1. Customer receives prompt on phone
    2. Customer enters M-Pesa PIN
    3. Payment is completed and callback received

    In simulation mode, payments auto-complete after ~5 seconds.
    """
    try:
        # Get client info for tracking
        ip_address = http_request.client.host if http_request.client else None
        user_agent = http_request.headers.get("user-agent")

        response = await payment_service.initiate_stk_push(
            request=request,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        logger.info(
            f"STK Push initiated: {response.merchant_request_id} "
            f"for {request.phone_number}, amount {request.amount}"
        )

        return response
    except Exception as e:
        logger.error(f"Error initiating STK Push: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initiate payment: {str(e)}",
        )


@router.post("/stkpush/status", response_model=STKPushStatusResponse)
async def check_stk_push_status(
    request: STKPushStatusRequest,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """
    Check STK Push transaction status.

    Queries both the local database and M-Pesa for latest status.
    """
    try:
        response = await payment_service.check_transaction_status(
            merchant_request_id=request.merchant_request_id,
        )

        return response
    except Exception as e:
        logger.error(f"Error checking STK Push status: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check transaction status",
        )


# ============================================================================
# CALLBACKS (MPESA WEBHOOK)
# ============================================================================

@router.post("/callbacks/mpesa", status_code=200)
async def mpesa_callback(
    callback_data: CallbackRequest,
    http_request: Request,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """
    M-Pesa payment callback endpoint (webhook).

    This endpoint receives payment result callbacks from M-Pesa Daraja API.
    In simulation mode, this is called by the simulator.

    Real M-Pesa validates requests via HMAC signature.
    """
    try:
        # Extract callback data
        stk_callback = callback_data.Body.get("stkCallback", {})
        merchant_request_id = stk_callback.get("MerchantRequestID")

        if not merchant_request_id:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Missing MerchantRequestID",
            )

        # Get client IP for logging
        ip_address = http_request.client.host if http_request.client else None

        # Process callback
        success = await payment_service.process_callback(
            merchant_request_id=merchant_request_id,
            callback_data=callback_data.Body,
            ip_address=ip_address,
        )

        if success:
            logger.info(f"Callback processed successfully: {merchant_request_id}")
            return {"status": "success", "message": "Callback processed"}
        else:
            logger.warning(f"Callback failed: transaction not found for {merchant_request_id}")
            return {"status": "error", "message": "Transaction not found"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing M-Pesa callback: {e}")
        # Always return 200 to M-Pesa to avoid retries
        return {"status": "error", "message": "Callback processing failed"}


# ============================================================================
# TRANSACTIONS
# ============================================================================

@router.get("/transactions", response_model=TransactionListResponse)
async def get_transactions(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    payment_method_id: Optional[uuid.UUID] = None,
    phone_number: Optional[str] = None,
    order_id: Optional[uuid.UUID] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """Get transactions with filtering (admin/vendor endpoint)"""
    try:
        transactions, total = await payment_service.get_transactions(
            skip=skip,
            limit=limit,
            status=status,
            payment_method_id=payment_method_id,
            phone_number=phone_number,
            order_id=order_id,
            date_from=date_from,
            date_to=date_to,
        )

        return TransactionListResponse(
            transactions=[
                TransactionDetailResponse.model_validate(t)
                for t in transactions
            ],
            total=total,
            page=skip // limit + 1 if limit > 0 else 1,
            page_size=limit,
        )
    except Exception as e:
        logger.error(f"Error getting transactions: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get transactions",
        )


@router.get("/transactions/{transaction_id}", response_model=TransactionDetailResponse)
async def get_transaction(
    transaction_id: uuid.UUID,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """Get transaction details by ID"""
    try:
        transaction = await payment_service.get_transaction(transaction_id)

        if not transaction:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Transaction not found",
            )

        return TransactionDetailResponse.model_validate(transaction)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting transaction: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get transaction",
        )


# ============================================================================
# REFUNDS
# ============================================================================

@router.post("/refunds", response_model=RefundResponse, status_code=201)
async def create_refund(
    refund_data: RefundCreate,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """Create a refund request"""
    try:
        refund = await payment_service.create_refund(refund_data)

        if not refund:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Refund could not be created. Check transaction is completed and amount is valid.",
            )

        logger.info(f"Refund created: {refund.id} for transaction {refund.transaction_id}")

        return RefundResponse.model_validate(refund)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating refund: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create refund",
        )


@router.get("/refunds", response_model=RefundListResponse)
async def get_refunds(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    transaction_id: Optional[uuid.UUID] = None,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """Get refunds with filtering"""
    try:
        refunds, total = await payment_service.get_refunds(
            skip=skip,
            limit=limit,
            status=status,
            transaction_id=transaction_id,
        )

        return RefundListResponse(
            refunds=[RefundResponse.model_validate(r) for r in refunds],
            total=total,
            page=skip // limit + 1 if limit > 0 else 1,
            page_size=limit,
        )
    except Exception as e:
        logger.error(f"Error getting refunds: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get refunds",
        )


@router.post("/refunds/{refund_id}/approve", response_model=RefundResponse)
async def approve_refund(
    refund_id: uuid.UUID,
    approval: RefundApproval,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """
    Approve or reject refund.

    Approved refunds will be processed via M-Pesa reversal.
    """
    try:
        # In a real app, get user ID from auth context
        approved_by = uuid.uuid4()  # Placeholder

        refund = await payment_service.approve_refund(
            refund_id=refund_id,
            approved=approval.approved,
            approved_by=approved_by,
            notes=approval.notes,
        )

        if not refund:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Refund not found or not in pending status",
            )

        logger.info(f"Refund {refund_id} {'approved' if approval.approved else 'rejected'}")

        return RefundResponse.model_validate(refund)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving refund: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to approve refund",
        )


@router.put("/refunds/{refund_id}", response_model=RefundResponse)
async def update_refund(
    refund_id: uuid.UUID,
    refund_update: RefundUpdate,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """Update refund (admin notes, etc.)"""
    try:
        refund = await payment_service.get_refund_by_id(refund_id)

        if not refund:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Refund not found",
            )

        # Update fields
        for field, value in refund_update.model_dump(exclude_unset=True).items():
            setattr(refund, field, value)

        await payment_service.db.commit()
        await payment_service.db.refresh(refund)

        return RefundResponse.model_validate(refund)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating refund: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update refund",
        )


@router.get("/refunds/{refund_id}", response_model=RefundResponse)
async def get_refund(
    refund_id: uuid.UUID,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """Get refund details by ID"""
    try:
        refund = await payment_service.get_refund_by_id(refund_id)

        if not refund:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Refund not found",
            )

        return RefundResponse.model_validate(refund)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting refund: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get refund",
        )


@router.delete("/refunds/{refund_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def delete_refund(
    refund_id: uuid.UUID,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """Delete a refund (admin only) - soft delete"""
    try:
        deleted_refund = await payment_service.delete_refund(refund_id)

        if not deleted_refund:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Refund not found or cannot be deleted",
            )

        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting refund: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete refund",
        )


# ============================================================================
# ANALYTICS
# ============================================================================

@router.get("/analytics/summary", response_model=PaymentSummaryResponse)
async def get_payment_summary(
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """Get payment summary statistics"""
    try:
        summary = await payment_service.get_payment_summary(
            date_from=date_from,
            date_to=date_to,
        )

        return summary
    except Exception as e:
        logger.error(f"Error getting payment summary: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get payment summary",
        )


@router.get("/analytics/details", response_model=PaymentAnalyticsResponse)
async def get_payment_analytics(
    days: int = 30,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """Get detailed payment analytics"""
    try:
        analytics = await payment_service.get_payment_analytics(days=days)

        return analytics
    except Exception as e:
        logger.error(f"Error getting payment analytics: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get payment analytics",
        )


# Export router
payments_router = router
