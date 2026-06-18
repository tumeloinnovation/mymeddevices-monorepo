import uuid
from datetime import datetime, timezone
from typing import Tuple, List, Optional
from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domains.tickets.models.ticket import Ticket, TicketReply
from app.domains.tickets.schemas.ticket_schemas import (
    TicketCreate,
    TicketUpdate,
    TicketReplyCreate,
)
from app.domains.auth.models.user import User


class TicketService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _generate_ticket_number(self) -> str:
        """Generate a unique ticket number."""
        # Use timestamp + random suffix for uniqueness
        timestamp = datetime.now().strftime("%Y%m%d")
        import random
        return f"TKT-{timestamp}-{random.randint(1000, 9999)}"

    async def create_ticket(
        self, customer_id: uuid.UUID, ticket_in: TicketCreate
    ) -> Ticket:
        """Create a new support ticket."""
        # Check if ticket number already exists and generate new one if needed
        ticket_number = self._generate_ticket_number()
        while await self._ticket_number_exists(ticket_number):
            ticket_number = self._generate_ticket_number()

        ticket = Ticket(
            ticket_number=ticket_number,
            customer_id=customer_id,
            subject=ticket_in.subject,
            description=ticket_in.description,
            category=ticket_in.category,
            priority=ticket_in.priority,
            status="open",
        )

        self.db.add(ticket)
        await self.db.commit()
        await self.db.refresh(ticket)

        return ticket

    async def _ticket_number_exists(self, ticket_number: str) -> bool:
        """Check if ticket number already exists."""
        result = await self.db.execute(
            select(Ticket).where(Ticket.ticket_number == ticket_number)
        )
        return result.scalar_one_or_none() is not None

    async def get_ticket(self, ticket_id: uuid.UUID) -> Optional[Ticket]:
        """Get a ticket by ID with replies."""
        result = await self.db.execute(
            select(Ticket)
            .options(selectinload(Ticket.replies))
            .where(Ticket.id == ticket_id)
        )
        return result.scalar_one_or_none()

    async def get_ticket_by_number(self, ticket_number: str) -> Optional[Ticket]:
        """Get a ticket by ticket number."""
        result = await self.db.execute(
            select(Ticket)
            .options(selectinload(Ticket.replies))
            .where(Ticket.ticket_number == ticket_number)
        )
        return result.scalar_one_or_none()

    async def list_tickets(
        self,
        customer_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        search: Optional[str] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> Tuple[List[Ticket], int]:
        """List tickets with filters."""
        query = select(Ticket)

        # Build filters
        conditions = []
        if customer_id:
            conditions.append(Ticket.customer_id == customer_id)
        if status:
            conditions.append(Ticket.status == status)
        if category:
            conditions.append(Ticket.category == category)
        if priority:
            conditions.append(Ticket.priority == priority)
        if search:
            conditions.append(
                (Ticket.subject.ilike(f"%{search}%")) |
                (Ticket.ticket_number.ilike(f"%{search}%"))
            )

        if conditions:
            query = query.where(and_(*conditions))

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated results
        query = query.options(selectinload(Ticket.replies)).order_by(desc(Ticket.created_at))
        query = query.offset(offset).limit(limit)

        result = await self.db.execute(query)
        tickets = result.scalars().all()

        return list(tickets), total

    async def update_ticket(
        self, ticket_id: uuid.UUID, ticket_in: TicketUpdate
    ) -> Optional[Ticket]:
        """Update a ticket."""
        ticket = await self.get_ticket(ticket_id)
        if not ticket:
            return None

        update_data = ticket_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(ticket, key, value)

        await self.db.commit()
        await self.db.refresh(ticket)

        return ticket

    async def add_reply(
        self, ticket_id: uuid.UUID, user_id: uuid.UUID, reply_in: TicketReplyCreate
    ) -> Optional[TicketReply]:
        """Add a reply to a ticket."""
        ticket = await self.get_ticket(ticket_id)
        if not ticket:
            return None

        reply = TicketReply(
            ticket_id=ticket_id,
            user_id=user_id,
            content=reply_in.content,
            is_internal=reply_in.is_internal,
        )

        self.db.add(reply)

        # Update ticket's last_reply_at
        ticket.last_reply_at = datetime.now(timezone.utc)

        # Auto-update status based on who is replying
        if reply_in.is_internal == "no" and ticket.status in ["resolved", "closed"]:
            ticket.status = "open"
        elif reply_in.is_internal == "yes" and ticket.status == "open":
            ticket.status = "in_progress"

        await self.db.commit()
        await self.db.refresh(reply)

        return reply

    async def get_replies(self, ticket_id: uuid.UUID) -> List[TicketReply]:
        """Get all replies for a ticket."""
        result = await self.db.execute(
            select(TicketReply)
            .where(TicketReply.ticket_id == ticket_id)
            .order_by(TicketReply.created_at)
        )
        return list(result.scalars().all())

    async def update_status(
        self, ticket_id: uuid.UUID, status: str, user_id: uuid.UUID
    ) -> Optional[Ticket]:
        """Update ticket status."""
        ticket = await self.get_ticket(ticket_id)
        if not ticket:
            return None

        ticket.status = status

        if status == "resolved":
            ticket.resolved_at = datetime.now(timezone.utc)
        elif status == "closed":
            ticket.closed_at = datetime.now(timezone.utc)

        await self.db.commit()
        await self.db.refresh(ticket)

        return ticket

    async def close_ticket(self, ticket_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Ticket]:
        """Close a ticket."""
        return await self.update_status(ticket_id, "closed", user_id)

    async def assign_ticket(
        self, ticket_id: uuid.UUID, assign_to_id: uuid.UUID
    ) -> Optional[Ticket]:
        """Assign a ticket to a user."""
        ticket = await self.get_ticket(ticket_id)
        if not ticket:
            return None

        ticket.assigned_to = assign_to_id
        if ticket.status == "open":
            ticket.status = "in_progress"

        await self.db.commit()
        await self.db.refresh(ticket)

        return ticket

    async def delete_ticket(self, ticket_id: uuid.UUID) -> bool:
        """Delete a ticket (soft delete by closing)."""
        ticket = await self.get_ticket(ticket_id)
        if not ticket:
            return False

        ticket.status = "closed"
        await self.db.commit()
        return True
