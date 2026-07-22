import asyncio
import sys
from pathlib import Path

# Add the app directory to sys.path
sys.path.append(str(Path(__file__).parent / "app"))

# Import all models to ensure they are registered with Base
import app.domains.auth.models  # noqa
import app.domains.catalog.models  # noqa
import app.domains.vendor.models  # noqa
import app.domains.customers.models  # noqa
import app.domains.shopping.models  # noqa
import app.domains.payments.models  # noqa
import app.domains.tickets.models  # noqa
import app.domains.returns.models  # noqa
import app.domains.shared.models  # noqa

from app.core.database import AsyncSessionLocal
from app.domains.catalog.models.product import Product
from app.domains.catalog.models.category import Category
from sqlalchemy import select

async def check_catalog():
    async with AsyncSessionLocal() as db:
        try:
            # Query Categories
            cat_result = await db.execute(select(Category))
            categories = cat_result.scalars().all()
            print(f"Found {len(categories)} categories:")
            for cat in categories:
                print(f"- ID: {cat.id}, Name: {cat.name}, Slug: {cat.slug}, Is Active: {cat.is_active}")

            # Query Products
            prod_result = await db.execute(select(Product))
            products = prod_result.scalars().all()
            print(f"\nFound {len(products)} products:")
            for prod in products:
                print(f"- ID: {prod.id}, Name: {prod.name}, Slug: {prod.slug}, Status: {prod.status}, Category ID: {prod.category_id}, Is Verified: {prod.is_verified}")
        except Exception as e:
            print(f"Error querying catalog: {e}")

if __name__ == "__main__":
    asyncio.run(check_catalog())
