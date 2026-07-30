"""
Consumer app entry point for FastStream.

This module aggregates all consumer routers for running with:
    faststream run app.consumers:broker

Or from CLI:
    faststream rabbit consume app.consumers:broker
"""
from app.domains.catalog.consumers.inventory_consumer import inventory_router
from app.domains.vendor.consumers.ledger_consumer import ledger_router
from app.domains.shopping.consumers.notification_consumer import notification_router

# Import the broker for FastStream CLI
from app.core.broker import broker

# Combine all consumer routers
consumers = [
    inventory_router,
    ledger_router,
    notification_router,
]

__all__ = ["broker", "consumers", "inventory_router", "ledger_router", "notification_router"]
