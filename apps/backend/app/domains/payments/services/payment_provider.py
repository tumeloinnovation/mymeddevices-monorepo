"""
Payment Provider Interface and Protocol
"""

import uuid
from typing import Any, Protocol, runtime_checkable
from decimal import Decimal


@runtime_checkable
class PaymentProvider(Protocol):
    """Abstract protocol for payment gateway implementations."""

    @property
    def provider_code(self) -> str:
        """Unique identifier for this payment provider (e.g. 'mpesa', 'stripe')."""
        ...

    async def initiate_payment(
        self,
        order_id: uuid.UUID,
        amount: Decimal,
        customer_identifier: str,
        **kwargs: Any,
    ) -> dict[str, Any]:
        """Initiate payment processing for an order."""
        ...

    async def verify_payment(
        self,
        transaction_id: str,
    ) -> dict[str, Any]:
        """Verify the status of a payment transaction."""
        ...

    async def process_refund(
        self,
        transaction_id: str,
        amount: Decimal,
        reason: str | None = None,
    ) -> dict[str, Any]:
        """Process a refund for a previously verified transaction."""
        ...
