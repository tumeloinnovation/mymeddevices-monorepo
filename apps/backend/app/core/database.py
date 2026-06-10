import time
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event
from .logging import logger
from pydantic_settings import BaseSettings

class DatabaseSettings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://nickm@localhost:5432/mymeddevices"
    ECHO_SQL: bool = False

settings = DatabaseSettings()

engine = create_async_engine(settings.DATABASE_URL, echo=settings.ECHO_SQL)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session

# Beautiful SQL Logging
@event.listens_for(engine.sync_engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault("query_start_time", []).append(time.time())
    logger.debug(f"SQL Query: {statement}")

@event.listens_for(engine.sync_engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total_time = time.time() - conn.info["query_start_time"].pop(-1)
    logger.debug(f"SQL Finished: {total_time:.4f}s")
