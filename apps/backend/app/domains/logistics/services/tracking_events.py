"""Redis-backed realtime tracking event fan-out."""

from __future__ import annotations

import asyncio
import json
from collections import defaultdict
from collections.abc import AsyncIterator
from typing import Any

from app.core.cache import get_redis

_subscribers: dict[str, set[asyncio.Queue[Any]]] = defaultdict(set)


async def publish_tracking_event(delivery_id: str, event_type: str, payload: dict[str, Any]) -> None:
    message = json.dumps({"type": event_type, "delivery_id": delivery_id, **payload}, default=str)
    channel = f"tracking:{delivery_id}"
    try:
        redis = get_redis()
        if redis:
            await redis.publish(channel, message)
            return
    except Exception:
        pass
    for queue in list(_subscribers[channel]):
        await queue.put(message)


async def subscribe_tracking_events(delivery_id: str) -> AsyncIterator[str]:
    """Subscribe with Redis when available, otherwise an in-process fallback."""
    redis = get_redis()
    if redis:
        pubsub = redis.pubsub()
        await pubsub.subscribe(f"tracking:{delivery_id}")
        try:
            async for message in pubsub.listen():
                if message.get("type") == "message" and isinstance(message.get("data"), str):
                    yield message["data"]
        finally:
            await pubsub.unsubscribe(f"tracking:{delivery_id}")
            await pubsub.aclose()
        return

    queue: asyncio.Queue[str] = asyncio.Queue()
    _subscribers[f"tracking:{delivery_id}"].add(queue)
    try:
        while True:
            yield await queue.get()
    finally:
        _subscribers[f"tracking:{delivery_id}"].discard(queue)
