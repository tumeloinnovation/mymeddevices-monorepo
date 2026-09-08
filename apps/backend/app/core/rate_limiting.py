import asyncio
import ipaddress
import sys
import time
import uuid
from collections import defaultdict, deque
from typing import TYPE_CHECKING, Optional

from fastapi import Depends, HTTPException, Request, status

from app.core.config import settings
from app.core.database import get_db
from app.core.logging import logger

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

# Atomic sliding-window rate limit Lua script for Redis
# KEYS[1]: Rate limit zset key (e.g. rate_limit:login:ip:1.2.3.4)
# ARGV[1]: Current timestamp (float as string)
# ARGV[2]: Window size in seconds (int as string)
# ARGV[3]: Max requests allowed (int as string)
# ARGV[4]: Unique member identifier (e.g. timestamp:uuid)
# Returns: table [allowed (1 or 0), remaining_count, reset_timestamp]
SLIDING_WINDOW_LUA_SCRIPT = """
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local max_requests = tonumber(ARGV[3])
local member = ARGV[4]

local cutoff = now - window
redis.call('ZREMRANGEBYSCORE', key, 0, cutoff)
local current_count = redis.call('ZCARD', key)

if current_count >= max_requests then
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local reset_ts = now + window
    if oldest and #oldest >= 2 then
        reset_ts = tonumber(oldest[2]) + window
    end
    return {0, 0, math.floor(reset_ts)}
else
    redis.call('ZADD', key, now, member)
    redis.call('EXPIRE', key, math.ceil(window))
    local remaining = max_requests - (current_count + 1)
    local reset_ts = now + window
    return {1, remaining, math.floor(reset_ts)}
end
"""


class RateLimiter:
    """
    Sliding window rate limiter supporting both Redis and In-Memory.

    Tracks requests per identifier (IP, device_id, etc.) within a time window atomically.
    """

    def __init__(self):
        # Store for in-memory fallback: {identifier: deque of (timestamp, count)}
        self._requests: defaultdict[str, deque[tuple[float, int]]] = defaultdict(deque)
        self._lock = asyncio.Lock()
        # Configuration: {endpoint_key: (max_requests, window_seconds)}
        self._default_limits: dict[str, tuple[int, int]] = {
            "login": (10, 300),  # 10 requests per 5 minutes
            "register": (10, 3600),  # 10 requests per hour
            "otp": (10, 300),  # 10 OTP requests per 5 minutes
            "password_reset": (10, 300),  # 10 password resets per 5 minutes
            "guest_login": (10, 3600),  # 10 guest logins per hour
            "products_get": (60, 60),  # 60 product GET requests per minute
            "mpesa_callback": (120, 60),  # 120 callback requests per minute
            "mpesa_status": (60, 60),  # 60 status checks per minute
            "stk_push": (15, 60),  # 15 STK pushes per minute
            "checkout": (20, 300),  # 20 checkouts per 5 minutes (order-spam protection)
        }
        self._limits: dict[str, tuple[int, int]] = self._default_limits.copy()
        self._last_refresh: float = 0
        self._refresh_interval = 60  # Refresh limits from DB every 60 seconds
        self.redis_client = None
        self._lua_script = None

        # Check if running under test
        is_testing = "pytest" in sys.modules or "unittest" in sys.modules

        # Enforce Redis in production (case-insensitive check)
        if settings.ENVIRONMENT.lower() == "production":
            if not settings.REDIS_URL:
                raise ValueError("REDIS_URL must be configured when running in a production environment.")
            try:
                import redis.asyncio as aioredis

                self.redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
                self._lua_script = self.redis_client.register_script(SLIDING_WINDOW_LUA_SCRIPT)
                logger.info("Redis rate limiting storage initialized for production.")
            except Exception as e:
                logger.error(f"Failed to initialize Redis for rate limiting in production: {e}")
                raise RuntimeError(f"Redis initialization failed in production: {e}")
        elif not is_testing and settings.REDIS_URL:
            try:
                import redis.asyncio as aioredis

                self.redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
                self._lua_script = self.redis_client.register_script(SLIDING_WINDOW_LUA_SCRIPT)
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
                self._limits = {
                    k: (int(v[0]), int(v[1]))
                    for k, v in db_limits.items()
                    if isinstance(v, (list, tuple)) and len(v) >= 2
                }
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

    async def check_and_record(
        self, identifier: str, endpoint_type: str, current_time: float | None = None
    ) -> tuple[bool, dict[str, int]]:
        """
        Atomically check and record a request under rate limits.

        Returns:
            (allowed, info_dict) where info_dict contains:
            - limit: max requests allowed
            - remaining: requests remaining
            - reset: timestamp when limit resets
        """
        if current_time is None:
            current_time = time.time()

        max_requests, window_seconds = self._limits.get(
            endpoint_type,
            (10, 60),  # Default: 10 requests per minute
        )

        # 1. Atomic Redis sliding-window via Lua script
        if self.redis_client:
            key = f"rate_limit:{endpoint_type}:{identifier}"
            member = f"{current_time}:{uuid.uuid4()}"
            try:
                if self._lua_script is None:
                    self._lua_script = self.redis_client.register_script(SLIDING_WINDOW_LUA_SCRIPT)
                res = await self._lua_script(
                    keys=[key],
                    args=[str(current_time), str(window_seconds), str(max_requests), member],
                )
                allowed_num, remaining, reset_ts = res
                is_allowed = bool(allowed_num == 1)
                return is_allowed, {
                    "limit": max_requests,
                    "remaining": int(remaining),
                    "reset": int(reset_ts),
                }
            except Exception as e:
                logger.error(f"Redis rate limiter error: {e}. Falling back to in-memory storage.")

        # 2. In-Memory fallback implementation protected by asyncio.Lock
        async with self._lock:
            count = self._get_count(identifier, window_seconds, current_time)
            if count >= max_requests:
                if self._requests[identifier]:
                    reset_timestamp = self._requests[identifier][0][0] + window_seconds
                else:
                    reset_timestamp = current_time + window_seconds

                return False, {"limit": max_requests, "remaining": 0, "reset": int(reset_timestamp)}

            # Record request atomically within lock
            self._requests[identifier].append((current_time, 1))
            return True, {
                "limit": max_requests,
                "remaining": max_requests - (count + 1),
                "reset": int(current_time + window_seconds),
            }

    async def is_allowed(
        self, identifier: str, endpoint_type: str, current_time: float | None = None
    ) -> tuple[bool, dict[str, int]]:
        """
        Check if request is allowed under rate limit without recording (read-only inspection).
        """
        if current_time is None:
            current_time = time.time()

        max_requests, window_seconds = self._limits.get(
            endpoint_type,
            (10, 60),
        )

        if self.redis_client:
            key = f"rate_limit:{endpoint_type}:{identifier}"
            try:
                cutoff = current_time - window_seconds
                async with self.redis_client.pipeline(transaction=True) as pipe:
                    pipe.zremrangebyscore(key, 0, cutoff)
                    pipe.zcard(key)
                    pipe.zrange(key, 0, 0, withscores=True)
                    res = await pipe.execute()

                _, count, oldest_items = res

                if count >= max_requests:
                    reset_timestamp = oldest_items[0][1] + window_seconds if oldest_items else current_time + window_seconds
                    return False, {"limit": max_requests, "remaining": 0, "reset": int(reset_timestamp)}

                return True, {
                    "limit": max_requests,
                    "remaining": max_requests - count,
                    "reset": int(current_time + window_seconds),
                }
            except Exception as e:
                logger.error(f"Redis rate limiter read error: {e}. Falling back to in-memory storage.")

        async with self._lock:
            count = self._get_count(identifier, window_seconds, current_time)
            if count >= max_requests:
                reset_timestamp = (
                    self._requests[identifier][0][0] + window_seconds
                    if self._requests[identifier]
                    else current_time + window_seconds
                )
                return False, {"limit": max_requests, "remaining": 0, "reset": int(reset_timestamp)}

            return True, {
                "limit": max_requests,
                "remaining": max_requests - count,
                "reset": int(current_time + window_seconds),
            }

    async def record_request(self, identifier: str, endpoint_type: str) -> None:
        """Record a request for rate limiting."""
        current_time = time.time()
        _, window_seconds = self._limits.get(endpoint_type, (10, 60))

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

        async with self._lock:
            self._clean_old_requests(identifier, window_seconds, current_time)
            self._requests[identifier].append((current_time, 1))

    def clear(self, identifier: str | None = None) -> None:
        """Clear rate limit data (synchronous for compatibility with testing frameworks)"""
        if identifier:
            if identifier in self._requests:
                del self._requests[identifier]
        else:
            self._requests.clear()


def is_trusted_proxy(peer_ip: str) -> bool:
    """Check if the direct peer connecting IP belongs to configured trusted proxies."""
    if not peer_ip or peer_ip == "unknown":
        return False
    try:
        ip_obj = ipaddress.ip_address(peer_ip)
        for trusted in settings.TRUSTED_PROXIES:
            try:
                if "/" in trusted:
                    if ip_obj in ipaddress.ip_network(trusted, strict=False):
                        return True
                else:
                    if ip_obj == ipaddress.ip_address(trusted):
                        return True
            except ValueError:
                continue
    except ValueError:
        return False
    return False


def resolve_client_ip(request: Request) -> str:
    """
    Extract verified client IP.
    Only trust X-Forwarded-For / X-Real-IP if the direct TCP peer (request.client.host) is a trusted proxy.
    """
    peer_ip = request.client.host if request.client else "unknown"
    if not is_trusted_proxy(peer_ip):
        return peer_ip

    # Peer is a trusted reverse proxy; parse forwarding headers
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        parts = [p.strip() for p in forwarded_for.split(",") if p.strip()]
        if parts:
            return parts[0]

    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()

    return peer_ip


# Global rate limiter instance
rate_limiter = RateLimiter()


async def get_identifier(request: Request, endpoint_type: str) -> str:
    """
    Extract identifier for rate limiting from request.

    SECURITY: ALWAYS includes client IP to prevent bypass.
    Only trusts proxy headers (X-Forwarded-For) if direct peer is in TRUSTED_PROXIES.
    Device ID is used as a secondary discriminator when present.
    """
    client_ip = resolve_client_ip(request)

    # For login/register/guest_login, also extract device_id as secondary discriminator
    device_id = None
    if endpoint_type in ["login", "register", "guest_login"]:
        try:
            body = await request.json()
            if isinstance(body, dict):
                device_id = body.get("device_id")
        except Exception:
            pass

    # Always include IP, device_id as secondary if present
    if device_id:
        return f"ip:{client_ip}:device:{device_id}"
    else:
        return f"ip:{client_ip}"


async def check_rate_limit(
    request: Request, endpoint_type: str, identifier: str | None = None, db: Optional["AsyncSession"] = None
) -> None:
    """
    Check rate limit and raise exception if exceeded (atomic check-and-record).

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

    # Atomically check and record the request
    allowed, info = await rate_limiter.check_and_record(identifier, endpoint_type)

    if not allowed:
        logger.warning(f"Rate limit exceeded for {identifier} on {endpoint_type}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "error": "Rate limit exceeded",
                "limit": info["limit"],
                "remaining": info["remaining"],
                "reset": info["reset"],
            },
            headers={
                "X-RateLimit-Limit": str(info["limit"]),
                "X-RateLimit-Remaining": str(info["remaining"]),
                "X-RateLimit-Reset": str(info["reset"]),
                "Retry-After": str(max(0, info["reset"] - int(time.time()))),
            },
        )


class RateLimiterDependency:
    """FastAPI dependency to apply rate limiting to endpoints"""

    def __init__(self, endpoint_type: str):
        self.endpoint_type = endpoint_type

    async def __call__(self, request: Request, db: "AsyncSession" = Depends(get_db)) -> None:
        await check_rate_limit(request, self.endpoint_type, db=db)

