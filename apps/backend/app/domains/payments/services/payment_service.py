"""
Payment Service

Centralizes payment record mutations (refunds, status changes).
Other domains should call this service instead of directly manipulating
MobileMoneyPayment models.
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.domains.payments.models.mobile_money_payment import (
    MobileMoneyPayment,
    MobileMoneyPaymentStatus,
)


class PaymentService:
    """Centralized service for payment record operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def mark_payment_refunded(
        self,
        order_id: uuid.UUID,
        refund_transaction_id: str | None = None,
        refund_reason: str | None = None,
    ) -> MobileMoneyPayment | None:
        """
        Mark the active mobile money payment for an order as refunded.

        Finds the most recent VERIFIED payment for the given order and
        transitions it to REFUNDED status with refund metadata.

        Args:
            order_id: The order whose payment should be marked refunded.
            refund_transaction_id: Optional transaction ID of the refund sent to customer.
            refund_reason: Reason for the refund.

        Returns:
            The updated MobileMoneyPayment, or None if no verified payment found.
        """
        payment_stmt = select(MobileMoneyPayment).where(
            and_(
                MobileMoneyPayment.order_id == order_id,
                MobileMoneyPayment.status == MobileMoneyPaymentStatus.VERIFIED,
            )
        )
        result = await self.db.execute(payment_stmt)
        payment = result.scalar_one_or_none()

        if not payment:
            logger.info(f"No verified payment found for order {order_id} to refund.")
            return None

        payment.status = MobileMoneyPaymentStatus.REFUNDED
        payment.refunded_at = datetime.now(UTC)
        if refund_transaction_id:
            payment.refund_transaction_id = str(refund_transaction_id)
        payment.refund_reason = refund_reason

        logger.info(f"Payment {payment.id} for order {order_id} marked as refunded.")
        return payment
