from typing import Annotated

from fastapi import Depends

from app.core.dependencies import DbDep
from app.domains.vendor.services.vendor_service import VendorService


async def get_vendor_service(db: DbDep) -> VendorService:
    """Dependency provider for VendorService."""
    return VendorService(db)


VendorServiceDep = Annotated[VendorService, Depends(get_vendor_service)]
