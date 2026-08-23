"""Small async Redis cache used for high-frequency logistics data."""

from __future__ import annotations

import json
from typing import Any

from redis.asyncio import Redis

from app.core.config import settings

_client: Redis | None = None


def get_redis() -> Redis | None:
    global _client
    if not settings.REDIS_URL:
        return None
    if _client is None:
        _client = Redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=1, socket_timeout=1)
    return _client


async def cache_get_json(key: str) -> Any | None:
    try:
        client = get_redis()
        if client is None:
            return None
        value = await client.get(key)
        return json.loads(value) if value else None
    except Exception:
        return None


async def cache_set_json(key: str, value: Any, ttl_seconds: int) -> None:
    try:
        client = get_redis()
        if client is not None:
            await client.set(key, json.dumps(value, separators=(",", ":"), default=str), ex=ttl_seconds)
    except Exception:
        return
