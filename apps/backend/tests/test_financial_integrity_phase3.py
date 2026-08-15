import uuid
from decimal import Decimal

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.auth.models.user import User
from app.domains.returns.models.return_request import ReturnRequest
from app.domains.returns.services.return_service import ReturnService
from app.domains.shared.models.outbox import OutboxEvent, OutboxStatus
from app.domains.shared.services.outbox_relay import OutboxRelay
from app.domains.shopping.models.order import Order, OrderStatus
from app.domains.shopping.models.sub_order import SubOrder
from app.domains.shopping.models.vendor_ledger import LedgerTransaction, LedgerTransactionType, VendorLedger
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.fixture
async def financial_fixtures(db_session: AsyncSession):
    # Customer
    customer = User(
        id=uuid.uuid4(),
        email="fin_cust@test.com",
        first_name="Finance",
        last_name="Customer",
        password_hash="fake_hash",
        role="customer",
        is_active=True,
    )
    db_session.add(customer)

    # Vendor
    vendor_user = User(
        id=uuid.uuid4(),
        email="fin_vendor@test.com",
        first_name="Finance",
        last_name="Vendor",
        password_hash="fake_hash",
        role="vendor",
        is_active=True,
    )
    db_session.add(vendor_user)

    vendor_profile = VendorProfile(
        id=uuid.uuid4(),
        user_id=vendor_user.id,
        store_name="Fin Med Supply",
    )
    db_session.add(vendor_profile)

    # Order & Sub-order
    order = Order(
        id=uuid.uuid4(),
        user_id=customer.id,
        order_number=90001,
        status=OrderStatus.PENDING,
        currency="KES",
        total_amount=Decimal("10000.00"),
        shipping_address={"address": "Nairobi CBD"},
    )
    db_session.add(order)

    sub_order = SubOrder(
        id=uuid.uuid4(),
        parent_order_id=order.id,
        vendor_id=vendor_profile.id,
        status=OrderStatus.PENDING,
        subtotal_amount=Decimal("10000.00"),
    )
    db_session.add(sub_order)

    await db_session.commit()

    return {
        "customer": customer,
        "vendor_user": vendor_user,
        "vendor_profile": vendor_profile,
        "order": order,
        "sub_order": sub_order,
    }


@pytest.mark.asyncio
async def test_order_paid_outbox_relay_and_refund_lifecycle(db_session: AsyncSession, financial_fixtures):
    """
    Verify complete financial accounting cycle:
    1. OrderPaid event credits vendor ledger with platform fee deduction (90% net).
    2. Duplicate OrderPaid event is skipped idempotently.
    3. Return refund debits vendor ledger by exact net amount.
    4. Duplicate return refund skips debit idempotently.
    """
    order = financial_fixtures["order"]
    sub_order = financial_fixtures["sub_order"]
    vendor_profile = financial_fixtures["vendor_profile"]
    customer = financial_fixtures["customer"]

    # 1. Simulate Outbox Event for OrderPaid
    outbox_event = OutboxEvent(
        id=uuid.uuid4(),
        aggregate_type="Order",
        aggregate_id=str(order.id),
        event_type="OrderPaid",
        payload={
            "order_id": str(order.id),
            "total_amount": float(order.total_amount),
            "sub_orders": [
                {
                    "sub_order_id": str(sub_order.id),
                    "vendor_id": str(vendor_profile.id),
                    "subtotal_amount": float(sub_order.subtotal_amount),
                    "items": [],
                }
            ],
        },
        status=OutboxStatus.PENDING,
    )
    db_session.add(outbox_event)
    await db_session.commit()

    relay = OutboxRelay(db_session)
    await relay.process_pending_events()

    # Verify VendorLedger was created and credited
    ledger = (
        await db_session.execute(select(VendorLedger).where(VendorLedger.vendor_id == vendor_profile.id))
    ).scalar_one_or_none()
    assert ledger is not None
    # 10000 gross - 10% platform fee (1000) = 9000 net
    assert ledger.balance == Decimal("9000.00")

    # 2. Test Idempotency: re-dispatching OrderPaid must not double credit
    outbox_event_dup = OutboxEvent(
        id=uuid.uuid4(),
        aggregate_type="Order",
        aggregate_id=str(order.id),
        event_type="OrderPaid",
        payload=outbox_event.payload,
        status=OutboxStatus.PENDING,
    )
    db_session.add(outbox_event_dup)
    await db_session.commit()

    await relay.process_pending_events()

    await db_session.refresh(ledger)
    assert ledger.balance == Decimal("9000.00")  # Still exactly 9000

    # 3. Simulate Return & Refund
    return_service = ReturnService(db_session)
    return_req = ReturnRequest(
        id=uuid.uuid4(),
        return_number="RET-FIN-001",
        customer_id=customer.id,
        order_id=order.id,
        reason="Defective item",
        description="Device does not power on",
        items=[{"order_item_id": str(uuid.uuid4()), "product_id": str(uuid.uuid4()), "quantity": 1}],
        refund_method="mpesa",
        status="approved",
    )
    db_session.add(return_req)
    await db_session.commit()

    # Update return status to 'refunded'
    await return_service.update_status(return_req.id, "refunded", resolver_id=customer.id)

    # Verify ledger was debited back to 0.00
    await db_session.refresh(ledger)
    assert ledger.balance == Decimal("0.00")

    # Verify debit transaction was created
    debit_txn = (
        await db_session.execute(
            select(LedgerTransaction).where(
                LedgerTransaction.sub_order_id == sub_order.id,
                LedgerTransaction.transaction_type == LedgerTransactionType.DEBIT_REFUND,
            )
        )
    ).scalar_one_or_none()
    assert debit_txn is not None
    assert debit_txn.net_amount == Decimal("9000.00")
