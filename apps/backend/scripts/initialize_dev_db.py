import asyncio
import sys
import argparse
import json
import subprocess
from pathlib import Path
from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import create_async_engine

# Add parent directory to sys.path so we can import from 'app'
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings
from app.core.database import Base, AsyncSessionLocal
from app.core.security import get_password_hash
from app.domains.catalog.services.typesense_client import TypesenseClient

# Import all models to ensure they are registered with Base for drop_all/create_all
# This is critical for SQLAlchemy to know about all tables
import app.domains.auth.models  # noqa
import app.domains.catalog.models  # noqa
import app.domains.vendor.models  # noqa
import app.domains.customers.models  # noqa
import app.domains.shopping.models  # noqa
import app.domains.payments.models  # noqa
import app.domains.tickets.models  # noqa
import app.domains.returns.models  # noqa
import app.domains.shared.models  # noqa
import app.domains.admin.models  # noqa

from app.domains.auth.models.user import User
from app.domains.catalog.models.category import Category

DEFAULT_CATEGORIES = [
    {"name": "Diagnostic Equipment", "slug": "diagnostic-equipment"},
    {"name": "Surgical Instruments", "slug": "surgical-instruments"},
    {"name": "Hospital Furniture", "slug": "hospital-furniture"},
    {"name": "Dental Supplies", "slug": "dental-supplies"},
    {"name": "Laboratory Equipment", "slug": "laboratory-equipment"},
    {"name": "Emergency & First Aid", "slug": "emergency-first-aid"},
    {"name": "Patient Care", "slug": "patient-care"},
    {"name": "Imaging & X-Ray", "slug": "imaging-x-ray"},
    {"name": "Medical Consumables", "slug": "medical-consumables"},
    {"name": "Rehabilitation Aids", "slug": "rehabilitation-aids"},
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
                await conn.execute(text("""
                    DO $$ DECLARE
                        r RECORD;
                    BEGIN
                        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                            EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
                        END LOOP;
                    END $$;
                """))
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
                    name = collection['name']
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
            data.append({
                "name": cat.name,
                "slug": cat.slug,
                "description": cat.description,
                "icon_url": cat.icon_url,
                "sort_order": cat.sort_order,
                "is_active": cat.is_active
            })
            
        with open(output_file, 'w') as f:
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
            is_verified=True
        )
        db.add(admin)
        
        # 2. Seed Categories
        categories_to_seed = DEFAULT_CATEGORIES
        if categories_file:
            try:
                with open(categories_file, 'r') as f:
                    categories_to_seed = json.load(f)
                print(f"Loaded {len(categories_to_seed)} categories from {categories_file}")
            except Exception as e:
                print(f"Warning: Could not load categories from {categories_file}: {e}")
                print("Falling back to default categories.")

        print(f"Seeding {len(categories_to_seed)} categories...")
        for cat_data in categories_to_seed:
            category = Category(
                name=cat_data["name"],
                slug=cat_data.get("slug") or cat_data["name"].lower().replace(" ", "-"),
                description=cat_data.get("description"),
                icon_url=cat_data.get("icon_url"),
                sort_order=cat_data.get("sort_order", 0),
                is_active=cat_data.get("is_active", True)
            )
            db.add(category)
            
        try:
            await db.commit()
            print("✓ Database initialization complete.")
            print(f"✓ Admin account: {admin_email} / {admin_password}")
            print(f"✓ Categories seeded: {len(categories_to_seed)}")
            
            # Stamp Alembic to head so migrations are in sync
            print("Stamping Alembic migration status...")
            try:
                subprocess.run(
                    ["alembic", "stamp", "head"],
                    cwd=str(Path(__file__).resolve().parent.parent),
                    check=True,
                    capture_output=True
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
    parser.add_argument("--email", default="admin@mymeddevices.com", help="Admin email (default: admin@mymeddevices.com)")
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
        confirm = input("DANGER: You are targeting a PRODUCTION environment. Are you sure you want to proceed? (yes/no): ")
        if confirm.lower() != "yes":
            print("Aborted.")
            return

    await reset_db(drop_tables=not args.no_drop, clean_typesense=not args.no_typesense)
    await seed_data(args.email, args.password, args.categories)

if __name__ == "__main__":
    asyncio.run(main())
