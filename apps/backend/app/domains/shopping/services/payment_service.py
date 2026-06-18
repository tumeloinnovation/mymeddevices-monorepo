import uuid
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.domains.shopping.models.order import Order
from app.domains.shopping.models.payment import Payment
from app.domains.shopping.schemas.payment_schemas import MockPaymentProcess
from app.domains.shopping.services.order_service import OrderService

class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def process_mock_payment(self, data: MockPaymentProcess) -> Payment:
        # 1. Fetch order
        stmt = select(Order).where(Order.id == data.order_id)
        result = await self.db.execute(stmt)
        order = result.scalar_one_or_none()

        if not order:
            raise ValueError("Order not found")
        
        if order.status != "pending":
            raise ValueError(f"Cannot pay for order in status: {order.status}")

        # 2. Simulate payment processing
        # In a real scenario, this would call a payment gateway (M-Pesa, Stripe, etc.)
        transaction_id = f"MOCK-{uuid.uuid4().hex[:8].upper()}"
        
        payment = Payment(
            id=uuid.uuid4(),
            order_id=order.id,
            amount=order.total_amount,
            currency=order.currency,
            payment_method=data.payment_method,
            status="completed",
            transaction_id=transaction_id,
            provider_response={
                "mock": True,
                "card_number": f"****{data.card_number[-4:]}",
                "timestamp": uuid.uuid4().hex # placeholder
            }
        )
        self.db.add(payment)

        # 3. Update order status using OrderService
        order_service = OrderService(self.db)
        await order_service.update_order_status(
            order_id=order.id,
            new_status="paid"
        )
        
        await self.db.commit()
        await self.db.refresh(payment)
        return payment

    async def list_all_payments(self) -> List[Payment]:
        stmt = select(Payment).order_by(Payment.created_at.desc())
        result = await self.db.execute(stmt)
        return result.scalars().all()

    async def get_payment_by_order(self, order_id: uuid.UUID) -> Optional[Payment]:
        stmt = select(Payment).where(Payment.order_id == order_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()
