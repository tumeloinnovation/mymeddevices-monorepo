"""FastAPI dependency providers for logistics domain services."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

# Database dependency type
DbDep = Annotated[AsyncSession, Depends(get_db)]


async def get_routing_service(db: DbDep) -> "app.domains.logistics.services.routing_service.RoutingService":
    from app.domains.logistics.services.routing_service import RoutingService

    return RoutingService(db)


async def get_driver_assignment_service(
    db: DbDep,
) -> "app.domains.logistics.services.driver_assignment_service.DriverAssignmentService":
    from app.domains.logistics.services.driver_assignment_service import DriverAssignmentService

    return DriverAssignmentService(db)


async def get_delivery_service(db: DbDep) -> "app.domains.logistics.services.delivery_service.DeliveryService":
    from app.domains.logistics.services.delivery_service import DeliveryService

    return DeliveryService(db)


async def get_tracking_service(db: DbDep) -> "app.domains.logistics.services.tracking_service.TrackingService":
    from app.domains.logistics.services.tracking_service import TrackingService

    return TrackingService(db)


# Type aliases for dependency injection
RoutingServiceDep = Annotated[
    "app.domains.logistics.services.routing_service.RoutingService",
    Depends(get_routing_service),
]

DriverAssignmentServiceDep = Annotated[
    "app.domains.logistics.services.driver_assignment_service.DriverAssignmentService",
    Depends(get_driver_assignment_service),
]

DeliveryServiceDep = Annotated[
    "app.domains.logistics.services.delivery_service.DeliveryService",
    Depends(get_delivery_service),
]

TrackingServiceDep = Annotated[
    "app.domains.logistics.services.tracking_service.TrackingService",
    Depends(get_tracking_service),
]
