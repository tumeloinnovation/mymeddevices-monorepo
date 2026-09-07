"""
Vendor Ledger Service

Centralizes all vendor ledger operations (credits, debits, reversals, payouts).
Other domains should call this service instead of directly manipulating
VendorLedger and LedgerTransaction models.
"""

import uuid
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleError
from app.core.logging import logger
from app.domains.payments.models.vendor_ledger import (
    LedgerTransaction,
    LedgerTransactionType,
    VendorLedger,
)

# Default platform commission rate (10%)
DEFAULT_PLATFORM_FEE_RATE = Decimal("0.10")


class LedgerService:
    """Centralized service for all vendor ledger financial operations."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_or_create_ledger(
        self,
        vendor_id: uuid.UUID,
        *,
        lock: bool = True,
    ) -> VendorLedger:
        """
        Fetch the vendor's ledger, creating one if it doesn't exist.

        Args:
            vendor_id: The vendor profile ID.
            lock: If True, acquire a row-level lock (FOR UPDATE) for safe concurrent writes.
                  Automatically skipped for SQLite (which doesn't support row-level locking).
        """
        stmt = select(VendorLedger).where(VendorLedger.vendor_id == vendor_id)
        if lock and self.db.bind and self.db.bind.dialect.name != "sqlite":
            stmt = stmt.with_for_update()
        result = await self.db.execute(stmt)
        ledger = result.scalar_one_or_none()

        if not ledger:
            ledger = VendorLedger(vendor_id=vendor_id, balance=Decimal("0.00"))
            self.db.add(ledger)
            await self.db.flush()

        return ledger

    async def credit_vendor_for_sub_order(
        self,
        vendor_id: uuid.UUID,
        sub_order_id: uuid.UUID | None,
        gross_amount: Decimal,
        reference_id: str,
        notes: str | None = None,
        *,
        platform_fee_rate: Decimal = DEFAULT_PLATFORM_FEE_RATE,
    ) -> LedgerTransaction | None:
        """
        Credit a vendor's ledger for a paid sub-order.

        Idempotent: if a CREDIT transaction already exists for this sub_order_id,
        the operation is skipped and None is returned.

        Args:
            vendor_id: The vendor profile ID.
            sub_order_id: The sub-order being credited (used for idempotency).
            gross_amount: The gross sale amount before platform fees.
            reference_id: Reference to the parent order ID.
            notes: Optional description for the transaction.
            platform_fee_rate: Platform commission rate (default 10%).

        Returns:
            The created LedgerTransaction, or None if already credited.
        """
        # Idempotency check
        if sub_order_id:
            existing = (
                await self.db.execute(
                    select(LedgerTransaction).where(
                        LedgerTransaction.sub_order_id == sub_order_id,
                        LedgerTransaction.transaction_type == LedgerTransactionType.CREDIT,
                    )
                )
            ).scalar_one_or_none()
            if existing:
                logger.info(f"Sub-order {sub_order_id} already credited on ledger. Skipping duplicate.")
                return None

        ledger = await self.get_or_create_ledger(vendor_id)

        platform_fee = gross_amount * platform_fee_rate
        net = gross_amount - platform_fee

        ledger.balance += net
        ledger.last_updated_at = datetime.now(UTC)

        txn = LedgerTransaction(
            vendor_id=vendor_id,
            sub_order_id=sub_order_id,
            gross_amount=gross_amount,
            platform_fee_rate=platform_fee_rate,
            platform_fee_amount=platform_fee,
            net_amount=net,
            transaction_type=LedgerTransactionType.CREDIT,
            reference_id=reference_id,
            reference_type="order",
            notes=notes or f"Order payment - Order {reference_id}",
        )
        self.db.add(txn)
        return txn

    async def reverse_vendor_credit(
        self,
        vendor_id: uuid.UUID,
        sub_order_id: uuid.UUID,
        reference_id: str,
        notes: str | None = None,
    ) -> LedgerTransaction | None:
        """
        Reverse a previously credited sub-order (e.g. order cancellation).

        Idempotent: if a DEBIT_REFUND already exists for this sub_order_id,
        the operation is skipped and None is returned.

        Raises:
            BusinessRuleError: If no credit exists or insufficient balance.

        Returns:
            The created reversal LedgerTransaction, or None if already reversed.
        """
        # Check the original credit exists
        credit = (
            await self.db.execute(
                select(LedgerTransaction).where(
                    LedgerTransaction.sub_order_id == sub_order_id,
                    LedgerTransaction.transaction_type == LedgerTransactionType.CREDIT,
                )
            )
        ).scalar_one_or_none()
        if not credit:
            logger.info(f"Sub-order {sub_order_id} was never credited; nothing to reverse.")
            return None

        # Idempotency check
        existing_reversal = (
            await self.db.execute(
                select(LedgerTransaction).where(
                    LedgerTransaction.sub_order_id == sub_order_id,
                    LedgerTransaction.transaction_type == LedgerTransactionType.DEBIT_REFUND,
                )
            )
        ).scalar_one_or_none()
        if existing_reversal:
            logger.info(f"Sub-order {sub_order_id} already reversed. Skipping duplicate.")
            return None

        ledger = await self.get_or_create_ledger(vendor_id)
        if ledger.balance < credit.net_amount:
            raise BusinessRuleError(
                f"Cannot reverse credit for sub-order {sub_order_id}: vendor ledger balance "
                f"{ledger.balance} is below the reversal amount {credit.net_amount}"
            )

        ledger.balance -= credit.net_amount
        ledger.last_updated_at = datetime.now(UTC)

        txn = LedgerTransaction(
            vendor_id=vendor_id,
            sub_order_id=sub_order_id,
            gross_amount=credit.gross_amount,
            platform_fee_rate=credit.platform_fee_rate,
            platform_fee_amount=credit.platform_fee_amount,
            net_amount=credit.net_amount,
            transaction_type=LedgerTransactionType.DEBIT_REFUND,
            reference_id=reference_id,
            reference_type="order",
            notes=notes or f"Order cancellation reversal - Order {reference_id}",
        )
        self.db.add(txn)
        return txn

    async def debit_vendor_for_refund(
        self,
        vendor_id: uuid.UUID,
        sub_order_id: uuid.UUID,
        reference_id: str,
        notes: str | None = None,
    ) -> LedgerTransaction | None:
        """
        Debit a vendor's ledger for a refunded sub-order (return flow).

        Idempotent: if a DEBIT_REFUND already exists for this sub_order_id,
        the operation is skipped and None is returned.

        Returns:
            The created refund LedgerTransaction, or None if already debited.
        """
        # Find the original credit
        credit_txn = (
            await self.db.execute(
                select(LedgerTransaction).where(
                    LedgerTransaction.sub_order_id == sub_order_id,
                    LedgerTransaction.transaction_type == LedgerTransactionType.CREDIT,
                )
            )
        ).scalar_one_or_none()
        if not credit_txn:
            return None

        # Idempotency check
        existing_refund = (
            await self.db.execute(
                select(LedgerTransaction).where(
                    LedgerTransaction.sub_order_id == sub_order_id,
                    LedgerTransaction.transaction_type == LedgerTransactionType.DEBIT_REFUND,
                )
            )
        ).scalar_one_or_none()
        if existing_refund:
            return None

        ledger = await self.get_or_create_ledger(vendor_id)
        if ledger:
            ledger.balance -= credit_txn.net_amount
            ledger.last_updated_at = datetime.now(UTC)

        txn = LedgerTransaction(
            id=uuid.uuid4(),
            vendor_id=vendor_id,
            sub_order_id=sub_order_id,
            gross_amount=credit_txn.gross_amount,
            platform_fee_rate=credit_txn.platform_fee_rate,
            platform_fee_amount=credit_txn.platform_fee_amount,
            net_amount=credit_txn.net_amount,
            transaction_type=LedgerTransactionType.DEBIT_REFUND,
            reference_id=reference_id,
            reference_type="return",
            notes=notes,
        )
        self.db.add(txn)
        return txn

    async def debit_vendor_for_payout(
        self,
        vendor_id: uuid.UUID,
        amount: Decimal,
        method: str,
        processed_by: uuid.UUID,
    ) -> LedgerTransaction:
        """
        Debit a vendor's ledger for a payout withdrawal.

        Args:
            vendor_id: The vendor profile ID.
            amount: Payout amount (must be >= 5000 KES, enforced by caller).
            method: Payout method ('mpesa' or 'bank').
            processed_by: The user ID who initiated the payout.

        Raises:
            BusinessRuleError: If insufficient balance.

        Returns:
            The created payout LedgerTransaction.
        """
        ledger = await self.get_or_create_ledger(vendor_id)

        if ledger.balance < amount:
            raise BusinessRuleError(
                f"Insufficient balance. Available: KES {ledger.balance:.2f}, Requested: KES {amount:.2f}"
            )

        txn = LedgerTransaction(
            id=uuid.uuid4(),
            vendor_id=vendor_id,
            gross_amount=amount,
            platform_fee_rate=Decimal("0"),
            platform_fee_amount=Decimal("0"),
            net_amount=amount,
            transaction_type=LedgerTransactionType.DEBIT_PAYOUT,
            reference_id=str(uuid.uuid4()),
            reference_type="payout",
            notes=f"Payout requested via {method}",
            processed_by=processed_by,
        )
        self.db.add(txn)

        ledger.balance -= amount
        ledger.last_updated_at = datetime.now(UTC)

        return txn
