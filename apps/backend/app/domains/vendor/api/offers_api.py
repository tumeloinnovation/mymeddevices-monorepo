from datetime import datetime, UTC
from decimal import Decimal
from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.dependencies import require_role
from app.core.responses import ApiSuccessResponse, success_response
from app.domains.auth.models.user import User
from app.domains.catalog.models.category import Category
from app.domains.catalog.models.product import Product
from app.domains.catalog.models.product_variant import ProductVariant
from app.domains.catalog.schemas.offer_schemas import (
    OfferInventoryResponse,
    OfferInventoryUpdate,
    VendorOfferCreate,
    VendorOfferResponse,
    VendorOfferUpdate,
)
from app.domains.catalog.services.ai_assist_service import ai_assist_service
from app.domains.catalog.services.pricing_engine import pricing_engine
from app.domains.vendor.models.vendor_offer import (
    OfferInventory,
    OfferStatusEnum,
    VendorOffer,
)
from app.domains.vendor.models.vendor_profile import VendorProfile

router = APIRouter(prefix="/vendor/offers", tags=["Vendor Commercial Offers"])


async def get_current_vendor_profile(
    db: AsyncSession, current_user: User
) -> VendorProfile:
    stmt = select(VendorProfile).where(VendorProfile.user_id == current_user.id)
    res = await db.execute(stmt)
    profile = res.scalar_one_or_none()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found for current user",
        )
    return profile


@router.post("", response_model=VendorOfferResponse, status_code=status.HTTP_201_CREATED)
async def create_vendor_offer(
    offer_in: VendorOfferCreate,
    current_user: Annotated[User, Depends(require_role("vendor"))],
    db: AsyncSession = Depends(get_db),
):
    """
    Vendor submits a commercial offer for an existing canonical ProductVariant.
    """
    profile = await get_current_vendor_profile(db, current_user)

    # 1. Verify variant exists and product is published
    stmt_v = (
        select(ProductVariant)
        .options(selectinload(ProductVariant.product).selectinload(Product.category))
        .where(ProductVariant.id == offer_in.product_variant_id, ProductVariant.is_active == True)
    )
    res_v = await db.execute(stmt_v)
    variant = res_v.scalar_one_or_none()

    if not variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product variant not found or inactive")

    # 2. Check for duplicate offer under same packaging configuration
    stmt_dup = select(VendorOffer).where(
        VendorOffer.vendor_id == profile.id,
        VendorOffer.product_variant_id == offer_in.product_variant_id,
        VendorOffer.selling_unit == offer_in.selling_unit,
        VendorOffer.package_quantity == offer_in.package_quantity,
    )
    res_dup = await db.execute(stmt_dup)
    if res_dup.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An offer for this variant under packaging '{offer_in.selling_unit.value} of {offer_in.package_quantity}' already exists for your store",
        )

    # 3. Create VendorOffer
    offer = VendorOffer(
        id=uuid.uuid4(),
        vendor_id=profile.id,
        product_variant_id=offer_in.product_variant_id,
        vendor_sku=offer_in.vendor_sku,
        vendor_price=offer_in.vendor_price,
        compare_at_vendor_price=offer_in.compare_at_vendor_price,
        selling_unit=offer_in.selling_unit,
        package_quantity=offer_in.package_quantity,
        min_order_quantity=offer_in.min_order_quantity,
        max_order_quantity=offer_in.max_order_quantity,
        lead_time_days=offer_in.lead_time_days,
        warranty_months=offer_in.warranty_months,
        status=OfferStatusEnum.ACTIVE,
        external_system=offer_in.external_system,
        external_offer_id=offer_in.external_offer_id,
    )
    db.add(offer)
    await db.flush()

    # 4. Create OfferInventory
    inv = OfferInventory(
        id=uuid.uuid4(),
        vendor_offer_id=offer.id,
        quantity_on_hand=offer_in.initial_stock_quantity,
        quantity_reserved=0,
        low_stock_threshold=offer_in.low_stock_threshold,
        warehouse_location=offer_in.warehouse_location,
    )
    db.add(inv)
    await db.commit()

    pricing = pricing_engine.calculate_customer_price(offer.vendor_price)
    
    return VendorOfferResponse(
        id=offer.id,
        vendor_id=offer.vendor_id,
        product_variant_id=offer.product_variant_id,
        vendor_sku=offer.vendor_sku,
        vendor_price=offer.vendor_price,
        compare_at_vendor_price=offer.compare_at_vendor_price,
        selling_unit=offer.selling_unit,
        package_quantity=offer.package_quantity,
        min_order_quantity=offer.min_order_quantity,
        max_order_quantity=offer.max_order_quantity,
        lead_time_days=offer.lead_time_days,
        warranty_months=offer.warranty_months,
        status=offer.status,
        calculated_customer_price=pricing.customer_price,
        inventory=OfferInventoryResponse(
            id=inv.id,
            quantity_on_hand=inv.quantity_on_hand,
            quantity_reserved=inv.quantity_reserved,
            available_quantity=inv.quantity_on_hand - inv.quantity_reserved,
            low_stock_threshold=inv.low_stock_threshold,
            warehouse_location=inv.warehouse_location,
            updated_at=inv.updated_at or datetime.now(UTC),
        ),
        created_at=offer.created_at or datetime.now(UTC),
        updated_at=offer.updated_at or datetime.now(UTC),
    )


@router.get("", response_model=list[VendorOfferResponse])
async def list_vendor_offers(
    current_user: Annotated[User, Depends(require_role("vendor"))],
    status_filter: OfferStatusEnum | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    List all commercial offers owned by current vendor.
    """
    profile = await get_current_vendor_profile(db, current_user)

    stmt = (
        select(VendorOffer)
        .options(selectinload(VendorOffer.inventory))
        .where(VendorOffer.vendor_id == profile.id)
    )
    if status_filter:
        stmt = stmt.where(VendorOffer.status == status_filter)

    stmt = stmt.order_by(VendorOffer.created_at.desc())
    res = await db.execute(stmt)
    offers = res.scalars().all()

    output = []
    for off in offers:
        p = pricing_engine.calculate_customer_price(off.vendor_price)
        inv_resp = None
        if off.inventory:
            inv_resp = OfferInventoryResponse(
                id=off.inventory.id,
                quantity_on_hand=off.inventory.quantity_on_hand,
                quantity_reserved=off.inventory.quantity_reserved,
                available_quantity=off.inventory.quantity_on_hand - off.inventory.quantity_reserved,
                low_stock_threshold=off.inventory.low_stock_threshold,
                warehouse_location=off.inventory.warehouse_location,
                updated_at=off.inventory.updated_at,
            )
        output.append(
            VendorOfferResponse(
                id=off.id,
                vendor_id=off.vendor_id,
                product_variant_id=off.product_variant_id,
                vendor_sku=off.vendor_sku,
                vendor_price=off.vendor_price,
                compare_at_vendor_price=off.compare_at_vendor_price,
                selling_unit=off.selling_unit,
                package_quantity=off.package_quantity,
                min_order_quantity=off.min_order_quantity,
                max_order_quantity=off.max_order_quantity,
                lead_time_days=off.lead_time_days,
                warranty_months=off.warranty_months,
                status=off.status,
                calculated_customer_price=p.customer_price,
                inventory=inv_resp,
                created_at=off.created_at,
                updated_at=off.updated_at,
            )
        )

    return output


@router.patch("/{offer_id}", response_model=VendorOfferResponse)
async def update_vendor_offer(
    offer_id: uuid.UUID,
    offer_update: VendorOfferUpdate,
    current_user: Annotated[User, Depends(require_role("vendor"))],
    db: AsyncSession = Depends(get_db),
):
    """
    Update pricing, packaging, lead times, or status for a vendor's offer.
    """
    profile = await get_current_vendor_profile(db, current_user)

    stmt = (
        select(VendorOffer)
        .options(selectinload(VendorOffer.inventory))
        .where(VendorOffer.id == offer_id, VendorOffer.vendor_id == profile.id)
    )
    res = await db.execute(stmt)
    offer = res.scalar_one_or_none()

    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found")

    update_data = offer_update.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(offer, field, val)

    await db.commit()
    await db.refresh(offer)

    p = pricing_engine.calculate_customer_price(offer.vendor_price)
    inv_resp = None
    if offer.inventory:
        inv_resp = OfferInventoryResponse(
            id=offer.inventory.id,
            quantity_on_hand=offer.inventory.quantity_on_hand,
            quantity_reserved=offer.inventory.quantity_reserved,
            available_quantity=offer.inventory.quantity_on_hand - offer.inventory.quantity_reserved,
            low_stock_threshold=offer.inventory.low_stock_threshold,
            warehouse_location=offer.inventory.warehouse_location,
            updated_at=offer.inventory.updated_at,
        )

    return VendorOfferResponse(
        id=offer.id,
        vendor_id=offer.vendor_id,
        product_variant_id=offer.product_variant_id,
        vendor_sku=offer.vendor_sku,
        vendor_price=offer.vendor_price,
        compare_at_vendor_price=offer.compare_at_vendor_price,
        selling_unit=offer.selling_unit,
        package_quantity=offer.package_quantity,
        min_order_quantity=offer.min_order_quantity,
        max_order_quantity=offer.max_order_quantity,
        lead_time_days=offer.lead_time_days,
        warranty_months=offer.warranty_months,
        status=offer.status,
        calculated_customer_price=p.customer_price,
        inventory=inv_resp,
        created_at=offer.created_at,
        updated_at=offer.updated_at,
    )


@router.patch("/{offer_id}/inventory", response_model=OfferInventoryResponse)
async def update_offer_inventory(
    offer_id: uuid.UUID,
    inv_update: OfferInventoryUpdate,
    current_user: Annotated[User, Depends(require_role("vendor"))],
    db: AsyncSession = Depends(get_db),
):
    """
    Update physical stock on hand for a vendor offer.
    """
    profile = await get_current_vendor_profile(db, current_user)

    stmt = (
        select(OfferInventory)
        .join(VendorOffer, OfferInventory.vendor_offer_id == VendorOffer.id)
        .where(VendorOffer.id == offer_id, VendorOffer.vendor_id == profile.id)
    )
    res = await db.execute(stmt)
    inv = res.scalar_one_or_none()

    if not inv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer inventory not found")

    inv.quantity_on_hand = inv_update.quantity_on_hand
    if inv_update.low_stock_threshold is not None:
        inv.low_stock_threshold = inv_update.low_stock_threshold
    if inv_update.warehouse_location is not None:
        inv.warehouse_location = inv_update.warehouse_location

    await db.commit()
    await db.refresh(inv)
    return OfferInventoryResponse(
        id=inv.id,
        quantity_on_hand=inv.quantity_on_hand,
        quantity_reserved=inv.quantity_reserved,
        available_quantity=inv.quantity_on_hand - inv.quantity_reserved,
        low_stock_threshold=inv.low_stock_threshold,
        warehouse_location=inv.warehouse_location,
        updated_at=inv.updated_at,
    )
