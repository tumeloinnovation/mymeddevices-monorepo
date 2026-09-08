import uuid
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.domains.catalog.models.bundle import Bundle, BundleComponent, BundleDiscountType
from app.domains.catalog.models.product import Product
from app.domains.catalog.models.product_variant import ProductVariant
from app.domains.catalog.services.buy_box_service import BuyBoxOfferCandidate, buy_box_service
from app.domains.vendor.models.vendor_offer import SellingUnitEnum


class BundleIneligibleException(Exception):
    """Raised when a bundle fails V1 business constraints (e.g. multi-variant component)."""
    pass


@dataclass
class ResolvedBundleComponent:
    component: BundleComponent
    product: Product
    variant: ProductVariant
    quantity: int
    winning_offer: BuyBoxOfferCandidate | None
    gross_unit_customer_price: Decimal
    gross_line_customer_price: Decimal
    allocated_line_discount: Decimal
    net_unit_customer_price: Decimal
    net_line_customer_price: Decimal
    vendor_payout_amount: Decimal  # Vendor price - commission


@dataclass
class ResolvedBundle:
    bundle: Bundle
    is_available: bool
    unavailability_reason: str | None
    components: list[ResolvedBundleComponent]
    gross_customer_price: Decimal
    discount_amount: Decimal
    net_customer_price: Decimal
    total_platform_subsidy: Decimal
    participating_vendor_ids: list[uuid.UUID]


class BundleService:
    """
    Authoritative Merchandising Bundle Resolution & Discount Allocation Engine.

    Principles:
    - V1 Invariant: All component Products MUST have exactly ONE active variant. Multi-variant products are strictly rejected.
    - Components independently resolve to the lowest eligible vendor offer via the Buy-Box.
    - Deterministic proportional discount allocation across component order lines with zero rounding residual leakage.
    - Platform absorbs bundle discount in V1 without docking vendor payouts.
    """

    @classmethod
    async def resolve_bundle(
        cls,
        session: AsyncSession,
        bundle_id: uuid.UUID,
        bundle_quantity: int = 1,
    ) -> ResolvedBundle:
        """
        Resolve a merchandising bundle into concrete vendor offers with proportional discount allocation.
        """
        stmt = (
            select(Bundle)
            .options(
                selectinload(Bundle.components)
                .selectinload(BundleComponent.product)
                .selectinload(Product.variants),
                selectinload(Bundle.components)
                .selectinload(BundleComponent.product)
                .selectinload(Product.category),
            )
            .where(Bundle.id == bundle_id, Bundle.is_active == True)
        )
        res = await session.execute(stmt)
        bundle = res.scalar_one_or_none()

        if not bundle:
            raise ValueError(f"Bundle {bundle_id} not found or inactive")

        if not bundle.components:
            raise BundleIneligibleException(f"Bundle {bundle_id} contains no components")

        resolved_components: list[ResolvedBundleComponent] = []
        is_available = True
        unavailability_reason = None
        participating_vendors: set[uuid.UUID] = set()

        for comp in bundle.components:
            product = comp.product
            if not product or product.status != "published" or product.is_deleted:
                is_available = False
                unavailability_reason = f"Component product '{product.name if product else comp.product_id}' is not published"
                break

            active_variants = [v for v in product.variants if v.is_active]

            # V1 Critical Rule: Exact 1 active variant constraint
            if len(active_variants) != 1:
                raise BundleIneligibleException(
                    f"Product '{product.name}' has {len(active_variants)} active variants. "
                    "V1 rules strictly prohibit products with multiple variants inside bundles."
                )

            variant = active_variants[0]
            required_qty = comp.quantity * bundle_quantity

            # Buy-box resolution for the single variant
            bb_res = await buy_box_service.resolve_buy_box(
                session=session,
                product_variant_id=variant.id,
                selling_unit=SellingUnitEnum.PIECE,
                package_quantity=1,
                required_quantity=required_qty,
            )

            if not bb_res.winning_candidate:
                is_available = False
                unavailability_reason = f"No eligible stock available for component '{product.name}'"
                winning_cand = None
                gross_unit = Decimal("0.00")
                gross_line = Decimal("0.00")
                vendor_payout = Decimal("0.00")
            else:
                winning_cand = bb_res.winning_candidate
                participating_vendors.add(winning_cand.offer.vendor_id)
                gross_unit = winning_cand.pricing.customer_price
                gross_line = gross_unit * Decimal(str(comp.quantity))
                # Vendor settlement: Vendor price - 2% commission
                vp = Decimal(str(winning_cand.offer.vendor_price))
                comm = (vp * Decimal("0.02")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                vendor_payout = (vp - comm) * Decimal(str(comp.quantity))

            resolved_components.append(
                ResolvedBundleComponent(
                    component=comp,
                    product=product,
                    variant=variant,
                    quantity=comp.quantity,
                    winning_offer=winning_cand,
                    gross_unit_customer_price=gross_unit,
                    gross_line_customer_price=gross_line,
                    allocated_line_discount=Decimal("0.00"),
                    net_unit_customer_price=gross_unit,
                    net_line_customer_price=gross_line,
                    vendor_payout_amount=vendor_payout,
                )
            )

        if not is_available:
            return ResolvedBundle(
                bundle=bundle,
                is_available=False,
                unavailability_reason=unavailability_reason,
                components=resolved_components,
                gross_customer_price=Decimal("0.00"),
                discount_amount=Decimal("0.00"),
                net_customer_price=Decimal("0.00"),
                total_platform_subsidy=Decimal("0.00"),
                participating_vendor_ids=list(participating_vendors),
            )

        # Calculate Total Gross Customer Price for 1 Bundle Unit
        gross_total = sum(c.gross_line_customer_price for c in resolved_components)

        # Calculate Discount
        if bundle.discount_type == BundleDiscountType.PERCENTAGE:
            discount_total = (gross_total * (Decimal(str(bundle.discount_value)) / Decimal("100.00"))).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
        else:
            discount_total = min(Decimal(str(bundle.discount_value)), gross_total)

        net_total = gross_total - discount_total

        # Proportional Discount Allocation across lines
        allocated_sum = Decimal("0.00")
        max_line_idx = 0
        max_line_val = Decimal("-1.00")

        final_components: list[ResolvedBundleComponent] = []
        for idx, comp_res in enumerate(resolved_components):
            if gross_total > Decimal("0.00"):
                line_discount = (
                    discount_total * (comp_res.gross_line_customer_price / gross_total)
                ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            else:
                line_discount = Decimal("0.00")

            allocated_sum += line_discount
            if comp_res.gross_line_customer_price > max_line_val:
                max_line_val = comp_res.gross_line_customer_price
                max_line_idx = idx

            net_line = comp_res.gross_line_customer_price - line_discount
            net_unit = (net_line / Decimal(str(comp_res.quantity))).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )

            final_components.append(
                ResolvedBundleComponent(
                    component=comp_res.component,
                    product=comp_res.product,
                    variant=comp_res.variant,
                    quantity=comp_res.quantity,
                    winning_offer=comp_res.winning_offer,
                    gross_unit_customer_price=comp_res.gross_unit_customer_price,
                    gross_line_customer_price=comp_res.gross_line_customer_price,
                    allocated_line_discount=line_discount,
                    net_unit_customer_price=net_unit,
                    net_line_customer_price=net_line,
                    vendor_payout_amount=comp_res.vendor_payout_amount,
                )
            )

        # Apply Rounding Residual to Highest Value Component
        residual = discount_total - allocated_sum
        if residual != Decimal("0.00") and final_components:
            target = final_components[max_line_idx]
            adjusted_discount = target.allocated_line_discount + residual
            adjusted_net_line = target.gross_line_customer_price - adjusted_discount
            adjusted_net_unit = (adjusted_net_line / Decimal(str(target.quantity))).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
            final_components[max_line_idx] = ResolvedBundleComponent(
                component=target.component,
                product=target.product,
                variant=target.variant,
                quantity=target.quantity,
                winning_offer=target.winning_offer,
                gross_unit_customer_price=target.gross_unit_customer_price,
                gross_line_customer_price=target.gross_line_customer_price,
                allocated_line_discount=adjusted_discount,
                net_unit_customer_price=adjusted_net_unit,
                net_line_customer_price=adjusted_net_line,
                vendor_payout_amount=target.vendor_payout_amount,
            )

        return ResolvedBundle(
            bundle=bundle,
            is_available=True,
            unavailability_reason=None,
            components=final_components,
            gross_customer_price=gross_total,
            discount_amount=discount_total,
            net_customer_price=net_total,
            total_platform_subsidy=discount_total,
            participating_vendor_ids=list(participating_vendors),
        )


bundle_service = BundleService()
