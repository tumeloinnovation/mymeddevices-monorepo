import asyncio
import pytest
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import pool
from app.main import app
from app.core.database import Base, get_db
from app.domains.auth.models.user import User
from app.domains.vendor.models.vendor_profile import VendorProfile
from app.core.security import get_password_hash, create_access_token
from sqlalchemy import select

DATABASE_URL = "postgresql+asyncpg:///mymeddevices_test"

@pytest.fixture(scope="session")
async def engine():
    # ... (rest of engine fixture)
    import asyncpg
    conn = await asyncpg.connect("postgresql:///postgres")
    try:
        # Terminate any active connections to the test DB
        await conn.execute(
            "SELECT pg_terminate_backend(pg_stat_activity.pid) "
            "FROM pg_stat_activity "
            "WHERE pg_stat_activity.datname = 'mymeddevices_test' "
            "AND pid <> pg_backend_pid();"
        )
        await conn.execute("DROP DATABASE IF EXISTS mymeddevices_test")
        await conn.execute("CREATE DATABASE mymeddevices_test")
    except Exception:
        pass
    finally:
        await conn.close()

    # Use a session-scoped engine
    engine = create_async_engine(DATABASE_URL, poolclass=pool.NullPool)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    await engine.dispose()

@pytest.fixture
async def db(engine) -> AsyncGenerator[AsyncSession, None]:
    async_session = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with async_session() as session:
        yield session

@pytest.fixture
async def client(db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    app.dependency_overrides[get_db] = lambda: db
    
    class PrefixedClient(AsyncClient):
        async def request(self, method: str, url: any, *args: any, **kwargs: any) -> any:
            url_str = str(url)
            if url_str.startswith("/shopping") or url_str.startswith("/auth") or url_str.startswith("/payments"):
                url = f"/api/v1{url_str}"
            return await super().request(method, url, *args, **kwargs)
            
    async with PrefixedClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
async def async_client(client) -> AsyncClient:
    return client


@pytest.fixture(autouse=True)
def clear_rate_limiter():
    from app.core.rate_limiting import rate_limiter
    rate_limiter.clear()

@pytest.fixture
async def vendor_user(db: AsyncSession) -> User:
    # Check if user already exists
    stmt = select(User).where(User.email == "vendor@example.com")
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    if existing_user:
        stmt_p = select(VendorProfile).where(VendorProfile.user_id == existing_user.id)
        res_p = await db.execute(stmt_p)
        profile = res_p.scalar_one_or_none()
        if not profile:
            profile = VendorProfile(
                user_id=existing_user.id,
                store_name="Vendor Store",
                approval_status="approved"
            )
            db.add(profile)
            await db.commit()
        elif profile.approval_status != "approved":
            profile.approval_status = "approved"
            await db.commit()
        return existing_user

    user = User(
        email="vendor@example.com",
        password_hash=get_password_hash("Test123!"),
        role="vendor",
        first_name="Vendor",
        last_name="One",
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    profile = VendorProfile(
        user_id=user.id,
        store_name="Vendor Store",
        approval_status="approved"
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return user

@pytest.fixture
async def vendor_token(vendor_user: User) -> str:
    return create_access_token({"sub": str(vendor_user.id)})

@pytest.fixture
async def admin_user(db: AsyncSession) -> User:
    stmt = select(User).where(User.email == "admin@example.com")
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    if existing_user:
        return existing_user

    user = User(
        email="admin@example.com",
        password_hash=get_password_hash("Test123!"),
        role="admin",
        first_name="Admin",
        last_name="User",
        is_active=True,
        is_verified=True
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@pytest.fixture
async def admin_token(admin_user: User) -> str:
    return create_access_token({"sub": str(admin_user.id)})

