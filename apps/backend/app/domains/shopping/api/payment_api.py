from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.core.database import get_db
from app.domains.shopping.schemas.payment_schemas import PaymentResponse, MockPaymentProcess
from app.domains.shopping.services.payment_service import PaymentService
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/process-mock", response_model=PaymentResponse)
async def process_mock_payment(
    data: MockPaymentProcess,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = PaymentService(db)
    try:
        return await service.process_mock_payment(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=List[PaymentResponse])
async def list_payments(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = PaymentService(db)
    return await service.list_all_payments()

@router.get("/order/{order_id}", response_model=PaymentResponse)
async def get_payment_by_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = PaymentService(db)
    payment = await service.get_payment_by_order(order_id)
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found for this order")
    return payment
