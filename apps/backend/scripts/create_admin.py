import asyncio
import argparse
import getpass
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.domains.auth.models.user import User
from app.domains.vendor.models.vendor_profile import VendorProfile
from app.domains.auth.models.token_device import RefreshToken, UserDevice
from app.domains.auth.models.otp import OTP
from sqlalchemy import select


async def main():
    parser = argparse.ArgumentParser(description="Create an admin user")
    parser.add_argument("--email", "-e", help="Admin email address")
    parser.add_argument("--password", "-p", help="Admin password (omit to be prompted)")
    args = parser.parse_args()

    email = args.email or input("Admin email: ").strip()
    if not email:
        print("Error: Email is required", file=sys.stderr)
        sys.exit(1)

    password = args.password
    if not password:
        password = getpass.getpass("Password: ")
    if not password:
        print("Error: Password is required", file=sys.stderr)
        sys.exit(1)

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none():
            print(f"Error: User with email '{email}' already exists", file=sys.stderr)
            sys.exit(1)

        user = User(
            email=email,
            password_hash=get_password_hash(password),
            role="admin",
            is_active=True,
            is_verified=True,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    print(f"Admin user created: {user.id} ({email})")


if __name__ == "__main__":
    asyncio.run(main())
