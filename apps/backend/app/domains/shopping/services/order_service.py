import random
import uuid
from contextlib import asynccontextmanager
from decimal import Decimal
from typing import Any

from sqlalchemy import String, case, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import result_rowcount
from app.core.exceptions import AuthorizationError, BusinessRuleError, ConflictError, NotFoundError
from app.core.logging import logger
from app.domains.auth.models.user import User
from app.domains.catalog.models.product import Product
from app.domains.shared.models.outbox import OutboxEvent, OutboxStatus
from app.domains.shopping.models.cart import Cart, CartItem
from app.domains.shopping.models.order import (
    Order,
    OrderItem,
    OrderItemFulfillmentStatus,
    OrderStatus,
    OrderTimelineEvent,
)
from app.domains.shopping.models.sub_order import SubOrder, SubOrderStatus
from app.domains.shopping.services.cart_calculation_service import (
    OFFICE_LAT,
    OFFICE_LON,
    CartCalculationService,
    _resolve_unit_price,
    quantize_money,
)
from app.domains.shopping.services.order_state_machine import InvalidStateTransitionError, OrderStateMachine


class CheckoutService:
    def __init__(self, db: AsyncSession, driver_assignment_service: Any | None = None):
        self.db = db
        self.driver_assignment_service = driver_assignment_service


    async def _generate_order_number(self) -> int:
        """Generate a unique order number.

        Uses the PostgreSQL sequence (atomic and collision-free) when available,
        falling back to a large random integer on SQLite/dev where the sequence
        does not exist.
        """
        from sqlalchemy import text

        bind = self.db.get_bind()
        if bind is not None and bind.dialect.name == "postgresql":
            result = await self.db.execute(text("SELECT nextval('order_number_seq')"))
            scalar_val = result.scalar()
            return int(scalar_val) if scalar_val is not None else random.randint(100000000, 999999999)
        return random.randint(100000000, 999999999)

    @asynccontextmanager
    async def _transaction(self):
        """Use begin_nested (SAVEPOINT) when already in a transaction."""
        if self.db.in_transaction():
            async with self.db.begin_nested():
                yield
        else:
            async with self.db.begin():
                yield

    async def create_order_from_cart(
        self,
        cart_id: uuid.UUID,
        user_id: uuid.UUID | None = None,
        shipping_address: dict[str, Any] | None = None,
        notes: str | None = None,
        idempotency_key: str | None = None,
        guest_token: str | None = None,
        points_to_redeem: int | None = 0,
    ) -> Order:
        """Atomic conversion of a cart to an order with idempotency support."""
        # Check for existing order with the same idempotency key (prevent duplicate orders)
        # This check happens BEFORE the transaction (read-only operation)
        if idempotency_key:
            existing_order_stmt = (
                select(Order)
                .where(Order.idempotency_key == idempotency_key)
                .options(
                    selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.images),
                    selectinload(Order.timeline_events),
                )
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

        # Transaction block for atomic order creation
        async with self._transaction():
            try:
                # 1. Fetch cart with items and products
                stmt = (
                    select(Cart)
                    .where(Cart.id == cart_id)
                    .options(
                        selectinload(Cart.items).selectinload(CartItem.product),
                        selectinload(Cart.items).selectinload(CartItem.product_variant),
                    )
                    .execution_options(populate_existing=True)
                )
                result = await self.db.execute(stmt)
                cart = result.scalar_one_or_none()

                if not cart:
                    logger.error(f"Cart not found: {cart_id}")
                    raise NotFoundError("Cart", cart_id)
                if not cart.is_active:
                    logger.error(f"Cart is no longer active: {cart_id}")
                    raise ConflictError("Cart is no longer active")
                if not cart.items:
                    logger.error(f"Cannot checkout an empty cart: {cart_id}")
                    raise BusinessRuleError("Cannot checkout an empty cart")

                # Ownership verification: prevent checking out another user's cart
                is_owner = False
                if cart.user_id:
                    is_owner = user_id is not None and cart.user_id == user_id
                else:
                    # Guest cart requires the matching cart token
                    is_owner = guest_token is not None and cart.cart_token == guest_token

                if not is_owner:
                    raise AuthorizationError("You do not have permission to check out this cart")

                # 2. Calculate final totals (snapshot) using the exact Decimal core
                calc_service = CartCalculationService(self.db)
                totals = await calc_service._compute_totals(cart, shipping_address)

                # Order number is generated via the database sequence (order_number_seq)
                # on PostgreSQL (atomic and thread-safe), with a large random fallback elsewhere.

                # Handle loyalty points redemption.
                # redeem_points re-checks the balance under a row lock, so a losing
                # concurrent checkout fails cleanly instead of overdrawing points.
                loyalty_discount = Decimal("0.00")
                loyalty_points_used = 0
                if points_to_redeem and points_to_redeem > 0 and user_id:
                    from app.domains.customers.services.loyalty_service import LoyaltyService

                    loyalty = LoyaltyService(self.db)
                    # Conversion: 2 points = 1 KES, never exceeding the order subtotal
                    loyalty_discount = min(Decimal(points_to_redeem) / Decimal("2"), totals["subtotal"])
                    loyalty_points_used = points_to_redeem
                    await loyalty.redeem_points(
                        customer_id=user_id,
                        points=points_to_redeem,
                        description="Applied to Order",
                    )

                # Auto-assign nearest active driver if company rider delivery
                assigned_driver_id = None
                if totals.get("logistics_type") == "company_rider":
                    # Use logistics domain DriverAssignmentService if available
                    if self.driver_assignment_service:
                        driver = await self.driver_assignment_service.get_available_drivers(
                            location=(OFFICE_LAT, OFFICE_LON)
                        )
                        if driver:
                            assigned_driver_id = driver[0].id
                    else:
                        # Fallback to legacy implementation
                        driver_stmt = select(User).where(User.role == "driver", User.is_active == True)
                        driver_result = await self.db.execute(driver_stmt)
                        drivers = driver_result.scalars().all()
                        if drivers:
                            assigned_driver_id = drivers[0].id

                # Update shipping address with calculated logistics metadata & fees breakdown.
                # Floats here on purpose: this dict is persisted in a JSON column as
                # display metadata; authoritative money lives in the Numeric columns.
                updated_shipping_address = dict(shipping_address) if shipping_address else {}
                updated_shipping_address["logistics_type"] = totals.get("logistics_type", "courier")
                updated_shipping_address["calculated_distance_km"] = totals.get("calculated_distance_km", 0.0)
                updated_shipping_address["route_coordinates"] = totals.get("route_coordinates", [])
                updated_shipping_address["shipping_amount"] = float(totals.get("shipping_amount", 0))
                updated_shipping_address["packaging_fee"] = float(totals.get("packaging_fee", 0))
                updated_shipping_address["services_fee"] = float(totals.get("services_fee", 0))
                updated_shipping_address["tax_amount"] = float(totals.get("tax_amount", 0))
                updated_shipping_address["discount_amount"] = float(totals.get("discount_amount", 0))
                updated_shipping_address["subtotal"] = float(totals.get("subtotal", 0))

                # Payment method metadata
                pm = updated_shipping_address.get("payment_method", "cod")
                updated_shipping_address["payment_method"] = pm
                updated_shipping_address["payment_method_title"] = (
                    "M-Pesa Express" if pm == "mpesa" else "Cash on Delivery"
                )

                if assigned_driver_id:
                    updated_shipping_address["assigned_driver_id"] = str(assigned_driver_id)

                # 3. Create Order record (exact Decimal totals; never float arithmetic)
                total_amt = (totals["total"] - loyalty_discount).quantize(Decimal("0.01"))
                if total_amt < 0:
                    total_amt = Decimal("0.00")

                order = Order(
                    id=uuid.uuid4(),
                    order_number=await self._generate_order_number(),
                    user_id=user_id,
                    guest_token=guest_token,
                    status=OrderStatus.PENDING,
                    total_amount=total_amt,
                    loyalty_discount=loyalty_discount,
                    loyalty_points_redeemed=loyalty_points_used,
                    currency="KES",
                    shipping_address=updated_shipping_address,
                    notes=notes,
                    idempotency_key=idempotency_key or str(uuid.uuid4()),
                )
                self.db.add(order)

                # Record coupon usage for applied discounts so per-user/global limits
                # are enforced under lock. Coupons are re-validated at checkout time
                # (active, unexpired, within limits, scope still matches) — a coupon
                # that became invalid after being applied to the cart aborts checkout.
                # Guest checkouts record usage too, so global usage limits hold.
                applied_discounts = totals.get("applied_discounts") or []
                if applied_discounts:
                    from app.domains.shopping.services.coupon_service import CouponService

                    coupon_service = CouponService(self.db)
                    for discount_info in applied_discounts:
                        coupon_code = discount_info.get("coupon_code")
                        if not coupon_code:
                            continue

                        is_valid, coupon, validation_error = await coupon_service.validate_coupon(
                            code=coupon_code,
                            order_subtotal=totals["subtotal"],
                            user_id=user_id,
                            cart_id=cart_id,
                            for_checkout=True,
                        )
                        if not is_valid or not coupon:
                            raise BusinessRuleError(
                                f"Coupon '{coupon_code}' is no longer valid: {validation_error or 'invalid coupon'}"
                            )

                        await coupon_service.record_coupon_usage(
                            coupon_id=coupon.id,
                            user_id=user_id,
                            order_id=order.id,
                            discount_amount=Decimal(str(discount_info.get("discount_amount") or 0)),
                            vendor_id=coupon.vendor_id,
                        )

                # 4. Group cart items by vendor for SubOrder creation
                vendor_items_map: dict[uuid.UUID, list[CartItem]] = {}
                for item in cart.items:
                    if not item.product or not item.product.vendor_id:
                        raise ConflictError(f"Product or vendor information missing for item {item.product_id}")

                    vendor_id = item.product.vendor_id
                    if vendor_id not in vendor_items_map:
                        vendor_items_map[vendor_id] = []
                    vendor_items_map[vendor_id].append(item)

                # 5. Create SubOrders and OrderItem records
                sub_order_map = {}  # Maps vendor_id to SubOrder
                for vendor_id, items in vendor_items_map.items():
                    # Calculate vendor subtotal with exact Decimal arithmetic
                    vendor_subtotal = Decimal("0")
                    for item in items:
                        vendor_subtotal += _resolve_unit_price(item) * Decimal(str(item.quantity))
                    vendor_subtotal = vendor_subtotal.quantize(Decimal("0.01"))

                    # Create SubOrder
                    sub_order = SubOrder(
                        id=uuid.uuid4(),
                        parent_order_id=order.id,
                        vendor_id=vendor_id,
                        subtotal_amount=vendor_subtotal,
                        status=SubOrderStatus.PENDING,
                    )
                    self.db.add(sub_order)
                    sub_order_map[vendor_id] = sub_order

                    # Create OrderItems for this vendor (Fix 1.1: Atomic stock deduction)
                    for item in items:
                        unit_p = quantize_money(_resolve_unit_price(item))
                        item_subtotal = quantize_money(unit_p * Decimal(str(item.quantity)))

                        if item.product_variant_id:
                            from app.domains.catalog.models.product_variant import ProductVariant

                            # 1. Decrement variant stock atomically
                            var_stmt = (
                                update(ProductVariant)
                                .where(
                                    ProductVariant.id == item.product_variant_id,
                                    ProductVariant.stock_quantity >= item.quantity,
                                    ProductVariant.is_active == True,
                                )
                                .values(stock_quantity=ProductVariant.stock_quantity - int(item.quantity))
                            )
                            var_res = await self.db.execute(var_stmt)
                            if result_rowcount(var_res) == 0:
                                raise ConflictError(
                                    f"Insufficient stock available for variant of product: {item.product.name}"
                                )

                            # 2. Also decrement aggregate Product stock
                            prod_stmt = (
                                update(Product)
                                .where(Product.id == item.product_id, Product.stock_quantity >= item.quantity)
                                .values(
                                    stock_quantity=Product.stock_quantity - int(item.quantity),
                                    stock_status=case(
                                        (Product.stock_quantity - int(item.quantity) <= 0, "outofstock"),
                                        else_=Product.stock_status,
                                    ),
                                )
                            )
                            await self.db.execute(prod_stmt)
                        else:
                            # Simple product atomic stock reduction
                            stock_stmt = (
                                update(Product)
                                .where(Product.id == item.product_id, Product.stock_quantity >= item.quantity)
                                .values(
                                    stock_quantity=Product.stock_quantity - item.quantity,
                                    stock_status=case(
                                        (Product.stock_quantity - item.quantity <= 0, "outofstock"),
                                        else_=Product.stock_status,
                                    ),
                                )
                            )
                            stock_res = await self.db.execute(stock_stmt)
                            if result_rowcount(stock_res) == 0:
                                raise ConflictError(f"Insufficient stock available for product: {item.product.name}")

                        # Calculate tax for this line item (16% VAT default or exempt)
                        is_taxable = True
                        vat_rate_val = Decimal("0.16")
                        tax_cat_code = "STANDARD_VAT_16"
                        if item.product:
                            if hasattr(item.product, "has_vat") and item.product.has_vat is False:
                                is_taxable = False
                                vat_rate_val = Decimal("0.00")
                                tax_cat_code = "EXEMPT_MEDICAL_DEVICE"
                            elif hasattr(item.product, "vat_rate") and item.product.vat_rate is not None:
                                vat_rate_val = Decimal(str(item.product.vat_rate)) / Decimal("100")

                        item_tax_amount = (
                            (Decimal(str(item_subtotal)) * vat_rate_val) if is_taxable else Decimal("0.00")
                        )

                        order_item = OrderItem(
                            id=uuid.uuid4(),
                            order_id=order.id,
                            sub_order_id=sub_order.id,
                            product_id=item.product_id,
                            product_variant_id=item.product_variant_id,
                            vendor_id=item.product.vendor_id,
                            quantity=item.quantity,
                            unit_price=unit_p,
                            subtotal=item_subtotal,
                            # Tax snapshot
                            tax_category_code=tax_cat_code,
                            tax_rate_snapshot=vat_rate_val,
                            tax_amount_snapshot=item_tax_amount.quantize(Decimal("0.01")),
                        )
                        self.db.add(order_item)

                # 6. Deactivate cart
                cart.is_active = False

                # 7. Create Outbox Events for COD orders
                # For COD, we treat order creation as "paid" for inventory/ledger purposes
                payment_method = updated_shipping_address.get("payment_method", "cod")

                # OrderCreated event
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
                    status=OutboxStatus.PENDING,
                )
                self.db.add(outbox_event)

                # For COD, create OrderPaid event immediately
                if payment_method == "cod":
                    # Build sub order events for OrderPaid
                    from app.domains.shared.events.events import OrderItemEvent, SubOrderEvent

                    sub_order_events = []
                    for vendor_id, sub_order in sub_order_map.items():
                        # Get items for this sub order from vendor_items_map
                        cart_vendor_items = vendor_items_map.get(vendor_id, [])
                        item_events = [
                            OrderItemEvent(
                                product_id=item.product_id,
                                vendor_id=item.product.vendor_id,
                                quantity=int(item.quantity),
                                unit_price=quantize_money(_resolve_unit_price(item)),
                            )
                            for item in cart_vendor_items
                        ]
                        sub_order_events.append(
                            SubOrderEvent(
                                sub_order_id=str(sub_order.id),
                                vendor_id=vendor_id,
                                subtotal_amount=Decimal(str(sub_order.subtotal_amount)),
                                items=item_events,
                            )
                        )

                    order_paid_event = OutboxEvent(
                        id=uuid.uuid4(),
                        aggregate_type="Order",
                        aggregate_id=str(order.id),
                        event_type="OrderPaid",
                        payload={
                            "order_id": str(order.id),
                            "customer_id": str(order.user_id) if order.user_id else None,
                            "total_amount": float(order.total_amount),
                            "payment_method": "cod",
                            "mpesa_receipt": None,
                            "sub_orders": [so.model_dump(mode="json") for so in sub_order_events],
                            "created_at": order.created_at.isoformat() if order.created_at else None,
                        },
                        status=OutboxStatus.PENDING,
                    )
                    self.db.add(order_paid_event)

                # 8. Create Order Timeline Event
                timeline_event = OrderTimelineEvent(
                    id=uuid.uuid4(),
                    order_id=order.id,
                    status=OrderStatus.PENDING.value,
                    message="Order placed successfully",
                    created_by=user_id,
                )
                self.db.add(timeline_event)

                # Transaction will commit automatically on success, rollback on exception
                # Need to capture order variables for use outside transaction
                created_order_id = order.id
            except Exception as err:
                logger.error(f"Failed to create order from cart {cart_id}: {err}")
                raise

        # Send vendor email notifications (outside transaction)
        try:
            from app.domains.shopping.services.email_notification_service import EmailNotificationService
            from app.domains.vendor.models.vendor_profile import VendorProfile

            email_service = EmailNotificationService()

            # Reload sub_orders to get their data after transaction commit
            sub_orders_stmt = select(SubOrder).where(SubOrder.parent_order_id == created_order_id)
            sub_orders_result = await self.db.execute(sub_orders_stmt)
            sub_orders = sub_orders_result.scalars().all()

            for sub_order in sub_orders:
                vendor_stmt = (
                    select(VendorProfile, User.email)
                    .join(User, VendorProfile.user_id == User.id)
                    .where(VendorProfile.id == sub_order.vendor_id)
                )
                res = await self.db.execute(vendor_stmt)
                row = res.first()
                if row:
                    vendor_profile, user_email = row[0], row[1]
                    vendor_email = vendor_profile.business_email or user_email
                    if vendor_email:
                        vendor_total = float(sub_order.subtotal_amount)
                        # Get order_number from the order
                        order_num_stmt = select(Order.order_number).where(Order.id == created_order_id)
                        order_num_result = await self.db.execute(order_num_stmt)
                        order_number = order_num_result.scalar()
                        await email_service.send_vendor_new_order(
                            vendor_email=vendor_email,
                            vendor_name=vendor_profile.store_name,
                            order_number=str(order_number or created_order_id),
                            order_total=vendor_total,
                        )
        except Exception as err:
            logger.error(f"Failed to send vendor order notification email: {err}")

        # Reload with items (and their products), user, timeline, and payments for response
        order_stmt = (
            select(Order)
            .where(Order.id == created_order_id)
            .options(
                selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.images),
                selectinload(Order.user),
                selectinload(Order.timeline_events),
                selectinload(Order.mobile_money_payments),
            )
        )
        order_result = await self.db.execute(order_stmt)
        order = order_result.scalar_one()

        return order


class OrderService:
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

    async def get_order(self, identifier: Any) -> Order | None:
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
            selectinload(Order.items).selectinload(OrderItem.vendor),
            selectinload(Order.user),
            selectinload(Order.timeline_events),
            selectinload(Order.mobile_money_payments),
        )

        if order_uuid:
            stmt = stmt.where(Order.id == order_uuid)
        else:
            stmt = stmt.where(Order.order_number == order_number)

        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_orders_by_phone(self, phone: str, limit: int = 20) -> list[Order]:
        """Look up orders placed with a given phone number (shipping address or user phone)."""
        clean_phone = phone.strip().replace(" ", "").replace("-", "")
        # Match common variants e.g. 0712345678, +254712345678, 254712345678
        digits_only = "".join(filter(str.isdigit, clean_phone))
        last_9_digits = digits_only[-9:] if len(digits_only) >= 9 else digits_only

        search_pattern = f"%{last_9_digits}%"

        stmt = (
            select(Order)
            .options(
                selectinload(Order.items).selectinload(OrderItem.product).selectinload(Product.images),
                selectinload(Order.items).selectinload(OrderItem.vendor),
                selectinload(Order.user),
                selectinload(Order.timeline_events),
                selectinload(Order.mobile_money_payments),
            )
            .outerjoin(User, Order.user_id == User.id)
            .where(
                or_(
                    func.cast(Order.shipping_address, String).ilike(search_pattern),
                    User.phone.ilike(search_pattern),
                )
            )
            .order_by(Order.created_at.desc())
            .limit(limit)
        )

        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_orders(
        self,
        user_id: uuid.UUID | None = None,
        vendor_id: uuid.UUID | None = None,
        status: str | None = None,
        search: str | None = None,
        offset: int = 0,
        limit: int = 20,
    ) -> tuple[list[Order], int]:
        # Build base query conditions
        conditions: list[Any] = []

        if user_id:
            conditions.append(Order.user_id == user_id)

        if vendor_id:
            # Use subquery to avoid DISTINCT issues with JSON columns
            vendor_order_subquery = select(OrderItem.order_id).where(OrderItem.vendor_id == vendor_id)
            conditions.append(Order.id.in_(vendor_order_subquery))

        if status:
            conditions.append(Order.status == status)

        if search and search.strip():
            clean_search = search.strip()
            search_pattern = f"%{clean_search}%"
            search_conditions: list[Any] = [
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
            selectinload(Order.items).selectinload(OrderItem.vendor),
            selectinload(Order.user),
            selectinload(Order.timeline_events),
            selectinload(Order.mobile_money_payments),
        )

        for condition in conditions:
            stmt = stmt.where(condition)

        # Paginate
        stmt = stmt.order_by(Order.created_at.desc()).offset(offset).limit(limit)
        result = await self.db.execute(stmt)
        orders = list(result.scalars().all())

        return orders, int(total)

    async def update_order_status(
        self,
        order_id: uuid.UUID,
        new_status: str,
        auto_rollup: bool = False,
        user_id: uuid.UUID | None = None,
        user_name: str | None = None,
    ) -> Order:
        """Update order status with state machine validation."""
        # Use transaction block for atomic status update
        async with self._transaction():
            order = await self.get_order(order_id)
            if not order:
                raise NotFoundError("Order", order_id)

            old_status = order.status.value if hasattr(order.status, "value") else str(order.status)

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
                    status=OutboxStatus.PENDING,
                )
                self.db.add(event)

                author_suffix = f" by {user_name}" if user_name else ""
                timeline_event = OrderTimelineEvent(
                    id=uuid.uuid4(),
                    order_id=order_id,
                    status=new_status,
                    message=f"Order status updated to {new_status}{author_suffix}",
                    created_by=user_id,
                )
                self.db.add(timeline_event)

            # Loyalty points for paid orders are awarded by the OutboxRelay when it
            # processes the OrderPaid event (emitted by M-Pesa, manual mobile money
            # verification, and COD order creation). The old "paid" status trigger
            # never fired because no payment flow sets status="paid".
            # (See LoyaltyService.award_points_for_order for the idempotent award.)

        # Transaction commits automatically
        order = await self.get_order(order_id)
        if order is None:
            raise NotFoundError("Order", order_id)
        return order

    async def update_order_item_status(
        self, item_id: uuid.UUID, new_status: str, vendor_id: uuid.UUID, auto_rollup: bool = True
    ) -> OrderItem:
        """Update order item status with validation and automatic rollup."""
        from sqlalchemy import select

        # Use transaction block for atomic status update
        async with self._transaction():
            # Get the item
            stmt = select(OrderItem).where(OrderItem.id == item_id)
            result = await self.db.execute(stmt)
            item = result.scalar_one_or_none()

            if not item:
                raise NotFoundError("OrderItem", item_id)

            # Validate vendor ownership
            if item.vendor_id != vendor_id:
                raise AuthorizationError("Item does not belong to this vendor")

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
                message=f"Order item status updated to {new_status}",
            )
            self.db.add(timeline_event)

            # Automatic rollup to parent entities
            if auto_rollup:
                await self._rollup_status_from_item(item)

        # Transaction commits automatically
        # Auto-dispatch: create Delivery + assign driver once all items are packed
        await self._maybe_dispatch_delivery(item.order_id)

        # Refresh and return
        stmt = select(OrderItem).where(OrderItem.id == item_id)
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def _maybe_dispatch_delivery(self, order_id: uuid.UUID) -> None:
        """Auto-dispatch once all order items are packed.

        Creates a Delivery record (if none exists) and, for company-rider
        orders, assigns the best available driver. Failures are logged and
        swallowed so a dispatch hiccup never blocks the vendor's status update.
        """
        from app.domains.logistics.models.delivery import Delivery
        from app.domains.logistics.services.delivery_service import DeliveryService
        from app.domains.logistics.services.driver_assignment_service import DriverAssignmentService

        try:
            order_stmt = select(Order).where(Order.id == order_id).options(selectinload(Order.items))
            order = (await self.db.execute(order_stmt)).scalar_one_or_none()
            if not order:
                return

            active_items = [
                i for i in order.items if i.fulfillment_status != OrderItemFulfillmentStatus.CANCELLED.value
            ]
            if not active_items:
                return
            if not all(i.fulfillment_status == OrderItemFulfillmentStatus.PACKED.value for i in active_items):
                return

            shipping_address = order.shipping_address or {}
            logistics_type = shipping_address.get("logistics_type", "courier")
            if logistics_type not in ("company_rider", "courier"):
                return

            dispatch_key = f"order-packed:{order_id}"
            existing = (
                await self.db.execute(
                    select(Delivery).where(
                        or_(
                            Delivery.order_id == order_id,
                            Delivery.dispatch_idempotency_key == dispatch_key,
                        )
                    )
                )
            ).scalar_one_or_none()
            if existing:
                return

            delivery_service = DeliveryService(self.db)
            delivery = await delivery_service.create_delivery_from_order(
                order_id,
                apply_stored_driver=False,
                dispatch_idempotency_key=dispatch_key,
            )

            if logistics_type == "company_rider":
                assignment_service = DriverAssignmentService(self.db)
                try:
                    assigned_driver = await assignment_service.assign_best_driver(
                        delivery_id=delivery.id,
                        pickup_location=(OFFICE_LAT, OFFICE_LON),
                    )
                    if assigned_driver is None:
                        raise BusinessRuleError("No available drivers")
                except Exception as assignment_error:
                    logger.warning(f"Delivery assignment pending for {delivery.id}: {assignment_error}")
                    await self.db.rollback()
                    self.db.add(
                        OutboxEvent(
                            id=uuid.uuid4(),
                            aggregate_type="Delivery",
                            aggregate_id=str(delivery.id),
                            event_type="DeliveryDispatchRetry",
                            payload={
                                "delivery_id": str(delivery.id),
                                "order_id": str(order_id),
                                "pickup_latitude": OFFICE_LAT,
                                "pickup_longitude": OFFICE_LON,
                            },
                            status=OutboxStatus.PENDING,
                        )
                    )
                    await self.db.commit()
        except Exception as err:
            logger.error(f"Auto-dispatch failed for order {order_id}: {err}")

    async def update_sub_order_status(self, sub_order_id: uuid.UUID, new_status: str, vendor_id: uuid.UUID) -> SubOrder:
        """Update sub-order status with validation."""
        from sqlalchemy import select

        # Use transaction block for atomic status update
        async with self._transaction():
            # Get the sub-order
            stmt = select(SubOrder).where(SubOrder.id == sub_order_id)
            result = await self.db.execute(stmt)
            sub_order = result.scalar_one_or_none()

            if not sub_order:
                raise NotFoundError("SubOrder", sub_order_id)

            # Validate vendor ownership
            if sub_order.vendor_id != vendor_id:
                raise AuthorizationError("SubOrder does not belong to this vendor")

            # Validate transition using state machine
            old_status = sub_order.status.value if hasattr(sub_order.status, "value") else str(sub_order.status)
            if not OrderStateMachine.validate_sub_order_transition(old_status, new_status):
                raise InvalidStateTransitionError(old_status, new_status, "SubOrder")

            # Update status
            sub_order.status = SubOrderStatus(new_status)

            # Create timeline event
            timeline_event = OrderTimelineEvent(
                id=uuid.uuid4(),
                order_id=sub_order.parent_order_id,
                status=new_status,
                message=f"SubOrder status updated to {new_status}",
            )
            self.db.add(timeline_event)

            # Rollup to parent order
            await self._rollup_status_from_sub_order(sub_order)

        # Transaction commits automatically
        # Reload and return
        stmt = select(SubOrder).where(SubOrder.id == sub_order_id)
        result = await self.db.execute(stmt)
        return result.scalar_one()

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
                update_stmt = update(SubOrder).where(SubOrder.id == item.sub_order_id).values(status=new_status)
                await self.db.execute(update_stmt)

                # Create timeline event
                timeline = OrderTimelineEvent(
                    id=uuid.uuid4(),
                    order_id=item.order_id,
                    status=new_status,
                    message=f"SubOrder status automatically rolled up to {new_status}",
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
                curr_val = current_status.value if hasattr(current_status, "value") else str(current_status)
                if new_status != curr_val:
                    # Update order
                    update_stmt = update(Order).where(Order.id == order_id).values(status=new_status)
                    await self.db.execute(update_stmt)

                    # Create timeline and outbox events
                    timeline = OrderTimelineEvent(
                        id=uuid.uuid4(),
                        order_id=order_id,
                        status=new_status,
                        message=f"Order status automatically rolled up to {new_status}",
                    )
                    self.db.add(timeline)

                    outbox = OutboxEvent(
                        id=uuid.uuid4(),
                        aggregate_type="Order",
                        aggregate_id=str(order_id),
                        event_type=f"Order{new_status.capitalize()}",
                        payload={"order_id": str(order_id), "status": new_status, "auto_rolled_up": True},
                        status=OutboxStatus.PENDING,
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
                curr_val = current_status.value if hasattr(current_status, "value") else str(current_status)
                if new_status != curr_val:
                    # Update order
                    update_stmt = update(Order).where(Order.id == sub_order.parent_order_id).values(status=new_status)
                    await self.db.execute(update_stmt)

                # Create timeline event
                timeline = OrderTimelineEvent(
                    id=uuid.uuid4(),
                    order_id=sub_order.parent_order_id,
                    status=new_status,
                    message=f"Order status automatically rolled up to {new_status}",
                )
                self.db.add(timeline)

                # Create outbox event
                outbox = OutboxEvent(
                    id=uuid.uuid4(),
                    aggregate_type="Order",
                    aggregate_id=str(sub_order.parent_order_id),
                    event_type=f"Order{new_status.capitalize()}",
                    payload={"order_id": str(sub_order.parent_order_id), "status": new_status, "auto_rolled_up": True},
                    status=OutboxStatus.PENDING,
                )
                self.db.add(outbox)
