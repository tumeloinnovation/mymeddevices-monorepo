import time
from collections.abc import AsyncGenerator
from typing import Any, cast

from sqlalchemy import CursorResult, MetaData, Result, event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

from .logging import logger

POSTGRES_INDEXES_NAMING_CONVENTION = {
    "ix": "%(column_0_label)s_idx",
    "uq": "%(table_name)s_%(column_0_name)s_key",
    "ck": "%(table_name)s_%(constraint_name)s_check",
    "fk": "%(table_name)s_%(column_0_name)s_fkey",
    "pk": "%(table_name)s_pkey",
}

# Safe fallback for import time or if DATABASE_URL is not set
if not settings.DATABASE_URL:
    db_url = "sqlite+aiosqlite:///:memory:"
else:
    db_url = settings.DATABASE_URL

# Configure engine options (pooling is only supported by PostgreSQL/MySQL, not SQLite)
engine_kwargs: dict[str, Any] = {"echo": settings.ECHO_SQL}
if db_url.startswith("postgresql") or db_url.startswith("postgres"):
    engine_kwargs.update(
        {
            "pool_size": settings.DB_POOL_SIZE,
            "max_overflow": settings.DB_MAX_OVERFLOW,
            "pool_recycle": settings.DB_POOL_RECYCLE,
            "pool_pre_ping": settings.DB_POOL_PRE_PING,
        }
    )

engine = create_async_engine(db_url, **engine_kwargs)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=POSTGRES_INDEXES_NAMING_CONVENTION)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


def result_rowcount(result: Result[Any]) -> int:
    """Return the number of rows affected by a DML execution."""
    return cast(CursorResult, result).rowcount or 0


# Beautiful SQL Logging
@event.listens_for(engine.sync_engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault("query_start_time", []).append(time.time())
    logger.debug(f"SQL Query: {statement}")


@event.listens_for(engine.sync_engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total_time = time.time() - conn.info["query_start_time"].pop(-1)
    logger.debug(f"SQL Finished: {total_time:.4f}s")
