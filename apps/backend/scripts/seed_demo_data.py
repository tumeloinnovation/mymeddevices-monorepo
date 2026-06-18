import asyncio
import sys
import json
from pathlib import Path
from datetime import datetime, timezone

# Add the parent directory to sys.path so we can import from 'app'
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.domains.auth.models.user import User
from app.domains.vendor.models.vendor_profile import VendorProfile
from app.domains.catalog.models.product import Product
from app.domains.customers.models.customer_profile import CustomerProfile
from sqlalchemy import select

JSON_FILE_PATH = "/Users/nickm/Downloads/woocommerce-export-2026-06-14-03-15-14.json"

# Test vendor configuration
TEST_VENDORS = [
    {
        "email": "vendor@mymeddevices.com",
        "password": "password123",
        "first_name": "Global",
        "last_name": "MedSupply",
        "company_name": "Global Med Supply Co.",
        "store_name": "Global Med Supply Co.",
        "phone": "+254711111111",
        "business_email": "vendor@mymeddevices.com",
        "business_phone": "+254711111111",
    },
    {
        "email": "vendor2@mymeddevices.com",
        "password": "password123",
        "first_name": "MedTech",
        "last_name": "Solutions",
        "company_name": "MedTech Solutions Ltd",
        "store_name": "MedTech Solutions",
        "phone": "+254722222222",
        "business_email": "vendor2@mymeddevices.com",
        "business_phone": "+254722222222",
    },
]


async def get_or_create_test_vendor(db: AsyncSessionLocal, vendor_config: dict) -> VendorProfile:
    """Get existing vendor profile or create a new one."""
    # Check if user exists
    result = await db.execute(select(User).where(User.email == vendor_config["email"]))
    user = result.scalar_one_or_none()

    if not user:
        print(f"Creating test vendor user: {vendor_config['email']}")
        user = User(
            email=vendor_config["email"],
            password_hash=get_password_hash(vendor_config["password"]),
            role="vendor",
            first_name=vendor_config["first_name"],
            last_name=vendor_config["last_name"],
            phone=vendor_config["phone"],
            company_name=vendor_config["company_name"],
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # Check if vendor profile exists
    prof_result = await db.execute(
        select(VendorProfile).where(VendorProfile.user_id == user.id)
    )
    profile = prof_result.scalar_one_or_none()

    if not profile:
        print(f"Creating vendor profile for: {vendor_config['email']}")
        profile = VendorProfile(
            user_id=user.id,
            store_name=vendor_config["store_name"],
            company_name=vendor_config["company_name"],
            business_email=vendor_config["business_email"],
            business_phone=vendor_config["business_phone"],
            approval_status="approved",
            approved_at=datetime.now(timezone.utc),
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    elif profile.approval_status != "approved":
        print(f"Approving vendor profile for: {vendor_config['email']}")
        profile.approval_status = "approved"
        profile.approved_at = datetime.now(timezone.utc)
        await db.commit()

    return profile


async def seed():
    with open(JSON_FILE_PATH, 'r') as f:
        data = json.load(f)

    all_products = data['products']
    print(f"Total products in export: {len(all_products)}")

    async with AsyncSessionLocal() as db:
        # Get or create both test vendors
        vendor1_profile = await get_or_create_test_vendor(db, TEST_VENDORS[0])
        vendor2_profile = await get_or_create_test_vendor(db, TEST_VENDORS[1])

        test_vendors = [
            (TEST_VENDORS[0]["email"], vendor1_profile),
            (TEST_VENDORS[1]["email"], vendor2_profile),
        ]

        # Distribute products between the two vendors
        created_count = 0
        updated_count = 0
        skipped_count = 0

        for idx, p_data in enumerate(all_products):
            # Alternate between vendors
            vendor_email, vendor_profile = test_vendors[idx % 2]
            slug = p_data['permalink'].split('/')[-2]

            # Check if product already exists
            existing_result = await db.execute(
                select(Product).where(Product.slug == slug)
            )
            existing_product = existing_result.scalar_one_or_none()

            if existing_product:
                # Update existing product and reassign to test vendor
                print(f"Updating existing product: {p_data['name']} -> {vendor_email}")
                existing_product.vendor_id = vendor_profile.id
                existing_product.name = p_data['name']
                existing_product.description = p_data.get('description') or p_data['name']
                existing_product.short_description = p_data.get('short_description')
                existing_product.price = float(p_data['price']) if p_data['price'] else 0.0
                existing_product.stock_quantity = p_data.get('stock_quantity', 0)
                existing_product.status = "published"
                existing_product.is_verified = True
                updated_count += 1
            else:
                print(f"Creating new product: {p_data['name']} -> {vendor_email}")
                product = Product(
                    vendor_id=vendor_profile.id,
                    name=p_data['name'],
                    slug=slug,
                    description=p_data.get('description') or p_data['name'],
                    short_description=p_data.get('short_description'),
                    price=float(p_data['price']) if p_data['price'] else 0.0,
                    stock_quantity=p_data.get('stock_quantity', 0),
                    status="published",
                    is_verified=True,
                )
                db.add(product)
                created_count += 1

        await db.commit()
        print(f"\n=== Summary ===")
        print(f"Test vendor 1: {TEST_VENDORS[0]['email']} ({vendor1_profile.store_name})")
        print(f"Test vendor 2: {TEST_VENDORS[1]['email']} ({vendor2_profile.store_name})")
        print(f"Products created: {created_count}")
        print(f"Products updated: {updated_count}")
        print(f"Total products processed: {created_count + updated_count}")


if __name__ == "__main__":
    asyncio.run(seed())
