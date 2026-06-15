import uuid
from typing import Optional, List, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from sqlalchemy.orm import selectinload

from app.domains.shared.models.outbox import OutboxEvent, OutboxStatus
from app.domains.shopping.models.order import Order, OrderItem, OrderStatus
from app.domains.shopping.models.cart import Cart, CartItem
from app.domains.shopping.services.cart_calculation_service import CartCalculationService
from app.domains.auth.models.user import User

class InvalidStateTransitionError(ValueError):
    pass

VALID_ORDER_TRANSITIONS = {
    OrderStatus.PENDING: [OrderStatus.PAID, OrderStatus.CANCELLED],
    OrderStatus.PAID: [OrderStatus.PROCESSING, OrderStatus.REFUNDED],
    OrderStatus.PROCESSING: [OrderStatus.SHIPPED, OrderStatus.REFUNDED],
    OrderStatus.SHIPPED: [OrderStatus.DELIVERED, OrderStatus.REFUNDED],
    OrderStatus.DELIVERED: [OrderStatus.REFUNDED],
    OrderStatus.CANCELLED: [],
    OrderStatus.REFUNDED: []
}

class CheckoutService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_order_from_cart(
        self, 
        cart_id: uuid.UUID, 
        user_id: uuid.UUID, 
        shipping_address: dict,
        notes: Optional[str] = None,
        idempotency_key: Optional[str] = None
    ) -> Order:
        """Atomic conversion of a cart to an order."""
        # 1. Fetch cart with items and products
        stmt = select(Cart).where(Cart.id == cart_id).options(
            selectinload(Cart.items).selectinload(CartItem.product)
        )
        result = await self.db.execute(stmt)
        cart = result.scalar_one_or_none()

        if not cart:
            raise ValueError("Cart not found")
        if not cart.is_active:
            raise ValueError("Cart is no longer active")
        if not cart.items:
            raise ValueError("Cannot checkout an empty cart")

        # 2. Calculate final totals (snapshot)
        calc_service = CartCalculationService(self.db)
        totals = await calc_service.calculate_totals(cart_id)

        # 3. Create Order record
        order = Order(
            id=uuid.uuid4(),
            user_id=user_id,
            status=OrderStatus.PENDING,
            total_amount=totals["total"],
            currency="KES",
            shipping_address=shipping_address,
            notes=notes,
            idempotency_key=idempotency_key or str(uuid.uuid4())
        )
        self.db.add(order)

        # 4. Create OrderItem records (snapshots of current price)
        for item in cart.items:
            if not item.product or not item.product.vendor_id:
                raise ValueError(f"Product or vendor information missing for item {item.product_id}")

            order_item = OrderItem(
                id=uuid.uuid4(),
                order_id=order.id,
                product_id=item.product_id,
                vendor_id=item.product.vendor_id,
                quantity=item.quantity,
                unit_price=item.product.price, # Snapshot price
                subtotal=item.product.price * item.quantity
            )
            self.db.add(order_item)

        # 5. Deactivate cart
        cart.is_active = False
        
        # 6. Create Outbox Event
        outbox_event = OutboxEvent(
            id=uuid.uuid4(),
            aggregate_type="Order",
            aggregate_id=str(order.id),
            event_type="OrderCreated",
            payload={
                "order_id": str(order.id),
                "user_id": str(order.user_id),
                "total_amount": float(order.total_amount),
            },
            status=OutboxStatus.PENDING
        )
        self.db.add(outbox_event)

        # Commit happens ONCE at the end now
        await self.db.commit()
        
        # Reload with items and user for response
        stmt = select(Order).where(Order.id == order.id).options(
            selectinload(Order.items),
            selectinload(Order.user)
        )
        result = await self.db.execute(stmt)
        order = result.scalar_one()
        
        return order

class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_order(self, order_id: uuid.UUID) -> Optional[Order]:
        stmt = select(Order).where(Order.id == order_id).options(
            selectinload(Order.items),
            selectinload(Order.user)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_orders(
        self, 
        user_id: Optional[uuid.UUID] = None, 
        vendor_id: Optional[uuid.UUID] = None,
        status: Optional[str] = None,
        offset: int = 0,
        limit: int = 20
    ) -> Tuple[List[Order], int]:
        stmt = select(Order).options(selectinload(Order.items))
        
        if user_id:
            stmt = stmt.where(Order.user_id == user_id)
        
        if vendor_id:
            # Join with OrderItem to filter by vendor
            stmt = stmt.join(OrderItem).where(OrderItem.vendor_id == vendor_id).distinct()

        if status:
            stmt = stmt.where(Order.status == status)

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar_one()

        # Paginate
        stmt = stmt.order_by(Order.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(stmt)
        orders = result.scalars().all()
        
        return orders, total

    async def update_order_status(self, order_id: uuid.UUID, new_status: str) -> Order:
        # Get current order state to check for transitions
        order = await self.get_order(order_id)
        if not order:
            raise ValueError("Order not found")
        
        old_status = OrderStatus(order.status)
        new_status_enum = OrderStatus(new_status)

        if new_status_enum not in VALID_ORDER_TRANSITIONS[old_status]:
            raise InvalidStateTransitionError(f"Cannot transition order from {old_status.value} to {new_status_enum.value}")

        stmt = update(Order).where(Order.id == order_id).values(status=new_status_enum.value)
        await self.db.execute(stmt)

        # Write outbox event for the transition
        if old_status != new_status_enum:
            event = OutboxEvent(
                id=uuid.uuid4(),
                aggregate_type="Order",
                aggregate_id=str(order.id),
                event_type=f"Order{new_status_enum.value.capitalize()}",
                payload={"order_id": str(order.id), "status": new_status_enum.value},
                status=OutboxStatus.PENDING
            )
            self.db.add(event)

        await self.db.commit()
        return await self.get_order(order_id)
