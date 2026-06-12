from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_dynamic_session
from app.services.metadata import extract_tables, get_schemas, get_db_version
from app.graph.builder import build_graph, graph_to_schema, compute_metrics
from app.schemas.db import (
    ConnectionRequest,
    ConnectionResponse,
    TableSchema,
    GraphSchema,
    MetricsSchema,
)
import structlog

log = structlog.get_logger()
router = APIRouter()


@router.post("/connection/test", response_model=ConnectionResponse)
async def test_db_connection(req: ConnectionRequest):
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
    from sqlalchemy import text

    dsn = (
        f"postgresql+psycopg://{req.user}:{req.password}"
        f"@{req.host}:{req.port}/{req.database}"
    )
    try:
        eng = create_async_engine(dsn, pool_size=1)
        sm = async_sessionmaker(eng)
        async with sm() as s:
            row = (await s.execute(text("SELECT version()"))).fetchone()
        await eng.dispose()
        return ConnectionResponse(success=True, message="Connected", version=row[0])
    except Exception as e:
        log.warning("connection_test_failed", error=str(e))
        return ConnectionResponse(success=False, message=str(e))


@router.get("/schemas", response_model=list[str])
async def list_schemas(session: AsyncSession = Depends(get_dynamic_session)):
    return await get_schemas(session)


@router.get("/tables", response_model=list[TableSchema])
async def list_tables(
    schema: str | None = Query(None),
    session: AsyncSession = Depends(get_dynamic_session),
):
    tables = await extract_tables(session)
    if schema:
        tables = [t for t in tables if t.schema_name == schema]
    return tables


@router.get("/table/{schema_name}/{table_name}", response_model=TableSchema)
async def get_table(
    schema_name: str,
    table_name: str,
    session: AsyncSession = Depends(get_dynamic_session),
):
    tables = await extract_tables(session)
    for t in tables:
        if t.schema_name == schema_name and t.name == table_name:
            return t
    raise HTTPException(status_code=404, detail="Table not found")


@router.get("/graph", response_model=GraphSchema)
async def get_graph(
    layout: str = Query("force", pattern="^(force|sphere)$"),
    schema: str | None = Query(None),
    session: AsyncSession = Depends(get_dynamic_session),
):
    tables = await extract_tables(session)
    if schema:
        tables = [t for t in tables if t.schema_name == schema]
    G = build_graph(tables)
    return graph_to_schema(G, layout=layout)


@router.get("/relationships")
async def get_relationships(session: AsyncSession = Depends(get_dynamic_session)):
    tables = await extract_tables(session)
    rels = []
    for t in tables:
        for fk in t.foreign_keys:
            rels.append({
                "from_schema": t.schema_name,
                "from_table": t.name,
                "from_column": fk.column,
                "to_schema": fk.ref_schema,
                "to_table": fk.ref_table,
                "to_column": fk.ref_column,
                "constraint": fk.constraint_name,
            })
    return rels


@router.get("/metrics", response_model=MetricsSchema)
async def get_metrics(session: AsyncSession = Depends(get_dynamic_session)):
    tables = await extract_tables(session)
    G = build_graph(tables)
    return compute_metrics(G)


@router.get("/health")
async def health():
    return {"status": "ok"}
