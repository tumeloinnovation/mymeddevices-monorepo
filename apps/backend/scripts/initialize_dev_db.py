import argparse
import asyncio
import json
import subprocess
import sys
from pathlib import Path

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import create_async_engine

# Add parent directory to sys.path so we can import from 'app'
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import app.domains.admin.models  # noqa

# Import all models to ensure they are registered with Base for drop_all/create_all
# This is critical for SQLAlchemy to know about all tables
import app.domains.auth.models  # noqa
import app.domains.catalog.models  # noqa
import app.domains.customers.models  # noqa
import app.domains.payments.models  # noqa
import app.domains.returns.models  # noqa
import app.domains.shared.models  # noqa
import app.domains.shopping.models  # noqa
import app.domains.tickets.models  # noqa
import app.domains.vendor.models  # noqa
from app.core.config import settings
from app.core.database import AsyncSessionLocal, Base
from app.core.security import get_password_hash
from app.domains.auth.models.user import User
from app.domains.catalog.models.category import Category
from app.domains.catalog.services.typesense_client import TypesenseClient

DEFAULT_CATEGORIES = [
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


async def reset_db(drop_tables: bool = True, clean_typesense: bool = True):
    """Clean the database and recreate schema."""
    if not settings.DATABASE_URL:
        print("Error: DATABASE_URL not set in environment/config")
        return

    print(f"Target Database: {settings.DATABASE_URL.split('@')[-1]}")

    engine = create_async_engine(settings.DATABASE_URL)

    if drop_tables:
        print("Dropping all tables with CASCADE...")
        async with engine.begin() as conn:
            # PostgreSQL specific robust drop using CASCADE to handle dependencies
            if "postgresql" in settings.DATABASE_URL:
                await conn.execute(
                    text("""
                    DO $$ DECLARE
                        r RECORD;
                    BEGIN
                        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
                        END LOOP;
                    END $$;
                """)
                )
            else:
                # Fallback for SQLite or others (drop_all is usually enough for SQLite)
                await conn.run_sync(Base.metadata.drop_all)
        print("All tables dropped.")

    print("Recreating schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Schema recreated.")

    await engine.dispose()

    # Clean Typesense
    if clean_typesense:
        print("Cleaning Typesense collections...")
        ts = TypesenseClient()
        if ts.client:
            try:
                collections = ts.client.collections.retrieve()
                for collection in collections:
                    name = collection["name"]
                    print(f"Deleting Typesense collection: {name}")
                    ts.client.collections[name].delete()
                print("✓ Typesense cleanup complete (collections will be recreated on demand).")
            except Exception as e:
                print(f"⚠ Warning: Could not clean Typesense: {e}")
        else:
            print("Typesense client not configured, skipping cleanup.")


async def export_categories(output_file: str):
    """Export current categories to a JSON file."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Category))
        categories = result.scalars().all()

        data = []
        for cat in categories:
            data.append(
                {
                    "name": cat.name,
                    "slug": cat.slug,
                    "description": cat.description,
                    "icon_url": cat.icon_url,
                    "sort_order": cat.sort_order,
                    "is_active": cat.is_active,
                }
            )

        with open(output_file, "w") as f:
            json.dump(data, f, indent=4)
        print(f"✓ Exported {len(data)} categories to {output_file}")


async def seed_data(admin_email: str, admin_password: str, categories_file: str = None):
    """Seed the database with initial data."""
    async with AsyncSessionLocal() as db:
        # 1. Create Admin User
        print(f"Creating admin user: {admin_email}...")
        admin = User(
            email=admin_email,
            password_hash=get_password_hash(admin_password),
            role="admin",
            first_name="System",
            last_name="Admin",
            is_active=True,
            is_verified=True,
        )
        db.add(admin)

        # 2. Seed Categories
        categories_to_seed = DEFAULT_CATEGORIES
        if categories_file:
            try:
                with open(categories_file) as f:
                    categories_to_seed = json.load(f)
                print(f"Loaded {len(categories_to_seed)} categories from {categories_file}")
            except Exception as e:
                print(f"Warning: Could not load categories from {categories_file}: {e}")
                print("Falling back to default categories.")

        print("Seeding categories...")
        total_seeded = 0
        for p_idx, cat_data in enumerate(categories_to_seed, 1):
            parent = Category(
                name=cat_data["name"],
                slug=cat_data.get("slug") or cat_data["name"].lower().replace(" ", "-"),
                description=cat_data.get("description"),
                icon_url=cat_data.get("icon_url"),
                sort_order=cat_data.get("sort_order", p_idx),
                is_active=cat_data.get("is_active", True),
                parent_id=None,
            )
            db.add(parent)
            await db.flush()
            total_seeded += 1

            for c_idx, child_data in enumerate(cat_data.get("children", []), 1):
                child = Category(
                    name=child_data["name"],
                    slug=child_data.get("slug") or child_data["name"].lower().replace(" ", "-"),
                    description=child_data.get("description"),
                    icon_url=child_data.get("icon_url"),
                    sort_order=child_data.get("sort_order", c_idx),
                    is_active=child_data.get("is_active", True),
                    parent_id=parent.id,
                )
                db.add(child)
                total_seeded += 1

        try:
            await db.commit()
            print("✓ Database initialization complete.")
            print(f"✓ Admin account: {admin_email} / {admin_password}")
            print(f"✓ Categories seeded: {total_seeded}")

            # Stamp Alembic to head so migrations are in sync
            print("Stamping Alembic migration status...")
            try:
                subprocess.run(
                    ["alembic", "stamp", "head"],
                    cwd=str(Path(__file__).resolve().parent.parent),
                    check=True,
                    capture_output=True,
                )
                print("✓ Alembic stamped at head.")
            except Exception as e:
                print(f"⚠ Warning: Could not stamp Alembic (migrations might be out of sync): {e}")

        except Exception as e:
            await db.rollback()
            print(f"✗ Error during seeding: {e}")


async def main():
    parser = argparse.ArgumentParser(description="Clean and initialize the developer database.")
    parser.add_argument("--no-drop", action="store_true", help="Don't drop tables, only create missing ones and seed.")
    parser.add_argument("--no-typesense", action="store_true", help="Don't clean Typesense collections.")
    parser.add_argument(
        "--email", default="admin@mymeddevices.com", help="Admin email (default: admin@mymeddevices.com)"
    )
    parser.add_argument("--password", default="Admin123!", help="Admin password (default: Admin123!)")
    parser.add_argument("--categories", help="Path to a JSON file containing categories list")
    parser.add_argument("--export-categories", help="Export current categories to specified JSON file and exit")

    args = parser.parse_args()

    # Handle export first
    if args.export_categories:
        await export_categories(args.export_categories)
        return

    # Confirmation for non-test environments
    if settings.ENVIRONMENT == "production":
        confirm = input(
            "DANGER: You are targeting a PRODUCTION environment. Are you sure you want to proceed? (yes/no): "
        )
        if confirm.lower() != "yes":
            print("Aborted.")
            return

    await reset_db(drop_tables=not args.no_drop, clean_typesense=not args.no_typesense)
    await seed_data(args.email, args.password, args.categories)


if __name__ == "__main__":
    asyncio.run(main())
