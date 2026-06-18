"""
Simple Payments API

Provides basic CRUD operations for Card and Bank Transfer payment methods.
These endpoints bypass the M-Pesa STK Push flow and allow direct transaction
management for simpler payment methods.
"""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status as http_status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.logging import logger
from app.domains.payments.services import PaymentService
from app.domains.payments.schemas import (
    SimpleTransactionCreate,
    SimpleTransactionUpdate,
    TransactionDetailResponse,
)
from app.domains.payments.models import PaymentProvider

router = APIRouter(prefix="/payments/simple-payments", tags=["Simple Payments"])


# ============================================================================
# DEPENDENCIES
# ============================================================================

async def get_payment_service(db: AsyncSession = Depends(get_db)) -> PaymentService:
    """Get payment service instance"""
    return PaymentService(db)


# ============================================================================
# SIMPLE TRANSACTIONS (Card, Bank Transfer)
# ============================================================================

@router.post("/transactions", response_model=TransactionDetailResponse, status_code=201)
async def create_simple_transaction(
    transaction_data: SimpleTransactionCreate,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """
    Create a Card or Bank Transfer transaction directly.

    This endpoint bypasses M-Pesa STK Push flow for simpler payment methods.
    The transaction starts as PENDING and can be manually updated.

    Only works for payment methods with provider = card or bank_transfer.
    """
    try:
        transaction = await payment_service.create_simple_transaction(
            payment_method_id=transaction_data.payment_method_id,
            amount=transaction_data.amount,
            currency=transaction_data.currency,
            phone_number=transaction_data.phone_number,
            order_id=transaction_data.order_id,
            vendor_id=transaction_data.vendor_id,
            transaction_metadata=transaction_data.metadata,
            notes=transaction_data.notes,
        )

        if not transaction:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Transaction could not be created. Payment method not found or not a simple payment method (card/bank_transfer).",
            )

        logger.info(f"Simple transaction created: {transaction.id} for payment method {transaction_data.payment_method_id}")

        return TransactionDetailResponse.model_validate(transaction)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating simple transaction: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create transaction",
        )


@router.put("/transactions/{transaction_id}", response_model=TransactionDetailResponse)
async def update_simple_transaction(
    transaction_id: uuid.UUID,
    transaction_update: SimpleTransactionUpdate,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """
    Update a Card or Bank Transfer transaction.

    Used for manual status updates (e.g., marking card payment as completed
    after manual verification).

    Only works for card and bank_transfer payment methods.
    """
    try:
        updated_transaction = await payment_service.update_simple_transaction(
            transaction_id=transaction_id,
            **transaction_update.model_dump(exclude_unset=True),
        )

        if not updated_transaction:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Transaction not found or not a simple payment method (card/bank_transfer)",
            )

        logger.info(f"Simple transaction updated: {transaction_id}")

        return TransactionDetailResponse.model_validate(updated_transaction)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating simple transaction: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update transaction",
        )


@router.delete("/transactions/{transaction_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def delete_simple_transaction(
    transaction_id: uuid.UUID,
    payment_service: PaymentService = Depends(get_payment_service),
):
    """
    Delete a Card or Bank Transfer transaction.

    Only pending transactions can be deleted.
    Only works for card and bank_transfer payment methods.
    """
    try:
        deleted_transaction = await payment_service.delete_transaction(transaction_id)

        if not deleted_transaction:
            raise HTTPException(
                status_code=http_status.HTTP_404_NOT_FOUND,
                detail="Transaction not found, not a simple payment method, or cannot be deleted",
            )

        logger.info(f"Simple transaction deleted: {transaction_id}")

        return None
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting simple transaction: {e}")
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete transaction",
        )


# Export router
simple_payments_router = router
