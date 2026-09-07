import uuid
from decimal import Decimal

import pytest

from app.domains.auth.models.user import User
from app.domains.catalog.models.bundle import Bundle, BundleComponent, BundleDiscountType
from app.domains.catalog.models.category import Category
from app.domains.catalog.models.product import Product
from app.domains.catalog.models.product_variant import ProductVariant
from app.domains.catalog.services.bundle_service import BundleIneligibleException, bundle_service
from app.domains.vendor.models.vendor_offer import (
    OfferInventory,
    OfferStatusEnum,
    VendorOffer,
)
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.mark.asyncio
async def test_cross_vendor_bundle_resolution_and_proportional_discount(db_session):
    """Verify cross-vendor bundle resolution, proportional line discount, and zero residual leakage."""

    # 1. Taxonomy
    cat = Category(id=uuid.uuid4(), name="Clinic Packages", slug="clinic-pkg")
    db_session.add(cat)

    # 2. Product 1: BP Monitor (Single Variant)
    p1 = Product(id=uuid.uuid4(), category_id=cat.id, name="Digital BP Monitor", slug="digital-bp-mon", status="published")
    v1 = ProductVariant(id=uuid.uuid4(), product_id=p1.id, name="Standard Unit", variant_slug="standard", is_active=True)
    db_session.add_all([p1, v1])

    # 3. Product 2: Pulse Oximeter (Single Variant)
    p2 = Product(id=uuid.uuid4(), category_id=cat.id, name="Fingertip Pulse Oximeter", slug="fingertip-oximeter", status="published")
    v2 = ProductVariant(id=uuid.uuid4(), product_id=p2.id, name="Standard Unit", variant_slug="standard", is_active=True)
    db_session.add_all([p2, v2])

    # 4. Product 3: Infrared Thermometer (Single Variant)
    p3 = Product(id=uuid.uuid4(), category_id=cat.id, name="Infrared Thermometer", slug="infrared-thermometer", status="published")
    v3 = ProductVariant(id=uuid.uuid4(), product_id=p3.id, name="Standard Unit", variant_slug="standard", is_active=True)
    db_session.add_all([p3, v3])
    await db_session.flush()

    # 5. Two Vendors
    u_a = User(id=uuid.uuid4(), email="vendor_a_bundle@test.com", password_hash="h", role="vendor", is_active=True)
    u_b = User(id=uuid.uuid4(), email="vendor_b_bundle@test.com", password_hash="h", role="vendor", is_active=True)
    db_session.add_all([u_a, u_b])
    await db_session.flush()

    v_prof_a = VendorProfile(id=uuid.uuid4(), user_id=u_a.id, store_name="Vendor A Health", approval_status="approved")
    v_prof_b = VendorProfile(id=uuid.uuid4(), user_id=u_b.id, store_name="Vendor B Supplies", approval_status="approved")
    db_session.add_all([v_prof_a, v_prof_b])
    await db_session.flush()

    # Vendor A sells BP Monitor @ KES 3,000 (Customer: 3,210) & Thermometer @ KES 1,500 (Customer: 1,605)
    off_1a = VendorOffer(id=uuid.uuid4(), vendor_id=v_prof_a.id, product_variant_id=v1.id, vendor_price=Decimal("3000.00"), status=OfferStatusEnum.ACTIVE)
    inv_1a = OfferInventory(id=uuid.uuid4(), vendor_offer_id=off_1a.id, quantity_on_hand=10, quantity_reserved=0)

    off_3a = VendorOffer(id=uuid.uuid4(), vendor_id=v_prof_a.id, product_variant_id=v3.id, vendor_price=Decimal("1500.00"), status=OfferStatusEnum.ACTIVE)
    inv_3a = OfferInventory(id=uuid.uuid4(), vendor_offer_id=off_3a.id, quantity_on_hand=15, quantity_reserved=0)

    # Vendor B sells Pulse Oximeter @ KES 2,000 (Customer: 2,140)
    off_2b = VendorOffer(id=uuid.uuid4(), vendor_id=v_prof_b.id, product_variant_id=v2.id, vendor_price=Decimal("2000.00"), status=OfferStatusEnum.ACTIVE)
    inv_2b = OfferInventory(id=uuid.uuid4(), vendor_offer_id=off_2b.id, quantity_on_hand=8, quantity_reserved=0)

    db_session.add_all([off_1a, inv_1a, off_3a, inv_3a, off_2b, inv_2b])

    # 6. Create Merchandising Bundle: "Vital Signs Starter Package"
    # Discount: KES 500 Fixed Discount
    bundle = Bundle(
        id=uuid.uuid4(),
        name="Vital Signs Starter Package",
        slug="vital-signs-starter-pkg",
        discount_type=BundleDiscountType.FIXED_AMOUNT,
        discount_value=Decimal("500.00"),
        funding_source="PLATFORM",
        is_active=True,
    )
    db_session.add(bundle)
    await db_session.flush()

    bc1 = BundleComponent(id=uuid.uuid4(), bundle_id=bundle.id, product_id=p1.id, quantity=1, sort_order=1)
    bc2 = BundleComponent(id=uuid.uuid4(), bundle_id=bundle.id, product_id=p2.id, quantity=1, sort_order=2)
    bc3 = BundleComponent(id=uuid.uuid4(), bundle_id=bundle.id, product_id=p3.id, quantity=1, sort_order=3)
    db_session.add_all([bc1, bc2, bc3])
    await db_session.commit()

    # 7. Resolve Bundle
    resolved = await bundle_service.resolve_bundle(db_session, bundle.id, bundle_quantity=1)
    assert resolved.is_available is True
    # Gross sum: 3,210 + 2,140 + 1,605 = 6,955.00
    assert resolved.gross_customer_price == Decimal("6955.00")
    assert resolved.discount_amount == Decimal("500.00")
    assert resolved.net_customer_price == Decimal("6455.00")
    assert len(resolved.participating_vendor_ids) == 2  # Multi-vendor bundle!

    # Verify proportional line discount allocation matches exact sum
    total_allocated_discount = sum(c.allocated_line_discount for c in resolved.components)
    assert total_allocated_discount == Decimal("500.00")
    total_net_line_sum = sum(c.net_line_customer_price for c in resolved.components)
    assert total_net_line_sum == Decimal("6455.00")


@pytest.mark.asyncio
async def test_bundle_rejects_multi_variant_product(db_session):
    """Verify V1 rule: A bundle component Product with multiple variants is strictly rejected."""

    cat = Category(id=uuid.uuid4(), name="Diagnostic", slug="diag-bundle-reject")
    db_session.add(cat)

    p_multi = Product(id=uuid.uuid4(), category_id=cat.id, name="Examination Bed", slug="exam-bed", status="published")
    v_1 = ProductVariant(id=uuid.uuid4(), product_id=p_multi.id, name="2 Folds Manual", variant_slug="2-folds", is_active=True)
    v_2 = ProductVariant(id=uuid.uuid4(), product_id=p_multi.id, name="5 Folds Electric", variant_slug="5-folds", is_active=True)
    db_session.add_all([p_multi, v_1, v_2])
    await db_session.flush()

    bundle = Bundle(
        id=uuid.uuid4(),
        name="Invalid Multi-Variant Bundle",
        slug="invalid-mv-bundle",
        is_active=True,
    )
    db_session.add(bundle)
    await db_session.flush()

    bc = BundleComponent(id=uuid.uuid4(), bundle_id=bundle.id, product_id=p_multi.id, quantity=1)
    db_session.add(bc)
    await db_session.commit()

    with pytest.raises(BundleIneligibleException) as exc_info:
        await bundle_service.resolve_bundle(db_session, bundle.id)
    assert "multiple variants" in str(exc_info.value).lower()
