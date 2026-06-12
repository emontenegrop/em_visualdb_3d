from fastapi import Header, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
import structlog

log = structlog.get_logger()


async def get_dynamic_session(
    x_db_host: str = Header(...),
    x_db_port: str = Header(default="5432"),
    x_db_user: str = Header(...),
    x_db_password: str = Header(...),
    x_db_name: str = Header(...),
):
    dsn = (
        f"postgresql+psycopg://{x_db_user}:{x_db_password}"
        f"@{x_db_host}:{x_db_port}/{x_db_name}"
    )
    engine = create_async_engine(dsn, pool_size=1, pool_pre_ping=True)
    sm = async_sessionmaker(engine, expire_on_commit=False)
    try:
        async with sm() as session:
            yield session
    except Exception as e:
        log.error("dynamic_session_failed", error=str(e))
        raise HTTPException(status_code=503, detail=f"Database connection failed: {e}")
    finally:
        await engine.dispose()
