import asyncio
import sys
from datetime import UTC, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from decimal import Decimal

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.domains.auth.models.user import User
from app.domains.shopping.models.banner import Banner, BannerPlacement, BannerStatus
from app.domains.shopping.models.coupon import Coupon, CouponRestriction
from app.domains.vendor.models.vendor_profile import VendorProfile


async def seed():
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
    ]

    async with AsyncSessionLocal() as db:
        for u_data in users_to_create:
            result = await db.execute(select(User).where(User.email == u_data["email"]))
            existing_user = result.scalar_one_or_none()

            if not existing_user:
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
                    # Check if profile exists
                    prof_result = await db.execute(select(VendorProfile).where(VendorProfile.user_id == user.id))
                    existing_prof = prof_result.scalar_one_or_none()

                    if not existing_prof:
                        print(f"Creating approved vendor profile for user: {user.email}")
                        profile = VendorProfile(
                            user_id=user.id,
                            store_name=u_data["company_name"],
                            company_name=u_data["company_name"],
                            business_email=u_data["email"],
                            business_phone=u_data["phone"],
                            approval_status="approved",
                            approved_at=datetime.now(UTC),
                        )
                        db.add(profile)
                        await db.commit()
            else:
                print(f"User already exists: {u_data['email']}")
                # If it's a vendor, check/ensure they have an approved profile
                if u_data["role"] == "vendor":
                    prof_result = await db.execute(
                        select(VendorProfile).where(VendorProfile.user_id == existing_user.id)
                    )
                    existing_prof = prof_result.scalar_one_or_none()
                    if not existing_prof:
                        print(f"Creating missing approved vendor profile for existing user: {existing_user.email}")
                        profile = VendorProfile(
                            user_id=existing_user.id,
                            store_name=u_data["company_name"],
                            company_name=u_data["company_name"],
                            business_email=u_data["email"],
                            business_phone=u_data["phone"],
                            approval_status="approved",
                            approved_at=datetime.now(UTC),
                        )
                        db.add(profile)
                        await db.commit()
                    elif existing_prof.approval_status != "approved":
                        print(f"Approving existing vendor profile for user: {existing_user.email}")
                        existing_prof.approval_status = "approved"
                        existing_prof.approved_at = datetime.now(UTC)
                        await db.commit()

        # Seed Coupons
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

        # Seed Banners
        banners_to_seed = [
            {
                "title": "⚡ Free Delivery on orders over KES 50,000 across Kenya!",
                "placement": BannerPlacement.HEADER_BAR,
                "status": BannerStatus.ACTIVE,
                "background_color": "#0284c7",
                "text_color": "#ffffff",
                "priority": 10,
                "is_dismissible": True,
                "show_close_button": True,
            },
            {
                "title": "Certified Medical Equipment & Hospital Supplies",
                "description": "Directly from verified manufacturers with full regulatory approval (KMPDB & PPB certified)",
                "cta_text": "Browse All Devices",
                "cta_link": "/products",
                "cta_target": "_self",
                "placement": BannerPlacement.HOMEPAGE_HERO,
                "status": BannerStatus.ACTIVE,
                "background_color": "#0f172a",
                "text_color": "#38bdf8",
                "priority": 10,
                "is_dismissible": False,
                "show_close_button": False,
            },
            {
                "title": "Special Promotion: 10% OFF First Order",
                "description": "Use coupon code MEDWELCOME at checkout for instant savings",
                "cta_text": "Claim Offer",
                "cta_link": "/products",
                "cta_target": "_self",
                "placement": BannerPlacement.HOMEPAGE_HERO,
                "status": BannerStatus.ACTIVE,
                "background_color": "#1e293b",
                "text_color": "#ffffff",
                "priority": 5,
                "is_dismissible": False,
                "show_close_button": False,
            },
        ]

        for b_data in banners_to_seed:
            res = await db.execute(
                select(Banner).where(Banner.title == b_data["title"], Banner.placement == b_data["placement"])
            )
            existing_b = res.scalar_one_or_none()
            if not existing_b:
                print(f"Creating banner: {b_data['title']}")
                banner = Banner(**b_data)
                db.add(banner)
                await db.commit()


if __name__ == "__main__":
    asyncio.run(seed())
