import asyncio
import sys
from pathlib import Path

# Add the app directory to sys.path
sys.path.append(str(Path(__file__).parent / "app"))

from app.core.database import get_db
from app.domains.auth.models.user import User
from sqlalchemy import select

async def check_users():
    # Use the session directly
    from app.core.database import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(select(User))
            users = result.scalars().all()
            print(f"Found {len(users)} users.")
            for user in users:
                print(f"- ID: {user.id}, Email: {user.email}")
        except Exception as e:
            print(f"Error querying users: {e}")

if __name__ == "__main__":
    asyncio.run(check_users())
