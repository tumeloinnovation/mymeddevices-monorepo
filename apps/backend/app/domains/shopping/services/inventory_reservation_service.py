import uuid
from typing import Sequence

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domains.vendor.models.vendor_offer import (
    OfferInventory,
    OfferStatusEnum,
    VendorOffer,
)


class InsufficientStockException(Exception):
    """Raised when requested inventory cannot be reserved."""

    def __init__(self, vendor_offer_id: uuid.UUID, requested: int, available: int):
        self.vendor_offer_id = vendor_offer_id
        self.requested = requested
        self.available = available
        super().__init__(
            f"Insufficient stock for offer {vendor_offer_id}: requested {requested}, available {available}"
        )


class InventoryReservationService:
    """
    Authoritative concurrency-safe Inventory Reservation & Stock Mutation Service.
    
    Principles:
    - Pure row-level locking via PostgreSQL SELECT ... FOR UPDATE.
    - Deadlock prevention via deterministic sorting of offer IDs in batch reservations.
    - Strict atomic invariants: quantity_reserved <= quantity_on_hand.
    """

    @classmethod
    async def reserve_stock(
        cls,
        session: AsyncSession,
        vendor_offer_id: uuid.UUID,
        quantity: int,
    ) -> OfferInventory:
        """
        Atomically reserve stock for a single vendor offer using row-level locking.
        """
        if quantity <= 0:
            raise ValueError(f"Reservation quantity must be positive, got {quantity}")

        stmt = (
            select(OfferInventory)
            .where(OfferInventory.vendor_offer_id == vendor_offer_id)
            .with_for_update()
        )
        res = await session.execute(stmt)
        inventory = res.scalar_one_or_none()

        if not inventory:
            raise InsufficientStockException(vendor_offer_id, quantity, 0)

        available = inventory.quantity_on_hand - inventory.quantity_reserved
        if available < quantity:
            raise InsufficientStockException(vendor_offer_id, quantity, available)

        inventory.quantity_reserved += quantity
        await session.flush()
        return inventory

    @classmethod
    async def batch_reserve_stock(
        cls,
        session: AsyncSession,
        reservations: Sequence[tuple[uuid.UUID, int]],
    ) -> list[OfferInventory]:
        """
        Deadlock-free atomic multi-offer stock reservation.
        Sorts offer IDs deterministically before acquiring row locks.
        """
        if not reservations:
            return []

        # Sort reservations by UUID string to guarantee consistent lock ordering across concurrent checkouts
        sorted_reservations = sorted(reservations, key=lambda r: str(r[0]))
        results: list[OfferInventory] = []

        for offer_id, qty in sorted_reservations:
            inv = await cls.reserve_stock(session, offer_id, qty)
            results.append(inv)

        return results

    @classmethod
    async def release_reserved_stock(
        cls,
        session: AsyncSession,
        vendor_offer_id: uuid.UUID,
        quantity: int,
    ) -> OfferInventory:
        """
        Atomically release previously reserved stock (e.g. cart timeout, checkout cancellation).
        """
        if quantity <= 0:
            return None

        stmt = (
            select(OfferInventory)
            .where(OfferInventory.vendor_offer_id == vendor_offer_id)
            .with_for_update()
        )
        res = await session.execute(stmt)
        inventory = res.scalar_one_or_none()

        if not inventory:
            return None

        inventory.quantity_reserved = max(0, inventory.quantity_reserved - quantity)
        await session.flush()
        return inventory

    @classmethod
    async def commit_stock_deduction(
        cls,
        session: AsyncSession,
        vendor_offer_id: uuid.UUID,
        quantity: int,
    ) -> OfferInventory:
        """
        Finalize order placement: Decrement quantity_on_hand and clear reserved allocation.
        Automatically updates offer status to OUT_OF_STOCK if inventory reaches 0.
        """
        if quantity <= 0:
            raise ValueError(f"Deduction quantity must be positive, got {quantity}")

        stmt = (
            select(OfferInventory)
            .where(OfferInventory.vendor_offer_id == vendor_offer_id)
            .with_for_update()
        )
        res = await session.execute(stmt)
        inventory = res.scalar_one_or_none()

        if not inventory:
            raise InsufficientStockException(vendor_offer_id, quantity, 0)

        if inventory.quantity_on_hand < quantity:
            raise InsufficientStockException(vendor_offer_id, quantity, inventory.quantity_on_hand)

        inventory.quantity_on_hand -= quantity
        inventory.quantity_reserved = max(0, inventory.quantity_reserved - quantity)

        # Update vendor offer status if out of stock
        if inventory.quantity_on_hand == 0:
            stmt_offer = (
                select(VendorOffer)
                .where(VendorOffer.id == vendor_offer_id)
                .with_for_update()
            )
            res_offer = await session.execute(stmt_offer)
            offer = res_offer.scalar_one_or_none()
            if offer and offer.status == OfferStatusEnum.ACTIVE:
                offer.status = OfferStatusEnum.OUT_OF_STOCK

        await session.flush()
        return inventory


inventory_reservation_service = InventoryReservationService()
