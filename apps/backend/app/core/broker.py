"""
RabbitMQ broker setup using FastStream.

This module configures the RabbitMQ broker and exchanges
for the event-driven order processing system.
"""
from typing import Optional

from faststream.rabbit import RabbitBroker, RabbitExchange
from loguru import logger

from app.core.config import settings


# Global broker instance
_broker: Optional[RabbitBroker] = None


def get_broker() -> RabbitBroker:
    """Get or create the RabbitMQ broker instance."""
    global _broker

    if _broker is None:
        rabbitmq_url = settings.RABBITMQ_URL
        if not rabbitmq_url:
            logger.warning("RABBITMQ_URL not configured, using default localhost")
            rabbitmq_url = "amqp://guest:guest@localhost:5672/"

        _broker = RabbitBroker(url=rabbitmq_url)
        logger.info(f"RabbitMQ broker initialized with URL: {rabbitmq_url}")

    return _broker


# Exchange definitions
def get_order_exchange() -> RabbitExchange:
    """Get the order events exchange."""
    return RabbitExchange(
        name="order_events",
        exchange_type="topic",
        durable=True,
        auto_delete=False
    )


# Broker and exchange for direct import
broker = get_broker()
order_exchange = get_order_exchange()


async def startup_broker():
    """Connect to RabbitMQ broker (called on app startup)."""
    if settings.RABBITMQ_URL:
        await broker.start()
        logger.info("RabbitMQ broker connected")
    else:
        logger.warning("RABBITMQ_URL not set, skipping broker connection")


async def shutdown_broker():
    """Disconnect from RabbitMQ broker (called on app shutdown)."""
    if _broker is not None:
        await broker.close()
        logger.info("RabbitMQ broker disconnected")
