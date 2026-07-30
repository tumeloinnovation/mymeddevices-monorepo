"""
Event publisher for publishing events to RabbitMQ.

This module provides functions for publishing domain events
to the message broker for asynchronous processing.
"""
from loguru import logger

from app.core.broker import broker, order_exchange
from app.domains.shared.events.events import (
    OrderPaidEvent,
    OrderCreatedEvent,
    OrderShippedEvent,
    OrderDeliveredEvent,
)


async def publish_order_paid(event: OrderPaidEvent):
    """
    Publish an OrderPaid event to RabbitMQ.

    This event triggers:
    - Inventory consumer: Deducts stock, creates StockLogs
    - Ledger consumer: Credits vendor ledgers
    - Notification consumer: Sends vendor notifications
    """
    try:
        await broker.publish(
            event,
            exchange=order_exchange,
            routing_key="order.paid"
        )
        logger.info(f"Published OrderPaid event for order {event.order_id}")
    except Exception as e:
        logger.error(f"Failed to publish OrderPaid event: {e}")
        # Event will be retried via outbox pattern


async def publish_order_created(event: OrderCreatedEvent):
    """Publish an OrderCreated event to RabbitMQ."""
    try:
        await broker.publish(
            event,
            exchange=order_exchange,
            routing_key="order.created"
        )
        logger.info(f"Published OrderCreated event for order {event.order_id}")
    except Exception as e:
        logger.error(f"Failed to publish OrderCreated event: {e}")


async def publish_order_shipped(event: OrderShippedEvent):
    """Publish an OrderShipped event to RabbitMQ."""
    try:
        await broker.publish(
            event,
            exchange=order_exchange,
            routing_key="order.shipped"
        )
        logger.info(f"Published OrderShipped event for sub-order {event.sub_order_id}")
    except Exception as e:
        logger.error(f"Failed to publish OrderShipped event: {e}")


async def publish_order_delivered(event: OrderDeliveredEvent):
    """Publish an OrderDelivered event to RabbitMQ."""
    try:
        await broker.publish(
            event,
            exchange=order_exchange,
            routing_key="order.delivered"
        )
        logger.info(f"Published OrderDelivered event for sub-order {event.sub_order_id}")
    except Exception as e:
        logger.error(f"Failed to publish OrderDelivered event: {e}")
