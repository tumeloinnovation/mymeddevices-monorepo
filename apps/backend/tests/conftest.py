import os
from collections.abc import AsyncGenerator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.database import Base, get_db
from app.main import app

# Pure PostgreSQL test database configuration
TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "postgresql+asyncpg:///mymeddevices_test")

engine_test = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    poolclass=NullPool,
)
TestingSessionLocal = async_sessionmaker(engine_test, expire_on_commit=False, class_=AsyncSession)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_test_database():
    """Ensure database schema is up-to-date once per test run."""
    async with engine_test.begin() as conn:
        await conn.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        await conn.execute(text("CREATE SCHEMA public"))
        await conn.execute(text("CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1000"))
        await conn.run_sync(Base.metadata.create_all)
    yield


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Fixture providing an isolated PostgreSQL database session for each test.
    Cleans up tables after each test to guarantee zero cross-test contamination.
    """
    from app.core.rate_limiting import rate_limiter

    rate_limiter._requests.clear()
    rate_limiter._limits = rate_limiter._default_limits.copy()

    async with TestingSessionLocal() as session:
        yield session

    rate_limiter._requests.clear()
    rate_limiter._limits = rate_limiter._default_limits.copy()

    # Fresh connection to truncate tables cleanly in PostgreSQL
    async with engine_test.begin() as conn:
        table_names = [table.name for table in Base.metadata.sorted_tables]
        if table_names:
            tables_str = ", ".join(f'"{name}"' for name in table_names)
            await conn.execute(text(f"TRUNCATE TABLE {tables_str} RESTART IDENTITY CASCADE;"))


@pytest_asyncio.fixture(scope="function")
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Fixture providing an AsyncClient configured with test database override."""

    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
