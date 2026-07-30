"""
Ledger consumer for processing OrderPaid events.

This consumer listens for OrderPaid events and:
1. Calculates platform fees
2. Credits vendor ledgers with net earnings
3. Creates LedgerTransaction entries
"""
from datetime import datetime
from decimal import Decimal
from faststream.rabbit import RabbitRouter
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.broker import order_exchange
from app.core.database import get_db
from app.domains.shopping.models.vendor_ledger import (
    VendorLedger,
    LedgerTransaction,
    LedgerTransactionType
)
from app.domains.shared.events.events import OrderPaidEvent


# Platform fee rate (configurable via environment)
PLATFORM_FEE_RATE = Decimal("0.10")  # 10%


# Create the ledger router
ledger_router = RabbitRouter()


@ledger_router.subscriber(
    queue="vendor.ledger.credits",
    exchange=order_exchange,
    routing_key="order.paid"
)
async def handle_order_paid(message: OrderPaidEvent):
    """
    Process OrderPaid event to credit vendor ledgers.

    For each sub-order:
    1. Get or create VendorLedger
    2. Calculate net amount (gross - platform fee)
    3. Credit ledger balance
    4. Create LedgerTransaction record
    """
    logger.info(f"Processing ledger credits for order {message.order_id}")

    async for db in get_db():
        try:
            for sub_order in message.sub_orders:
                # Get or create vendor ledger
                ledger = await db.get(VendorLedger, sub_order.vendor_id)
                if not ledger:
                    ledger = VendorLedger(
                        vendor_id=sub_order.vendor_id,
                        balance=Decimal("0.00"),
                        last_updated_at=datetime.utcnow()
                    )
                    db.add(ledger)
                    logger.debug(f"Created new ledger for vendor {sub_order.vendor_id}")

                # Calculate amounts
                gross = sub_order.subtotal_amount
                platform_fee = gross * PLATFORM_FEE_RATE
                net = gross - platform_fee

                # Update ledger balance
                previous_balance = ledger.balance
                ledger.balance += net
                ledger.last_updated_at = datetime.utcnow()

                # Create ledger transaction
                txn = LedgerTransaction(
                    vendor_id=sub_order.vendor_id,
                    sub_order_id=sub_order.sub_order_id,
                    gross_amount=gross,
                    platform_fee_rate=PLATFORM_FEE_RATE,
                    platform_fee_amount=platform_fee,
                    net_amount=net,
                    transaction_type=LedgerTransactionType.CREDIT,
                    reference_id=str(message.order_id),
                    reference_type="order",
                    notes=f"Order payment - Order {message.order_id}"
                )
                db.add(txn)

                logger.info(
                    f"Credited vendor {sub_order.vendor_id}: "
                    f"gross={gross:.2f}, fee={platform_fee:.2f}, net={net:.2f}, "
                    f"balance: {previous_balance:.2f} -> {ledger.balance:.2f}"
                )

            await db.commit()
            logger.info(f"Ledger credits completed for order {message.order_id}")

        except Exception as e:
            logger.error(f"Failed to process ledger credits for order {message.order_id}: {e}")
            await db.rollback()
            raise


# Export for consumer app
__all__ = ["ledger_router"]
