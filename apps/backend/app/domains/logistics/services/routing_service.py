"""Routing service for delivery route calculation and optimization.

Extracted from CartCalculationService.calculate_shipping_details() (lines 213-301).
"""

import datetime as dt
import uuid
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.domains.logistics.models.delivery import LogisticsType
from app.domains.logistics.schemas.routing_schemas import DeliveryRouteResult
from app.domains.logistics.utils.geometry import (
    OFFICE_LAT,
    OFFICE_LON,
    calculate_haversine_distance,
)
from app.domains.logistics.utils.traffic import (
    TravelTimeEstimate,
    estimate_travel_time,
    get_vehicle_base_speed,
)
from app.domains.vendor.models.vendor_profile import VendorProfile


class RoutingService:
    """Service for calculating delivery routes and determining logistics type."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _osrm_route(self, route: list[list[float]]) -> tuple[float, list[list[float]], int] | None:
        """Return OSRM distance km, latitude-first geometry, and duration minutes."""
        if not settings.OSRM_BASE_URL or len(route) < 2:
            return None
        coordinates = ";".join(f"{float(lon)},{float(lat)}" for lat, lon in route)
        url = f"{settings.OSRM_BASE_URL.rstrip('/')}/route/v1/driving/{coordinates}?overview=full&geometries=geojson"
        try:
            async with httpx.AsyncClient(timeout=settings.OSRM_TIMEOUT_SECONDS) as client:
                response = await client.get(url)
                response.raise_for_status()
                payload = response.json()
            osrm_route = payload["routes"][0]
            geometry = [[point[1], point[0]] for point in osrm_route["geometry"]["coordinates"]]
            return (
                float(osrm_route["distance"]) / 1000.0,
                geometry,
                max(1, round(float(osrm_route["duration"]) / 60.0)),
            )
        except Exception:
            return None

    @staticmethod
    def _haversine_route_distance(route: list[list[float]]) -> float:
        return sum(
            calculate_haversine_distance(route[i][0], route[i][1], route[i + 1][0], route[i + 1][1])
            for i in range(len(route) - 1)
        )

    async def calculate_delivery_route(
        self,
        customer_coords: tuple[float, float],
        vendor_ids: list[uuid.UUID] | None = None,
        logistics_settings: dict[str, Any] | None = None,
    ) -> DeliveryRouteResult:
        """Calculate optimal delivery route with stops and distance.

        Determines logistics type (company_rider vs courier), constructs multi-stop
        route, and calculates total distance and fees.

        Args:
            customer_coords: (latitude, longitude) of customer delivery location
            vendor_ids: List of vendor IDs to include in route
            logistics_settings: Settings for flat_fee, rate_per_km, max_radius_km, courier_fee

        Returns:
            DeliveryRouteResult with route, distance, logistics_type, and fees
        """
        if not logistics_settings:
            logistics_settings = {
                "flat_fee": 200.0,
                "rate_per_km": 20.0,
                "max_radius_km": 50.0,
                "courier_fee": 450.0,
            }

        flat_fee = float(logistics_settings.get("flat_fee", 200.0))
        rate_per_km = float(logistics_settings.get("rate_per_km", 20.0))
        max_radius_km = float(logistics_settings.get("max_radius_km", 50.0))
        courier_fee = float(logistics_settings.get("courier_fee", 450.0))

        customer_lat, customer_lon = customer_coords

        # Check distance from Office to Customer
        dist_office_customer = calculate_haversine_distance(OFFICE_LAT, OFFICE_LON, customer_lat, customer_lon)

        # Outside Nairobi surroundings -> use Courier
        if dist_office_customer > max_radius_km:
            # Estimate time for courier (car/van)
            courier_route = [[OFFICE_LAT, OFFICE_LON], [customer_lat, customer_lon]]
            osrm_result = await self._osrm_route(courier_route)
            route_provider = "osrm"
            route_geometry = None
            if osrm_result:
                courier_distance, route_geometry, estimated_minutes = osrm_result
            else:
                route_provider = "haversine"
                courier_distance = dist_office_customer
                time_estimate = estimate_travel_time(distance_km=dist_office_customer, vehicle_type="car")
                estimated_minutes = time_estimate.estimated_duration_minutes
            estimated_arrival = dt.datetime.now(dt.UTC) + dt.timedelta(minutes=estimated_minutes)

            return DeliveryRouteResult(
                logistics_type=LogisticsType.COURIER.value,
                amount=courier_fee,
                distance=courier_distance,
                route=courier_route,
                estimated_duration_minutes=estimated_minutes,
                estimated_arrival=estimated_arrival,
                geometry=route_geometry,
                provider=route_provider,
            )

        # Nairobi surroundings -> Company Rider route
        vendor_coords = []
        if vendor_ids:
            stmt = select(VendorProfile).where(VendorProfile.id.in_(vendor_ids))
            result = await self.db.execute(stmt)
            vendors = result.scalars().all()
            for vendor in vendors:
                if vendor.latitude is not None and vendor.longitude is not None:
                    vendor_coords.append((float(vendor.latitude), float(vendor.longitude)))

        # Construct route: Office -> Vendor 1 -> Vendor 2 ... -> Customer
        route = [[OFFICE_LAT, OFFICE_LON]]
        for v_coords in vendor_coords:
            coord_list = list(v_coords)
            if coord_list not in route:
                route.append(coord_list)
        route.append([customer_lat, customer_lon])

        osrm_result = await self._osrm_route(route)
        route_geometry: list[list[float]] | None
        if osrm_result:
            total_distance, route_geometry, osrm_duration = osrm_result
            route_provider = "osrm"
        else:
            total_distance = self._haversine_route_distance(route)
            route_geometry = None
            route_provider = "haversine"

        shipping_fee = flat_fee + (total_distance * rate_per_km)

        # Calculate ETA for company_rider deliveries
        logistics_type = LogisticsType.COMPANY_RIDER.value
        estimated_minutes: int | None = None
        estimated_arrival: dt.datetime | None = None
        num_stops = len(route) - 2  # Exclude office and customer
        time_estimate = estimate_travel_time(
            distance_km=total_distance,
            vehicle_type="motorcycle",  # Default for company rider
            num_stops=num_stops,
        )
        estimated_minutes = osrm_duration if osrm_result else time_estimate.estimated_duration_minutes
        estimated_arrival = dt.datetime.now(dt.UTC) + dt.timedelta(minutes=estimated_minutes)

        return DeliveryRouteResult(
            logistics_type=logistics_type,
            amount=round(shipping_fee),
            distance=round(total_distance, 2),
            route=route,
            estimated_duration_minutes=estimated_minutes,
            estimated_arrival=estimated_arrival,
            geometry=route_geometry,
            provider=route_provider,
        )

    async def calculate_distance(self, origin: tuple[float, float], destination: tuple[float, float]) -> float:
        """Calculate Haversine distance between two coordinates.

        Args:
            origin: (latitude, longitude) of origin point
            destination: (latitude, longitude) of destination point

        Returns:
            Distance in kilometers
        """
        return calculate_haversine_distance(origin[0], origin[1], destination[0], destination[1])

    async def determine_logistics_type(
        self, customer_coords: tuple[float, float], max_radius_km: float = 50.0
    ) -> LogisticsType:
        """Determine if company_rider or courier based on distance from office.

        Args:
            customer_coords: (latitude, longitude) of customer location
            max_radius_km: Maximum radius for company_rider delivery

        Returns:
            LogisticsType (COMPANY_RIDER or COURIER)
        """
        dist = calculate_haversine_distance(OFFICE_LAT, OFFICE_LON, customer_coords[0], customer_coords[1])
        return LogisticsType.COMPANY_RIDER if dist <= max_radius_km else LogisticsType.COURIER

    async def optimize_route(self, waypoints: list[tuple[float, float]]) -> list[tuple[float, float]]:
        """Optimize route using nearest-neighbor TSP heuristic.

        Simple implementation for multi-vendor route optimization.
        Future: Integrate with external routing APIs (Google Routes, OSRM).

        Args:
            waypoints: List of (lat, lon) coordinates to visit

        Returns:
            Optimized list of coordinates in visit order
        """
        if len(waypoints) <= 2:
            return waypoints

        # Simple nearest-neighbor optimization
        unvisited = waypoints.copy()
        route = [unvisited.pop(0)]  # Start from office

        while unvisited:
            last = route[-1]
            nearest = min(
                unvisited,
                key=lambda p: calculate_haversine_distance(last[0], last[1], p[0], p[1]),
            )
            route.append(nearest)
            unvisited.remove(nearest)

        return route

    async def estimate_travel_time(
        self,
        distance_km: float,
        vehicle_type: str = "motorcycle",
        departure_time: dt.datetime | None = None,
        num_stops: int = 0,
        zone_code: str | None = None,
    ) -> TravelTimeEstimate:
        """Estimate travel time with traffic and stop factors.

        Provides detailed breakdown including:
        - Base travel time
        - Traffic delay
        - Stop delay
        - Total duration

        Args:
            distance_km: Total distance to travel in kilometers
            vehicle_type: Vehicle type for speed calculation (motorcycle, bicycle, car, van, truck)
            departure_time: Departure time (defaults to now)
            num_stops: Number of intermediate stops (each adds 5 minutes)
            zone_code: Zone code for zone-specific traffic (CBD, WEST, EAST, etc.)

        Returns:
            TravelTimeEstimate with detailed breakdown of time components
        """
        return estimate_travel_time(
            distance_km=distance_km,
            vehicle_type=vehicle_type,
            departure_time=departure_time,
            num_stops=num_stops,
            zone_code=zone_code,
        )

    async def estimate_route_duration(
        self,
        route: list[list[float]],
        vehicle_type: str = "motorcycle",
        departure_time: dt.datetime | None = None,
        zone_code: str | None = None,
    ) -> TravelTimeEstimate:
        """Estimate duration for a multi-stop route.

        Args:
            route: List of [lat, lon] coordinates in order of travel
            vehicle_type: Vehicle type for speed calculation
            departure_time: Departure time (defaults to now)
            zone_code: Zone code for zone-specific traffic

        Returns:
            TravelTimeEstimate with breakdown including stop delays
        """
        osrm_result = await self._osrm_route(route)
        if osrm_result:
            total_distance, _, _ = osrm_result
        else:
            total_distance = self._haversine_route_distance(route)

        # Count intermediate stops (excluding start and end)
        num_stops = len(route) - 2

        return estimate_travel_time(
            distance_km=total_distance,
            vehicle_type=vehicle_type,
            departure_time=departure_time,
            num_stops=num_stops,
            zone_code=zone_code,
        )

    def get_vehicle_speed(self, vehicle_type: str) -> float:
        """Get base speed for a vehicle type in km/h.

        Args:
            vehicle_type: Vehicle type identifier

        Returns:
            Base speed in km/h
        """
        return get_vehicle_base_speed(vehicle_type)
