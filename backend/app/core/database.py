from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import text
from app.core.config import settings
import structlog

log = structlog.get_logger()

engine = create_async_engine(
    settings.async_dsn,
    pool_size=settings.db_pool_size,
    pool_timeout=settings.db_pool_timeout,
    echo=settings.debug,
)

AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


async def get_session() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session


async def test_connection() -> bool:
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return True
    except Exception as e:
        log.error("db_connection_failed", error=str(e))
        return False
