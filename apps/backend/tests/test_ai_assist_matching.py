import uuid
import pytest

from app.domains.catalog.models.manufacturer import Manufacturer
from app.domains.catalog.models.product import Product
from app.domains.catalog.models.product_variant import ProductVariant
from app.domains.catalog.services.ai_assist_service import ai_assist_service


@pytest.mark.asyncio
async def test_deterministic_barcode_match(db_session):
    """Verify exact GTIN/EAN barcode match returns auto_merge_eligible = True."""
    
    prod = Product(
        id=uuid.uuid4(),
        name="Digital Thermometer Pro",
        slug="digital-thermometer-pro",
        status="published",
    )
    db_session.add(prod)
    await db_session.flush()

    variant = ProductVariant(
        id=uuid.uuid4(),
        product_id=prod.id,
        name="Standard",
        gtin_or_ean="8901234567890",
        is_active=True,
    )
    db_session.add(variant)
    await db_session.commit()

    # Vendor submits item with same barcode
    res = await ai_assist_service.match_submitted_product(
        db_session,
        product_name="Digital Thermometer Medical Grade",
        gtin_or_ean="8901234567890",
    )
    assert res.is_match_found is True
    assert res.auto_merge_eligible is True
    assert res.matched_product_id == prod.id
    assert res.matched_variant_id == variant.id
    assert res.match_type == "EXACT_BARCODE"


@pytest.mark.asyncio
async def test_deterministic_manufacturer_model_match(db_session):
    """Verify exact Manufacturer + Model match returns auto_merge_eligible = True."""
    
    mfg = Manufacturer(id=uuid.uuid4(), name="Philips Healthcare", slug="philips-health")
    db_session.add(mfg)
    await db_session.flush()

    prod = Product(
        id=uuid.uuid4(),
        manufacturer_id=mfg.id,
        manufacturer_model_number="Efficia DFM100",
        name="Philips Defibrillator",
        slug="philips-defibrillator",
        status="published",
    )
    v = ProductVariant(id=uuid.uuid4(), product_id=prod.id, name="Default", is_active=True)
    db_session.add_all([prod, v])
    await db_session.commit()

    # Vendor submits item with same manufacturer and model number (case insensitive)
    res = await ai_assist_service.match_submitted_product(
        db_session,
        product_name="Defibrillator Machine",
        manufacturer_id=mfg.id,
        manufacturer_model_number="efficia dfm100",
    )
    assert res.is_match_found is True
    assert res.auto_merge_eligible is True
    assert res.matched_product_id == prod.id
    assert res.match_type == "EXACT_MODEL_NUMBER"


@pytest.mark.asyncio
async def test_fuzzy_match_requires_admin_review(db_session):
    """Verify fuzzy/semantic match NEVER auto-merges and routes to admin moderation."""
    
    prod = Product(
        id=uuid.uuid4(),
        name="Stethoscope Cardiology IV",
        slug="stethoscope-cardiology-iv",
        status="published",
    )
    db_session.add(prod)
    await db_session.commit()

    # Vendor submits item with similar title but no barcode or model match
    res = await ai_assist_service.match_submitted_product(
        db_session,
        product_name="Cardiology IV",
        gtin_or_ean=None,
    )
    assert res.is_match_found is False
    assert res.auto_merge_eligible is False  # Prohibited from auto-merging
    assert res.requires_admin_review is True  # Routed to admin queue
    assert res.match_type == "FUZZY_CANDIDATE"
    assert len(res.candidate_products) > 0
