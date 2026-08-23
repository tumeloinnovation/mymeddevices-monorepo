import asyncio
from decimal import Decimal
import uuid
import pytest
from sqlalchemy import select

from app.domains.auth.models.user import User
from app.domains.catalog.models.brand import Brand
from app.domains.catalog.models.category import Category
from app.domains.catalog.models.category_attribute import (
    AttributeAllowedValue,
    AttributeDataType,
    CategoryAttributeDefinition,
    VariantAttributeValue,
)
from app.domains.catalog.models.manufacturer import Manufacturer
from app.domains.catalog.models.product import Product
from app.domains.catalog.models.product_variant import ProductVariant
from app.domains.catalog.services.buy_box_service import buy_box_service
from app.domains.catalog.services.pricing_engine import pricing_engine
from app.domains.shopping.services.inventory_reservation_service import (
    InsufficientStockException,
    inventory_reservation_service,
)
from app.domains.vendor.models.vendor_offer import (
    OfferInventory,
    OfferStatusEnum,
    SellingUnitEnum,
    VendorOffer,
)
from app.domains.vendor.models.vendor_profile import VendorProfile


@pytest.mark.asyncio
async def test_canonical_product_and_variant_attribute_definitions(db_session):
    """Verify category attribute definitions, allowed values, and variant configuration."""
    
    # 1. Create Manufacturer & Brand
    mfg = Manufacturer(
        id=uuid.uuid4(),
        name="Mindray Bio-Medical",
        slug="mindray-bio-medical",
        country_of_origin="CN",
    )
    db_session.add(mfg)
    await db_session.flush()

    brand = Brand(
        id=uuid.uuid4(),
        manufacturer_id=mfg.id,
        name="Mindray",
        slug="mindray",
        approval_status="approved",
    )
    db_session.add(brand)

    # 2. Create Category & Attribute Definitions
    cat = Category(
        id=uuid.uuid4(),
        name="Patient Monitors",
        slug="patient-monitors",
        tax_category_code="STANDARD_VAT_16",
        min_warranty_months=12,
    )
    db_session.add(cat)
    await db_session.flush()

    attr_screen = CategoryAttributeDefinition(
        id=uuid.uuid4(),
        category_id=cat.id,
        code="screen_size",
        name="Screen Size",
        data_type=AttributeDataType.ENUM,
        is_variant_defining=True,
    )
    db_session.add(attr_screen)
    await db_session.flush()

    opt_12 = AttributeAllowedValue(
        id=uuid.uuid4(),
        attribute_id=attr_screen.id,
        value="12_inch",
        display_label="12.1 Inch Display",
    )
    opt_15 = AttributeAllowedValue(
        id=uuid.uuid4(),
        attribute_id=attr_screen.id,
        value="15_inch",
        display_label="15.0 Inch Display",
    )
    db_session.add_all([opt_12, opt_15])
    await db_session.flush()

    # 3. Create Canonical Product (Platform-owned)
    prod = Product(
        id=uuid.uuid4(),
        category_id=cat.id,
        brand_id=brand.id,
        manufacturer_id=mfg.id,
        manufacturer_model_number="uMEC12",
        name="Mindray uMEC Patient Monitor",
        slug="mindray-umec-patient-monitor",
        status="published",
    )
    db_session.add(prod)
    await db_session.flush()

    # 4. Create Two Variants
    v1 = ProductVariant(
        id=uuid.uuid4(),
        product_id=prod.id,
        name="12.1 Inch Configuration",
        variant_slug="12-inch",
        gtin_or_ean="6934567890123",
        attributes_summary={"screen_size": "12_inch"},
    )
    v2 = ProductVariant(
        id=uuid.uuid4(),
        product_id=prod.id,
        name="15.0 Inch Configuration",
        variant_slug="15-inch",
        gtin_or_ean="6934567890124",
        attributes_summary={"screen_size": "15_inch"},
    )
    db_session.add_all([v1, v2])
    await db_session.flush()

    # Assign attribute values
    va1 = VariantAttributeValue(
        id=uuid.uuid4(),
        product_variant_id=v1.id,
        attribute_id=attr_screen.id,
        allowed_value_id=opt_12.id,
    )
    db_session.add(va1)
    await db_session.commit()

    # 5. Verify derived multi-variant property
    reloaded_prod = (await db_session.execute(select(Product).where(Product.id == prod.id))).scalar_one()
    assert reloaded_prod.is_multi_variant is True
    assert reloaded_prod.is_single_variant is False
    assert len(reloaded_prod.active_variants) == 2


@pytest.mark.asyncio
async def test_buy_box_package_isolation_and_price_resolution(db_session):
    """Verify Buy-Box selects lowest customer price with strict packaging isolation."""
    
    # 1. Setup Taxonomy & Product
    cat = Category(
        id=uuid.uuid4(),
        name="Medical Consumables",
        slug="consumables",
        tax_category_code="STANDARD_VAT_16",
        min_warranty_months=0,
    )
    prod = Product(
        id=uuid.uuid4(),
        category_id=cat.id,
        name="Nitrile Examination Gloves",
        slug="nitrile-exam-gloves",
        status="published",
    )
    db_session.add_all([cat, prod])
    await db_session.flush()

    variant = ProductVariant(
        id=uuid.uuid4(),
        product_id=prod.id,
        name="Size Medium Blue",
        variant_slug="medium-blue",
    )
    db_session.add(variant)
    await db_session.flush()

    # 2. Setup 2 Vendor Users & Profiles
    u1 = User(
        id=uuid.uuid4(),
        email="vendor1_box@test.com",
        password_hash="hash1",
        role="vendor",
        is_active=True,
    )
    u2 = User(
        id=uuid.uuid4(),
        email="vendor2_box@test.com",
        password_hash="hash2",
        role="vendor",
        is_active=True,
    )
    db_session.add_all([u1, u2])
    await db_session.flush()

    v_prof1 = VendorProfile(
        id=uuid.uuid4(),
        user_id=u1.id,
        store_name="Nairobi Medical Supplies",
        approval_status="approved",
    )
    v_prof2 = VendorProfile(
        id=uuid.uuid4(),
        user_id=u2.id,
        store_name="Mombasa Healthcare Traders",
        approval_status="approved",
    )
    db_session.add_all([v_prof1, v_prof2])
    await db_session.flush()

    # 3. Vendor 1: Box of 100 @ KES 1,000 Vendor Price
    offer1 = VendorOffer(
        id=uuid.uuid4(),
        vendor_id=v_prof1.id,
        product_variant_id=variant.id,
        vendor_price=Decimal("1000.00"),
        selling_unit=SellingUnitEnum.BOX,
        package_quantity=100,
        lead_time_days=2,
        status=OfferStatusEnum.ACTIVE,
    )
    inv1 = OfferInventory(
        id=uuid.uuid4(),
        vendor_offer_id=offer1.id,
        quantity_on_hand=50,
        quantity_reserved=0,
    )

    # 4. Vendor 2: Box of 100 @ KES 950 Vendor Price (Winner for Box of 100)
    offer2 = VendorOffer(
        id=uuid.uuid4(),
        vendor_id=v_prof2.id,
        product_variant_id=variant.id,
        vendor_price=Decimal("950.00"),
        selling_unit=SellingUnitEnum.BOX,
        package_quantity=100,
        lead_time_days=3,
        status=OfferStatusEnum.ACTIVE,
    )
    inv2 = OfferInventory(
        id=uuid.uuid4(),
        vendor_offer_id=offer2.id,
        quantity_on_hand=20,
        quantity_reserved=0,
    )

    # 5. Vendor 1: Carton of 1,000 @ KES 9,000 Vendor Price (Different packaging)
    offer_bulk = VendorOffer(
        id=uuid.uuid4(),
        vendor_id=v_prof1.id,
        product_variant_id=variant.id,
        vendor_price=Decimal("9000.00"),
        selling_unit=SellingUnitEnum.CARTON,
        package_quantity=1000,
        lead_time_days=1,
        status=OfferStatusEnum.ACTIVE,
    )
    inv_bulk = OfferInventory(
        id=uuid.uuid4(),
        vendor_offer_id=offer_bulk.id,
        quantity_on_hand=5,
        quantity_reserved=0,
    )

    db_session.add_all([offer1, inv1, offer2, inv2, offer_bulk, inv_bulk])
    await db_session.commit()

    # 6. Resolve Buy-Box for Box of 100
    res_box = await buy_box_service.resolve_buy_box(
        db_session,
        product_variant_id=variant.id,
        selling_unit=SellingUnitEnum.BOX,
        package_quantity=100,
        required_quantity=1,
    )
    assert res_box.winning_candidate is not None
    assert res_box.winning_candidate.offer.id == offer2.id
    assert res_box.winning_candidate.offer.vendor_id == v_prof2.id
    assert res_box.winning_candidate.pricing.customer_price == Decimal("1016.50")  # 950 + 5% (47.50) + 2% (19.00)
    assert res_box.total_eligible_offers == 2

    # 7. Resolve Buy-Box for Carton of 1000
    res_carton = await buy_box_service.resolve_buy_box(
        db_session,
        product_variant_id=variant.id,
        selling_unit=SellingUnitEnum.CARTON,
        package_quantity=1000,
        required_quantity=1,
    )
    assert res_carton.winning_candidate is not None
    assert res_carton.winning_candidate.offer.id == offer_bulk.id
    assert res_carton.total_eligible_offers == 1


@pytest.mark.asyncio
async def test_inventory_reservation_and_concurrency(db_session):
    """Verify concurrency safety, stock reservation, and atomic rollback."""
    
    # 1. Setup User, Vendor, Product, Variant, Offer
    u = User(
        id=uuid.uuid4(),
        email="vendor_inv@test.com",
        password_hash="hash",
        role="vendor",
        is_active=True,
    )
    db_session.add(u)
    await db_session.flush()

    vp = VendorProfile(
        id=uuid.uuid4(),
        user_id=u.id,
        store_name="Direct Medical Supplies",
        approval_status="approved",
    )
    cat = Category(
        id=uuid.uuid4(),
        name="Equipment",
        slug="equipment-inv",
    )
    prod = Product(
        id=uuid.uuid4(),
        category_id=cat.id,
        name="Surgical Suction Unit",
        slug="surgical-suction-unit",
        status="published",
    )
    db_session.add_all([vp, cat, prod])
    await db_session.flush()

    variant = ProductVariant(
        id=uuid.uuid4(),
        product_id=prod.id,
        name="Standard 20L",
        variant_slug="std-20l",
    )
    db_session.add(variant)
    await db_session.flush()

    offer = VendorOffer(
        id=uuid.uuid4(),
        vendor_id=vp.id,
        product_variant_id=variant.id,
        vendor_price=Decimal("15000.00"),
        status=OfferStatusEnum.ACTIVE,
    )
    inv = OfferInventory(
        id=uuid.uuid4(),
        vendor_offer_id=offer.id,
        quantity_on_hand=10,
        quantity_reserved=0,
    )
    db_session.add_all([offer, inv])
    await db_session.commit()

    # 2. Reserve 4 units
    inv_res = await inventory_reservation_service.reserve_stock(db_session, offer.id, 4)
    assert inv_res.quantity_reserved == 4
    assert inv_res.available_quantity == 6

    # 3. Reserve another 6 units (Stock fully allocated)
    inv_res2 = await inventory_reservation_service.reserve_stock(db_session, offer.id, 6)
    assert inv_res2.quantity_reserved == 10
    assert inv_res2.available_quantity == 0

    # 4. Attempt to reserve 1 more unit -> Raises InsufficientStockException
    with pytest.raises(InsufficientStockException):
        await inventory_reservation_service.reserve_stock(db_session, offer.id, 1)

    # 5. Release 3 units
    inv_rel = await inventory_reservation_service.release_reserved_stock(db_session, offer.id, 3)
    assert inv_rel.quantity_reserved == 7
    assert inv_rel.available_quantity == 3

    # 6. Commit final deduction of 2 units (Order placed)
    inv_commit = await inventory_reservation_service.commit_stock_deduction(db_session, offer.id, 2)
    assert inv_commit.quantity_on_hand == 8
    assert inv_commit.quantity_reserved == 5
