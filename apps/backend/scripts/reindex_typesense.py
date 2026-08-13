"""
Reindex all published & verified products into Typesense.

Run from the backend directory:
    uv run python scripts/reindex_typesense.py

This pulls every published+verified product from the DB (with category eagerly
loaded), then upserts each one into Typesense so that category_name / category_slug
are always fresh.
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.core.logging import logger
from app.domains.catalog.models.product import Product
from app.domains.catalog.services.typesense_client import TypesenseClient


async def reindex():
    typesense = TypesenseClient()

    if typesense.client is None:
        print("❌  Typesense client is disabled (TYPESENSE_API_KEY not set). Aborting.")
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Product)
            .options(
                selectinload(Product.category),
                selectinload(Product.images),
                selectinload(Product.brand_relation),
            )
            .where(
                Product.status == "published",
                Product.is_verified == True,
                Product.is_deleted == False,
            )
            .order_by(Product.created_at.desc())
        )
        products = result.scalars().all()

    total = len(products)
    print(f"📦  Found {total} published+verified products to reindex.")

    ok = 0
    failed = 0
    no_category = 0

    for i, product in enumerate(products, 1):
        cat_name = product.category.name if product.category else None
        if not cat_name:
            no_category += 1

        try:
            typesense.index_product(product)
            ok += 1
        except Exception as e:
            failed += 1
            print(f"  ⚠️  [{i}/{total}] Failed to index {product.slug}: {e}")

        # Progress every 50 products
        if i % 50 == 0 or i == total:
            print(f"  ✔  {i}/{total} processed  (ok={ok}, failed={failed})")

    print()
    print("─" * 50)
    print(f"✅  Reindex complete.")
    print(f"   Indexed:       {ok}")
    print(f"   Failed:        {failed}")
    print(f"   No category:   {no_category}  ← these products have no category in the DB")


if __name__ == "__main__":
    asyncio.run(reindex())
