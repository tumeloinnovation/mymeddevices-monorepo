import asyncio
import sys
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.domains.auth.models.user import User
from app.domains.vendor.models.vendor_profile import VendorProfile
from sqlalchemy import select


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
                    prof_result = await db.execute(
                        select(VendorProfile).where(VendorProfile.user_id == user.id)
                    )
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
                            approved_at=datetime.now(timezone.utc),
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
                            approved_at=datetime.now(timezone.utc),
                        )
                        db.add(profile)
                        await db.commit()
                    elif existing_prof.approval_status != "approved":
                        print(f"Approving existing vendor profile for user: {existing_user.email}")
                        existing_prof.approval_status = "approved"
                        existing_prof.approved_at = datetime.now(timezone.utc)
                        await db.commit()


if __name__ == "__main__":
    asyncio.run(seed())
