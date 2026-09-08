import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.shared.repositories import BaseRepository
from app.domains.vendor.models.vendor_profile import VendorProfile


class VendorProfileRepository(BaseRepository[VendorProfile]):
    def __init__(self, db: AsyncSession):
        super().__init__(VendorProfile, db)

    async def get_by_user_id(self, user_id: str | uuid.UUID) -> VendorProfile | None:
        # Accept string or UUID and resolve to database type
        if isinstance(user_id, str):
            user_uuid = uuid.UUID(user_id)
        else:
            user_uuid = user_id
        return await self.get_by(user_id=user_uuid)
