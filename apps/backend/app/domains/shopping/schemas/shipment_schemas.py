from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
import uuid

class ShipmentBase(BaseModel):
    order_id: uuid.UUID
    tracking_number: Optional[str] = None
    carrier: Optional[str] = None
    status: str = "pending"
    estimated_delivery: Optional[datetime] = None
    shipping_details: Optional[dict] = None

class ShipmentCreate(BaseModel):
    order_id: uuid.UUID
    carrier: str
    tracking_number: Optional[str] = None

class ShipmentResponse(ShipmentBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class MockShipmentProcess(BaseModel):
    order_id: uuid.UUID
    carrier: str = "FedEx"
