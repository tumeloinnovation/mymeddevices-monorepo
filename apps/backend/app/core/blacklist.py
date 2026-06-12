import sys
import time
from typing import Dict
from app.core.config import settings
from app.core.logging import logger

class TokenBlacklist:
    def __init__(self):
        self.redis_client = None
        # In-memory blacklist fallback: {jti: expiry_timestamp}
        self._in_memory_blacklist: Dict[str, float] = {}

        # Detect testing environment
        is_testing = "pytest" in sys.modules or "unittest" in sys.modules

        if settings.ENVIRONMENT == "production":
            if not settings.REDIS_URL:
                raise ValueError("REDIS_URL must be configured when running in a production environment.")
            try:
                import redis.asyncio as aioredis
                self.redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
                logger.info("Redis token blacklist initialized for production.")
            except Exception as e:
                logger.error(f"Failed to initialize Redis for token blacklist in production: {e}")
                raise RuntimeError(f"Redis initialization failed in production: {e}")
        elif not is_testing and settings.REDIS_URL:
            try:
                import redis.asyncio as aioredis
                self.redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
                logger.info("Redis token blacklist initialized.")
            except Exception as e:
                logger.warning(f"Failed to initialize Redis for token blacklist: {e}. Falling back to in-memory.")

    async def blacklist_token(self, jti: str, expires_in_seconds: int) -> None:
        """
        Blacklist a token JTI until its expiration time.
        """
        if not jti:
            return

        if self.redis_client:
            try:
                key = f"blacklist:{jti}"
                # Store the JTI with the TTL equal to the remaining expiration seconds
                # Ensure we have at least 1 second TTL
                await self.redis_client.setex(key, max(1, expires_in_seconds), "1")
                logger.debug(f"Blacklisted JTI {jti} in Redis for {expires_in_seconds} seconds.")
            except Exception as e:
                logger.error(f"Failed to blacklist token JTI {jti} in Redis: {e}")
                # Fallback to in-memory
                self._in_memory_blacklist[jti] = time.time() + expires_in_seconds
        else:
            self._in_memory_blacklist[jti] = time.time() + expires_in_seconds
            logger.debug(f"Blacklisted JTI {jti} in-memory for {expires_in_seconds} seconds.")
            self._cleanup_expired()

    async def is_blacklisted(self, jti: str) -> bool:
        """
        Check if a token JTI is blacklisted.
        """
        if not jti:
            return False

        if self.redis_client:
            try:
                key = f"blacklist:{jti}"
                exists = await self.redis_client.exists(key)
                return bool(exists)
            except Exception as e:
                logger.error(f"Failed to check blacklist for JTI {jti} in Redis: {e}")
                return self._is_blacklisted_in_memory(jti)
        else:
            return self._is_blacklisted_in_memory(jti)

    def _is_blacklisted_in_memory(self, jti: str) -> bool:
        self._cleanup_expired()
        expiry = self._in_memory_blacklist.get(jti)
        if expiry is None:
            return False
        if expiry < time.time():
            self._in_memory_blacklist.pop(jti, None)
            return False
        return True

    def _cleanup_expired(self) -> None:
        """Remove expired tokens from the in-memory dictionary to free space."""
        now = time.time()
        expired_keys = [k for k, v in self._in_memory_blacklist.items() if v < now]
        for k in expired_keys:
            self._in_memory_blacklist.pop(k, None)

    def clear(self) -> None:
        """Clear the in-memory blacklist (mainly for testing cleanup)."""
        self._in_memory_blacklist.clear()

# Global singleton instance
token_blacklist = TokenBlacklist()
