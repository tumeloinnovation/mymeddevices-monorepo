import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.auth.models.token_device import RefreshToken, UserDevice
from app.domains.auth.models.user import User
from app.domains.shared.repositories import BaseRepository


class UserRepository(BaseRepository[User]):
    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> User | None:
        return await self.get_by(email=email)


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    def __init__(self, db: AsyncSession):
        super().__init__(RefreshToken, db)

    async def get_by_token(self, token: str) -> RefreshToken | None:
        return await self.get_by(token=token)

    async def get_token_with_user(self, token: str) -> tuple[RefreshToken, User] | None:
        stmt = select(RefreshToken, User).join(User, RefreshToken.user_id == User.id).where(RefreshToken.token == token)
        result = await self.db.execute(stmt)
        row = result.first()
        return (row[0], row[1]) if row else None


class UserDeviceRepository(BaseRepository[UserDevice]):
    def __init__(self, db: AsyncSession):
        super().__init__(UserDevice, db)

    async def get_by_user_and_device(self, user_id: uuid.UUID, device_id: str) -> UserDevice | None:
        return await self.get_by(user_id=user_id, device_id=device_id)
