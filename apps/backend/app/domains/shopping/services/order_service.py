import uuid
from typing import Optional, List, Tuple, Any
from decimal import Decimal
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, func, case, or_, String
from sqlalchemy.orm import selectinload

from app.core.logging import logger
from app.domains.shared.models.outbox import OutboxEvent, OutboxStatus
from app.domains.shopping.models.order import Order, OrderItem, OrderStatus, OrderTimelineEvent, OrderItemFulfillmentStatus
from app.domains.shopping.models.sub_order import SubOrder, SubOrderStatus
from app.domains.shopping.models.cart import Cart, CartItem
from app.domains.shopping.services.cart_calculation_service import CartCalculationService
from app.domains.shopping.services.order_state_machine import (
    OrderStateMachine,
    InvalidStateTransitionError
)
from app.domains.auth.models.user import User
from app.domains.catalog.models.product import Product

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
        guest_token: Optional[str] = None,
        points_to_redeem: Optional[int] = 0
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
            elif guest_token:
                # Fix 5.1: Prevent guest PII leak by enforcing guest_token matching on guest idempotency checks
                existing_order_stmt = existing_order_stmt.where(Order.guest_token == guest_token)
            else:
                # If neither user_id nor guest_token is present, do not return cached guest order
                existing_order_stmt = existing_order_stmt.where(Order.user_id.is_(None), Order.guest_token.is_(None))

            existing_order_result = await self.db.execute(existing_order_stmt)
            existing_order = existing_order_result.scalar_one_or_none()

            if existing_order:
                logger.info(f"Found existing order with idempotency key {idempotency_key}, returning existing order")
                return existing_order

        # Enclose database updates in a try-except block
        try:
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

            # 2. Calculate final totals (snapshot)
            calc_service = CartCalculationService(self.db)
            totals = await calc_service.calculate_totals(cart_id, shipping_address)

            # Get next sequential order number
            max_order_num_stmt = select(func.max(Order.order_number))
            max_order_num_result = await self.db.execute(max_order_num_stmt)
            max_order_num = max_order_num_result.scalar() or 100000
            next_order_num = max_order_num + 1

            # Handle loyalty points redemption
            loyalty_discount = Decimal(0)
            loyalty_points_used = 0
            if points_to_redeem and points_to_redeem > 0 and user_id:
                from app.domains.customers.services.loyalty_service import LoyaltyService
                loyalty = LoyaltyService(self.db)
                profile = await loyalty._get_or_create_profile(user_id)
                if profile.loyalty_points < points_to_redeem:
                    raise HTTPException(status_code=400, detail="Insufficient loyalty points")
                # Conversion: 2 points = 1 KES
                loyalty_discount = min(
                    Decimal(points_to_redeem) / 2,
                    Decimal(totals.get("subtotal", 0.0))  # Never exceed order subtotal
                )
                loyalty_points_used = points_to_redeem
                await loyalty.redeem_points(
                    customer_id=user_id,
                    points=points_to_redeem,
                    description=f"Applied to Order #{next_order_num}",
                )

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

            # 3. Create Order record (Fix 3.2: Precision handling for total amount)
            total_amt = round(float(totals["total"]), 2)
            total_amt = round(total_amt - float(loyalty_discount), 2)
            if total_amt < 0:
                total_amt = 0.0
                
            order = Order(
                id=uuid.uuid4(),
                order_number=next_order_num,
                user_id=user_id,
                guest_token=guest_token,
                status=OrderStatus.PENDING,
                total_amount=total_amt,
                loyalty_discount=loyalty_discount,
                loyalty_points_redeemed=loyalty_points_used,
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
                # Calculate vendor subtotal with precise rounding
                vendor_subtotal = sum(
                    round(float(item.product.price), 2) * item.quantity
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

                # Create OrderItems for this vendor (Fix 1.1: Atomic stock deduction)
                for item in items:
                    # Perform atomic stock reduction at database level to prevent race conditions
                    stock_stmt = (
                        update(Product)
                        .where(
                            Product.id == item.product_id,
                            Product.stock_quantity >= item.quantity
                        )
                        .values(
                            stock_quantity=Product.stock_quantity - item.quantity,
                            stock_status=case(
                                (Product.stock_quantity - item.quantity <= 0, "outofstock"),
                                else_=Product.stock_status
                            )
                        )
                    )
                    stock_res = await self.db.execute(stock_stmt)
                    if stock_res.rowcount == 0:
                        raise ValueError(f"Insufficient stock available for product: {item.product.name}")

                    unit_p = round(float(item.product.price), 2)
                    item_subtotal = round(unit_p * item.quantity, 2)

                    order_item = OrderItem(
                        id=uuid.uuid4(),
                        order_id=order.id,
                        sub_order_id=sub_order.id,
                        product_id=item.product_id,
                        vendor_id=item.product.vendor_id,
                        quantity=item.quantity,
                        unit_price=unit_p,
                        subtotal=item_subtotal
                    )
                    self.db.add(order_item)

            # 6. Deactivate cart
            cart.is_active = False
            
            # 7. Create Outbox Event
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

            # 8. Create Order Timeline Event
            timeline_event = OrderTimelineEvent(
                id=uuid.uuid4(),
                order_id=order.id,
                status=OrderStatus.PENDING.value,
                message="Order placed successfully",
                created_by=user_id
            )
            self.db.add(timeline_event)

            # Commit the transaction safely
            await self.db.commit()
        except Exception as err:
            await self.db.rollback()
            logger.error(f"Failed to create order from cart {cart_id}: {err}")
            raise

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
        search: Optional[str] = None,
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

        if search and search.strip():
            clean_search = search.strip()
            search_pattern = f"%{clean_search}%"
            search_conditions = [
                func.cast(Order.order_number, String).ilike(search_pattern),
                func.cast(Order.id, String).ilike(search_pattern),
            ]
            if clean_search.isdigit():
                search_conditions.append(Order.order_number == int(clean_search))
            conditions.append(or_(*search_conditions))

        # Build count query
        count_stmt = select(func.count(Order.id))
        for condition in conditions:
            count_stmt = count_stmt.where(condition)

        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar_one()

        stmt = select(Order).options(
            selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.images),
            selectinload(Order.user),
            selectinload(Order.timeline_events)
        )

        for condition in conditions:
            stmt = stmt.where(condition)

        # Paginate
        stmt = stmt.order_by(Order.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(stmt)
        orders = result.scalars().all()

        return orders, total

    async def update_order_status(
        self,
        order_id: uuid.UUID,
        new_status: str,
        auto_rollup: bool = False
    ) -> Order:
        """Update order status with state machine validation."""
        order = await self.get_order(order_id)
        if not order:
            raise ValueError("Order not found")

        old_status = order.status.value if hasattr(order.status, 'value') else str(order.status)

        # Validate transition using state machine
        if not OrderStateMachine.validate_order_transition(old_status, new_status):
            raise InvalidStateTransitionError(old_status, new_status, "Order")

        # Update status in database
        stmt = update(Order).where(Order.id == order_id).values(status=new_status)
        await self.db.execute(stmt)

        # Create timeline and outbox events for the transition
        if old_status != new_status:
            event = OutboxEvent(
                id=uuid.uuid4(),
                aggregate_type="Order",
                aggregate_id=str(order.id),
                event_type=f"Order{new_status.capitalize()}",
                payload={"order_id": str(order.id), "status": new_status},
                status=OutboxStatus.PENDING
            )
            self.db.add(event)

            timeline_event = OrderTimelineEvent(
                id=uuid.uuid4(),
                order_id=order_id,
                status=new_status,
                message=f"Order status updated to {new_status}"
            )
            self.db.add(timeline_event)

        # Award loyalty points on payment
        if new_status == "paid" and order.user_id:
            try:
                from app.domains.customers.services.loyalty_service import LoyaltyService
                loyalty = LoyaltyService(self.db)
                # 1 point per KES 100 spent
                base_points = int(order.total_amount / 100)
                if base_points > 0:
                    # Apply tier multiplier
                    profile = await loyalty._get_or_create_profile(order.user_id)
                    tier_config = loyalty.TIERS.get(profile.loyalty_tier, {})
                    multiplier = tier_config.get("multiplier", 1.0)
                    final_points = max(1, int(base_points * multiplier))
                    await loyalty.earn_points(
                        customer_id=order.user_id,
                        points=final_points,
                        description=f"Earned from Order #{order.order_number}",
                        reference_type="order",
                        reference_id=order.id,
                    )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Failed to award loyalty points for order {order.id}: {e}")

        await self.db.commit()
        return await self.get_order(order_id)

    async def update_order_item_status(
        self,
        item_id: uuid.UUID,
        new_status: str,
        vendor_id: uuid.UUID,
        auto_rollup: bool = True
    ) -> OrderItem:
        """Update order item status with validation and automatic rollup."""
        from sqlalchemy import select

        # Get the item
        stmt = select(OrderItem).where(OrderItem.id == item_id)
        result = await self.db.execute(stmt)
        item = result.scalar_one_or_none()

        if not item:
            raise ValueError("Order item not found")

        # Validate vendor ownership
        if item.vendor_id != vendor_id:
            raise ValueError("Item does not belong to this vendor")

        # Validate transition using state machine
        old_status = item.fulfillment_status
        if not OrderStateMachine.validate_order_item_transition(old_status, new_status):
            raise InvalidStateTransitionError(old_status, new_status, "OrderItem")

        # Update item status
        item.fulfillment_status = new_status

        # Create timeline event
        timeline_event = OrderTimelineEvent(
            id=uuid.uuid4(),
            order_id=item.order_id,
            status=new_status,
            message=f"Order item status updated to {new_status}"
        )
        self.db.add(timeline_event)

        # Automatic rollup to parent entities
        if auto_rollup:
            await self._rollup_status_from_item(item)

        await self.db.commit()

        # Refresh and return
        await self.db.refresh(item)
        return item

    async def update_sub_order_status(
        self,
        sub_order_id: uuid.UUID,
        new_status: str,
        vendor_id: uuid.UUID
    ) -> SubOrder:
        """Update sub-order status with validation."""
        from sqlalchemy import select

        # Get the sub-order
        stmt = select(SubOrder).where(SubOrder.id == sub_order_id)
        result = await self.db.execute(stmt)
        sub_order = result.scalar_one_or_none()

        if not sub_order:
            raise ValueError("SubOrder not found")

        # Validate vendor ownership
        if sub_order.vendor_id != vendor_id:
            raise ValueError("SubOrder does not belong to this vendor")

        # Validate transition using state machine
        old_status = sub_order.status.value if hasattr(sub_order.status, 'value') else str(sub_order.status)
        if not OrderStateMachine.validate_sub_order_transition(old_status, new_status):
            raise InvalidStateTransitionError(old_status, new_status, "SubOrder")

        # Update status
        sub_order.status = SubOrderStatus(new_status)

        # Create timeline event
        timeline_event = OrderTimelineEvent(
            id=uuid.uuid4(),
            order_id=sub_order.parent_order_id,
            status=new_status,
            message=f"SubOrder status updated to {new_status}"
        )
        self.db.add(timeline_event)

        # Rollup to parent order
        await self._rollup_status_from_sub_order(sub_order)

        await self.db.commit()
        return sub_order

    async def _rollup_status_from_item(self, item: OrderItem):
        """Roll up status changes from item to sub-order and order."""
        # Update SubOrder
        if item.sub_order_id:
            await self._update_sub_order_from_item(item)

        # Update Order
        await self._update_order_from_items(item.order_id)

    async def _update_sub_order_from_item(self, item: OrderItem):
        """Update SubOrder status based on its items."""
        from sqlalchemy import select

        if not item.sub_order_id:
            return

        # Get all items in the sub-order
        stmt = select(OrderItem).where(OrderItem.sub_order_id == item.sub_order_id)
        result = await self.db.execute(stmt)
        items = result.scalars().all()

        # Calculate new status
        item_statuses = [i.fulfillment_status for i in items]
        new_status = OrderStateMachine.calculate_sub_order_status(item_statuses)

        if new_status:
            # Get current sub-order status
            sub_order_stmt = select(SubOrder.status).where(SubOrder.id == item.sub_order_id)
            sub_order_result = await self.db.execute(sub_order_stmt)
            current_status = sub_order_result.scalar_one_or_none()

            if current_status and new_status != current_status:
                # Update sub-order
                update_stmt = update(SubOrder).where(
                    SubOrder.id == item.sub_order_id
                ).values(status=new_status)
                await self.db.execute(update_stmt)

                # Create timeline event
                timeline = OrderTimelineEvent(
                    id=uuid.uuid4(),
                    order_id=item.order_id,
                    status=new_status,
                    message=f"SubOrder status automatically rolled up to {new_status}"
                )
                self.db.add(timeline)

    async def _update_order_from_items(self, order_id: uuid.UUID):
        """Update Order status based on all items."""
        from sqlalchemy import select

        # Get all items in the order
        stmt = select(OrderItem).where(OrderItem.order_id == order_id)
        result = await self.db.execute(stmt)
        items = result.scalars().all()

        if not items:
            return

        # Calculate new status
        item_statuses = [i.fulfillment_status for i in items]
        new_status = OrderStateMachine.calculate_order_status(item_statuses)

        if new_status:
            # Get current order status
            order_stmt = select(Order.status).where(Order.id == order_id)
            order_result = await self.db.execute(order_stmt)
            current_status = order_result.scalar_one_or_none()

            if current_status:
                curr_val = current_status.value if hasattr(current_status, 'value') else str(current_status)
                if new_status != curr_val:
                    # Update order
                    update_stmt = update(Order).where(Order.id == order_id).values(status=new_status)
                    await self.db.execute(update_stmt)

                    # Create timeline and outbox events
                    timeline = OrderTimelineEvent(
                        id=uuid.uuid4(),
                        order_id=order_id,
                        status=new_status,
                        message=f"Order status automatically rolled up to {new_status}"
                    )
                    self.db.add(timeline)

                    outbox = OutboxEvent(
                        id=uuid.uuid4(),
                        aggregate_type="Order",
                        aggregate_id=str(order_id),
                        event_type=f"Order{new_status.capitalize()}",
                        payload={"order_id": str(order_id), "status": new_status, "auto_rolled_up": True},
                        status=OutboxStatus.PENDING
                    )
                    self.db.add(outbox)

    async def _rollup_status_from_sub_order(self, sub_order: SubOrder):
        """Roll up status changes from sub-order to parent order."""
        from sqlalchemy import select

        # Get all sub-orders for the parent order
        stmt = select(SubOrder).where(SubOrder.parent_order_id == sub_order.parent_order_id)
        result = await self.db.execute(stmt)
        sub_orders = result.scalars().all()

        if not sub_orders:
            return

        # Get all items from all sub-orders
        sub_order_ids = [so.id for so in sub_orders]
        item_stmt = select(OrderItem).where(OrderItem.sub_order_id.in_(sub_order_ids))
        item_result = await self.db.execute(item_stmt)
        items = item_result.scalars().all()

        # Calculate new order status from all items
        item_statuses = [i.fulfillment_status for i in items]
        new_status = OrderStateMachine.calculate_order_status(item_statuses)

        if new_status:
            # Get current order status
            order_stmt = select(Order.status).where(Order.id == sub_order.parent_order_id)
            order_result = await self.db.execute(order_stmt)
            current_status = order_result.scalar_one_or_none()

            if current_status:
                curr_val = current_status.value if hasattr(current_status, 'value') else str(current_status)
                if new_status != curr_val:
                    # Update order
                    update_stmt = update(Order).where(Order.id == sub_order.parent_order_id).values(status=new_status)
                    await self.db.execute(update_stmt)

                # Create timeline event
                timeline = OrderTimelineEvent(
                    id=uuid.uuid4(),
                    order_id=sub_order.parent_order_id,
                    status=new_status,
                    message=f"Order status automatically rolled up to {new_status}"
                )
                self.db.add(timeline)

                # Create outbox event
                outbox = OutboxEvent(
                    id=uuid.uuid4(),
                    aggregate_type="Order",
                    aggregate_id=str(sub_order.parent_order_id),
                    event_type=f"Order{new_status.capitalize()}",
                    payload={"order_id": str(sub_order.parent_order_id), "status": new_status, "auto_rolled_up": True},
                    status=OutboxStatus.PENDING
                )
                self.db.add(outbox)
