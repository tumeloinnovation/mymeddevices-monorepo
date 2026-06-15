# Ecommerce Structure Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a strict transactional outbox pattern, enforce linear state machines for orders and shipments, and apply robust row-level security for vendors and customers.

**Architecture:** We will introduce an `OutboxEvent` model in the `shared` domain to decouple database transactions from side effects. We will enforce state transitions with Enums and Python logic in the domain services, preventing illegal jumps. We will also secure API endpoints to ensure vendors only retrieve or act on their specific order items.

**Tech Stack:** Python, FastAPI, SQLAlchemy (Async), PostgreSQL.

---

### Task 1: Create Outbox Event Model

**Files:**
- Create: `apps/backend/app/domains/shared/models/outbox.py`
- Modify: `apps/backend/app/domains/shared/models/__init__.py`

- [ ] **Step 1: Write the minimal implementation for OutboxEvent**

```python
# apps/backend/app/domains/shared/models/outbox.py
from sqlalchemy import Column, String, JSON, DateTime, Enum as SQLEnum
from datetime import datetime
import uuid
import enum

from app.core.database import Base
from app.domains.shared.models import IDMixin

class OutboxStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSED = "processed"
    FAILED = "failed"

class OutboxEvent(Base, IDMixin):
    __tablename__ = "outbox_events"

    aggregate_type = Column(String(100), nullable=False)
    aggregate_id = Column(String(100), nullable=False)
    event_type = Column(String(100), nullable=False)
    payload = Column(JSON, nullable=False)
    status = Column(SQLEnum(OutboxStatus), default=OutboxStatus.PENDING, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    processed_at = Column(DateTime, nullable=True)
```

- [ ] **Step 2: Expose the model**

```python
# apps/backend/app/domains/shared/models/__init__.py
from app.domains.shared.models.base import IDMixin, AuditMixin
from app.domains.shared.models.outbox import OutboxEvent, OutboxStatus

__all__ = ["IDMixin", "AuditMixin", "OutboxEvent", "OutboxStatus"]
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/app/domains/shared/models/outbox.py apps/backend/app/domains/shared/models/__init__.py
git commit -m "feat: add OutboxEvent model for transactional outbox"
```

### Task 2: Implement Order and Shipment State Enums

**Files:**
- Modify: `apps/backend/app/domains/shopping/models/order.py`
- Modify: `apps/backend/app/domains/shopping/models/shipment.py`

- [ ] **Step 1: Add OrderStatus enum to order model**

Update `apps/backend/app/domains/shopping/models/order.py` to use an explicit Enum. Ensure the necessary imports (`from sqlalchemy import Enum as SQLEnum` and `import enum`) are added.

```python
# Insert at top of file
import enum
from sqlalchemy import Enum as SQLEnum

class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

# Modify Order class field:
# status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False, index=True)
```

- [ ] **Step 2: Add ShipmentStatus enum to shipment model**

Update `apps/backend/app/domains/shopping/models/shipment.py`.

```python
# Insert at top of file
import enum
from sqlalchemy import Enum as SQLEnum

class ShipmentStatus(str, enum.Enum):
    CREATED = "created"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    EXCEPTION = "exception"

# Modify Shipment class field:
# status = Column(SQLEnum(ShipmentStatus), default=ShipmentStatus.CREATED, nullable=False, index=True)
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/app/domains/shopping/models/order.py apps/backend/app/domains/shopping/models/shipment.py
git commit -m "refactor: enforce Order and Shipment status via Enum"
```

### Task 3: Secure CheckoutService with Outbox and Data Integrity

**Files:**
- Modify: `apps/backend/app/domains/shopping/services/order_service.py`

- [ ] **Step 1: Refactor `create_order_from_cart` to use Outbox and ensure pricing**

In `CheckoutService`, replace the email dispatch block with an `OutboxEvent` insert. Remove `email_service` from `CheckoutService.__init__`.

```python
# apps/backend/app/domains/shopping/services/order_service.py
# (Include these imports at the top)
from app.domains.shared.models.outbox import OutboxEvent, OutboxStatus
from app.domains.shopping.models.order import OrderStatus
import json

# Inside CheckoutService.create_order_from_cart:
# 1. Update Order creation to use OrderStatus.PENDING
# 2. Update OrderItem creation to strictly snapshot price:
#    unit_price=item.product.price,
#    subtotal=item.product.price * item.quantity
# 3. Replace the email sending block (step 6 and 7) with OutboxEvent creation:

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
        await self.db.refresh(order)
        return order
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/app/domains/shopping/services/order_service.py
git commit -m "feat: use outbox pattern and strict pricing in CheckoutService"
```

### Task 4: Enforce State Machine in OrderService

**Files:**
- Modify: `apps/backend/app/domains/shopping/services/order_service.py`

- [ ] **Step 1: Add Custom Exception**

```python
# Top of apps/backend/app/domains/shopping/services/order_service.py
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
```

- [ ] **Step 2: Update `update_order_status`**

In `OrderService`, check valid transitions and write `OrderPaid` or `OrderShipped` outbox events instead of directly calling `email_service`.

```python
# Inside OrderService.update_order_status
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
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/app/domains/shopping/services/order_service.py
git commit -m "feat: enforce order state machine and log transition events"
```

### Task 5: Secure Vendor API Access

**Files:**
- Modify: `apps/backend/app/domains/shopping/api/admin_orders_api.py`

- [ ] **Step 1: Filter Order Items in `vendor_list_orders`**

Update `vendor_list_orders` to strip out OrderItems that do not belong to the requesting vendor before returning.

```python
# apps/backend/app/domains/shopping/api/admin_orders_api.py
@router.get("/vendor", response_model=ApiSuccessResponse[List[OrderResponse]])
async def vendor_list_orders(
    current_user: Annotated[User, Depends(require_role("vendor", "admin"))],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """Vendor lists orders containing their products."""
    from app.domains.vendor.models.vendor_profile import VendorProfile
    from sqlalchemy import select
    
    stmt = select(VendorProfile).where(VendorProfile.user_id == current_user.id)
    result = await db.execute(stmt)
    vendor_profile = result.scalar_one_or_none()
    
    if not vendor_profile:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vendor profile not found")

    service = OrderService(db)
    orders, total = await service.list_orders(
        vendor_id=vendor_profile.id,
        offset=(page - 1) * page_size,
        limit=page_size
    )

    # Secure data: filter order items and recalculate totals for the vendor
    secured_orders = []
    for order in orders:
        vendor_items = [item for item in order.items if item.vendor_id == vendor_profile.id]
        if vendor_items:
            # Overwrite items and total for the response view
            order.items = vendor_items
            order.total_amount = sum(item.subtotal for item in vendor_items)
            secured_orders.append(order)

    return success_response(secured_orders)
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/app/domains/shopping/api/admin_orders_api.py
git commit -m "fix: secure vendor order list to only expose their own items"
```

### Task 6: Implement Outbox Relay Service

**Files:**
- Create: `apps/backend/app/domains/shared/services/outbox_relay.py`

- [ ] **Step 1: Write Relay Logic**

```python
# apps/backend/app/domains/shared/services/outbox_relay.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from datetime import datetime
import asyncio

from app.domains.shared.models.outbox import OutboxEvent, OutboxStatus
from app.domains.shopping.services.email_notification_service import EmailNotificationService
from app.core.logging import logger

class OutboxRelay:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.email_service = EmailNotificationService()

    async def process_pending_events(self, limit: int = 50):
        stmt = select(OutboxEvent).where(OutboxEvent.status == OutboxStatus.PENDING).limit(limit)
        result = await self.db.execute(stmt)
        events = result.scalars().all()

        for event in events:
            try:
                await self._dispatch(event)
                event.status = OutboxStatus.PROCESSED
                event.processed_at = datetime.utcnow()
            except Exception as e:
                logger.error(f"Failed to process event {event.id}: {e}")
                event.status = OutboxStatus.FAILED
            
            self.db.add(event)
        
        if events:
            await self.db.commit()

    async def _dispatch(self, event: OutboxEvent):
        # Temporary in-process dispatcher until Celery is wired
        if event.event_type == "OrderCreated":
            # logic to load user and send email
            pass
        elif event.event_type == "OrderPaid":
            pass
        elif event.event_type == "OrderShipped":
            pass
        # Extend as necessary
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/app/domains/shared/services/outbox_relay.py
git commit -m "feat: implement outbox relay dispatcher"
```
