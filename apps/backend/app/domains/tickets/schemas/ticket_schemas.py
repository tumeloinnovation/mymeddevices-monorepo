from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid


class TicketBase(BaseModel):
    subject: str = Field(..., min_length=1, max_length=500)
    description: str = Field(..., min_length=1)
    category: str = "general"
    priority: str = "medium"


class TicketCreate(TicketBase):
    pass


class TicketUpdate(BaseModel):
    subject: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = None
    priority: Optional[str] = None


class TicketReplyCreate(BaseModel):
    content: str = Field(..., min_length=1)
    is_internal: str = "no"


class TicketReplyResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    content: str
    is_internal: str
    created_at: datetime
    user_name: Optional[str] = None
    user_role: Optional[str] = None

    class Config:
        from_attributes = True


class TicketResponse(BaseModel):
    id: uuid.UUID
    ticket_number: str
    customer_id: uuid.UUID
    subject: str
    description: str
    category: str
    priority: str
    status: str
    assigned_to: Optional[uuid.UUID] = None
    assignee_name: Optional[str] = None
    resolution: Optional[str] = None
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    last_reply_at: Optional[datetime] = None
    reply_count: int = 0

    class Config:
        from_attributes = True


class TicketDetailResponse(TicketResponse):
    replies: List[TicketReplyResponse] = []

    class Config:
        from_attributes = True


class TicketListResponse(BaseModel):
    items: List[TicketResponse]
    total: int
    page: int
    limit: int
