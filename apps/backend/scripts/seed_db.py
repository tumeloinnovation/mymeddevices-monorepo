import asyncio
import sys
from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.domains.auth.models.user import User
from app.domains.catalog.models.brand import Brand
from app.domains.catalog.models.bundle import Bundle, BundleComponent, BundleDiscountType
from app.domains.catalog.models.bundle_item import BundleItem
from app.domains.catalog.models.category import Category
from app.domains.catalog.models.manufacturer import Manufacturer
from app.domains.catalog.models.product import Product
from app.domains.catalog.models.product_image import ProductImage
from app.domains.catalog.models.product_variant import ProductVariant
from app.domains.catalog.models.related_product import RelatedProduct
from app.domains.logistics.models.driver_profile import DriverProfile, DriverStatus
from app.domains.shopping.models.banner import Banner
from app.domains.shopping.models.coupon import Coupon, CouponRestriction
from app.domains.vendor.models.vendor_offer import (
    OfferInventory,
    OfferStatusEnum,
    SellingUnitEnum,
    VendorOffer,
)
from app.domains.vendor.models.vendor_profile import VendorProfile

DEFAULT_PRODUCT_IMAGE = "https://postimg.cc/gwJmkhgk"


async def seed_users_and_vendors(db):
    users_to_create = [
        {
            "email": "admin@mymeddevices.com",
            "password": "password123",
            "role": "admin",
            "first_name": "System",
            "last_name": "Admin",
            "is_active": True,
            "is_verified": True,
        },
        {
            "email": "vendor@mymeddevices.com",
            "password": "password123",
            "role": "vendor",
            "first_name": "Medical",
            "last_name": "Vendor",
            "company_name": "Global Med Supply Co.",
            "phone": "+254712345678",
            "is_active": True,
            "is_verified": True,
        },
        {
            "email": "customer@mymeddevices.com",
            "password": "password123",
            "role": "customer",
            "first_name": "Jane",
            "last_name": "Doe",
            "phone": "+254722222222",
            "is_active": True,
            "is_verified": True,
        },
        {
            "email": "driver@mymeddevices.com",
            "password": "password123",
            "role": "driver",
            "first_name": "Dennis",
            "last_name": "Kiprono",
            "phone": "+254700000001",
            "is_active": True,
            "is_verified": True,
        },
    ]

    primary_vendor_profile = None

    for u_data in users_to_create:
        result = await db.execute(select(User).where(User.email == u_data["email"]))
        user = result.scalar_one_or_none()

        if not user:
            print(f"Creating user: {u_data['email']}")
            user = User(
                email=u_data["email"],
                password_hash=get_password_hash(u_data["password"]),
                role=u_data["role"],
                first_name=u_data["first_name"],
                last_name=u_data["last_name"],
                phone=u_data.get("phone"),
                company_name=u_data.get("company_name"),
                is_active=u_data["is_active"],
                is_verified=u_data["is_verified"],
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        if u_data["role"] == "vendor":
            prof_result = await db.execute(select(VendorProfile).where(VendorProfile.user_id == user.id))
            vendor_profile = prof_result.scalar_one_or_none()
            if not vendor_profile:
                print(f"Creating approved vendor profile for user: {user.email}")
                vendor_profile = VendorProfile(
                    user_id=user.id,
                    store_name=u_data.get("company_name", "Global Med Supply Co."),
                    company_name=u_data.get("company_name", "Global Med Supply Co."),
                    business_email=u_data["email"],
                    business_phone=u_data.get("phone"),
                    approval_status="approved",
                    approved_at=datetime.now(UTC),
                )
                db.add(vendor_profile)
                await db.commit()
                await db.refresh(vendor_profile)
            primary_vendor_profile = vendor_profile
        elif u_data["role"] == "driver":
            driver_prof_result = await db.execute(
                select(DriverProfile).where(DriverProfile.user_id == user.id)
            )
            driver_prof = driver_prof_result.scalar_one_or_none()
            if not driver_prof:
                print(f"Creating driver profile for user: {user.email}")
                driver_prof = DriverProfile(
                    user_id=user.id,
                    status=DriverStatus.AVAILABLE.value,
                    vehicle_type="motorcycle",
                    vehicle_plate="KMD 450X",
                    vehicle_color="Blue / Black",
                    max_concurrent_deliveries=3,
                    verified_vehicle=True,
                )
                db.add(driver_prof)
                await db.commit()

    return primary_vendor_profile


async def seed_marketing_and_coupons(db):
    coupons_to_seed = [
        {
            "code": "MEDWELCOME",
            "description": "10% off your first medical supply order",
            "coupon_type": "percentage",
            "discount_value": Decimal("10.00"),
            "discount_scope": "cart",
            "is_active": True,
            "is_stackable": False,
            "valid_from": datetime.now(UTC),
            "distribution_type": "public",
            "min_order_value": Decimal("1000.00"),
        },
        {
            "code": "SAVE5000",
            "description": "KES 5,000 flat discount on purchases over KES 20,000",
            "coupon_type": "fixed_amount",
            "discount_value": Decimal("5000.00"),
            "discount_scope": "cart",
            "is_active": True,
            "is_stackable": False,
            "valid_from": datetime.now(UTC),
            "distribution_type": "public",
            "min_order_value": Decimal("20000.00"),
        },
        {
            "code": "HEALTH2026",
            "description": "15% off hospital equipment and diagnostic devices",
            "coupon_type": "percentage",
            "discount_value": Decimal("15.00"),
            "discount_scope": "cart",
            "is_active": True,
            "is_stackable": False,
            "valid_from": datetime.now(UTC),
            "distribution_type": "public",
            "min_order_value": Decimal("5000.00"),
        },
    ]

    for c_data in coupons_to_seed:
        min_val = c_data.pop("min_order_value", None)
        res = await db.execute(select(Coupon).where(Coupon.code == c_data["code"]))
        existing_c = res.scalar_one_or_none()
        if not existing_c:
            print(f"Creating coupon: {c_data['code']}")
            coupon = Coupon(**c_data)
            db.add(coupon)
            await db.commit()
            await db.refresh(coupon)
            if min_val:
                restr = CouponRestriction(coupon_id=coupon.id, min_order_value=min_val)
                db.add(restr)
                await db.commit()

    banners_to_seed = [
        {
            "title": "⚡ Free Delivery on orders over KES 50,000 across Kenya!",
            "placement": "HEADER_BAR",
            "status": "ACTIVE",
            "background_color": "#0284c7",
            "text_color": "#ffffff",
            "priority": 10,
            "is_dismissible": True,
            "show_close_button": True,
        },
        {
            "title": "Certified Home-Based Medical Equipment & Health Monitors",
            "description": "Directly from verified manufacturers with full regulatory approval (KMPDB & PPB certified)",
            "cta_text": "Browse Home Devices",
            "cta_link": "/products",
            "cta_target": "_self",
            "placement": "HOMEPAGE_HERO",
            "status": "ACTIVE",
            "background_color": "#0f172a",
            "text_color": "#38bdf8",
            "priority": 10,
            "is_dismissible": False,
            "show_close_button": False,
        },
    ]

    for b_data in banners_to_seed:
        res = await db.execute(select(Banner).where(Banner.title == b_data["title"]))
        if not res.scalar_one_or_none():
            db.add(Banner(**b_data))
            await db.commit()


async def cleanup_legacy_data(db, allowed_category_slugs: set[str], allowed_product_slugs: set[str]):
    """Remove any categories, legacy products, or orphan records not in the allowed home-based device catalog."""
    from app.domains.catalog.models.bundle import BundleComponent
    from app.domains.catalog.models.product_image import ProductImage
    from app.domains.catalog.models.product_variant import ProductVariant
    from app.domains.catalog.models.related_product import RelatedProduct
    from app.domains.catalog.models.stock_log import StockLog
    from app.domains.catalog.models.tag import product_tags
    from app.domains.customers.models.review import Review
    from app.domains.customers.models.wishlist import WishlistItem
    from app.domains.shopping.models.cart import CartItem
    from app.domains.shopping.models.order import OrderItem
    from app.domains.shopping.models.saved_cart import SavedCartItem
    from app.domains.vendor.models.vendor_offer import OfferInventory, VendorOffer

    # 1. Find legacy products
    prod_stmt = select(Product).where(~Product.slug.in_(allowed_product_slugs))
    legacy_products = (await db.execute(prod_stmt)).scalars().all()
    legacy_prod_ids = [p.id for p in legacy_products]

    if legacy_prod_ids:
        print(f"Cleaning up {len(legacy_prod_ids)} legacy/unapproved products...")
        # Get variants
        var_stmt = select(ProductVariant).where(ProductVariant.product_id.in_(legacy_prod_ids))
        variants = (await db.execute(var_stmt)).scalars().all()
        var_ids = [v.id for v in variants]

        if var_ids:
            # Delete Vendor Offers & Inventories
            offers = (await db.execute(select(VendorOffer).where(VendorOffer.product_variant_id.in_(var_ids)))).scalars().all()
            offer_ids = [o.id for o in offers]
            if offer_ids:
                for inv in (await db.execute(select(OfferInventory).where(OfferInventory.vendor_offer_id.in_(offer_ids)))).scalars().all():
                    await db.delete(inv)
                for offer in offers:
                    await db.delete(offer)

            # Delete CartItems
            for ci in (await db.execute(select(CartItem).where((CartItem.product_variant_id.in_(var_ids)) | (CartItem.product_id.in_(legacy_prod_ids))))).scalars().all():
                await db.delete(ci)

            # Delete OrderItems
            for oi in (await db.execute(select(OrderItem).where((OrderItem.product_variant_id.in_(var_ids)) | (OrderItem.product_id.in_(legacy_prod_ids))))).scalars().all():
                await db.delete(oi)

            # Delete Variants
            for v in variants:
                await db.delete(v)

        # Delete any remaining CartItems & OrderItems by product_id
        for ci in (await db.execute(select(CartItem).where(CartItem.product_id.in_(legacy_prod_ids)))).scalars().all():
            await db.delete(ci)
        for oi in (await db.execute(select(OrderItem).where(OrderItem.product_id.in_(legacy_prod_ids)))).scalars().all():
            await db.delete(oi)

        # Delete StockLogs
        for sl in (await db.execute(select(StockLog).where(StockLog.product_id.in_(legacy_prod_ids)))).scalars().all():
            await db.delete(sl)

        # Delete SavedCartItems
        for sci in (await db.execute(select(SavedCartItem).where(SavedCartItem.product_id.in_(legacy_prod_ids)))).scalars().all():
            await db.delete(sci)

        # Delete Reviews
        for rev in (await db.execute(select(Review).where(Review.product_id.in_(legacy_prod_ids)))).scalars().all():
            await db.delete(rev)

        # Delete WishlistItems
        for wi in (await db.execute(select(WishlistItem).where(WishlistItem.product_id.in_(legacy_prod_ids)))).scalars().all():
            await db.delete(wi)

        # Delete BundleItems & BundleComponents
        for bi in (await db.execute(select(BundleItem).where(
            (BundleItem.bundle_product_id.in_(legacy_prod_ids)) | (BundleItem.component_product_id.in_(legacy_prod_ids))
        ))).scalars().all():
            await db.delete(bi)
        for bc in (await db.execute(select(BundleComponent).where(BundleComponent.product_id.in_(legacy_prod_ids)))).scalars().all():
            await db.delete(bc)

        # Delete RelatedProducts
        for rp in (await db.execute(select(RelatedProduct).where(
            (RelatedProduct.product_id.in_(legacy_prod_ids)) | (RelatedProduct.related_product_id.in_(legacy_prod_ids))
        ))).scalars().all():
            await db.delete(rp)

        # Delete ProductTags
        await db.execute(product_tags.delete().where(product_tags.c.product_id.in_(legacy_prod_ids)))

        # Delete ProductImages
        for pi in (await db.execute(select(ProductImage).where(ProductImage.product_id.in_(legacy_prod_ids)))).scalars().all():
            await db.delete(pi)

        # Delete Products
        for p in legacy_products:
            await db.delete(p)

        await db.commit()

    # 2. Delete legacy categories not in allowed list
    cat_stmt = select(Category).where(~Category.slug.in_(allowed_category_slugs))
    legacy_cats = (await db.execute(cat_stmt)).scalars().all()
    if legacy_cats:
        print(f"Removing {len(legacy_cats)} unapproved categories from database...")
        # First unlink any remaining products
        for cat in legacy_cats:
            await db.execute(
                select(Product).where(Product.category_id == cat.id)
            )
        # Delete subcategories first (parent_id is not null)
        subcats = [c for c in legacy_cats if c.parent_id is not None]
        for sc in subcats:
            await db.delete(sc)
        await db.commit()

        # Delete parent categories
        parents = [c for c in legacy_cats if c.parent_id is None]
        for pc in parents:
            await db.delete(pc)
        await db.commit()


async def seed_categories(db):
    categories_tree = [
        {
            "name": "Diagnostic Devices",
            "slug": "diagnostic-devices",
            "description": "Essential diagnostic and vital sign monitoring equipment for home health tracking.",
            "icon_url": "stethoscope",
            "sort_order": 1,
            "children": [
                {"name": "Digital Thermometers", "slug": "digital-thermometers", "description": "Accurate digital body temperature thermometers.", "icon_url": "thermometer", "sort_order": 1},
                {"name": "Blood Pressure Monitors", "slug": "blood-pressure-monitors", "description": "Digital upper-arm and wrist blood pressure monitors.", "icon_url": "activity", "sort_order": 2},
                {"name": "Blood Glucose Meters", "slug": "blood-glucose-meters", "description": "Glucometers, test strips, and lancets for diabetes monitoring.", "icon_url": "droplet", "sort_order": 3},
                {"name": "Pulse Oximeters", "slug": "pulse-oximeters", "description": "Fingertip oxygen saturation (SpO2) and pulse rate monitors.", "icon_url": "heart-pulse", "sort_order": 4},
                {"name": "Cholesterol Test Kits", "slug": "cholesterol-test-kits", "description": "Home lipid and cholesterol screening test kits.", "icon_url": "test-tube", "sort_order": 5},
                {"name": "Digital Weighing Scales", "slug": "digital-weighing-scales", "description": "High-precision digital body weight and health scales.", "icon_url": "scale", "sort_order": 6},
            ],
        },
        {
            "name": "Respiratory Care Devices",
            "slug": "respiratory-care-devices",
            "description": "Equipment and solutions for breathing support and pulmonary therapy.",
            "icon_url": "wind",
            "sort_order": 2,
            "children": [
                {"name": "Nebulizers", "slug": "nebulizers", "description": "Compressor and mesh nebulizers for respiratory therapy.", "icon_url": "wind", "sort_order": 1},
                {"name": "CPAP/BiPAP Machines", "slug": "cpap-bipap-machines", "description": "Continuous positive airway pressure devices for sleep apnea.", "icon_url": "lungs", "sort_order": 2},
                {"name": "Portable Oxygen Concentrators", "slug": "portable-oxygen-concentrators", "description": "Continuous and pulse-flow portable oxygen machines.", "icon_url": "gauge", "sort_order": 3},
                {"name": "Steam Inhalers", "slug": "steam-inhalers", "description": "Personal warm mist facial and steam inhalers.", "icon_url": "flame", "sort_order": 4},
            ],
        },
        {
            "name": "Mobility & Rehabilitation Aids",
            "slug": "mobility-rehabilitation-aids",
            "description": "Assistive devices for mobility, physical therapy, and daily independence.",
            "icon_url": "accessibility",
            "sort_order": 3,
            "children": [
                {"name": "Wheelchairs (Manual/Electric)", "slug": "wheelchairs", "description": "Ergonomic manual and motorized electric wheelchairs.", "icon_url": "accessibility", "sort_order": 1},
                {"name": "Walkers and Crutches", "slug": "walkers-and-crutches", "description": "Rollators, walking frames, quad canes, and axillary crutches.", "icon_url": "footprints", "sort_order": 2},
                {"name": "Knee Braces and Wrist Supports", "slug": "knee-braces-wrist-supports", "description": "Orthopedic joint braces, stabilizers, and compression sleeves.", "icon_url": "shield-check", "sort_order": 3},
                {"name": "Hot/Cold Therapy Packs", "slug": "hot-cold-therapy-packs", "description": "Reusable gel hot and cold packs for pain and inflammation.", "icon_url": "snowflake", "sort_order": 4},
                {"name": "TENS Machines (for Pain Relief)", "slug": "tens-machines", "description": "Transcutaneous electrical nerve stimulators for targeted pain relief.", "icon_url": "zap", "sort_order": 5},
            ],
        },
        {
            "name": "Personal Health & Wellness Devices",
            "slug": "personal-health-wellness",
            "description": "Connected smart devices for active wellness, tracking, and fitness metrics.",
            "icon_url": "heart",
            "sort_order": 4,
            "children": [
                {"name": "Smart Fitness Bands / Heart Rate Monitors", "slug": "smart-fitness-bands-hr-monitors", "description": "Wearable activity trackers and continuous heart rate sensors.", "icon_url": "watch", "sort_order": 1},
                {"name": "Body Composition Analyzers", "slug": "body-composition-analyzers", "description": "Bioimpedance scales measuring BMI, body fat, and muscle mass.", "icon_url": "pie-chart", "sort_order": 2},
                {"name": "Infrared Thermometers", "slug": "infrared-thermometers", "description": "No-touch forehead and surface infrared thermometers.", "icon_url": "scan", "sort_order": 3},
                {"name": "Sleep Trackers", "slug": "sleep-trackers", "description": "Smart sleep monitoring sensors and bedside monitors.", "icon_url": "moon", "sort_order": 4},
            ],
        },
        {
            "name": "Home Care & Patient Support",
            "slug": "home-care-patient-support",
            "description": "Supportive equipment for patient recovery and long-term home nursing.",
            "icon_url": "bed",
            "sort_order": 5,
            "children": [
                {"name": "Hospital Beds (Adjustable, Manual, Electric)", "slug": "hospital-beds", "description": "Adjustable multi-crank and motorized home care beds.", "icon_url": "bed", "sort_order": 1},
                {"name": "Suction Machines", "slug": "suction-machines", "description": "Portable medical aspirators and phlegm suction machines.", "icon_url": "cylinder", "sort_order": 2},
                {"name": "Air Mattresses (Anti-Bedsore)", "slug": "air-mattresses-anti-bedsore", "description": "Alternating pressure bubble and tubular anti-decubitus mattresses.", "icon_url": "layers", "sort_order": 3},
                {"name": "Urine Bags, Bedpans, and Commodes", "slug": "urine-bags-bedpans-commodes", "description": "Sanitary home nursing commodes, bedpans, and drainage bags.", "icon_url": "package", "sort_order": 4},
            ],
        },
        {
            "name": "Wound & First Aid Care",
            "slug": "wound-first-aid-care",
            "description": "Essential first response supplies and advanced wound dressing solutions.",
            "icon_url": "bandage",
            "sort_order": 6,
            "children": [
                {"name": "First Aid Kits", "slug": "first-aid-kits", "description": "Comprehensive emergency first aid response kits.", "icon_url": "cross", "sort_order": 1},
                {"name": "Bandages and Dressings", "slug": "bandages-and-dressings", "description": "Sterile gauze pads, cohesive bandages, and hydrocolloid dressings.", "icon_url": "bandage", "sort_order": 2},
                {"name": "Digital Thermometers", "slug": "first-aid-digital-thermometers", "description": "Clinical digital thermometers for emergency first aid kits.", "icon_url": "thermometer", "sort_order": 3},
                {"name": "Burn Relief Gels", "slug": "burn-relief-gels", "description": "Cooling burn dressings, soothing gels, and emergency kits.", "icon_url": "flame", "sort_order": 4},
                {"name": "Hot/Cold Compresses", "slug": "hot-cold-compresses", "description": "Instant cold packs and microwaveable heat therapy compresses.", "icon_url": "snowflake", "sort_order": 5},
            ],
        },
        {
            "name": "Maternal & Child Health",
            "slug": "maternal-child-health",
            "description": "Specialized health and care equipment for mothers, infants, and toddlers.",
            "icon_url": "baby",
            "sort_order": 7,
            "children": [
                {"name": "Fetal Dopplers", "slug": "fetal-dopplers", "description": "Prenatal pocket fetal heartbeat detectors and monitoring probes.", "icon_url": "heart-pulse", "sort_order": 1},
                {"name": "Baby Thermometers", "slug": "baby-thermometers", "description": "Fast-reading gentle infant digital and pacifier thermometers.", "icon_url": "thermometer", "sort_order": 2},
                {"name": "Electric Breast Pumps", "slug": "electric-breast-pumps", "description": "Hospital-grade dual and wearable hands-free electric breast pumps.", "icon_url": "sparkles", "sort_order": 3},
                {"name": "Baby Weighing Scales", "slug": "baby-weighing-scales", "description": "Ergonomic high-accuracy infant and toddler weighing scales.", "icon_url": "scale", "sort_order": 4},
                {"name": "Bottle Sterilizers", "slug": "bottle-sterilizers", "description": "Electric steam and UV feeding bottle sterilizers & dryers.", "icon_url": "shield-check", "sort_order": 5},
            ],
        },
    ]

    category_lookup = {}

    for p_idx, parent_data in enumerate(categories_tree, 1):
        p_res = await db.execute(select(Category).where(Category.slug == parent_data["slug"]))
        parent_cat = p_res.scalar_one_or_none()

        if not parent_cat:
            print(f"Creating parent category: {parent_data['name']}")
            parent_cat = Category(
                name=parent_data["name"],
                slug=parent_data["slug"],
                description=parent_data.get("description"),
                icon_url=parent_data.get("icon_url"),
                sort_order=parent_data.get("sort_order", p_idx),
                is_active=True,
                parent_id=None,
            )
            db.add(parent_cat)
            await db.commit()
            await db.refresh(parent_cat)
        else:
            parent_cat.name = parent_data["name"]
            parent_cat.description = parent_data.get("description")
            parent_cat.icon_url = parent_data.get("icon_url")
            parent_cat.sort_order = parent_data.get("sort_order", p_idx)
            parent_cat.is_active = True
            await db.commit()

        category_lookup[parent_cat.slug] = parent_cat.id

        for c_idx, child_data in enumerate(parent_data.get("children", []), 1):
            c_res = await db.execute(select(Category).where(Category.slug == child_data["slug"]))
            child_cat = c_res.scalar_one_or_none()

            if not child_cat:
                child_cat = Category(
                    name=child_data["name"],
                    slug=child_data["slug"],
                    description=child_data.get("description"),
                    icon_url=child_data.get("icon_url"),
                    sort_order=child_data.get("sort_order", c_idx),
                    is_active=True,
                    parent_id=parent_cat.id,
                )
                db.add(child_cat)
                await db.commit()
                await db.refresh(child_cat)
            else:
                child_cat.name = child_data["name"]
                child_cat.parent_id = parent_cat.id
                child_cat.description = child_data.get("description")
                child_cat.icon_url = child_data.get("icon_url")
                child_cat.sort_order = child_data.get("sort_order", c_idx)
                child_cat.is_active = True
                await db.commit()

            category_lookup[child_cat.slug] = child_cat.id

    return category_lookup, categories_tree


async def seed_manufacturers_and_brands(db):
    mfg_data = [
        {"name": "Omron Healthcare", "slug": "omron-healthcare", "country_of_origin": "JP"},
        {"name": "Philips Respironics", "slug": "philips-respironics", "country_of_origin": "NL"},
        {"name": "Drive DeVilbiss Healthcare", "slug": "drive-devilbiss", "country_of_origin": "US"},
        {"name": "Roche Diabetes Care", "slug": "roche-diabetes", "country_of_origin": "CH"},
        {"name": "Medela AG", "slug": "medela-ag", "country_of_origin": "CH"},
        {"name": "Beurer GmbH", "slug": "beurer-gmbh", "country_of_origin": "DE"},
        {"name": "Yuwell Medical", "slug": "yuwell-medical", "country_of_origin": "CN"},
        {"name": "Microlife AG", "slug": "microlife-ag", "country_of_origin": "CH"},
    ]

    mfg_map = {}
    for m in mfg_data:
        res = await db.execute(select(Manufacturer).where(Manufacturer.slug == m["slug"]))
        mfg = res.scalar_one_or_none()
        if not mfg:
            mfg = Manufacturer(**m)
            db.add(mfg)
            await db.commit()
            await db.refresh(mfg)
        mfg_map[m["slug"]] = mfg

    brand_data = [
        {"name": "Omron", "slug": "omron", "manufacturer_slug": "omron-healthcare"},
        {"name": "Philips", "slug": "philips", "manufacturer_slug": "philips-respironics"},
        {"name": "Drive Medical", "slug": "drive-medical", "manufacturer_slug": "drive-devilbiss"},
        {"name": "Accu-Chek", "slug": "accu-chek", "manufacturer_slug": "roche-diabetes"},
        {"name": "Medela", "slug": "medela", "manufacturer_slug": "medela-ag"},
        {"name": "Beurer", "slug": "beurer", "manufacturer_slug": "beurer-gmbh"},
        {"name": "Yuwell", "slug": "yuwell", "manufacturer_slug": "yuwell-medical"},
        {"name": "Microlife", "slug": "microlife", "manufacturer_slug": "microlife-ag"},
    ]

    brand_map = {}
    for b in brand_data:
        mfg = mfg_map.get(b["manufacturer_slug"])
        res = await db.execute(select(Brand).where(Brand.slug == b["slug"]))
        brand = res.scalar_one_or_none()
        if not brand:
            brand = Brand(
                name=b["name"],
                slug=b["slug"],
                manufacturer_id=mfg.id if mfg else None,
                approval_status="approved",
                is_active=True,
            )
            db.add(brand)
            await db.commit()
            await db.refresh(brand)
        brand_map[b["slug"]] = brand

    return mfg_map, brand_map


async def seed_products(db, vendor_profile, category_lookup, brand_map, mfg_map):
    products_definition = [
        # --- 1. Diagnostic Devices ---
        {
            "name": "Omron Gentle Temp 720 Non-Contact Digital Thermometer",
            "slug": "omron-gentle-temp-720-digital-thermometer",
            "category_slug": "digital-thermometers",
            "brand_slug": "omron",
            "sku": "DIAG-THERM-001",
            "price": Decimal("3800.00"),
            "compare_at_price": Decimal("4500.00"),
            "is_featured": True,
            "is_clinical_pick": True,
            "short_description": "3-in-1 non-contact forehead and surface digital thermometer with 1-second fast reading.",
            "description": "The Omron Gentle Temp 720 provides infrared 1-second accurate temperature reading with backlight and silent mode for sleeping patients and infants.",
            "specifications": {"Accuracy": "±0.2°C", "Measurement Time": "1 second", "Memory": "25 readings"},
            "tags": ["thermometer", "diagnostic", "fever", "home-care"],
        },
        {
            "name": "Microlife MT1622 Rapid Flexible Digital Thermometer",
            "slug": "microlife-mt1622-rapid-digital-thermometer",
            "category_slug": "digital-thermometers",
            "brand_slug": "microlife",
            "sku": "DIAG-THERM-002",
            "price": Decimal("1200.00"),
            "compare_at_price": Decimal("1500.00"),
            "is_featured": False,
            "short_description": "Flexible-tip waterproof digital oral and axillary clinical thermometer.",
            "description": "High accuracy 10-second digital thermometer with fever alarm and memory recall for home temperature tracking.",
            "specifications": {"Type": "Flexible Tip", "Response": "10s", "Waterproof": "Yes"},
            "tags": ["thermometer", "first-aid", "diagnostic"],
        },
        {
            "name": "Omron M3 Comfort Upper Arm Blood Pressure Monitor",
            "slug": "omron-m3-comfort-blood-pressure-monitor",
            "category_slug": "blood-pressure-monitors",
            "brand_slug": "omron",
            "sku": "DIAG-BPM-001",
            "price": Decimal("8500.00"),
            "compare_at_price": Decimal("9800.00"),
            "is_featured": True,
            "is_clinical_pick": True,
            "short_description": "Clinically validated digital blood pressure monitor with 360° Intelli Wrap Cuff.",
            "description": "The Omron M3 Comfort eliminates placement inaccuracy with its pre-formed 22-42cm cuff, detecting irregular heartbeats and morning hypertension.",
            "specifications": {"Cuff Size": "22-42cm", "Memory": "2 users x 60 readings", "Validation": "Clinical ESH"},
            "tags": ["blood-pressure", "hypertension", "omron", "cardiac"],
        },
        {
            "name": "Beurer BM45 Upper Arm Blood Pressure Monitor",
            "slug": "beurer-bm45-upper-arm-blood-pressure-monitor",
            "category_slug": "blood-pressure-monitors",
            "brand_slug": "beurer",
            "sku": "DIAG-BPM-002",
            "price": Decimal("7200.00"),
            "compare_at_price": Decimal("8200.00"),
            "is_featured": False,
            "short_description": "Illuminated sensor-touch digital blood pressure monitor with WHO risk indicator.",
            "description": "German engineered upper arm BP monitor featuring resting indicator and automatic cuff inflation.",
            "specifications": {"Display": "White backlit XL LCD", "Memory": "2 x 60 slots", "WHO Indicator": "Yes"},
            "tags": ["blood-pressure", "beurer", "home-care"],
        },
        {
            "name": "Accu-Chek Instant Blood Glucose Monitoring System",
            "slug": "accu-chek-instant-blood-glucose-meter",
            "category_slug": "blood-glucose-meters",
            "brand_slug": "accu-chek",
            "sku": "DIAG-GLUC-001",
            "price": Decimal("3500.00"),
            "compare_at_price": Decimal("4200.00"),
            "is_featured": True,
            "is_clinical_pick": True,
            "short_description": "Wireless glucometer with target range indicator and instant test strip dosing.",
            "description": "Accu-Chek Instant requires effortless 1-button navigation, micro 0.6µl blood volume, and delivers lab-accurate results in under 4 seconds.",
            "specifications": {"Sample Size": "0.6 µL", "Test Time": "<4 seconds", "Bluetooth": "Yes"},
            "tags": ["diabetes", "glucometer", "glucose", "accu-chek"],
        },
        {
            "name": "Accu-Chek Instant Test Strips (Pack of 50)",
            "slug": "accu-chek-instant-test-strips-50pk",
            "category_slug": "blood-glucose-meters",
            "brand_slug": "accu-chek",
            "sku": "DIAG-GLUC-002",
            "price": Decimal("2400.00"),
            "compare_at_price": Decimal("2800.00"),
            "is_featured": False,
            "short_description": "Pack of 50 sterile capillary action glucose test strips.",
            "description": "Sterile test strips designed for Accu-Chek Instant meter with wide dosing area.",
            "specifications": {"Quantity": "50 strips", "Compatibility": "Accu-Chek Instant"},
            "tags": ["strips", "diabetes", "consumables"],
        },
        {
            "name": "Yuwell YX301 Fingertip Pulse Oximeter",
            "slug": "yuwell-yx301-fingertip-pulse-oximeter",
            "category_slug": "pulse-oximeters",
            "brand_slug": "yuwell",
            "sku": "DIAG-OXIM-001",
            "price": Decimal("2600.00"),
            "compare_at_price": Decimal("3200.00"),
            "is_featured": True,
            "short_description": "High precision SpO2 and pulse rate monitor with multi-directional OLED display.",
            "description": "Compact and reliable fingertip oximeter detecting blood oxygen saturation and pulse bar graph within seconds.",
            "specifications": {"SpO2 Range": "70%-100%", "PR Range": "25-250 bpm", "Display": "Dual Color OLED"},
            "tags": ["oximeter", "spo2", "respiratory", "pulse"],
        },
        {
            "name": "Multi-Check 3-in-1 Cholesterol & Glucose Test Kit",
            "slug": "multicheck-3in1-cholesterol-glucose-kit",
            "category_slug": "cholesterol-test-kits",
            "brand_slug": "microlife",
            "sku": "DIAG-CHOL-001",
            "price": Decimal("9500.00"),
            "compare_at_price": Decimal("11000.00"),
            "is_featured": True,
            "short_description": "Comprehensive lipid profile and total cholesterol testing device for home use.",
            "description": "Multi-parameter digital monitor evaluating total cholesterol, glucose, and uric acid from a single drop of blood.",
            "specifications": {"Test Parameters": "Cholesterol, Glucose, Uric Acid", "Memory": "400 tests"},
            "tags": ["cholesterol", "lipid", "diagnostic", "screening"],
        },
        {
            "name": "Beurer GS215 High Precision Digital Weighing Scale",
            "slug": "beurer-gs215-digital-weighing-scale",
            "category_slug": "digital-weighing-scales",
            "brand_slug": "beurer",
            "sku": "DIAG-SCALE-001",
            "price": Decimal("4800.00"),
            "compare_at_price": Decimal("5500.00"),
            "is_featured": False,
            "short_description": "Tempered safety glass bathroom scale with modern invisible dot-matrix display.",
            "description": "Features 180kg capacity, 100g graduation, and quick-start technology with automatic switch-off.",
            "specifications": {"Capacity": "180 kg", "Graduation": "100 g", "Platform": "Safety Glass"},
            "tags": ["scale", "weight", "fitness", "home-health"],
        },

        # --- 2. Respiratory Care Devices ---
        {
            "name": "Omron CompAIR NE-C28P Compressor Nebulizer",
            "slug": "omron-compair-ne-c28p-compressor-nebulizer",
            "category_slug": "nebulizers",
            "brand_slug": "omron",
            "sku": "RESP-NEB-001",
            "price": Decimal("8900.00"),
            "compare_at_price": Decimal("10500.00"),
            "is_featured": True,
            "is_clinical_pick": True,
            "short_description": "Heavy-duty compressor nebulizer with Virtual Valve Technology (V.V.T).",
            "description": "Robust and efficient nebulization for frequent lower respiratory tract treatment including asthma, COPD, and bronchitis.",
            "specifications": {"Nebulization Rate": "0.5 ml/min", "Particle Size": "MMAD 3.0 µm", "Vessel Capacity": "2-10 ml"},
            "tags": ["nebulizer", "respiratory", "asthma", "omron"],
        },
        {
            "name": "Yuwell M102 Ultra-Quiet Mesh Nebulizer (Portable)",
            "slug": "yuwell-m102-portable-mesh-nebulizer",
            "category_slug": "nebulizers",
            "brand_slug": "yuwell",
            "sku": "RESP-NEB-002",
            "price": Decimal("5400.00"),
            "compare_at_price": Decimal("6500.00"),
            "is_featured": True,
            "short_description": "Pocket-sized silent vibrating mesh nebulizer powered by USB or AA batteries.",
            "description": "Ultrasonic mesh technology enabling aerosol therapy on the go or during nighttime for infants and active adults.",
            "specifications": {"Weight": "108g", "Noise": "<20dB", "Power": "Micro USB / 2x AA"},
            "tags": ["mesh-nebulizer", "portable", "asthma", "pocket"],
        },
        {
            "name": "Philips DreamStation Auto CPAP Machine",
            "slug": "philips-dreamstation-auto-cpap-machine",
            "category_slug": "cpap-bipap-machines",
            "brand_slug": "philips",
            "sku": "RESP-CPAP-001",
            "price": Decimal("145000.00"),
            "compare_at_price": Decimal("160000.00"),
            "is_featured": True,
            "is_clinical_pick": True,
            "short_description": "Auto-titrating positive airway pressure device with heated humidifier for sleep apnea.",
            "description": "Advanced sleep therapy system with SmartRamp, OptiStart, and heated tubing for maximum airway comfort.",
            "specifications": {"Pressure Range": "4 to 20 cm H2O", "Noise Level": "25.8 dBA", "Humidification": "Adaptive Heated"},
            "tags": ["cpap", "sleep-apnea", "philips", "respiratory"],
        },
        {
            "name": "Philips DreamWear Silicone Under-Nose CPAP Mask",
            "slug": "philips-dreamwear-under-nose-cpap-mask",
            "category_slug": "cpap-bipap-machines",
            "brand_slug": "philips",
            "sku": "RESP-CPAP-ACC-001",
            "price": Decimal("18500.00"),
            "compare_at_price": Decimal("21000.00"),
            "is_featured": False,
            "short_description": "Innovative top-of-head tube connection CPAP mask preventing red marks.",
            "description": "Cushion rests gently under nose without entering nostrils, allowing freedom of movement in any sleeping posture.",
            "specifications": {"Cushion Type": "Nasal Under-the-nose", "Compatibility": "All standard CPAP tubes"},
            "tags": ["cpap-mask", "respiratory-accessory"],
        },
        {
            "name": "Yuwell 5L Medical Grade Portable Oxygen Concentrator",
            "slug": "yuwell-5l-portable-oxygen-concentrator",
            "category_slug": "portable-oxygen-concentrators",
            "brand_slug": "yuwell",
            "sku": "RESP-OXY-001",
            "price": Decimal("95000.00"),
            "compare_at_price": Decimal("110000.00"),
            "is_featured": True,
            "is_clinical_pick": True,
            "short_description": "Continuous flow 1-5L/min 93% high-purity medical oxygen generator with atomizing function.",
            "description": "Equipped with intelligent self-diagnosis, high-efficiency compressor, and quiet sound enclosure for continuous 24/7 home oxygen therapy.",
            "specifications": {"Oxygen Flow": "1-5 L/min", "Oxygen Concentration": "93% ± 3%", "Alarms": "Low O2, Power failure"},
            "tags": ["oxygen-concentrator", "oxygen", "home-nursing", "respiratory"],
        },
        {
            "name": "Beurer SI40 Warm Mist Steam Inhaler",
            "slug": "beurer-si40-warm-mist-steam-inhaler",
            "category_slug": "steam-inhalers",
            "brand_slug": "beurer",
            "sku": "RESP-STEAM-001",
            "price": Decimal("6500.00"),
            "compare_at_price": Decimal("7500.00"),
            "is_featured": False,
            "short_description": "Facial and nasal warm steam inhaler for cold and sinusitis relief.",
            "description": "Safe application with flexible universal mask for nose and mouth to open airways with saline solutions and essential vapors.",
            "specifications": {"Steam Temp": "approx 43°C", "Steam Output": "Adjustable slider"},
            "tags": ["steam-inhaler", "sinus", "respiratory-care"],
        },

        # --- 3. Mobility & Rehabilitation Aids ---
        {
            "name": "Drive Medical Cruiser III Lightweight Wheelchair",
            "slug": "drive-medical-cruiser-iii-wheelchair",
            "category_slug": "wheelchairs",
            "brand_slug": "drive-medical",
            "sku": "MOB-WCH-001",
            "price": Decimal("32000.00"),
            "compare_at_price": Decimal("38000.00"),
            "is_featured": True,
            "is_clinical_pick": True,
            "short_description": "Durable dual-axle folding manual wheelchair with removable flip-back arms.",
            "description": "High-strength carbon steel frame with silver vein finish, adjustable seat-to-floor height, and swing-away elevating footrests.",
            "specifications": {"Weight Capacity": "136 kg (300 lbs)", "Product Weight": "16.5 kg", "Seat Width": "18 inches"},
            "tags": ["wheelchair", "mobility", "drive-medical", "rehabilitation"],
        },
        {
            "name": "Drive Medical Cirrus Plus Power Electric Wheelchair",
            "slug": "drive-medical-cirrus-plus-electric-wheelchair",
            "category_slug": "wheelchairs",
            "brand_slug": "drive-medical",
            "sku": "MOB-WCH-002",
            "price": Decimal("245000.00"),
            "compare_at_price": Decimal("275000.00"),
            "is_featured": True,
            "is_clinical_pick": True,
            "short_description": "Motorized folding power wheelchair with programmable joystick controller.",
            "description": "Folding frame with dual 250W motors, electromagnetic brakes, foam-filled flat-free tires, and 24km range per charge.",
            "specifications": {"Max Speed": "8 km/h", "Range": "24 km", "Weight Capacity": "136 kg"},
            "tags": ["electric-wheelchair", "motorized", "mobility-aid"],
        },
        {
            "name": "Drive Medical Deluxe Folding Walker with 5-inch Wheels",
            "slug": "drive-medical-deluxe-folding-walker",
            "category_slug": "walkers-and-crutches",
            "brand_slug": "drive-medical",
            "sku": "MOB-WLK-001",
            "price": Decimal("8500.00"),
            "compare_at_price": Decimal("9800.00"),
            "is_featured": False,
            "short_description": "Dual-button push release aluminum folding walker with glide caps.",
            "description": "Sturdy anodized 1-inch aluminum construction supporting independent mobility for elderly patients and post-surgery rehabilitation.",
            "specifications": {"Height Adjustment": "81 - 99 cm", "Weight Capacity": "159 kg"},
            "tags": ["walker", "walking-aid", "elderly-care"],
        },
        {
            "name": "Orthopedic Adjustable Elbow Crutches (Pair)",
            "slug": "orthopedic-adjustable-elbow-crutches-pair",
            "category_slug": "walkers-and-crutches",
            "brand_slug": "drive-medical",
            "sku": "MOB-CRU-001",
            "price": Decimal("4500.00"),
            "compare_at_price": Decimal("5200.00"),
            "is_featured": False,
            "short_description": "Ergonomic forearm crutches with non-slip rubber ferrules and double height adjustment.",
            "description": "Comfort-molded anatomical grip handles with reflector safety caps for dependable post-injury walking support.",
            "specifications": {"Material": "High grade aluminum", "Height range": "96 - 118 cm"},
            "tags": ["crutches", "mobility", "rehabilitation"],
        },
        {
            "name": "Beurer EM49 Digital TENS & EMS Machine for Pain Relief",
            "slug": "beurer-em49-digital-tens-ems-machine",
            "category_slug": "tens-machines",
            "brand_slug": "beurer",
            "sku": "MOB-TENS-001",
            "price": Decimal("11500.00"),
            "compare_at_price": Decimal("13500.00"),
            "is_featured": True,
            "is_clinical_pick": True,
            "short_description": "3-in-1 transcutaneous electrical nerve stimulation, muscle massage, and rehabilitation therapy.",
            "description": "Features 2 separate channels, 64 pre-programmed applications, 6 customizable programs, and 4 self-adhesive electrode pads.",
            "specifications": {"Channels": "2 isolated channels", "Programs": "70 total", "Display": "Inverted Blue LCD"},
            "tags": ["tens", "pain-relief", "ems", "physiotherapy"],
        },
        {
            "name": "Orthopedic Hinged Knee Support Brace with Lateral Stabilizers",
            "slug": "orthopedic-hinged-knee-support-brace",
            "category_slug": "knee-braces-wrist-supports",
            "brand_slug": "drive-medical",
            "sku": "MOB-BRACE-001",
            "price": Decimal("3800.00"),
            "compare_at_price": Decimal("4500.00"),
            "is_featured": False,
            "short_description": "Dual polycentric hinge knee stabilizer for ACL/MCL recovery and arthritis support.",
            "description": "Breathable open-patella neoprene brace with silicone ring to relieve kneecap pressure and prevent hyperextension.",
            "specifications": {"Material": "Medical Neoprene & Dual Aluminum Hinges", "Size": "Universal Adjustable"},
            "tags": ["knee-brace", "orthopedic", "joint-support"],
        },
        {
            "name": "Reusable Gel Hot & Cold Therapy Pack (XL Body Wrap)",
            "slug": "reusable-gel-hot-cold-therapy-pack-xl",
            "category_slug": "hot-cold-therapy-packs",
            "brand_slug": "beurer",
            "sku": "MOB-THERM-001",
            "price": Decimal("2200.00"),
            "compare_at_price": Decimal("2800.00"),
            "is_featured": False,
            "short_description": "Microwaveable and freezable therapeutic gel wrap with elastic securing strap.",
            "description": "Delivers up to 30 minutes of targeted hot or cold relief for backache, joint inflammation, and sprains.",
            "specifications": {"Dimensions": "30 x 20 cm", "Temperature Retention": "30 mins"},
            "tags": ["hot-cold", "pain-relief", "therapy-pack"],
        },

        # --- 4. Personal Health & Wellness Devices ---
        {
            "name": "Beurer BF720 Bluetooth Body Composition Analyzer",
            "slug": "beurer-bf720-bluetooth-body-composition-scale",
            "category_slug": "body-composition-analyzers",
            "brand_slug": "beurer",
            "sku": "WELL-BCA-001",
            "price": Decimal("8800.00"),
            "compare_at_price": Decimal("10200.00"),
            "is_featured": True,
            "is_clinical_pick": True,
            "short_description": "Diagnostic bathroom scale computing body fat, water percentage, muscle ratio, bone mass, and AMR/BMR.",
            "description": "Syncs seamlessly via Bluetooth with HealthManager app to monitor long-term health metrics with 8 user memories.",
            "specifications": {"Electrodes": "Brushed Stainless Steel", "Capacity": "180 kg", "App Sync": "iOS & Android"},
            "tags": ["body-composition", "smart-scale", "wellness", "beurer"],
        },
        {
            "name": "Microlife NC200 Non-Contact Auto-Measurement Infrared Thermometer",
            "slug": "microlife-nc200-infrared-thermometer",
            "category_slug": "infrared-thermometers",
            "brand_slug": "microlife",
            "sku": "WELL-IR-001",
            "price": Decimal("5200.00"),
            "compare_at_price": Decimal("6000.00"),
            "is_featured": False,
            "short_description": "Automated distance-control infrared fever thermometer with Silent Glow technology.",
            "description": "Automatically measures when sensor detects 5cm distance, glowing red in fever conditions and blue in guidance.",
            "specifications": {"Distance Sensor": "Autocue 5cm", "Silent Glow": "Yes", "Memory": "30 readings"},
            "tags": ["infrared-thermometer", "fever-scan", "wellness"],
        },
        {
            "name": "Smart Health & Continuous Heart Rate Monitor Wristband",
            "slug": "smart-health-continuous-heart-rate-wristband",
            "category_slug": "smart-fitness-bands-hr-monitors",
            "brand_slug": "beurer",
            "sku": "WELL-FIT-001",
            "price": Decimal("6800.00"),
            "compare_at_price": Decimal("7900.00"),
            "is_featured": False,
            "short_description": "24/7 PPG optical heart rate monitor, step counter, sleep quality scorer, and calorie ledger.",
            "description": "IP68 waterproof smart health bracelet with vibratory notifications, ECG-level resting HR detection, and 14-day battery.",
            "specifications": {"Battery Life": "14 days", "Waterproof": "IP68", "Sensors": "Optical PPG, 3-Axis Accelerometer"},
            "tags": ["fitness-band", "heart-rate", "wellness-tracker"],
        },
        {
            "name": "Beurer SE80 SleepExpert Contactless Sleep Sensor",
            "slug": "beurer-se80-sleepexpert-sleep-tracker",
            "category_slug": "sleep-trackers",
            "brand_slug": "beurer",
            "sku": "WELL-SLP-001",
            "price": Decimal("14500.00"),
            "compare_at_price": Decimal("16800.00"),
            "is_featured": True,
            "short_description": "Under-mattress non-invasive sleep tracker recording heart rate, respiration, and sleep phases.",
            "description": "High-precision contactless sensor placed under the mattress to document sleep behavior, detect sleep apnea hypopnea episodes, and sync with the beurer SleepExpert app.",
            "specifications": {"Sensor Type": "High precision piezo sensor", "Placement": "Under mattress", "Connectivity": "Bluetooth Smart"},
            "tags": ["sleep-tracker", "sleep-apnea", "wellness", "beurer"],
        },

        # --- 5. Home Care & Patient Support ---
        {
            "name": "Medical 3-Crank Deluxe Home Care Hospital Bed",
            "slug": "medical-3-crank-deluxe-home-care-hospital-bed",
            "category_slug": "hospital-beds",
            "brand_slug": "drive-medical",
            "sku": "HOME-BED-001",
            "price": Decimal("88000.00"),
            "compare_at_price": Decimal("98000.00"),
            "is_featured": True,
            "is_clinical_pick": True,
            "short_description": "Manual 3-crank adjustable backrest, leg rest, and total height patient care bed.",
            "description": "Equipped with aluminum collapsible safety side rails, ABS head and foot boards, IV drip pole, and 5-inch lockable castor wheels.",
            "specifications": {"Backrest Tilt": "0-80°", "Leg Tilt": "0-40°", "Height Range": "45-75 cm", "Safe Working Load": "200 kg"},
            "tags": ["hospital-bed", "home-care", "patient-support", "elderly-nursing"],
        },
        {
            "name": "Drive Medical Full-Electric Multi-Function Hospital Bed",
            "slug": "drive-medical-full-electric-hospital-bed",
            "category_slug": "hospital-beds",
            "brand_slug": "drive-medical",
            "sku": "HOME-BED-002",
            "price": Decimal("185000.00"),
            "compare_at_price": Decimal("210000.00"),
            "is_featured": True,
            "is_clinical_pick": True,
            "short_description": "Motorized handheld pendant controlled nursing bed with Trendelenburg positioning.",
            "description": "Quiet electric linear actuators providing effortless patient articulation, lowering caregiver strain and optimizing patient comfort.",
            "specifications": {"Actuators": "Linak Medical Grade", "Control": "Handheld Remote & Lockout Box"},
            "tags": ["electric-bed", "home-nursing", "icu-bed"],
        },
        {
            "name": "Yuwell 7E-A Portable Phlegm Suction Machine",
            "slug": "yuwell-7ea-portable-phlegm-suction-machine",
            "category_slug": "suction-machines",
            "brand_slug": "yuwell",
            "sku": "HOME-SUCT-001",
            "price": Decimal("24000.00"),
            "compare_at_price": Decimal("28000.00"),
            "is_featured": True,
            "is_clinical_pick": True,
            "short_description": "High-vacuum oil-free lubrication piston pump medical aspirator.",
            "description": "Designed for clearing airway secretions in tracheostomy and bedridden home patients with 1000ml overflow-protected reservoir bottle.",
            "specifications": {"Max Vacuum": "≥0.075 MPa", "Pumping Capacity": "≥15 L/min", "Bottle Capacity": "1000 mL"},
            "tags": ["suction-machine", "aspirator", "phlegm", "home-care"],
        },
        {
            "name": "Alternating Pressure Anti-Bedsore Air Mattress with Pump",
            "slug": "alternating-pressure-anti-bedsore-air-mattress",
            "category_slug": "air-mattresses-anti-bedsore",
            "brand_slug": "drive-medical",
            "sku": "HOME-MAT-001",
            "price": Decimal("12500.00"),
            "compare_at_price": Decimal("15000.00"),
            "is_featured": True,
            "is_clinical_pick": True,
            "short_description": "Bubble-style alternating pressure decubitus prevention mattress system with quiet pump.",
            "description": "130 individual bubble cells inflate and deflate on a 6-minute cycle to alleviate pressure points and stimulate blood flow in immobilized patients.",
            "specifications": {"Cycle Time": "6 minutes", "Material": "Medical grade PVC", "Weight Capacity": "135 kg"},
            "tags": ["air-mattress", "bedsore-prevention", "anti-decubitus", "home-nursing"],
        },
        {
            "name": "Drive Medical Folding Commode Chair with Pail & Splash Guard",
            "slug": "drive-medical-folding-commode-chair",
            "category_slug": "urine-bags-bedpans-commodes",
            "brand_slug": "drive-medical",
            "sku": "HOME-COMM-001",
            "price": Decimal("7500.00"),
            "compare_at_price": Decimal("8800.00"),
            "is_featured": False,
            "short_description": "3-in-1 bedside commode, toilet safety frame, and elevated toilet seat.",
            "description": "Steel welded construction that folds flat for storage, featuring 7.5qt commode bucket with carry handle, cover, and splash shield.",
            "specifications": {"Weight Capacity": "159 kg", "Height Adjustment": "40 - 55 cm"},
            "tags": ["commode", "bedside-toilet", "patient-care"],
        },

        # --- 6. Wound & First Aid Care ---
        {
            "name": "Comprehensive Workplace & Home Emergency First Aid Kit (180 Pieces)",
            "slug": "comprehensive-emergency-first-aid-kit-180pc",
            "category_slug": "first-aid-kits",
            "brand_slug": "drive-medical",
            "sku": "WOUND-FAK-001",
            "price": Decimal("5500.00"),
            "compare_at_price": Decimal("6500.00"),
            "is_featured": True,
            "is_clinical_pick": True,
            "short_description": "OSHA & Red Cross compliant hard shell emergency first aid case for home and field.",
            "description": "Contains sterile dressings, antiseptic wipes, burn dressings, triangular bandages, CPR mask, surgical tape, and trauma shears.",
            "specifications": {"Contents": "180 clinical items", "Case": "Waterproof ABS hardcase"},
            "tags": ["first-aid", "emergency", "trauma", "safety"],
        },
        {
            "name": "Sterile Hydrocolloid & Gauze Dressing Assortment Pack",
            "slug": "sterile-hydrocolloid-gauze-dressing-pack",
            "category_slug": "bandages-and-dressings",
            "brand_slug": "drive-medical",
            "sku": "WOUND-DRES-001",
            "price": Decimal("1800.00"),
            "compare_at_price": Decimal("2200.00"),
            "is_featured": False,
            "short_description": "Advanced wound healing sterile adhesive dressings with waterproof barrier.",
            "description": "Promotes moist wound healing, accelerates epithelialization, and absorbs exudate without sticking to raw tissue.",
            "specifications": {"Pack Contains": "10 hydrocolloid pads, 20 sterile non-adherent gauzes, 2 rolls cohesive tape"},
            "tags": ["bandages", "dressings", "wound-care"],
        },
        {
            "name": "Emergency Rapid-Read Waterproof Clinical Digital Thermometer",
            "slug": "first-aid-rapid-digital-thermometer",
            "category_slug": "first-aid-digital-thermometers",
            "brand_slug": "microlife",
            "sku": "WOUND-THERM-001",
            "price": Decimal("950.00"),
            "compare_at_price": Decimal("1200.00"),
            "is_featured": False,
            "short_description": "Compact waterproof 10-second digital oral/axillary thermometer for first aid kits.",
            "description": "Durable fast-reading clinical thermometer with automatic fever alert beeper and memory storage for emergency response.",
            "specifications": {"Measurement Time": "10s", "Waterproof": "IP67", "Memory": "Last reading"},
            "tags": ["thermometer", "first-aid", "emergency"],
        },
        {
            "name": "Burnshield Emergency Burn Relief Hydrogel Kit (125ml + Dressings)",
            "slug": "burnshield-emergency-burn-relief-hydrogel-kit",
            "category_slug": "burn-relief-gels",
            "brand_slug": "drive-medical",
            "sku": "WOUND-BURN-001",
            "price": Decimal("3200.00"),
            "compare_at_price": Decimal("3900.00"),
            "is_featured": False,
            "short_description": "Natural tea-tree oil based sterile burn soothing gel and sterile open-cell foam dressings.",
            "description": "Dissipates heat immediately, relieves intense pain, minimizes burn depth progression, and protects against infection.",
            "specifications": {"Hydrogel Bottle": "125 ml", "Dressings": "2x 10x10cm burn pads"},
            "tags": ["burn-gel", "burn-care", "first-aid"],
        },
        {
            "name": "Instant Cold Compresses & Heat Packs (Box of 10)",
            "slug": "instant-cold-compresses-box-of-10",
            "category_slug": "hot-cold-compresses",
            "brand_slug": "beurer",
            "sku": "WOUND-COMP-001",
            "price": Decimal("2500.00"),
            "compare_at_price": Decimal("3000.00"),
            "is_featured": False,
            "short_description": "Single-use squeeze-to-activate instant freezing cold therapy packs.",
            "description": "Requires no pre-refrigeration; rapidly activates endothermic reaction for immediate acute sports injury and swelling reduction.",
            "specifications": {"Activation": "Instant chemical squeeze", "Quantity": "10 packs"},
            "tags": ["cold-compress", "instant-ice", "first-aid"],
        },

        # --- 7. Maternal & Child Health ---
        {
            "name": "Pocket Fetal Doppler Heartbeat Detector with 3MHz Probe",
            "slug": "pocket-fetal-doppler-heartbeat-detector-3mhz",
            "category_slug": "fetal-dopplers",
            "brand_slug": "yuwell",
            "sku": "MAT-DOP-001",
            "price": Decimal("7500.00"),
            "compare_at_price": Decimal("8800.00"),
            "is_featured": True,
            "is_clinical_pick": True,
            "short_description": "Prenatal home baby heartbeat listener with high-sensitivity waterproof probe and LCD curve display.",
            "description": "Enables expectant mothers to listen to fetal heartbeat from 12 weeks of pregnancy with built-in speaker and headphone jack.",
            "specifications": {"Probe Frequency": "3.0 MHz ± 10%", "FHR Display": "50-240 BPM", "Audio": "Built-in Speaker"},
            "tags": ["fetal-doppler", "maternal", "prenatal", "baby-heartbeat"],
        },
        {
            "name": "Beurer BY11 Frog Gentle Infant Digital Thermometer",
            "slug": "beurer-by11-frog-infant-digital-thermometer",
            "category_slug": "baby-thermometers",
            "brand_slug": "beurer",
            "sku": "MAT-THERM-001",
            "price": Decimal("1600.00"),
            "compare_at_price": Decimal("1950.00"),
            "is_featured": False,
            "short_description": "Child-friendly flexible tip digital pacifier/oral thermometer with fever alarm icon.",
            "description": "10-second fast measurement designed to keep toddlers calm during temperature screening without glass or mercury.",
            "specifications": {"Shape": "Child Animal Motif", "Response": "10 seconds", "Waterproof": "Yes"},
            "tags": ["baby-thermometer", "pediatric", "gentle-temp"],
        },
        {
            "name": "Medela Freestyle Hands-Free Double Electric Breast Pump",
            "slug": "medela-freestyle-hands-free-double-breast-pump",
            "category_slug": "electric-breast-pumps",
            "brand_slug": "medela",
            "sku": "MAT-PUMP-001",
            "price": Decimal("46000.00"),
            "compare_at_price": Decimal("52000.00"),
            "is_featured": True,
            "is_clinical_pick": True,
            "short_description": "Wearable double electric breast pump with anatomically shaped in-bra collection cups.",
            "description": "2-Phase Expression technology mimics baby natural sucking rhythm, ultralight 76g cups, USB rechargeable battery, and Medela Family app sync.",
            "specifications": {"Cups Weight": "76 g each", "Suction Levels": "9 vacuum strengths", "Battery": "USB-C Rechargeable"},
            "tags": ["breast-pump", "medela", "maternal-care", "lactation"],
        },
        {
            "name": "Beurer BY80 Digital Baby & Toddler Weighing Scale",
            "slug": "beurer-by80-digital-baby-weighing-scale",
            "category_slug": "baby-weighing-scales",
            "brand_slug": "beurer",
            "sku": "MAT-SCALE-001",
            "price": Decimal("7800.00"),
            "compare_at_price": Decimal("9200.00"),
            "is_featured": True,
            "short_description": "Curved ergonomic weighing surface with automatic hold function for wriggling babies.",
            "description": "High precision 5g graduation baby scale with tare function, measuring weight changes before and after feeding up to 20kg.",
            "specifications": {"Capacity": "20 kg", "Graduation": "5 g", "Platform": "Curved Contour"},
            "tags": ["baby-scale", "pediatric", "growth-monitoring"],
        },
        {
            "name": "Philips Avent 3-in-1 Electric Steam & Drying Bottle Sterilizer",
            "slug": "philips-avent-3in1-electric-steam-bottle-sterilizer",
            "category_slug": "bottle-sterilizers",
            "brand_slug": "philips",
            "sku": "MAT-STER-001",
            "price": Decimal("14500.00"),
            "compare_at_price": Decimal("16500.00"),
            "is_featured": True,
            "short_description": "Modular electric steam sterilizer killing 99.9% of harmful germs in 6 minutes.",
            "description": "Adjustable modular design accommodating up to 6 feeding bottles, breast pump accessories, and soothers, staying sterile for 24 hours.",
            "specifications": {"Sterilization Cycle": "6 minutes", "Capacity": "6 Philips Avent bottles", "Chemical Free": "Natural Steam"},
            "tags": ["bottle-sterilizer", "philips-avent", "infant-hygiene", "maternal"],
        },
    ]

    product_map = {}

    for p_def in products_definition:
        res = await db.execute(select(Product).where(Product.slug == p_def["slug"]))
        product = res.scalar_one_or_none()

        cat_id = category_lookup.get(p_def["category_slug"])
        brand_obj = brand_map.get(p_def["brand_slug"])
        brand_id = brand_obj.id if brand_obj else None
        mfg_id = brand_obj.manufacturer_id if brand_obj else None

        if not product:
            print(f"Creating product: {p_def['name']}")
            product = Product(
                name=p_def["name"],
                slug=p_def["slug"],
                category_id=cat_id,
                brand_id=brand_id,
                manufacturer_id=mfg_id,
                brand=brand_obj.name if brand_obj else "Medical",
                sku=p_def["sku"],
                price=p_def["price"],
                base_price=p_def["price"] * Decimal("0.85"),
                markup_price=p_def["price"] * Decimal("0.15"),
                compare_at_price=p_def.get("compare_at_price"),
                short_description=p_def.get("short_description"),
                description=p_def.get("description"),
                specifications=p_def.get("specifications"),
                tags=p_def.get("tags", []),
                status="published",
                is_verified=True,
                verified_at=datetime.now(UTC),
                is_featured=p_def.get("is_featured", False),
                is_clinical_pick=p_def.get("is_clinical_pick", False),
                is_on_sale=bool(p_def.get("compare_at_price")),
                stock_quantity=50,
                stock_status="instock",
                track_inventory=True,
                vendor_id=vendor_profile.id if vendor_profile else None,
            )
            db.add(product)
            await db.commit()
            await db.refresh(product)
        else:
            product.name = p_def["name"]
            product.category_id = cat_id
            product.brand_id = brand_id
            product.manufacturer_id = mfg_id
            product.price = p_def["price"]
            product.compare_at_price = p_def.get("compare_at_price")
            product.short_description = p_def.get("short_description")
            product.description = p_def.get("description")
            product.specifications = p_def.get("specifications")
            product.tags = p_def.get("tags", [])
            product.status = "published"
            product.is_verified = True
            product.stock_status = "instock"
            product.stock_quantity = 50
            await db.commit()
            await db.refresh(product)

        product_map[product.slug] = product

        # Seed primary ProductImage
        img_res = await db.execute(
            select(ProductImage).where(ProductImage.product_id == product.id)
        )
        existing_imgs = img_res.scalars().all()
        if not existing_imgs:
            img = ProductImage(
                product_id=product.id,
                url=DEFAULT_PRODUCT_IMAGE,
                alt_text=product.name,
                sort_order=0,
                is_primary=True,
            )
            db.add(img)
            await db.commit()

        # Seed default ProductVariant
        var_res = await db.execute(
            select(ProductVariant).where(ProductVariant.product_id == product.id)
        )
        existing_vars = var_res.scalars().all()
        if not existing_vars:
            variant = ProductVariant(
                product_id=product.id,
                name="Standard Unit",
                variant_slug=f"{product.slug}-std",
                sku=f"{product.sku}-STD",
                override_price=product.price,
                stock_quantity=50,
                is_default=True,
                is_active=True,
                image_url=DEFAULT_PRODUCT_IMAGE,
            )
            db.add(variant)
            await db.commit()
            await db.refresh(variant)
            variant_to_use = variant
        else:
            variant_to_use = existing_vars[0]

        # Seed VendorOffer and OfferInventory
        if vendor_profile and variant_to_use:
            offer_res = await db.execute(
                select(VendorOffer).where(
                    VendorOffer.vendor_id == vendor_profile.id,
                    VendorOffer.product_variant_id == variant_to_use.id,
                )
            )
            existing_offer = offer_res.scalar_one_or_none()
            if not existing_offer:
                offer = VendorOffer(
                    vendor_id=vendor_profile.id,
                    product_variant_id=variant_to_use.id,
                    vendor_sku=f"VEND-{product.sku}",
                    vendor_price=product.price,
                    compare_at_vendor_price=product.compare_at_price,
                    selling_unit=SellingUnitEnum.PIECE,
                    package_quantity=1,
                    min_order_quantity=1,
                    lead_time_days=1,
                    warranty_months=12,
                    status=OfferStatusEnum.ACTIVE,
                )
                db.add(offer)
                await db.commit()
                await db.refresh(offer)

                inventory = OfferInventory(
                    vendor_offer_id=offer.id,
                    quantity_on_hand=50,
                    quantity_reserved=0,
                    low_stock_threshold=5,
                    warehouse_location="Nairobi Main Hub",
                )
                db.add(inventory)
                await db.commit()

    return product_map, products_definition


async def seed_related_products_and_bundles(db, product_map):
    """
    Establish clinical and cross-sell relationships:
    - Cross-sells: Consumables and complementary devices (e.g., Glucose meter -> Test strips, Nebulizer -> Oximeter)
    - Upsells: Premium or automated editions (e.g., Manual Bed -> Full Electric Bed, Manual Wheelchair -> Electric Wheelchair)
    - Bundles: Comprehensive care packages
    """
    relationships_to_seed = [
        # Cross-sells
        {"from": "accu-chek-instant-blood-glucose-meter", "to": "accu-chek-instant-test-strips-50pk", "type": "cross_sell"},
        {"from": "omron-compair-ne-c28p-compressor-nebulizer", "to": "yuwell-yx301-fingertip-pulse-oximeter", "type": "cross_sell"},
        {"from": "omron-m3-comfort-blood-pressure-monitor", "to": "multicheck-3in1-cholesterol-glucose-kit", "type": "cross_sell"},
        {"from": "philips-dreamstation-auto-cpap-machine", "to": "philips-dreamwear-under-nose-cpap-mask", "type": "cross_sell"},
        {"from": "medical-3-crank-deluxe-home-care-hospital-bed", "to": "alternating-pressure-anti-bedsore-air-mattress", "type": "cross_sell"},
        {"from": "medical-3-crank-deluxe-home-care-hospital-bed", "to": "drive-medical-folding-commode-chair", "type": "cross_sell"},
        {"from": "comprehensive-emergency-first-aid-kit-180pc", "to": "burnshield-emergency-burn-relief-hydrogel-kit", "type": "cross_sell"},
        {"from": "comprehensive-emergency-first-aid-kit-180pc", "to": "first-aid-rapid-digital-thermometer", "type": "cross_sell"},
        {"from": "medela-freestyle-hands-free-double-breast-pump", "to": "philips-avent-3in1-electric-steam-bottle-sterilizer", "type": "cross_sell"},
        {"from": "pocket-fetal-doppler-heartbeat-detector-3mhz", "to": "beurer-by80-digital-baby-weighing-scale", "type": "cross_sell"},

        # Upsells
        {"from": "microlife-mt1622-rapid-digital-thermometer", "to": "omron-gentle-temp-720-digital-thermometer", "type": "upsell"},
        {"from": "beurer-bm45-upper-arm-blood-pressure-monitor", "to": "omron-m3-comfort-blood-pressure-monitor", "type": "upsell"},
        {"from": "yuwell-m102-portable-mesh-nebulizer", "to": "omron-compair-ne-c28p-compressor-nebulizer", "type": "upsell"},
        {"from": "drive-medical-cruiser-iii-wheelchair", "to": "drive-medical-cirrus-plus-electric-wheelchair", "type": "upsell"},
        {"from": "beurer-gs215-digital-weighing-scale", "to": "beurer-bf720-bluetooth-body-composition-scale", "type": "upsell"},
        {"from": "medical-3-crank-deluxe-home-care-hospital-bed", "to": "drive-medical-full-electric-hospital-bed", "type": "upsell"},
    ]

    for rel in relationships_to_seed:
        p_from = product_map.get(rel["from"])
        p_to = product_map.get(rel["to"])
        if p_from and p_to:
            check = await db.execute(
                select(RelatedProduct).where(
                    RelatedProduct.product_id == p_from.id,
                    RelatedProduct.related_product_id == p_to.id,
                    RelatedProduct.relation_type == rel["type"],
                )
            )
            if not check.scalar_one_or_none():
                db.add(
                    RelatedProduct(
                        product_id=p_from.id,
                        related_product_id=p_to.id,
                        relation_type=rel["type"],
                        sort_order=0,
                        is_bidirectional=True,
                    )
                )
                await db.commit()

    # Seed Merchandising Bundles
    bundles_definition = [
        {
            "name": "Diabetes Home Management Starter Kit",
            "slug": "diabetes-home-management-kit",
            "description": "Essential diagnostic pairing of Accu-Chek Instant Blood Glucose Meter with a pack of 50 test strips.",
            "discount_type": BundleDiscountType.FIXED_AMOUNT,
            "discount_value": Decimal("900.00"),
            "components": [
                {"product_slug": "accu-chek-instant-blood-glucose-meter", "quantity": 1},
                {"product_slug": "accu-chek-instant-test-strips-50pk", "quantity": 1},
            ],
        },
        {
            "name": "Home Care Patient Recovery Suite",
            "slug": "home-care-patient-recovery-suite",
            "description": "Complete hospital bed nursing setup featuring 3-Crank Adjustable Bed, Alternating Pressure Anti-Bedsore Air Mattress, and Folding Commode Chair.",
            "discount_type": BundleDiscountType.PERCENTAGE,
            "discount_value": Decimal("10.00"),
            "components": [
                {"product_slug": "medical-3-crank-deluxe-home-care-hospital-bed", "quantity": 1},
                {"product_slug": "alternating-pressure-anti-bedsore-air-mattress", "quantity": 1},
                {"product_slug": "drive-medical-folding-commode-chair", "quantity": 1},
            ],
        },
        {
            "name": "Maternal & Newborn Welcome Care Bundle",
            "slug": "maternal-newborn-welcome-bundle",
            "description": "Everything mother and infant need: Philips Avent Steam Bottle Sterilizer, Beurer BY80 Digital Baby Scale, and BY11 Gentle Infant Thermometer.",
            "discount_type": BundleDiscountType.FIXED_AMOUNT,
            "discount_value": Decimal("2500.00"),
            "components": [
                {"product_slug": "philips-avent-3in1-electric-steam-bottle-sterilizer", "quantity": 1},
                {"product_slug": "beurer-by80-digital-baby-weighing-scale", "quantity": 1},
                {"product_slug": "beurer-by11-frog-infant-digital-thermometer", "quantity": 1},
            ],
        },
        {
            "name": "Comprehensive Home Respiratory Therapy Bundle",
            "slug": "comprehensive-home-respiratory-bundle",
            "description": "Complete respiratory therapy solution with Omron CompAIR Nebulizer, Yuwell Fingertip Pulse Oximeter, and Beurer Steam Inhaler.",
            "discount_type": BundleDiscountType.FIXED_AMOUNT,
            "discount_value": Decimal("2000.00"),
            "components": [
                {"product_slug": "omron-compair-ne-c28p-compressor-nebulizer", "quantity": 1},
                {"product_slug": "yuwell-yx301-fingertip-pulse-oximeter", "quantity": 1},
                {"product_slug": "beurer-si40-warm-mist-steam-inhaler", "quantity": 1},
            ],
        },
    ]

    for b_def in bundles_definition:
        res = await db.execute(select(Bundle).where(Bundle.slug == b_def["slug"]))
        bundle = res.scalar_one_or_none()
        if not bundle:
            print(f"Creating merchandising bundle: {b_def['name']}")
            bundle = Bundle(
                name=b_def["name"],
                slug=b_def["slug"],
                description=b_def["description"],
                discount_type=b_def["discount_type"],
                discount_value=b_def["discount_value"],
                funding_source="PLATFORM",
                is_active=True,
            )
            db.add(bundle)
            await db.commit()
            await db.refresh(bundle)

            for c_idx, comp_def in enumerate(b_def["components"]):
                p_obj = product_map.get(comp_def["product_slug"])
                if p_obj:
                    comp = BundleComponent(
                        bundle_id=bundle.id,
                        product_id=p_obj.id,
                        quantity=comp_def["quantity"],
                        sort_order=c_idx,
                    )
                    db.add(comp)
                    await db.commit()


async def seed_main():
    async with AsyncSessionLocal() as db:
        print("🌱 Starting database seeding...")
        vendor_prof = await seed_users_and_vendors(db)
        print("✓ Users and vendor profiles verified.")

        await seed_marketing_and_coupons(db)
        print("✓ Coupons and banners verified.")

        cat_lookup, categories_tree = await seed_categories(db)

        # Calculate all allowed category slugs
        allowed_cat_slugs = set()
        for cat in categories_tree:
            allowed_cat_slugs.add(cat["slug"])
            for child in cat.get("children", []):
                allowed_cat_slugs.add(child["slug"])

        mfg_map, brand_map = await seed_manufacturers_and_brands(db)
        print("✓ Manufacturers and brands verified.")

        product_map, products_def = await seed_products(db, vendor_prof, cat_lookup, brand_map, mfg_map)
        allowed_prod_slugs = {p["slug"] for p in products_def}

        # Perform cleanup of any categories or products not in allowed lists
        await cleanup_legacy_data(db, allowed_cat_slugs, allowed_prod_slugs)

        print(f"✓ {len(cat_lookup)} categories active and verified in database.")
        print(f"✓ {len(product_map)} products active and verified with image {DEFAULT_PRODUCT_IMAGE}.")

        await seed_related_products_and_bundles(db, product_map)
        print("✓ Cross-sells, upsells, and bundles seeded successfully.")

        print("✨ Database seed completed successfully!")


if __name__ == "__main__":
    asyncio.run(seed_main())


