"""
Rate limiting middleware for API endpoints.

Uses sliding window algorithm with Redis-based storage in production,
and falls back to in-memory storage for development/testing/offline mode.
"""

import time
import sys
import uuid
from collections import defaultdict, deque
from typing import Optional, TYPE_CHECKING
from fastapi import Request, HTTPException, status, Depends
from app.core.logging import logger
from app.core.config import settings
from app.core.database import get_db

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

class RateLimiter:
    """
    Sliding window rate limiter supporting both Redis and In-Memory.

    Tracks requests per identifier (IP, device_id, etc.) within a time window.
    """

    def __init__(self):
        # Store for in-memory fallback: {identifier: deque of (timestamp, count)}
        self._requests: defaultdict[str, deque[tuple[float, int]]] = defaultdict(deque)
        # Configuration: {endpoint_key: (max_requests, window_seconds)}
        self._default_limits = {
            "login": (10, 300),  # 10 requests per 5 minutes
            "register": (10, 3600),  # 10 requests per hour
            "otp": (10, 300),  # 10 OTP requests per 5 minutes
            "password_reset": (10, 300),  # 10 password resets per 5 minutes
            "guest_login": (10, 3600),  # 10 guest logins per hour
        }
        self._limits = self._default_limits.copy()
        self._last_refresh = 0
        self._refresh_interval = 60  # Refresh limits from DB every 60 seconds
        self.redis_client = None

        # Check if running under test
        is_testing = "pytest" in sys.modules or "unittest" in sys.modules
        
        # Enforce Redis in production
        if settings.ENVIRONMENT == "production":
            if not settings.REDIS_URL:
                raise ValueError("REDIS_URL must be configured when running in a production environment.")
            try:
                import redis.asyncio as aioredis
                self.redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
                logger.info("Redis rate limiting storage initialized for production.")
            except Exception as e:
                logger.error(f"Failed to initialize Redis for rate limiting in production: {e}")
                raise RuntimeError(f"Redis initialization failed in production: {e}")
        elif not is_testing and settings.REDIS_URL:
            try:
                import redis.asyncio as aioredis
                self.redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
                logger.info("Redis rate limiting storage initialized.")
            except Exception as e:
                logger.warning(f"Failed to initialize Redis for rate limiting: {e}. Falling back to in-memory.")

    async def refresh_if_needed(self, db: Optional["AsyncSession"] = None) -> None:
        """Refresh limits from database if interval has passed."""
        if db is None:
            return

        current_time = time.time()
        if current_time - self._last_refresh < self._refresh_interval:
            return

        try:
            from app.domains.admin.services import SystemSettingService
            db_limits = await SystemSettingService.get_setting(db, "rate_limits")
            if db_limits:
                # Convert list [max, window] to tuple (max, window)
                self._limits = {k: tuple(v) for k, v in db_limits.items()}
                self._last_refresh = current_time
                logger.debug("Rate limits refreshed from database.")
        except Exception as e:
            logger.error(f"Failed to refresh rate limits from DB: {e}")
            try:
                await db.rollback()
            except Exception as rollback_err:
                logger.error(f"Failed to rollback session after rate limit refresh error: {rollback_err}")
            # Fallback to defaults if something goes wrong and we have no limits
            if not self._limits:
                self._limits = self._default_limits.copy()

    def _clean_old_requests(self, identifier: str, window_seconds: int, current_time: float) -> None:
        """Remove requests outside the time window (In-Memory fallback only)"""
        if identifier in self._requests:
            cutoff_time = current_time - window_seconds
            while self._requests[identifier] and self._requests[identifier][0][0] < cutoff_time:
                self._requests[identifier].popleft()

    def _get_count(self, identifier: str, window_seconds: int, current_time: float) -> int:
        """Get total request count in the current window (In-Memory fallback only)"""
        self._clean_old_requests(identifier, window_seconds, current_time)
        return sum(count for _, count in self._requests[identifier])

    async def is_allowed(
        self,
        identifier: str,
        endpoint_type: str,
        current_time: float | None = None
    ) -> tuple[bool, dict[str, int]]:
        """
        Check if request is allowed under rate limit.

        Returns:
            (allowed, info_dict) where info_dict contains:
            - limit: max requests allowed
            - remaining: requests remaining
            - reset: timestamp when limit resets
        """
        if current_time is None:
            current_time = time.time()

        max_requests, window_seconds = self._limits.get(
            endpoint_type, (10, 60)  # Default: 10 requests per minute
        )

        # 1. Redis Sliding Window implementation
        if self.redis_client:
            key = f"rate_limit:{endpoint_type}:{identifier}"
            try:
                cutoff = current_time - window_seconds
                async with self.redis_client.pipeline(transaction=True) as pipe:
                    pipe.zremrangebyscore(key, 0, cutoff)
                    pipe.zcard(key)
                    pipe.zrange(key, 0, 0, withscores=True)
                    res = await pipe.execute()
                
                removed_count, count, oldest_items = res
                
                if count >= max_requests:
                    if oldest_items:
                        # oldest_items is a list of (member, score)
                        reset_timestamp = oldest_items[0][1] + window_seconds
                    else:
                        reset_timestamp = current_time + window_seconds

                    return False, {
                        "limit": max_requests,
                        "remaining": 0,
                        "reset": int(reset_timestamp)
                    }

                return True, {
                    "limit": max_requests,
                    "remaining": max_requests - count,
                    "reset": int(current_time + window_seconds)
                }
            except Exception as e:
                logger.error(f"Redis rate limiter error: {e}. Falling back to in-memory storage.")

        # 2. In-Memory fallback implementation
        count = self._get_count(identifier, window_seconds, current_time)

        if count >= max_requests:
            if self._requests[identifier]:
                reset_timestamp = self._requests[identifier][0][0] + window_seconds
            else:
                reset_timestamp = current_time + window_seconds

            return False, {
                "limit": max_requests,
                "remaining": 0,
                "reset": int(reset_timestamp)
            }

        return True, {
            "limit": max_requests,
            "remaining": max_requests - count,
            "reset": int(current_time + window_seconds)
        }

    async def record_request(self, identifier: str, endpoint_type: str) -> None:
        """Record a request for rate limiting"""
        current_time = time.time()
        max_requests, window_seconds = self._limits.get(
            endpoint_type, (10, 60)
        )

        # 1. Redis Sliding Window implementation
        if self.redis_client:
            key = f"rate_limit:{endpoint_type}:{identifier}"
            try:
                member = f"{current_time}:{uuid.uuid4()}"
                async with self.redis_client.pipeline(transaction=True) as pipe:
                    pipe.zadd(key, {member: current_time})
                    pipe.expire(key, window_seconds)
                    await pipe.execute()
                return
            except Exception as e:
                logger.error(f"Redis rate limiter record error: {e}. Falling back to in-memory storage.")

        # 2. In-Memory fallback implementation
        self._clean_old_requests(identifier, window_seconds, current_time)
        self._requests[identifier].append((current_time, 1))

    def clear(self, identifier: str | None = None) -> None:
        """Clear rate limit data (synchronous for compatibility with testing frameworks)"""
        if identifier:
            if identifier in self._requests:
                del self._requests[identifier]
        else:
            self._requests.clear()

# Global rate limiter instance
rate_limiter = RateLimiter()

async def get_identifier(request: Request, endpoint_type: str) -> str:
    """
    Extract identifier for rate limiting from request.

    Prioritizes:
    1. device_id (for login/register/guest_login) - more specific than IP
    2. IP address - fallback for all endpoints
    """
    if endpoint_type in ["login", "register", "guest_login"]:
        try:
            body = await request.json()
            if isinstance(body, dict):
                device_id = body.get("device_id")
                if device_id:
                    return f"device:{device_id}"
        except Exception:
            pass

    # Fallback to IP address (checks headers first if behind reverse proxies/CDNs)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()

    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip

    return request.client.host if request.client else "unknown"

async def check_rate_limit(
    request: Request,
    endpoint_type: str,
    identifier: str | None = None,
    db: Optional["AsyncSession"] = None
) -> None:
    """
    Check rate limit and raise exception if exceeded.

    Args:
        request: FastAPI request
        endpoint_type: Type of endpoint (login, register, etc.)
        identifier: Optional custom identifier (overrides automatic detection)
        db: Optional database session for refreshing limits
    """
    if identifier is None:
        identifier = await get_identifier(request, endpoint_type)

    # Refresh limits if needed
    await rate_limiter.refresh_if_needed(db)

    allowed, info = await rate_limiter.is_allowed(identifier, endpoint_type)

    if not allowed:
        logger.warning(f"Rate limit exceeded for {identifier} on {endpoint_type}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "Rate limit exceeded",
                "limit": info["limit"],
                "remaining": info["remaining"],
                "reset": info["reset"]
            },
            headers={
                "X-RateLimit-Limit": str(info["limit"]),
                "X-RateLimit-Remaining": str(info["remaining"]),
                "X-RateLimit-Reset": str(info["reset"]),
                "Retry-After": str(max(0, info["reset"] - int(time.time())))
            }
        )

    # Record the request
    await rate_limiter.record_request(identifier, endpoint_type)

class RateLimiterDependency:
    """FastAPI dependency to apply rate limiting to endpoints"""
    def __init__(self, endpoint_type: str):
        self.endpoint_type = endpoint_type

    async def __call__(self, request: Request, db: "AsyncSession" = Depends(get_db)) -> None:
        await check_rate_limit(request, self.endpoint_type, db=db)
