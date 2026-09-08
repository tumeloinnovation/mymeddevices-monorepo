import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class TicketBase(BaseModel):
    subject: str = Field(..., min_length=1, max_length=500)
    description: str = Field(..., min_length=1)
    category: str = "general"
    priority: str = "medium"


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    subject: str | None = Field(None, min_length=1, max_length=500)
    description: str | None = Field(None, min_length=1)
    category: str | None = None
    priority: str | None = None


class TicketReplyCreate(BaseModel):
    content: str = Field(..., min_length=1)
    is_internal: str = "no"


class TicketReplyResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    content: str
    is_internal: str
    created_at: datetime
    user_name: str | None = None
    user_role: str | None = None

    model_config = ConfigDict(from_attributes=True)


class TicketResponse(BaseModel):
    id: uuid.UUID
    ticket_number: str
    customer_id: uuid.UUID
    subject: str
    description: str
    category: str
    priority: str
    status: str
    assigned_to: uuid.UUID | None = None
    assignee_name: str | None = None
    resolution: str | None = None
    resolved_at: datetime | None = None
    closed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    last_reply_at: datetime | None = None
    reply_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class TicketDetailResponse(TicketResponse):
    replies: list[TicketReplyResponse] = []

    model_config = ConfigDict(from_attributes=True)


class TicketListResponse(BaseModel):
    items: list[TicketResponse]
    total: int
    page: int
    limit: int
