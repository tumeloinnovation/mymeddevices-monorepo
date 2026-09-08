from typing import Annotated

from fastapi import Depends

from app.core.dependencies import DbDep
from app.domains.catalog.services.ai_assist_service import AIAssistService
from app.domains.catalog.services.catalog_service import CatalogService


async def get_catalog_service(db: DbDep) -> CatalogService:
    """Dependency provider for CatalogService."""
    return CatalogService(db)


async def get_ai_assist_service(db: DbDep) -> AIAssistService:
    """Dependency provider for AIAssistService."""
    return AIAssistService()


CatalogServiceDep = Annotated[CatalogService, Depends(get_catalog_service)]
AIAssistServiceDep = Annotated[AIAssistService, Depends(get_ai_assist_service)]
