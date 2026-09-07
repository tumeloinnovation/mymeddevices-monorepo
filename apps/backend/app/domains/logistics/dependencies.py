"""FastAPI dependency providers for logistics domain services."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.domains.logistics.services.delivery_service import DeliveryService
from app.domains.logistics.services.driver_assignment_service import DriverAssignmentService
from app.domains.logistics.services.routing_service import RoutingService
from app.domains.logistics.services.tracking_service import TrackingService

# Database dependency type
DbDep = Annotated[AsyncSession, Depends(get_db)]


async def get_routing_service(db: DbDep) -> RoutingService:
    return RoutingService(db)


async def get_driver_assignment_service(db: DbDep) -> DriverAssignmentService:
    return DriverAssignmentService(db)


async def get_delivery_service(db: DbDep) -> DeliveryService:
    return DeliveryService(db)


async def get_tracking_service(db: DbDep) -> TrackingService:
    return TrackingService(db)


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

TrackingServiceDep = Annotated[
    TrackingService,
    Depends(get_tracking_service),
]

