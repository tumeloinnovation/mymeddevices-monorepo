import uuid
from decimal import Decimal

import pytest
from sqlalchemy import select

from app.domains.auth.models.user import User
from app.domains.catalog.models.product import Product
from app.domains.shared.models.outbox import OutboxEvent
from app.domains.shared.services.outbox_relay import OutboxRelay
from app.domains.shopping.models.order import Order, OrderItem, OrderStatus
from app.domains.shopping.models.sub_order import SubOrder, SubOrderStatus
from app.domains.shopping.models.vendor_ledger import LedgerTransaction, LedgerTransactionType, VendorLedger
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.mark.asyncio
async def test_order_paid_duplicate_dispatch_financial_idempotency(db_session):
    """
    Test that dispatching OrderPaid multiple times (re-delivery / retries)
    does NOT credit the vendor ledger multiple times.
    """
    # 1. Setup User, Vendor, Product, Order, SubOrder
    user = User(
        id=uuid.uuid4(),
        email=f"vendor_{uuid.uuid4().hex[:6]}@test.com",
        password_hash="test_hash",
        first_name="Test",
        last_name="Vendor",
        role="vendor",
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    vendor = VendorProfile(
        id=uuid.uuid4(),
        user_id=user.id,
        store_name="Medical Supply Co",
        approval_status="approved",
    )
    db_session.add(vendor)
    await db_session.flush()

    ledger = VendorLedger(
        vendor_id=vendor.id,
        balance=Decimal("0.00"),
    )
    db_session.add(ledger)
    await db_session.flush()

    product = Product(
        id=uuid.uuid4(),
        name="Stethoscope",
        slug=f"stethoscope-{uuid.uuid4().hex[:6]}",
        sku=f"SKU-{uuid.uuid4().hex[:6]}",
        vendor_id=vendor.id,
        base_price=Decimal("1000.00"),
        price=Decimal("1000.00"),
        stock_quantity=10,
        status="published",
    )
    db_session.add(product)
    await db_session.flush()

    order = Order(
        id=uuid.uuid4(),
        order_number=1001,
        user_id=user.id,
        status=OrderStatus.PENDING,
        total_amount=Decimal("1000.00"),
        currency="KES",
    )
    db_session.add(order)
    await db_session.flush()

    sub_order = SubOrder(
        id=uuid.uuid4(),
        parent_order_id=order.id,
        vendor_id=vendor.id,
        subtotal_amount=Decimal("1000.00"),
        status=SubOrderStatus.PENDING,
    )
    db_session.add(sub_order)
    await db_session.flush()

    order_item = OrderItem(
        id=uuid.uuid4(),
        order_id=order.id,
        sub_order_id=sub_order.id,
        product_id=product.id,
        vendor_id=vendor.id,
        quantity=1,
        unit_price=Decimal("1000.00"),
        subtotal=Decimal("1000.00"),
    )
    db_session.add(order_item)
    await db_session.commit()

    # 2. Create OrderPaid outbox event payload
    event = OutboxEvent(
        id=uuid.uuid4(),
        aggregate_type="Order",
        aggregate_id=str(order.id),
        event_type="OrderPaid",
        payload={
            "order_id": str(order.id),
            "customer_id": str(user.id),
            "total_amount": 1000.00,
            "sub_orders": [
                {
                    "sub_order_id": str(sub_order.id),
                    "vendor_id": str(vendor.id),
                    "subtotal_amount": 1000.00,
                    "items": [
                        {
                            "product_id": str(product.id),
                            "quantity": 1,
                            "unit_price": 1000.00,
                        }
                    ],
                }
            ],
        },
    )

    relay = OutboxRelay(db_session)

    # 3. Dispatch the event first time
    await relay._dispatch(event)
    await db_session.commit()

    # Verify initial credit
    await db_session.refresh(ledger)
    assert ledger.balance == Decimal("900.00")  # 1000 - 10% fee

    # 4. Dispatch the EXACT SAME event 5 times repeatedly (simulate retries / outbox loops)
    for _ in range(5):
        await relay._dispatch(event)
        await db_session.commit()

    # Invariant: balance must STILL be 900.00, not 4500.00!
    await db_session.refresh(ledger)
    assert ledger.balance == Decimal("900.00"), (
        f"Repeated credit detected! Balance is {ledger.balance}, expected 900.00"
    )

    # Invariant: exactly 1 LedgerTransaction record must exist for this sub_order
    txns = (
        (
            await db_session.execute(
                select(LedgerTransaction).where(
                    LedgerTransaction.sub_order_id == sub_order.id,
                    LedgerTransaction.transaction_type == LedgerTransactionType.CREDIT,
                )
            )
        )
        .scalars()
        .all()
    )
    assert len(txns) == 1, f"Expected 1 LedgerTransaction, found {len(txns)}"
