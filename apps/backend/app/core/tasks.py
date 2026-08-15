import asyncio
from datetime import UTC, datetime, timedelta

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, result_rowcount
from app.core.logging import logger
from app.domains.auth.models.otp import OTP
from app.domains.auth.models.token_device import RefreshToken
from app.domains.auth.models.user import User


async def cleanup_expired_records(db: AsyncSession) -> dict:
    """
    Clean up expired and revoked database records:
    1. Revoked or expired refresh tokens
    2. Used or expired OTPs
    3. Soft-deleted users older than 30 days
    """
    now = datetime.now(UTC)
    stats = {}

    try:
        # 1. Clean up refresh tokens
        token_stmt = delete(RefreshToken).where((RefreshToken.expires_at < now) | (RefreshToken.revoked == True))
        token_result = await db.execute(token_stmt)
        stats["deleted_tokens"] = result_rowcount(token_result)

        # 2. Clean up OTPs
        otp_stmt = delete(OTP).where((OTP.expires_at < now) | (OTP.is_used == True))
        otp_result = await db.execute(otp_stmt)
        stats["deleted_otps"] = result_rowcount(otp_result)

        # 3. Clean up soft-deleted users (older than 30 days)
        thirty_days_ago = now - timedelta(days=30)
        user_stmt = delete(User).where(
            (User.is_active == False) & (User.email.startswith("deleted_")) & (User.updated_at < thirty_days_ago)
        )
        user_result = await db.execute(user_stmt)
        stats["deleted_users"] = result_rowcount(user_result)

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


async def start_outbox_relay_scheduler(interval_seconds: int = 15):
    """
    Background loop that processes pending outbox events (vendor ledger
    credits, stock audit logs, vendor notification emails).
    Default interval: 15 seconds
    """
    from app.domains.shared.services.outbox_relay import OutboxRelay

    logger.info("Starting outbox relay scheduler...")
    while True:
        try:
            async with AsyncSessionLocal() as db:
                relay = OutboxRelay(db)
                await relay.process_pending_events()
        except Exception as e:
            logger.error(f"Error in outbox relay scheduler loop: {e}")

        await asyncio.sleep(interval_seconds)
