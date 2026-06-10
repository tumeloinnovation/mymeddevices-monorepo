import secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.security import get_password_hash, verify_password, create_access_token, settings as security_settings
from app.domains.auth.models.user import User
from app.domains.auth.models.token_device import RefreshToken, UserDevice
from app.domains.auth.schemas.auth_schemas import UserCreate, LoginRequest
from app.core.logging import logger

class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register_user(self, user_in: UserCreate) -> User:
        user = User(
            email=user_in.email,
            password_hash=get_password_hash(user_in.password),
            first_name=user_in.first_name,
            last_name=user_in.last_name
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        logger.info(f"User registered: {user.email}")
        return user

    async def authenticate(self, login_data: LoginRequest) -> tuple[User, str]:
        result = await self.db.execute(select(User).where(User.email == login_data.email))
        user = result.scalar_one_or_none()
        
        if not user or not verify_password(login_data.password, user.password_hash):
            return None, None

        # Create or update device
        result = await self.db.execute(
            select(UserDevice).where(UserDevice.user_id == user.id, UserDevice.device_id == login_data.device_id)
        )
        device = result.scalar_one_or_none()
        if not device:
            device = UserDevice(user_id=user.id, device_id=login_data.device_id, device_name=login_data.device_name)
            self.db.add(device)
        else:
            device.last_login = datetime.now(timezone.utc)
            device.device_name = login_data.device_name
        
        # Create Refresh Token
        refresh_token_str = secrets.token_urlsafe(32)
        refresh_token = RefreshToken(
            token=refresh_token_str,
            user_id=user.id,
            device_id=login_data.device_id,
            expires_at=datetime.now(timezone.utc) + timedelta(days=security_settings.REFRESH_TOKEN_EXPIRE_DAYS)
        )
        self.db.add(refresh_token)
        
        await self.db.commit()
        logger.info(f"User authenticated: {user.email} on device {login_data.device_id}")
        return user, refresh_token_str

    async def create_tokens(self, user: User, refresh_token: str) -> dict:
        access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
