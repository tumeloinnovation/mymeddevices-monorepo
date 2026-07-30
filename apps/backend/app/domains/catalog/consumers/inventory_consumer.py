"""
Inventory consumer for processing OrderPaid events.

This consumer listens for OrderPaid events and:
1. Deducts stock for each product
2. Creates StockLog entries for audit trail
"""
from decimal import Decimal
from faststream.rabbit import RabbitRouter
from loguru import logger

from app.core.broker import order_exchange
from app.core.database import get_db
from app.domains.catalog.models import Product, StockLog, StockChangeReason
from app.domains.shared.events.events import OrderPaidEvent


# Create the inventory router
inventory_router = RabbitRouter()


@inventory_router.subscriber(
    queue="inventory.deductions",
    exchange=order_exchange,
    routing_key="order.paid"
)
async def handle_order_paid(message: OrderPaidEvent):
    """
    Process OrderPaid event to deduct inventory.

    For each item in the order:
    1. Deduct stock quantity
    2. Create StockLog entry
    """
    logger.info(f"Processing inventory deduction for order {message.order_id}")

    async for db in get_db():
        try:
            for sub_order in message.sub_orders:
                for item in sub_order.items:
                    # Get product
                    product = await db.get(Product, item.product_id)
                    if not product:
                        logger.warning(f"Product {item.product_id} not found, skipping stock deduction")
                        continue

                    # Check if product has enough stock
                    if product.stock_quantity < item.quantity:
                        logger.error(
                            f"Insufficient stock for product {item.product_id}: "
                            f"available={product.stock_quantity}, required={item.quantity}"
                        )
                        # Continue with negative stock for audit purposes
                        # In production, this might trigger a backorder or alert

                    # Deduct stock
                    previous_qty = product.stock_quantity
                    product.stock_quantity -= item.quantity
                    new_qty = product.stock_quantity

                    # Create StockLog
                    stock_log = StockLog(
                        product_id=item.product_id,
                        vendor_id=item.vendor_id,
                        quantity_change=-item.quantity,
                        previous_quantity=previous_qty,
                        new_quantity=new_qty,
                        reason=StockChangeReason.ORDER_SALE,
                        reference_id=str(message.order_id),
                        reference_type="order"
                    )
                    db.add(stock_log)

                    logger.debug(
                        f"Deducted {item.quantity} units from product {item.product_id}: "
                        f"{previous_qty} -> {new_qty}"
                    )

            await db.commit()
            logger.info(f"Stock deduction completed for order {message.order_id}")

        except Exception as e:
            logger.error(f"Failed to process inventory deduction for order {message.order_id}: {e}")
            await db.rollback()
            # In production, implement retry logic or dead letter queue
            raise


# Export for consumer app
__all__ = ["inventory_router"]
