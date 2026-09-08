import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ShipmentBase(BaseModel):
    order_id: uuid.UUID
    tracking_number: str | None = None
    carrier: str | None = None
    status: str = "pending"
    estimated_delivery: datetime | None = None
    shipping_details: dict | None = None


class ShipmentCreate(BaseModel):
    order_id: uuid.UUID
    carrier: str
    tracking_number: str | None = None


class ShipmentResponse(ShipmentBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None

    model_config = ConfigDict(from_attributes=True)


class MockShipmentProcess(BaseModel):
    order_id: uuid.UUID
    carrier: str = "FedEx"
