import asyncio
from app.core.database import engine
from sqlalchemy import text

async def check_products():
    async with engine.connect() as conn:
        result = await conn.execute(text("""
            SELECT p.name, p.status, p.is_verified, vp.store_name
            FROM products p
            JOIN vendor_profiles vp ON p.vendor_id = vp.id
            ORDER BY p.created_at DESC
            LIMIT 10
        """))
        print("Products in database:")
        for row in result:
            print(f"  - {row[0]} | Status: {row[1]} | Verified: {row[2]} | Vendor: {row[3]}")

asyncio.run(check_products())
