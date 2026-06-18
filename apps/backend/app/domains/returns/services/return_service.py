import uuid
from datetime import datetime, timezone
from typing import Tuple, List, Optional
from sqlalchemy import select, func, and_, desc
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.returns.models.return_request import ReturnRequest
from app.domains.returns.schemas.return_schemas import ReturnRequestCreate, ReturnRequestUpdate


class ReturnService:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _generate_return_number(self) -> str:
        """Generate a unique return number."""
        timestamp = datetime.now().strftime("%Y%m%d")
        import random
        return f"RET-{timestamp}-{random.randint(1000, 9999)}"

    async def create_return(
        self, customer_id: uuid.UUID, return_in: ReturnRequestCreate
    ) -> ReturnRequest:
        """Create a new return request."""
        return_number = self._generate_return_number()

        items_with_ids = []
        for item in return_in.items:
            item_data = item.model_dump()
            item_data["id"] = str(uuid.uuid4())
            items_with_ids.append(item_data)

        return_request = ReturnRequest(
            return_number=return_number,
            customer_id=customer_id,
            order_id=return_in.order_id,
            reason=return_in.reason,
            description=return_in.description,
            items=items_with_ids,
            refund_method=return_in.refund_method,
            status="pending",
        )

        self.db.add(return_request)
        await self.db.commit()
        await self.db.refresh(return_request)

        return return_request

    async def get_return(self, return_id: uuid.UUID) -> Optional[ReturnRequest]:
        result = await self.db.execute(
            select(ReturnRequest).where(ReturnRequest.id == return_id)
        )
        return result.scalar_one_or_none()

    async def get_return_by_number(self, return_number: str) -> Optional[ReturnRequest]:
        result = await self.db.execute(
            select(ReturnRequest).where(ReturnRequest.return_number == return_number)
        )
        return result.scalar_one_or_none()

    async def list_returns(
        self,
        customer_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        order_id: Optional[uuid.UUID] = None,
        offset: int = 0,
        limit: int = 20,
    ) -> Tuple[List[ReturnRequest], int]:
        """List return requests with filters."""
        query = select(ReturnRequest)

        # Build filters
        conditions = []
        if customer_id:
            conditions.append(ReturnRequest.customer_id == customer_id)
        if status:
            conditions.append(ReturnRequest.status == status)
        if order_id:
            conditions.append(ReturnRequest.order_id == order_id)

        if conditions:
            query = query.where(and_(*conditions))

        # Get total count
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await self.db.execute(count_query)
        total = total_result.scalar() or 0

        query = query.order_by(desc(ReturnRequest.created_at))
        query = query.offset(offset).limit(limit)

        result = await self.db.execute(query)
        returns = result.scalars().all()

        return list(returns), total

    async def update_return(
        self, return_id: uuid.UUID, return_in: ReturnRequestUpdate
    ) -> Optional[ReturnRequest]:
        """Update a return request."""
        return_request = await self.get_return(return_id)
        if not return_request:
            return None

        update_data = return_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(return_request, key, value)

        await self.db.commit()
        await self.db.refresh(return_request)

        return return_request

    async def update_status(
        self, return_id: uuid.UUID, status: str, resolver_id: uuid.UUID
    ) -> Optional[ReturnRequest]:
        """Update return status (admin only)."""
        return_request = await self.get_return(return_id)
        if not return_request:
            return None

        return_request.status = status

        if status in ["approved", "rejected", "completed", "refunded"]:
            return_request.resolved_at = datetime.now(timezone.utc)
            return_request.resolved_by = resolver_id

        await self.db.commit()
        await self.db.refresh(return_request)

        return return_request

    async def add_shipping_label(
        self, return_id: uuid.UUID, shipping_label: str
    ) -> Optional[ReturnRequest]:
        """Add shipping label to return request."""
        return_request = await self.get_return(return_id)
        if not return_request:
            return None

        return_request.shipping_label = shipping_label
        return_request.status = "approved"

        await self.db.commit()
        await self.db.refresh(return_request)

        return return_request

    async def add_tracking_number(
        self, return_id: uuid.UUID, tracking_number: str
    ) -> Optional[ReturnRequest]:
        """Add tracking number to return request."""
        return_request = await self.get_return(return_id)
        if not return_request:
            return None

        return_request.tracking_number = tracking_number

        await self.db.commit()
        await self.db.refresh(return_request)

        return return_request

    async def cancel_return(self, return_id: uuid.UUID) -> Optional[ReturnRequest]:
        """Cancel a return request."""
        return_request = await self.get_return(return_id)
        if not return_request:
            return None

        # Only allow cancellation if pending
        if return_request.status != "pending":
            raise ValueError("Can only cancel pending returns")

        return_request.status = "rejected"

        await self.db.commit()
        await self.db.refresh(return_request)

        return return_request
