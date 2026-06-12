import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.domains.auth.models.token_device import RefreshToken
from app.domains.auth.models.otp import OTP
from app.domains.auth.models.user import User
from app.core.logging import logger

async def cleanup_expired_records(db: AsyncSession) -> dict:
    """
    Clean up expired and revoked database records:
    1. Revoked or expired refresh tokens
    2. Used or expired OTPs
    3. Soft-deleted users older than 30 days
    """
    now = datetime.now(timezone.utc)
    stats = {}

    try:
        # 1. Clean up refresh tokens
        token_stmt = delete(RefreshToken).where(
            (RefreshToken.expires_at < now) | (RefreshToken.revoked == True)
        )
        token_result = await db.execute(token_stmt)
        stats["deleted_tokens"] = token_result.rowcount

        # 2. Clean up OTPs
        otp_stmt = delete(OTP).where(
            (OTP.expires_at < now) | (OTP.is_used == True)
        )
        otp_result = await db.execute(otp_stmt)
        stats["deleted_otps"] = otp_result.rowcount

        # 3. Clean up soft-deleted users (older than 30 days)
        thirty_days_ago = now - timedelta(days=30)
        user_stmt = delete(User).where(
            (User.is_active == False) &
            (User.email.startswith("deleted_")) &
            (User.updated_at < thirty_days_ago)
        )
        user_result = await db.execute(user_stmt)
        stats["deleted_users"] = user_result.rowcount

        await db.commit()
        logger.info(f"Database cleanup completed: {stats}")
    except Exception as e:
        await db.rollback()
        logger.error(f"Error during database cleanup: {e}")
        raise e

    return stats

async def start_cleanup_scheduler(interval_seconds: int = 86400):
    """
    Background loop that runs cleanup_expired_records periodically.
    Default interval: 24 hours (86400 seconds)
    """
    logger.info("Starting database cleanup scheduler...")
    while True:
        try:
            async with AsyncSessionLocal() as db:
                await cleanup_expired_records(db)
        except Exception as e:
            logger.error(f"Error in database cleanup scheduler loop: {e}")

        await asyncio.sleep(interval_seconds)
