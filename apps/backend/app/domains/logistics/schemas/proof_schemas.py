"""Proof schemas for proof of delivery."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.domains.logistics.models.delivery_proof import ProofType


class DeliveryProofCreate(BaseModel):
    """Schema for creating delivery proof."""

    delivery_id: uuid.UUID
    proof_type: ProofType
    proof_data: dict
    captured_by: uuid.UUID


class DeliveryProofResponse(BaseModel):
    """Schema for delivery proof response."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    delivery_id: uuid.UUID
    proof_type: ProofType
    proof_data: dict
    captured_by_user_id: uuid.UUID | None = None
    captured_at: datetime
    created_at: datetime
