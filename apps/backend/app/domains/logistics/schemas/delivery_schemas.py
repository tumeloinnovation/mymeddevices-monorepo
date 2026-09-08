"""Delivery-related schemas for logistics operations."""

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from app.domains.logistics.models.delivery import DeliveryStatus, LogisticsType


class DeliveryCreate(BaseModel):
    """Schema for creating a new delivery."""

    order_id: uuid.UUID
    logistics_type: LogisticsType = LogisticsType.COURIER
    delivery_address: dict[str, Any] | None = None
    delivery_notes: str | None = None
    customer_phone: str | None = None


class DeliveryStopResponse(BaseModel):
    """Schema for a single delivery route stop."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    stop_sequence: int
    stop_type: str
    latitude: float
    longitude: float
    address: str | None = None
    vendor_id: uuid.UUID | None = None
    vendor_name: str | None = None
    status: str
    arrived_at: datetime | None = None
    departed_at: datetime | None = None


class DeliveryDriverResponse(BaseModel):
    """Schema for driver information attached to a delivery."""

    id: uuid.UUID
    full_name: str | None = None
    phone: str | None = None
    email: str | None = None
    vehicle_type: str | None = None
    vehicle_plate: str | None = None
    vehicle_color: str | None = None
    current_latitude: float | None = None
    current_longitude: float | None = None
    rating: float | None = None


class DeliveryItemResponse(BaseModel):
    """Schema for item details attached to a delivery."""

    id: uuid.UUID | None = None
    product_id: uuid.UUID | None = None
    product_name: str
    quantity: int
    temperature_sensitive: bool = False
    fragile: bool = False
    weight_kg: float | None = None
    price: float | None = None


class DeliveryResponse(BaseModel):
    """Schema for delivery response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    order_id: uuid.UUID
    logistics_type: LogisticsType
    status: DeliveryStatus
    assigned_driver_id: uuid.UUID | None
    tracking_number: str | None
    tracking_url: str | None
    carrier: str | None
    estimated_delivery: datetime | None
    actual_delivery: datetime | None
    shipping_amount: float | None
    delivery_notes: str | None
    customer_phone: str | None
    assignment_status: str | None = "pending"
    customer_name: str | None = None
    proof_photo_url: str | None = None
    signature_url: str | None = None
    created_at: datetime
    updated_at: datetime
    # Enriched fields
    delivery_address: dict[str, Any] | None = None
    route_coordinates: list[list[float]] | None = None
    calculated_distance_km: float | None = None
    estimated_duration_minutes: int | None = None
    stops: list[DeliveryStopResponse] = []
    items: list[DeliveryItemResponse] = []
    driver: DeliveryDriverResponse | None = None

    @classmethod
    def from_delivery(cls, delivery: Any) -> "DeliveryResponse":
        """Build a fully populated response from a Delivery ORM entity.

        The Delivery ORM model cannot express nested driver/profile and stop
        objects through plain ``from_attributes`` validation, so we assemble
        them here while keeping scalar fields attribute-mapped.
        """
        driver = None
        assigned_user = getattr(delivery, "driver", None)
        if assigned_user is not None:
            profile = getattr(assigned_user, "driver_profile", None)
            full_name = f"{(assigned_user.first_name or '')} {(assigned_user.last_name or '')}".strip() or None
            driver = DeliveryDriverResponse(
                id=assigned_user.id,
                full_name=full_name,
                phone=assigned_user.phone,
                email=assigned_user.email,
                vehicle_type=profile.vehicle_type if profile else None,
                vehicle_plate=profile.vehicle_plate if profile else None,
                vehicle_color=profile.vehicle_color if profile else None,
                current_latitude=profile.current_latitude if profile else None,
                current_longitude=profile.current_longitude if profile else None,
                rating=profile.average_rating if profile else None,
            )

        stops = [DeliveryStopResponse.model_validate(s) for s in (delivery.stops or [])]

        # Extract items from order if available
        items: list[DeliveryItemResponse] = []
        order = getattr(delivery, "order", None)
        if order is not None and getattr(order, "items", None):
            for order_item in order.items:
                product = getattr(order_item, "product", None)
                items.append(
                    DeliveryItemResponse(
                        id=order_item.id,
                        product_id=order_item.product_id,
                        product_name=product.name if product else "Medical item",
                        quantity=order_item.quantity,
                        temperature_sensitive=bool(getattr(product, "requires_prescription", False)),
                        fragile=False,
                        weight_kg=float(getattr(product, "weight_kg", 0.5)) if getattr(product, "weight_kg", None) else None,
                        price=float(order_item.unit_price) if order_item.unit_price is not None else None,
                    )
                )

        # Extract proof URLs from proofs
        proof_photo_url = None
        signature_url = None
        proofs = getattr(delivery, "proofs", None) or []
        for proof in proofs:
            p_data = getattr(proof, "proof_data", {}) or {}
            p_type = getattr(proof, "proof_type", None)
            if p_type == "photo" or getattr(p_type, "value", None) == "photo":
                proof_photo_url = p_data.get("photo_url")
            elif p_type == "signature" or getattr(p_type, "value", None) == "signature":
                signature_url = p_data.get("signature_url")

        # Resolve customer name
        customer_name = None
        if delivery.delivery_address:
            customer_name = delivery.delivery_address.get("full_name") or f"{delivery.delivery_address.get('first_name', '')} {delivery.delivery_address.get('last_name', '')}".strip() or None
        if not customer_name and order is not None and getattr(order, "user", None):
            customer = order.user
            customer_name = f"{(customer.first_name or '')} {(customer.last_name or '')}".strip() or customer.email

        return cls(
            id=delivery.id,
            order_id=delivery.order_id,
            logistics_type=delivery.logistics_type,
            status=delivery.status,
            assigned_driver_id=delivery.assigned_driver_id,
            tracking_number=delivery.tracking_number,
            tracking_url=delivery.tracking_url,
            carrier=delivery.carrier,
            estimated_delivery=delivery.estimated_delivery,
            actual_delivery=delivery.actual_delivery,
            shipping_amount=float(delivery.shipping_amount) if delivery.shipping_amount is not None else None,
            delivery_notes=delivery.delivery_notes,
            customer_phone=delivery.customer_phone,
            assignment_status=getattr(delivery, "assignment_status", "pending") or "pending",
            customer_name=customer_name,
            proof_photo_url=proof_photo_url,
            signature_url=signature_url,
            created_at=delivery.created_at,
            updated_at=delivery.updated_at,
            delivery_address=delivery.delivery_address,
            route_coordinates=delivery.route_coordinates,
            calculated_distance_km=delivery.calculated_distance_km,
            estimated_duration_minutes=delivery.estimated_duration_minutes,
            stops=stops,
            items=items,
            driver=driver,
        )


class DeliveryStatusUpdate(BaseModel):
    """Schema for updating delivery status."""

    status: DeliveryStatus
    estimated_delivery: datetime | None = None
    actual_delivery: datetime | None = None
    tracking_number: str | None = None
    tracking_url: str | None = None


class DeliveryRequirementsRequest(BaseModel):
    """Request schema for delivery requirements matching."""

    weight_kg: float = Field(ge=0, description="Delivery weight in kilograms")
    volume_m3: float = Field(ge=0, description="Delivery volume in cubic meters")
    is_urgent: bool = False
    is_fragile: bool = False
    is_pharma: bool = False
    requires_multi_drop: bool = False
    logistics_type: str = "courier"
    max_distance_km: float | None = Field(None, ge=0)


class EligibleDriverResponse(BaseModel):
    """Response schema for an eligible driver."""

    driver_id: uuid.UUID
    driver_profile_id: uuid.UUID
    vehicle_type: str | None
    status: str
    match_score: float
    distance_km: float | None
    capacity_utilization: float
    estimated_pickup_minutes: int | None
    vehicle_plate: str | None
    rating: float | None
    preferred_zone: str | None


class FindDriversRequest(BaseModel):
    """Request to find eligible drivers."""

    requirements: DeliveryRequirementsRequest
    pickup_latitude: float | None = Field(None, ge=-90, le=90)
    pickup_longitude: float | None = Field(None, ge=-180, le=180)
    zone_code: str | None = None
    limit: int | None = Field(None, ge=1, le=100)


class FindDriversResponse(BaseModel):
    """Response from finding eligible drivers."""

    eligible_drivers: list[EligibleDriverResponse]
    total_count: int
    search_criteria: dict[str, Any]


class DriverCapacityResponse(BaseModel):
    """Response schema for driver capacity status."""

    driver_id: uuid.UUID
    current_deliveries: int
    max_concurrent_deliveries: int
    available_slots: int
    utilization_percent: float
    is_at_capacity: bool
    vehicle_type: str | None
    vehicle_capacity_weight_kg: float | None
    vehicle_capacity_volume_m3: float | None


class MultiDropBatchRequest(BaseModel):
    """Request to create a multi-drop batch."""

    delivery_ids: list[uuid.UUID] = Field(..., min_length=2)
    driver_id: uuid.UUID
    multi_drop_id: uuid.UUID | None = None


class MultiDropBatchResponse(BaseModel):
    """Response from creating multi-drop batch."""

    multi_drop_id: uuid.UUID
    deliveries_assigned: int
    driver_id: uuid.UUID


class ETACalculationRequest(BaseModel):
    """Request for ETA calculation."""

    driver_id: uuid.UUID | None = None
    pickup_latitude: float = Field(..., ge=-90, le=90)
    pickup_longitude: float = Field(..., ge=-180, le=180)
    delivery_latitude: float = Field(..., ge=-90, le=90)
    delivery_longitude: float = Field(..., ge=-180, le=180)
    vehicle_type: str = "motorcycle"
    num_stops: int = Field(0, ge=0)


class ETAResponse(BaseModel):
    """Response with ETA information."""

    estimated_pickup: datetime | None = None
    estimated_delivery: datetime
    total_minutes: int
    distance_km: float
    traffic_coefficient: float
