from typing import Annotated
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import success_response, ApiSuccessResponse
from app.core.dependencies import get_current_user
from app.domains.auth.models.user import User
from app.domains.payments.schemas.payment_method_schemas import (
    MpesaPaymentMethodCreate,
    CardPaymentMethodCreate,
    BankPaymentMethodCreate,
    PaymentMethodResponse,
    PaymentMethodListResponse,
)
from app.domains.payments.services.payment_method_service import PaymentMethodService

router = APIRouter(prefix="/payment-methods", tags=["Payment Methods"])


@router.get("", response_model=ApiSuccessResponse[PaymentMethodListResponse])
async def list_payment_methods(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """List all saved payment methods."""
    service = PaymentMethodService(db)
    methods, total = await service.list_payment_methods(current_user.id)

    return success_response(
        PaymentMethodListResponse(
            items=[_method_to_response(m) for m in methods],
            total=total,
        )
    )


@router.get("/default", response_model=ApiSuccessResponse[PaymentMethodResponse])
async def get_default_payment_method(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Get the default payment method."""
    service = PaymentMethodService(db)
    method = await service.get_default_payment_method(current_user.id)

    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No default payment method found"
        )

    return success_response(_method_to_response(method))


@router.post("/mpesa", response_model=ApiSuccessResponse[PaymentMethodResponse])
async def create_mpesa_method(
    method_in: MpesaPaymentMethodCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Create an M-Pesa payment method."""
    service = PaymentMethodService(db)
    method = await service.create_mpesa_method(current_user.id, method_in)
    return success_response(_method_to_response(method))


@router.post("/card", response_model=ApiSuccessResponse[PaymentMethodResponse])
async def create_card_method(
    method_in: CardPaymentMethodCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Create a card payment method."""
    service = PaymentMethodService(db)
    method = await service.create_card_method(current_user.id, method_in)
    return success_response(_method_to_response(method))


@router.post("/bank", response_model=ApiSuccessResponse[PaymentMethodResponse])
async def create_bank_method(
    method_in: BankPaymentMethodCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Create a bank transfer payment method."""
    service = PaymentMethodService(db)
    method = await service.create_bank_method(current_user.id, method_in)
    return success_response(_method_to_response(method))


@router.put("/{method_id}", response_model=ApiSuccessResponse[PaymentMethodResponse])
async def update_payment_method(
    method_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    is_default: bool = None,
    display_name: str = None,
    is_active: bool = None,
    db: AsyncSession = Depends(get_db),
):
    """Update a payment method."""
    service = PaymentMethodService(db)
    method = await service.update_payment_method(
        method_id,
        current_user.id,
        is_default=is_default,
        display_name=display_name,
        is_active=is_active,
    )

    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Payment method not found"
        )

    return success_response(_method_to_response(method))


@router.delete("/{method_id}")
async def delete_payment_method(
    method_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Delete (deactivate) a payment method."""
    service = PaymentMethodService(db)
    success = await service.delete_payment_method(method_id, current_user.id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Payment method not found"
        )

    return success_response({"message": "Payment method deleted successfully"})


@router.post("/{method_id}/set-default", response_model=ApiSuccessResponse[PaymentMethodResponse])
async def set_default_payment_method(
    method_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Set a payment method as default."""
    service = PaymentMethodService(db)
    method = await service.update_payment_method(
        method_id, current_user.id, is_default=True
    )

    if not method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Payment method not found"
        )

    return success_response(_method_to_response(method))


def _method_to_response(method) -> PaymentMethodResponse:
    """Convert payment method model to response."""
    # Mask sensitive data
    bank_account_number = None
    if method.bank_account_number:
        # Show only last 4 digits
        bank_account_number = f"•••• {method.bank_account_number[-4:]}"

    return PaymentMethodResponse(
        id=method.id,
        customer_id=method.customer_id,
        payment_type=method.payment_type,
        is_default=method.is_default,
        is_active=method.is_active,
        display_name=method.display_name,
        phone_number=method.phone_number,
        card_last4=method.card_last4,
        card_brand=method.card_brand,
        card_expiry_month=method.card_expiry_month,
        card_expiry_year=method.card_expiry_year,
        cardholder_name=method.cardholder_name,
        bank_name=method.bank_name,
        bank_account_number=bank_account_number,
        bank_account_name=method.bank_account_name,
        created_at=method.created_at,
        updated_at=method.updated_at,
    )
