import asyncio
from app.core.database import engine
from sqlalchemy import text

async def publish_products():
    async with engine.begin() as conn:
        # Get vendor profile IDs
        v1_result = await conn.execute(text("SELECT id FROM vendor_profiles WHERE user_id = '9c488fcd-33e4-4bfa-b7b4-73d80ca38246'"))
        v1_profile_id = v1_result.scalar()

        v2_result = await conn.execute(text("SELECT id FROM vendor_profiles WHERE user_id = 'd16c4711-39f8-468f-9c2c-a9772b955501'"))
        v2_profile_id = v2_result.scalar()

        print(f"Vendor1 Profile ID: {v1_profile_id}")
        print(f"Vendor2 Profile ID: {v2_profile_id}")

        # Publish 2 products from each vendor
        # First get the product IDs
        v1_products = await conn.execute(text(f"SELECT id FROM products WHERE vendor_id = '{v1_profile_id}' ORDER BY created_at LIMIT 2"))
        v1_ids = [str(row[0]) for row in v1_products]

        v2_products = await conn.execute(text(f"SELECT id FROM products WHERE vendor_id = '{v2_profile_id}' ORDER BY created_at LIMIT 2"))
        v2_ids = [str(row[0]) for row in v2_products]

        all_ids = v1_ids + v2_ids
        print(f'Publishing {len(all_ids)} products')

        # Update the products
        if all_ids:
            ids_str = ', '.join(f"'{id}'" for id in all_ids)
            result = await conn.execute(text(f'''
                UPDATE products
                SET status = 'published', is_verified = true, updated_at = NOW()
                WHERE id IN ({ids_str})
                RETURNING name, status
            '''))
            print('Published products:')
            for row in result:
                print(f'  ✓ {row[0]} - {row[1]}')

asyncio.run(publish_products())
