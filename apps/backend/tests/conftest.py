import asyncio
import pytest
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import pool
from app.main import app
from app.core.database import Base, get_db

DATABASE_URL = "postgresql+asyncpg://nickm@localhost:5432/mymeddevices_test"

@pytest.fixture(scope="session")
def event_loop_policy():
    return asyncio.get_event_loop_policy()

@pytest.fixture(scope="session")
async def engine():
    # Setup test DB
    import asyncpg
    conn = await asyncpg.connect("postgresql://nickm@localhost:5432/postgres")
    try:
        await conn.execute("CREATE DATABASE mymeddevices_test")
    except:
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
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
