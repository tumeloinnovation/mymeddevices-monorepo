from dataclasses import dataclass
from decimal import Decimal
import uuid
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domains.catalog.models.category import Category
from app.domains.catalog.models.product import Product
from app.domains.catalog.models.product_variant import ProductVariant
from app.domains.catalog.services.pricing_engine import PricingBreakdown, pricing_engine
from app.domains.vendor.models.vendor_offer import (
    OfferInventory,
    OfferStatusEnum,
    SellingUnitEnum,
    VendorOffer,
)
from app.domains.vendor.models.vendor_profile import VendorProfile


@dataclass
class BuyBoxOfferCandidate:
    offer: VendorOffer
    inventory: OfferInventory
    pricing: PricingBreakdown
    unit_customer_price: Decimal  # Normalized customer price per individual piece/unit


@dataclass
class BuyBoxResult:
    winning_candidate: Optional[BuyBoxOfferCandidate]
    all_candidates: list[BuyBoxOfferCandidate]
    variant_id: uuid.UUID
    selling_unit: SellingUnitEnum
    package_quantity: int
    total_eligible_offers: int


class BuyBoxService:
    """
    Authoritative Buy-Box Resolution Service for MyMedDevices.
    
    Principles:
    - Scoped strictly to (product_variant_id, selling_unit, package_quantity).
    - Filters: Approved vendor, active offer, published product, sufficient inventory, warranty compliance.
    - Deterministic ranking: Lowest customer price -> Shortest lead time -> Earliest creation.
    """

    @classmethod
    async def resolve_buy_box(
        cls,
        session: AsyncSession,
        product_variant_id: uuid.UUID,
        selling_unit: SellingUnitEnum = SellingUnitEnum.PIECE,
        package_quantity: int = 1,
        required_quantity: int = 1,
    ) -> BuyBoxResult:
        """
        Evaluate and return the winning offer for the requested variant packaging unit.
        """
        # Fetch variant with product and category hierarchy
        stmt_variant = (
            select(ProductVariant)
            .options(
                selectinload(ProductVariant.product).selectinload(Product.category),
            )
            .where(ProductVariant.id == product_variant_id, ProductVariant.is_active == True)
        )
        res_variant = await session.execute(stmt_variant)
        variant = res_variant.scalar_one_or_none()

        if not variant or not variant.product or variant.product.status != "published" or variant.product.is_deleted:
            return BuyBoxResult(
                winning_candidate=None,
                all_candidates=[],
                variant_id=product_variant_id,
                selling_unit=selling_unit,
                package_quantity=package_quantity,
                total_eligible_offers=0,
            )

        min_warranty = variant.product.category.min_warranty_months if variant.product.category else 0

        # Query all active offers for this exact packaging configuration
        stmt_offers = (
            select(VendorOffer)
            .options(
                selectinload(VendorOffer.vendor),
                selectinload(VendorOffer.inventory),
            )
            .join(VendorProfile, VendorOffer.vendor_id == VendorProfile.id)
            .join(OfferInventory, VendorOffer.id == OfferInventory.vendor_offer_id)
            .where(
                VendorOffer.product_variant_id == product_variant_id,
                VendorOffer.selling_unit == selling_unit,
                VendorOffer.package_quantity == package_quantity,
                VendorOffer.status == OfferStatusEnum.ACTIVE,
                VendorProfile.approval_status == "approved",
                VendorOffer.warranty_months >= min_warranty,
            )
        )
        res_offers = await session.execute(stmt_offers)
        offers = res_offers.scalars().all()

        candidates: list[BuyBoxOfferCandidate] = []
        for offer in offers:
            inv = offer.inventory
            if not inv:
                continue

            available_stock = inv.quantity_on_hand - inv.quantity_reserved
            if available_stock < required_quantity:
                continue

            # Minimum / Maximum order quantity checks
            if required_quantity < offer.min_order_quantity:
                continue
            if offer.max_order_quantity is not None and required_quantity > offer.max_order_quantity:
                continue

            pricing = pricing_engine.calculate_customer_price(Decimal(str(offer.vendor_price)))
            unit_price = (pricing.customer_price / Decimal(str(offer.package_quantity))).quantize(Decimal("0.01"))

            candidates.append(
                BuyBoxOfferCandidate(
                    offer=offer,
                    inventory=inv,
                    pricing=pricing,
                    unit_customer_price=unit_price,
                )
            )

        if not candidates:
            return BuyBoxResult(
                winning_candidate=None,
                all_candidates=[],
                variant_id=product_variant_id,
                selling_unit=selling_unit,
                package_quantity=package_quantity,
                total_eligible_offers=0,
            )

        # Deterministic ranking: lowest customer price -> shortest lead time -> earliest offer creation
        candidates.sort(
            key=lambda c: (
                c.pricing.customer_price,
                c.offer.lead_time_days,
                c.offer.created_at,
            )
        )

        return BuyBoxResult(
            winning_candidate=candidates[0],
            all_candidates=candidates,
            variant_id=product_variant_id,
            selling_unit=selling_unit,
            package_quantity=package_quantity,
            total_eligible_offers=len(candidates),
        )


buy_box_service = BuyBoxService()
