"""FastAPI dependency providers for shopping domain services."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.logistics.services.delivery_service import DeliveryService
from app.domains.logistics.services.driver_assignment_service import DriverAssignmentService
from app.domains.logistics.services.routing_service import RoutingService

# Database dependency type
DbDep = Annotated[AsyncSession, Depends(get_db)]


async def get_routing_service(db: DbDep) -> RoutingService:
    """Get routing service from logistics domain."""
    return RoutingService(db)


async def get_driver_assignment_service(db: DbDep) -> DriverAssignmentService:
    """Get driver assignment service from logistics domain."""
    return DriverAssignmentService(db)


async def get_delivery_service(db: DbDep) -> DeliveryService:
    """Get delivery service from logistics domain."""
    return DeliveryService(db)


# Type aliases for dependency injection
RoutingServiceDep = Annotated[
    RoutingService,
    Depends(get_routing_service),
]

DriverAssignmentServiceDep = Annotated[
    DriverAssignmentService,
    Depends(get_driver_assignment_service),
]

DeliveryServiceDep = Annotated[
    DeliveryService,
    Depends(get_delivery_service),
]

