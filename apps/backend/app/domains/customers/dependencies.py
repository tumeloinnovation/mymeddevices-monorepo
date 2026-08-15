from typing import Annotated

from fastapi import Depends

from app.core.dependencies import DbDep
from app.domains.customers.services.customer_service import CustomerService
from app.domains.customers.services.loyalty_service import LoyaltyService


async def get_customer_service(db: DbDep) -> CustomerService:
    """Dependency provider for CustomerService."""
    return CustomerService(db)


async def get_loyalty_service(db: DbDep) -> LoyaltyService:
    """Dependency provider for LoyaltyService."""
    return LoyaltyService(db)


CustomerServiceDep = Annotated[CustomerService, Depends(get_customer_service)]
LoyaltyServiceDep = Annotated[LoyaltyService, Depends(get_loyalty_service)]
