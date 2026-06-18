from typing import Annotated, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.responses import success_response, ApiSuccessResponse
from app.core.dependencies import get_current_user
from app.domains.auth.models.user import User
from app.domains.tickets.schemas.ticket_schemas import (
    TicketCreate,
    TicketUpdate,
    TicketReplyCreate,
    TicketResponse,
    TicketDetailResponse,
    TicketListResponse,
    TicketReplyResponse,
)
from app.domains.tickets.services.ticket_service import TicketService

router = APIRouter(prefix="/tickets", tags=["Support Tickets"])


@router.post("", response_model=ApiSuccessResponse[TicketResponse])
async def create_ticket(
    ticket_in: TicketCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Create a new support ticket."""
    service = TicketService(db)
    ticket = await service.create_ticket(current_user.id, ticket_in)
    return success_response(_ticket_to_response(ticket))


@router.get("", response_model=ApiSuccessResponse[TicketListResponse])
async def list_my_tickets(
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List my support tickets."""
    service = TicketService(db)
    offset = (page - 1) * limit

    tickets, total = await service.list_tickets(
        customer_id=current_user.id,
        status=status,
        search=search,
        offset=offset,
        limit=limit,
    )

    return success_response(
        TicketListResponse(
            items=[_ticket_to_response(t) for t in tickets],
            total=total,
            page=page,
            limit=limit,
        )
    )


@router.get("/{ticket_id}", response_model=ApiSuccessResponse[TicketDetailResponse])
async def get_ticket_details(
    ticket_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Get ticket details with replies."""
    service = TicketService(db)
    ticket = await service.get_ticket(ticket_id)

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found"
        )

    # Verify ownership
    if ticket.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    replies = await service.get_replies(ticket_id)

    return success_response(
        TicketDetailResponse(
            **_ticket_to_response(ticket).model_dump(),
            replies=[_reply_to_response(r, ticket) for r in replies],
        )
    )


@router.post("/{ticket_id}/replies", response_model=ApiSuccessResponse[TicketReplyResponse])
async def add_reply(
    ticket_id: uuid.UUID,
    reply_in: TicketReplyCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Add a reply to a ticket."""
    service = TicketService(db)
    ticket = await service.get_ticket(ticket_id)

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found"
        )

    # Verify ownership
    if ticket.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    reply = await service.add_reply(ticket_id, current_user.id, reply_in)

    if not reply:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to add reply"
        )

    return success_response(_reply_to_response(reply, ticket))


@router.post("/{ticket_id}/close", response_model=ApiSuccessResponse[TicketResponse])
async def close_ticket(
    ticket_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """Close a ticket."""
    service = TicketService(db)
    ticket = await service.get_ticket(ticket_id)

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found"
        )

    # Verify ownership
    if ticket.customer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Access denied"
        )

    closed_ticket = await service.close_ticket(ticket_id, current_user.id)

    if not closed_ticket:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to close ticket"
        )

    return success_response(_ticket_to_response(closed_ticket))


# Helper functions
def _ticket_to_response(ticket) -> TicketResponse:
    """Convert ticket model to response."""
    return TicketResponse(
        id=ticket.id,
        ticket_number=ticket.ticket_number,
        customer_id=ticket.customer_id,
        subject=ticket.subject,
        description=ticket.description,
        category=ticket.category,
        priority=ticket.priority,
        status=ticket.status,
        assigned_to=ticket.assigned_to,
        assignee_name=None,
        resolution=ticket.resolution,
        resolved_at=ticket.resolved_at,
        closed_at=ticket.closed_at,
        created_at=ticket.created_at,
        updated_at=ticket.updated_at,
        last_reply_at=ticket.last_reply_at,
        reply_count=len(ticket.replies) if ticket.replies else 0,
    )


def _reply_to_response(reply, ticket) -> TicketReplyResponse:
    """Convert reply model to response."""
    user_name = None
    user_role = None

    if reply.user:
        user_name = reply.user.display_name or reply.user.email
        if reply.user.role == "admin":
            user_role = "Support Agent"
        elif reply.user.role == "vendor":
            user_role = "Vendor"
        else:
            user_role = "Customer"

    return TicketReplyResponse(
        id=reply.id,
        user_id=reply.user_id,
        content=reply.content,
        is_internal=reply.is_internal,
        created_at=reply.created_at,
        user_name=user_name,
        user_role=user_role,
    )
