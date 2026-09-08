import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID | str
    notification_type: str
    title: str
    body: str
    data: dict[str, Any]
    is_read: bool
    read_at: datetime | None
    created_at: datetime
    updated_at: datetime


class UnreadCountResponse(BaseModel):
    count: int
