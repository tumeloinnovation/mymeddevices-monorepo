import uuid
from contextlib import asynccontextmanager
from datetime import UTC, datetime

from sqlalchemy import and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import AuthorizationError, BusinessRuleError, ConflictError, NotFoundError
from app.domains.returns.models.return_request import ReturnRequest
from app.domains.returns.schemas.return_schemas import ReturnRequestCreate, ReturnRequestUpdate
from app.domains.shopping.models.order import Order, OrderStatus


class ReturnService:
    def __init__(self, db: AsyncSession):
        self.db = db

    @asynccontextmanager
    async def _transaction(self):
        """Use begin_nested (SAVEPOINT) when already in a transaction."""
        if self.db.in_transaction():
            async with self.db.begin_nested():
                yield
        else:
            async with self.db.begin():
                yield

    def _generate_return_number(self) -> str:
        """Generate a unique return number."""
        timestamp = datetime.now().strftime("%Y%m%d")
        import random

        return f"RET-{timestamp}-{random.randint(1000, 9999)}"

    async def create_return(self, customer_id: uuid.UUID, return_in: ReturnRequestCreate) -> ReturnRequest:
        """Create a new return request with full validation and authorization."""
        # 1. Validate Order exists and belongs to customer
        order_stmt = select(Order).where(Order.id == return_in.order_id).options(selectinload(Order.items))
        order_res = await self.db.execute(order_stmt)
        order = order_res.scalar_one_or_none()

        if not order:
            raise NotFoundError("Order", return_in.order_id)

        if order.user_id != customer_id:
            raise AuthorizationError("You cannot request a return for an order that does not belong to you.")

        # 2. Validate Order is in eligible return state
        if order.status not in (OrderStatus.DELIVERED, OrderStatus.SHIPPED):
            raise BusinessRuleError(
                f"Order status '{order.status.value}' is not eligible for returns. Only delivered or shipped orders can be returned."
            )

        # 3. Validate items belong to the order and quantities do not exceed purchased quantities
        order_items_by_id = {item.id: item for item in order.items}
        if not return_in.items:
            raise BusinessRuleError("At least one item must be selected for return.")

        items_with_ids = []
        for item in return_in.items:
            order_item = order_items_by_id.get(item.order_item_id)
            if not order_item:
                raise BusinessRuleError(f"Order item {item.order_item_id} does not belong to order {order.id}.")

            if order_item.product_id != item.product_id:
                raise BusinessRuleError(f"Product {item.product_id} does not match order item {item.order_item_id}.")

            if item.quantity > order_item.quantity:
                raise BusinessRuleError(
                    f"Requested return quantity ({item.quantity}) exceeds purchased quantity ({int(order_item.quantity)}) for item {item.product_name}."
                )

            item_data = item.model_dump(mode="json")
            item_data["id"] = str(uuid.uuid4())
            items_with_ids.append(item_data)

        # 4. Check for duplicate active return requests on this order
        active_returns_stmt = select(ReturnRequest).where(
            and_(
                ReturnRequest.order_id == return_in.order_id,
                ReturnRequest.status.in_(["pending", "approved", "processing"]),
            )
        )
        active_returns = (await self.db.execute(active_returns_stmt)).scalars().all()
        if active_returns:
            raise ConflictError("An active return request already exists for this order.")

        return_number = self._generate_return_number()

        return_request = ReturnRequest(
            id=uuid.uuid4(),
            return_number=return_number,
            customer_id=customer_id,
            order_id=return_in.order_id,
            reason=return_in.reason,
            description=return_in.description,
            items=items_with_ids,
            refund_method=return_in.refund_method,
            status="pending",
        )

        async with self._transaction():
            self.db.add(return_request)
            await self.db.flush()
            return_request_id = return_request.id

        await self.db.commit()
        result = await self.get_return(return_request_id)
        if result is None:
            raise NotFoundError("ReturnRequest", str(return_request_id))
        return result

    async def get_return(self, return_id: uuid.UUID) -> ReturnRequest | None:
        result = await self.db.execute(select(ReturnRequest).where(ReturnRequest.id == return_id))
        return result.scalar_one_or_none()

    async def get_return_by_number(self, return_number: str) -> ReturnRequest | None:
        result = await self.db.execute(select(ReturnRequest).where(ReturnRequest.return_number == return_number))
        return result.scalar_one_or_none()

    async def list_returns(
        self,
        customer_id: uuid.UUID | None = None,
        status: str | None = None,
        order_id: uuid.UUID | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[ReturnRequest], int]:
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

    async def update_return(self, return_id: uuid.UUID, return_in: ReturnRequestUpdate) -> ReturnRequest | None:
        """Update a return request."""
        return_request = await self.get_return(return_id)
        if not return_request:
            return None

        update_data = return_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(return_request, key, value)

        # Save updates
        await self.db.commit()
        await self.db.refresh(return_request)
        return return_request

    ALLOWED_STATUSES = {"pending", "approved", "rejected", "processing", "completed", "refunded"}

    async def update_status(self, return_id: uuid.UUID, status: str, resolver_id: uuid.UUID) -> ReturnRequest | None:
        """Update return status (admin only)."""
        if status not in self.ALLOWED_STATUSES:
            raise ValueError(f"Invalid return status: {status}")

        return_request = await self.get_return(return_id)
        if not return_request:
            return None

        return_request.status = status

        if status in ["approved", "rejected", "completed", "refunded"]:
            return_request.resolved_at = datetime.now(UTC)
            return_request.resolved_by = resolver_id

        # When a return is refunded, actually move the money: mark the order
        # refunded and flag its mobile money payment as refunded.
        if status == "refunded":
            await self._mark_order_refunded(return_request)

        await self.db.commit()
        await self.db.refresh(return_request)
        return return_request

    async def _mark_order_refunded(self, return_request: ReturnRequest) -> None:
        """Mark the associated order and its mobile money payment as refunded, and debit vendor ledgers."""
        from app.domains.payments.services.ledger_service import LedgerService
        from app.domains.payments.services.payment_service import PaymentService
        from app.domains.shopping.models.order import Order, OrderStatus, OrderTimelineEvent
        from app.domains.shopping.models.sub_order import SubOrder

        order_stmt = select(Order).where(Order.id == return_request.order_id)
        order_result = await self.db.execute(order_stmt)
        order = order_result.scalar_one_or_none()

        if order and order.status != OrderStatus.REFUNDED:
            order.status = OrderStatus.REFUNDED
            timeline = OrderTimelineEvent(
                id=uuid.uuid4(),
                order_id=order.id,
                status=OrderStatus.REFUNDED.value,
                message=f"Refund processed for return {return_request.return_number}",
            )
            self.db.add(timeline)

        # Flag any verified mobile money payment as refunded for reconciliation
        payment_service = PaymentService(self.db)
        await payment_service.mark_payment_refunded(
            order_id=return_request.order_id,
            refund_transaction_id=str(return_request.refund_transaction_id) if return_request.refund_transaction_id else None,
            refund_reason=return_request.reason,
        )

        # Debit vendor ledger for refunded sub-orders if previously credited
        ledger_service = LedgerService(self.db)
        sub_orders_stmt = select(SubOrder).where(SubOrder.parent_order_id == return_request.order_id)
        sub_orders = (await self.db.execute(sub_orders_stmt)).scalars().all()
        for so in sub_orders:
            await ledger_service.debit_vendor_for_refund(
                vendor_id=so.vendor_id,
                sub_order_id=so.id,
                reference_id=str(return_request.id),
                notes=f"Refund deduction for return {return_request.return_number}",
            )

    async def add_shipping_label(self, return_id: uuid.UUID, shipping_label: str) -> ReturnRequest | None:
        """Add shipping label to return request."""
        return_request = await self.get_return(return_id)
        if not return_request:
            return None

        return_request.shipping_label = shipping_label
        return_request.status = "approved"

        await self.db.commit()
        await self.db.refresh(return_request)
        return return_request

    async def add_tracking_number(self, return_id: uuid.UUID, tracking_number: str) -> ReturnRequest | None:
        """Add tracking number to return request."""
        return_request = await self.get_return(return_id)
        if not return_request:
            return None

        return_request.tracking_number = tracking_number

        await self.db.commit()
        await self.db.refresh(return_request)
        return return_request

    async def cancel_return(self, return_id: uuid.UUID) -> ReturnRequest | None:
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
