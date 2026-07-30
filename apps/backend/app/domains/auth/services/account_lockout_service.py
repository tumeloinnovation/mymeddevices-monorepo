"""
Account Lockout Service for brute-force attack prevention.

Implements progressive delays and temporary account lockouts
after multiple failed authentication attempts.
"""

import time
import sys
from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional
from dataclasses import dataclass
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.logging import logger
from app.core.config import settings


@dataclass
class LockoutPolicy:
    """Configurable lockout policy settings."""
    # Attempt thresholds and delays (in seconds)
    attempt_thresholds: dict = None

    # Maximum lockout duration (1 hour)
    max_lockout_minutes: int = 60

    # Lockout cleanup interval (in seconds)
    cleanup_interval: int = 3600

    def __post_init__(self):
        if self.attempt_thresholds is None:
            # Progressive delay strategy
            self.attempt_thresholds = {
                3: {"delay": 0, "message": "Multiple failed attempts detected"},
                5: {"delay": 30, "message": "Account temporarily locked (30 seconds)"},
                7: {"delay": 300, "message": "Account locked (5 minutes)"},
                10: {"delay": 1800, "message": "Account locked (30 minutes)"},
                15: {"delay": 3600, "message": "Account locked (1 hour)"},
            }


@dataclass
class LockoutStatus:
    """Current lockout status for an identifier."""
    is_locked: bool
    remaining_seconds: int
    message: Optional[str] = None
    attempt_count: int = 0


# In-memory fallback storage
_in_memory_lockouts: dict[str, dict] = {}
_in_memory_attempts: dict[str, list] = {}
_in_memory_expiry: dict[str, float] = {}


class AccountLockoutService:
    """
    Service for tracking failed authentication attempts and
    enforcing progressive account lockouts.

    Uses Redis for production with in-memory fallback for development.
    """

    def __init__(self, db: AsyncSession, policy: LockoutPolicy = None):
        self.db = db
        self.policy = policy or LockoutPolicy()
        self.redis_client = None

        # Detect testing environment
        is_testing = "pytest" in sys.modules or "unittest" in sys.modules

        # Initialize Redis
        if settings.ENVIRONMENT == "production":
            if not settings.REDIS_URL:
                raise ValueError("REDIS_URL must be configured when running in a production environment.")
            try:
                import redis.asyncio as aioredis
                self.redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
                logger.info("Redis account lockout storage initialized for production.")
            except Exception as e:
                logger.error(f"Failed to initialize Redis for account lockout in production: {e}")
                raise RuntimeError(f"Redis initialization failed in production: {e}")
        elif not is_testing and settings.REDIS_URL:
            try:
                import redis.asyncio as aioredis
                self.redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
                logger.info("Redis account lockout storage initialized.")
            except Exception as e:
                logger.warning(f"Failed to initialize Redis for account lockout: {e}. Falling back to in-memory.")

    def _cleanup_in_memory(self) -> None:
        """Clean up expired in-memory entries."""
        now = time.time()

        # Clean up lockouts
        expired_lockouts = [
            k for k, v in _in_memory_lockouts.items()
            if v.get("locked_until", 0) < now
        ]
        for k in expired_lockouts:
            del _in_memory_lockouts[k]

        # Clean up attempts
        expired_attempts = [
            k for k, exp in _in_memory_expiry.items()
            if exp < now
        ]
        for k in expired_attempts:
            _in_memory_attempts.pop(k, None)
            _in_memory_expiry.pop(k, None)

    async def get_lockout_status(self, identifier: str) -> LockoutStatus:
        """
        Get the current lockout status for an identifier.

        Args:
            identifier: Unique identifier (email, device_id, etc.)

        Returns:
            LockoutStatus with current state
        """
        if self.redis_client:
            return await self._get_redis_status(identifier)
        else:
            return self._get_in_memory_status(identifier)

    async def _get_redis_status(self, identifier: str) -> LockoutStatus:
        """Get lockout status from Redis."""
        try:
            # Get attempt count
            attempts_key = f"auth_attempts:{identifier}"
            attempts = await self.redis_client.get(attempts_key)
            attempt_count = int(attempts) if attempts else 0

            # Get lockout info
            lockout_key = f"auth_lockout:{identifier}"
            locked_until = await self.redis_client.get(lockout_key)

            if locked_until:
                locked_until_ts = float(locked_until)
                remaining = int(locked_until_ts - time.time())

                if remaining > 0:
                    return LockoutStatus(
                        is_locked=True,
                        remaining_seconds=remaining,
                        message=f"Account is locked. Try again in {remaining // 60} minutes.",
                        attempt_count=attempt_count
                    )
                else:
                    # Lockout expired, clean up
                    await self.redis_client.delete(lockout_key)

            return LockoutStatus(
                is_locked=False,
                remaining_seconds=0,
                attempt_count=attempt_count
            )

        except Exception as e:
            logger.error(f"Error getting Redis lockout status: {e}")
            return LockoutStatus(is_locked=False, remaining_seconds=0)

    def _get_in_memory_status(self, identifier: str) -> LockoutStatus:
        """Get lockout status from in-memory storage."""
        self._cleanup_in_memory()
        now = time.time()

        # Get attempt count
        attempts = _in_memory_attempts.get(identifier, [])
        attempt_count = len(attempts)

        # Check lockout
        lockout = _in_memory_lockouts.get(identifier)
        if lockout:
            locked_until = lockout.get("locked_until", 0)
            if locked_until > now:
                remaining = int(locked_until - now)
                return LockoutStatus(
                    is_locked=True,
                    remaining_seconds=remaining,
                    message=f"Account is locked. Try again in {remaining // 60} minutes.",
                    attempt_count=attempt_count
                )
            else:
                # Lockout expired
                del _in_memory_lockouts[identifier]

        return LockoutStatus(
            is_locked=False,
            remaining_seconds=0,
            attempt_count=attempt_count
        )

    async def record_failed_attempt(self, identifier: str, user_email: Optional[str] = None) -> LockoutStatus:
        """
        Record a failed authentication attempt and apply lockout if needed.

        Args:
            identifier: Unique identifier for tracking (email, device_id)
            user_email: Optional user email for logging

        Returns:
            Updated LockoutStatus after recording the attempt
        """
        if self.redis_client:
            return await self._record_redis_attempt(identifier, user_email)
        else:
            return self._record_in_memory_attempt(identifier, user_email)

    async def _record_redis_attempt(self, identifier: str, user_email: Optional[str]) -> LockoutStatus:
        """Record failed attempt in Redis."""
        try:
            attempts_key = f"auth_attempts:{identifier}"
            lockout_key = f"auth_lockout:{identifier}"

            # Increment attempt counter
            pipe = self.redis_client.pipeline()
            pipe.incr(attempts_key)
            pipe.expire(attempts_key, 3600)  # 1 hour window
            results = await pipe.execute()
            attempt_count = results[0]

            # Determine lockout based on attempt count
            delay = 0
            message = None

            for threshold, config in sorted(self.policy.attempt_thresholds.items()):
                if attempt_count >= threshold:
                    delay = config["delay"]
                    message = config["message"]

            if delay > 0:
                # Apply lockout
                locked_until = time.time() + delay
                await self.redis_client.setex(
                    lockout_key,
                    delay,
                    str(locked_until)
                )

                logger.warning(
                    f"Account lockout applied for {identifier} "
                    f"(user: {user_email or 'unknown'}) - "
                    f"{attempt_count} attempts, locked for {delay}s"
                )

                return LockoutStatus(
                    is_locked=True,
                    remaining_seconds=delay,
                    message=message,
                    attempt_count=attempt_count
                )

            # Warning threshold reached
            if attempt_count >= 3:
                logger.info(
                    f"Multiple failed attempts detected for {identifier} "
                    f"(user: {user_email or 'unknown'}) - {attempt_count} attempts"
                )

            return LockoutStatus(
                is_locked=False,
                remaining_seconds=0,
                message=message,
                attempt_count=attempt_count
            )

        except Exception as e:
            logger.error(f"Error recording Redis failed attempt: {e}")
            return LockoutStatus(is_locked=False, remaining_seconds=0)

    def _record_in_memory_attempt(self, identifier: str, user_email: Optional[str]) -> LockoutStatus:
        """Record failed attempt in memory."""
        self._cleanup_in_memory()
        now = time.time()

        # Record attempt
        if identifier not in _in_memory_attempts:
            _in_memory_attempts[identifier] = []
        _in_memory_attempts[identifier].append(now)

        # Set expiry for attempts (1 hour)
        _in_memory_expiry[identifier] = now + 3600

        attempt_count = len(_in_memory_attempts[identifier])

        # Determine lockout
        delay = 0
        message = None

        for threshold, config in sorted(self.policy.attempt_thresholds.items()):
            if attempt_count >= threshold:
                delay = config["delay"]
                message = config["message"]

        if delay > 0:
            # Apply lockout
            _in_memory_lockouts[identifier] = {
                "locked_until": now + delay,
                "attempts": attempt_count
            }

            logger.warning(
                f"Account lockout applied for {identifier} "
                f"(user: {user_email or 'unknown'}) - "
                f"{attempt_count} attempts, locked for {delay}s"
            )

            return LockoutStatus(
                is_locked=True,
                remaining_seconds=delay,
                message=message,
                attempt_count=attempt_count
            )

        # Warning threshold
        if attempt_count >= 3:
            logger.info(
                f"Multiple failed attempts detected for {identifier} "
                f"(user: {user_email or 'unknown'}) - {attempt_count} attempts"
            )

        return LockoutStatus(
            is_locked=False,
            remaining_seconds=0,
            message=message,
            attempt_count=attempt_count
        )

    async def reset_attempts(self, identifier: str) -> None:
        """
        Clear failed attempt counter after successful authentication.

        Args:
            identifier: Unique identifier to reset
        """
        if self.redis_client:
            try:
                attempts_key = f"auth_attempts:{identifier}"
                lockout_key = f"auth_lockout:{identifier}"

                await self.redis_client.delete(attempts_key, lockout_key)
                logger.debug(f"Reset auth attempts for {identifier}")

            except Exception as e:
                logger.error(f"Error resetting Redis attempts: {e}")
        else:
            # Clear in-memory
            _in_memory_attempts.pop(identifier, None)
            _in_memory_lockouts.pop(identifier, None)
            logger.debug(f"Reset auth attempts for {identifier}")

    async def is_permanently_locked(self, identifier: str) -> bool:
        """
        Check if identifier has reached maximum lockout threshold.
        Requires admin intervention to unlock.

        Args:
            identifier: Unique identifier to check

        Returns:
            True if permanently locked
        """
        status = await self.get_lockout_status(identifier)

        # Check against highest threshold
        max_threshold = max(self.policy.attempt_thresholds.keys())
        return status.attempt_count >= max_threshold and status.remaining_seconds > 0


async def check_account_lockout(identifier: str, lockout_service: AccountLockoutService) -> None:
    """
    FastAPI dependency helper to check lockout status before authentication.

    Raises:
        ValueError: If account is locked
    """
    status = await lockout_service.get_lockout_status(identifier)

    if status.is_locked:
        raise ValueError(status.message or "Account is temporarily locked due to multiple failed attempts")


# Helper function for easy import
async def get_lockout_service(db: AsyncSession) -> AccountLockoutService:
    """Factory function to create lockout service."""
    return AccountLockoutService(db)
