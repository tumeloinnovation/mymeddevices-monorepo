from typing import Optional
import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.domains.shared.repositories import BaseRepository
from app.domains.auth.models.user import User
from app.domains.auth.models.token_device import RefreshToken, UserDevice

class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> Optional[User]:
        return await self.get_by(email=email)

class RefreshTokenRepository(BaseRepository[RefreshToken]):
    def __init__(self, db: AsyncSession):
        super().__init__(RefreshToken, db)

    async def get_by_token(self, token: str) -> Optional[RefreshToken]:
        return await self.get_by(token=token)

    async def get_token_with_user(self, token: str) -> Optional[tuple[RefreshToken, User]]:
        stmt = (
            select(RefreshToken, User)
            .join(User, RefreshToken.user_id == User.id)
            .where(RefreshToken.token == token)
        )
        result = await self.db.execute(stmt)
        return result.first()

class UserDeviceRepository(BaseRepository[UserDevice]):
    def __init__(self, db: AsyncSession):
        super().__init__(UserDevice, db)

    async def get_by_user_and_device(self, user_id: uuid.UUID, device_id: str) -> Optional[UserDevice]:
        return await self.get_by(user_id=user_id, device_id=device_id)
