from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.domains.admin.models import SystemSetting


class SystemSettingService:
    @staticmethod
    async def get_setting(db: AsyncSession, key: str, default: Any = None) -> Any:
        """Get a system setting by key."""
        stmt = select(SystemSetting).where(SystemSetting.key == key)
        result = await db.execute(stmt)
        setting = result.scalar_one_or_none()

        if setting:
            return setting.value
        return default

    @staticmethod
    async def set_setting(db: AsyncSession, key: str, value: dict, description: str | None = None) -> SystemSetting:
        """Create or update a system setting."""
        stmt = select(SystemSetting).where(SystemSetting.key == key)
        result = await db.execute(stmt)
        setting = result.scalar_one_or_none()

        if setting:
            setting.value = value
            if description:
                setting.description = description
        else:
            import uuid

            setting = SystemSetting(id=uuid.uuid4(), key=key, value=value, description=description)
            db.add(setting)

        await db.commit()
        await db.refresh(setting)
        return setting

    @staticmethod
    async def get_all_settings(db: AsyncSession) -> list[SystemSetting]:
        """Get all system settings."""
        stmt = select(SystemSetting)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_rate_limits(db: AsyncSession, default_limits: dict) -> dict:
        """Get rate limits from DB or return defaults."""
        try:
            limits = await SystemSettingService.get_setting(db, "rate_limits")
            if limits:
                return limits
        except Exception as e:
            logger.error(f"Failed to fetch rate limits from DB: {e}")

        return default_limits
