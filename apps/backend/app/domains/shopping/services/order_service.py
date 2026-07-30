import uuid
from typing import Optional, List, Tuple, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func
from sqlalchemy.orm import selectinload

from app.core.logging import logger
from app.domains.shared.models.outbox import OutboxEvent, OutboxStatus
from app.domains.shopping.models.order import Order, OrderItem, OrderStatus, OrderTimelineEvent
from app.domains.shopping.models.sub_order import SubOrder, SubOrderStatus
from app.domains.shopping.models.cart import Cart, CartItem
from app.domains.shopping.services.cart_calculation_service import CartCalculationService
from app.domains.auth.models.user import User
from app.domains.catalog.models.product import Product

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
        user_id: Optional[uuid.UUID] = None,
        shipping_address: dict = None,
        notes: Optional[str] = None,
        idempotency_key: Optional[str] = None,
        guest_token: Optional[str] = None
    ) -> Order:
        """Atomic conversion of a cart to an order with idempotency support."""
        # Check for existing order with the same idempotency key (prevent duplicate orders)
        if idempotency_key:
            existing_order_stmt = select(Order).where(Order.idempotency_key == idempotency_key).options(
                selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.images),
                selectinload(Order.timeline_events)
            )
            if user_id:
                existing_order_stmt = existing_order_stmt.where(Order.user_id == user_id)
            existing_order_result = await self.db.execute(existing_order_stmt)
            existing_order = existing_order_result.scalar_one_or_none()

            if existing_order:
                logger.info(f"Found existing order with idempotency key {idempotency_key}, returning existing order")
                return existing_order

        # 1. Fetch cart with items and products
        stmt = select(Cart).where(Cart.id == cart_id).options(
            selectinload(Cart.items).selectinload(CartItem.product)
        )
        result = await self.db.execute(stmt)
        cart = result.scalar_one_or_none()

        if not cart:
            logger.error(f"Cart not found: {cart_id}")
            raise ValueError("Cart not found")
        if not cart.is_active:
            logger.error(f"Cart is no longer active: {cart_id}")
            raise ValueError("Cart is no longer active")
        if not cart.items:
            logger.error(f"Cannot checkout an empty cart: {cart_id}")
            raise ValueError("Cannot checkout an empty cart")

        # 1.5 Check stock availability
        for item in cart.items:
            if item.product.stock_quantity < item.quantity:
                logger.warning(f"Insufficient stock for product {item.product.id}: has {item.product.stock_quantity}, requested {item.quantity}")
                raise ValueError(f"Insufficient stock for product: {item.product.name}")

        # 2. Calculate final totals (snapshot)
        calc_service = CartCalculationService(self.db)
        totals = await calc_service.calculate_totals(cart_id, shipping_address)

        # Get next sequential order number
        max_order_num_stmt = select(func.max(Order.order_number))
        max_order_num_result = await self.db.execute(max_order_num_stmt)
        max_order_num = max_order_num_result.scalar() or 100000
        next_order_num = max_order_num + 1

        # Auto-assign nearest active driver if company rider delivery
        assigned_driver_id = None
        if totals.get("logistics_type") == "company_rider":
            driver_stmt = select(User).where(User.role == "driver", User.is_active == True)
            driver_result = await self.db.execute(driver_stmt)
            drivers = driver_result.scalars().all()
            if drivers:
                assigned_driver_id = drivers[0].id

        # Update shipping address with calculated logistics metadata & fees breakdown
        updated_shipping_address = dict(shipping_address) if shipping_address else {}
        updated_shipping_address["logistics_type"] = totals.get("logistics_type", "courier")
        updated_shipping_address["calculated_distance_km"] = totals.get("calculated_distance_km", 0.0)
        updated_shipping_address["route_coordinates"] = totals.get("route_coordinates", [])
        updated_shipping_address["shipping_amount"] = totals.get("shipping_amount", 0.0)
        updated_shipping_address["packaging_fee"] = totals.get("packaging_fee", 100.0)
        updated_shipping_address["services_fee"] = totals.get("services_fee", 50.0)
        updated_shipping_address["discount_amount"] = totals.get("discount_amount", 0.0)
        updated_shipping_address["subtotal"] = totals.get("subtotal", 0.0)
        
        # Payment method metadata
        pm = updated_shipping_address.get("payment_method", "cod")
        updated_shipping_address["payment_method"] = pm
        updated_shipping_address["payment_method_title"] = (
            "M-Pesa Express" if pm == "mpesa" else "Cash on Delivery"
        )

        if assigned_driver_id:
            updated_shipping_address["assigned_driver_id"] = str(assigned_driver_id)

        # 3. Create Order record
        order = Order(
            id=uuid.uuid4(),
            order_number=next_order_num,
            user_id=user_id,
            guest_token=guest_token,
            status=OrderStatus.PENDING,
            total_amount=totals["total"],
            currency="KES",
            shipping_address=updated_shipping_address,
            notes=notes,
            idempotency_key=idempotency_key or str(uuid.uuid4())
        )
        self.db.add(order)

        # 4. Group cart items by vendor for SubOrder creation
        vendor_items_map = {}
        for item in cart.items:
            if not item.product or not item.product.vendor_id:
                raise ValueError(f"Product or vendor information missing for item {item.product_id}")

            vendor_id = item.product.vendor_id
            if vendor_id not in vendor_items_map:
                vendor_items_map[vendor_id] = []
            vendor_items_map[vendor_id].append(item)

        # 5. Create SubOrders and OrderItem records
        sub_order_map = {}  # Maps vendor_id to SubOrder
        for vendor_id, items in vendor_items_map.items():
            # Calculate vendor subtotal
            vendor_subtotal = sum(
                round(item.product.price) * item.quantity
                for item in items
            )

            # Create SubOrder
            sub_order = SubOrder(
                id=uuid.uuid4(),
                parent_order_id=order.id,
                vendor_id=vendor_id,
                subtotal_amount=vendor_subtotal,
                status=SubOrderStatus.PENDING
            )
            self.db.add(sub_order)
            sub_order_map[vendor_id] = sub_order

            # Create OrderItems for this vendor (deduct stock, snapshot price)
            for item in items:
                # Deduct stock
                item.product.stock_quantity -= item.quantity
                if item.product.stock_quantity <= 0:
                    item.product.stock_quantity = 0
                    item.product.stock_status = "outofstock"

                order_item = OrderItem(
                    id=uuid.uuid4(),
                    order_id=order.id,
                    sub_order_id=sub_order.id,
                    product_id=item.product_id,
                    vendor_id=item.product.vendor_id,
                    quantity=item.quantity,
                    unit_price=round(item.product.price),  # Snapshot price
                    subtotal=round(item.product.price * item.quantity)
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
                "user_id": str(order.user_id) if order.user_id else None,
                "guest_token": order.guest_token,
                "total_amount": float(order.total_amount),
            },
            status=OutboxStatus.PENDING
        )
        self.db.add(outbox_event)

        # 7. Create Order Timeline Event
        timeline_event = OrderTimelineEvent(
            id=uuid.uuid4(),
            order_id=order.id,
            status=OrderStatus.PENDING.value,
            message="Order placed successfully",
            created_by=user_id
        )
        self.db.add(timeline_event)

        # Commit happens ONCE at the end now
        await self.db.commit()
        
        # Send vendor email notifications
        try:
            from app.domains.vendor.models.vendor_profile import VendorProfile
            from app.domains.shopping.services.email_notification_service import EmailNotificationService

            email_service = EmailNotificationService()

            for vendor_id, sub_order in sub_order_map.items():
                stmt = select(VendorProfile, User.email).join(User, VendorProfile.user_id == User.id).where(VendorProfile.id == vendor_id)
                res = await self.db.execute(stmt)
                row = res.first()
                if row:
                    vendor_profile, user_email = row[0], row[1]
                    vendor_email = vendor_profile.business_email or user_email
                    if vendor_email:
                        vendor_total = float(sub_order.subtotal_amount)
                        await email_service.send_vendor_new_order(
                            vendor_email=vendor_email,
                            vendor_name=vendor_profile.store_name,
                            order_number=str(order.order_number or order.id),
                            order_total=vendor_total
                        )
        except Exception as err:
            logger.error(f"Failed to send vendor order notification email: {err}")

        # Reload with items (and their products) and user for response
        stmt = select(Order).where(Order.id == order.id).options(
            selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.images),
            selectinload(Order.timeline_events)
        )
        if order.user_id:
            stmt = stmt.options(selectinload(Order.user))
            
        result = await self.db.execute(stmt)
        order = result.scalar_one()
        
        return order

class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_order(self, identifier: Any) -> Optional[Order]:
        order_uuid = None
        order_number = None

        if isinstance(identifier, uuid.UUID):
            order_uuid = identifier
        elif isinstance(identifier, int):
            order_number = identifier
        elif isinstance(identifier, str):
            try:
                order_uuid = uuid.UUID(identifier)
            except ValueError:
                if identifier.isdigit():
                    order_number = int(identifier)

        if not order_uuid and order_number is None:
            return None

        stmt = select(Order).options(
            selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.images),
            selectinload(Order.user),
            selectinload(Order.timeline_events)
        )
        
        if order_uuid:
            stmt = stmt.where(Order.id == order_uuid)
        else:
            stmt = stmt.where(Order.order_number == order_number)
            
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
        # Build base query conditions
        conditions = []

        if user_id:
            conditions.append(Order.user_id == user_id)

        if vendor_id:
            # Use subquery to avoid DISTINCT issues with JSON columns
            vendor_order_subquery = select(OrderItem.order_id).where(
                OrderItem.vendor_id == vendor_id
            )
            conditions.append(Order.id.in_(vendor_order_subquery))

        if status:
            conditions.append(Order.status == status)

        # Build count query
        count_stmt = select(func.count(Order.id))
        for condition in conditions:
            count_stmt = count_stmt.where(condition)

        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar_one()

        stmt = select(Order).options(
            selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.images),
            selectinload(Order.user)
        )

        for condition in conditions:
            stmt = stmt.where(condition)

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

            timeline_event = OrderTimelineEvent(
                id=uuid.uuid4(),
                order_id=order_id,
                status=new_status_enum.value,
                message=f"Order status updated to {new_status_enum.value}"
            )
            self.db.add(timeline_event)

        await self.db.commit()
        return await self.get_order(order_id)
