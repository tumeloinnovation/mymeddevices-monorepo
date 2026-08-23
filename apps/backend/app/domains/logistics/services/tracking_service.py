"""Canonical live delivery tracking projections."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.cache import cache_get_json, cache_set_json
from app.core.security import verify_password
from app.domains.auth.models.user import User
from app.domains.logistics.models.delivery import Delivery
from app.domains.logistics.models.delivery_stop import DeliveryStop
from app.domains.logistics.models.tracking_token import DeliveryTrackingToken
from app.domains.shopping.models.order import Order


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value else None


class TrackingService:
    """Build a single customer-safe projection for all delivery surfaces."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_delivery(self, delivery_id: uuid.UUID) -> Delivery | None:
        result = await self.db.execute(
            select(Delivery)
            .where(Delivery.id == delivery_id)
            .options(
                selectinload(Delivery.stops),
                selectinload(Delivery.driver).selectinload(User.driver_profile),
                selectinload(Delivery.proofs),
                selectinload(Delivery.order).selectinload(Order.timeline_events),
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    def _current_stop(stops: list[DeliveryStop]) -> tuple[int, DeliveryStop | None]:
        ordered = sorted(stops, key=lambda stop: stop.stop_sequence)
        for index, stop in enumerate(ordered):
            if stop.status != "completed":
                return index, stop
        return max(0, len(ordered) - 1), ordered[-1] if ordered else None

    @staticmethod
    def _driver_identity(delivery: Delivery) -> dict[str, Any]:
        driver = delivery.driver
        if not driver:
            return {"name": None, "vehicle_plate": None}
        profile = getattr(driver, "driver_profile", None)
        name = f"{driver.first_name or ''} {driver.last_name or ''}".strip() or None
        return {"name": name, "vehicle_plate": profile.vehicle_plate if profile else None}

    def _snapshot(self, delivery: Delivery) -> dict[str, Any]:
        current_index, current_stop = self._current_stop(delivery.stops or [])
        driver = self._driver_identity(delivery)
        profile = getattr(delivery.driver, "driver_profile", None)
        location = (
            [profile.current_latitude, profile.current_longitude]
            if profile and profile.current_latitude is not None and profile.current_longitude is not None
            else None
        )
        ordered_stops = sorted(delivery.stops or [], key=lambda stop: stop.stop_sequence)
        return {
            "delivery_id": str(delivery.id),
            "order_id": str(delivery.order_id),
            "status": delivery.status.value,
            "current_stop": {
                "sequence": current_stop.stop_sequence,
                "type": current_stop.stop_type,
                "address": current_stop.address,
                "vendor_name": current_stop.vendor_name,
                "latitude": current_stop.latitude,
                "longitude": current_stop.longitude,
            }
            if current_stop
            else None,
            "current_stop_index": current_index,
            "total_stops": len(ordered_stops),
            "remaining_distance_km": delivery.remaining_distance_km,
            "distance_km": delivery.calculated_distance_km,
            "traveled_distance_km": delivery.traveled_distance_km,
            "route_geometry": delivery.route_geometry or delivery.route_coordinates or [],
            "route_provider": delivery.route_provider,
            "eta_minutes": delivery.estimated_duration_minutes,
            "estimated_delivery": _iso(delivery.estimated_delivery),
            "actual_delivery": _iso(delivery.actual_delivery),
            "last_location_update_at": _iso(profile.last_location_update_at) if profile else None,
            "driver_location": location,
            "driver_name": driver["name"],
            "vehicle_plate": driver["vehicle_plate"],
            "stops": [
                {
                    "stop_sequence": stop.stop_sequence,
                    "stop_type": stop.stop_type,
                    "latitude": stop.latitude,
                    "longitude": stop.longitude,
                    "address": stop.address,
                    "vendor_name": stop.vendor_name,
                    "status": stop.status,
                }
                for stop in ordered_stops
            ],
            "proof_ready": bool(delivery.proofs),
            "history": [
                {
                    "status": str(event.status),
                    "timestamp": _iso(event.created_at),
                    "description": event.message,
                }
                for event in sorted(delivery.order.timeline_events or [], key=lambda event: event.created_at)
            ],
        }

    async def get_tracking(self, delivery_id: uuid.UUID) -> dict[str, Any] | None:
        cache_key = f"tracking:{delivery_id}"
        cached = await cache_get_json(cache_key)
        if cached:
            return cached
        delivery = await self._get_delivery(delivery_id)
        if not delivery:
            return None
        snapshot = self._snapshot(delivery)
        await cache_set_json(cache_key, snapshot, ttl_seconds=10)
        return snapshot

    async def issue_guest_token(self, delivery_id: uuid.UUID, user_id: uuid.UUID | None, ttl_hours: int = 72) -> str:
        delivery = await self._get_delivery(delivery_id)
        if not delivery:
            raise LookupError("Delivery not found")
        token_model, token = DeliveryTrackingToken.issue(delivery_id, user_id, ttl_hours)
        self.db.add(token_model)
        await self.db.commit()
        return token

    async def revoke_guest_token(self, delivery_id: uuid.UUID, token_id: uuid.UUID) -> None:
        result = await self.db.execute(
            select(DeliveryTrackingToken).where(
                DeliveryTrackingToken.id == token_id,
                DeliveryTrackingToken.delivery_id == delivery_id,
            )
        )
        token = result.scalar_one_or_none()
        if not token:
            raise LookupError("Tracking token not found")
        token.revoked_at = datetime.now(UTC)
        await self.db.commit()

    async def get_tracking_by_token(self, raw_token: str) -> dict[str, Any] | None:
        candidates = (await self.db.execute(select(DeliveryTrackingToken))).scalars().all()
        matched = next(
            (
                candidate
                for candidate in candidates
                if verify_password(raw_token, candidate.token_hash)
            ),
            None,
        )
        if not matched or not matched.is_active:
            return None
        snapshot = await self.get_tracking(matched.delivery_id)
        if snapshot:
            matched.last_used_at = datetime.now(UTC)
            matched.use_count += 1
            await self.db.commit()
        return snapshot
