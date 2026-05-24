from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.schemas.db import TableSchema, ColumnSchema, ForeignKeySchema
import structlog

log = structlog.get_logger()

_TABLES_QUERY = """
SELECT
    t.table_schema,
    t.table_name,
    pg_stat_user_tables.n_live_tup AS row_count,
    pg_total_relation_size(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name)) AS size_bytes
FROM information_schema.tables t
LEFT JOIN pg_stat_user_tables
    ON pg_stat_user_tables.schemaname = t.table_schema
    AND pg_stat_user_tables.relname = t.table_name
WHERE t.table_type = 'BASE TABLE'
  AND t.table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY t.table_schema, t.table_name;
"""

_COLUMNS_QUERY = """
SELECT
    c.table_schema,
    c.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary_key
FROM information_schema.columns c
LEFT JOIN (
    SELECT ku.table_schema, ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku
        ON tc.constraint_name = ku.constraint_name
        AND tc.table_schema = ku.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
) pk ON pk.table_schema = c.table_schema
     AND pk.table_name = c.table_name
     AND pk.column_name = c.column_name
WHERE c.table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY c.table_schema, c.table_name, c.ordinal_position;
"""

_FK_QUERY = """
SELECT
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_schema AS ref_schema,
    ccu.table_name AS ref_table,
    ccu.column_name AS ref_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_schema, tc.table_name;
"""

_INDEXES_QUERY = """
SELECT
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY schemaname, tablename;
"""


async def extract_tables(session: AsyncSession) -> list[TableSchema]:
    rows = (await session.execute(text(_TABLES_QUERY))).fetchall()
    col_rows = (await session.execute(text(_COLUMNS_QUERY))).fetchall()
    fk_rows = (await session.execute(text(_FK_QUERY))).fetchall()
    idx_rows = (await session.execute(text(_INDEXES_QUERY))).fetchall()

    # Index columns
    col_map: dict[tuple, list[ColumnSchema]] = {}
    for row in col_rows:
        key = (row.table_schema, row.table_name)
        col_map.setdefault(key, []).append(
            ColumnSchema(
                name=row.column_name,
                data_type=row.data_type,
                nullable=row.is_nullable == "YES",
                default=row.column_default,
                is_primary_key=row.is_primary_key,
            )
        )

    # Index FKs
    fk_map: dict[tuple, list[ForeignKeySchema]] = {}
    fk_cols: set = set()
    for row in fk_rows:
        key = (row.table_schema, row.table_name)
        fk_cols.add((row.table_schema, row.table_name, row.column_name))
        fk_map.setdefault(key, []).append(
            ForeignKeySchema(
                constraint_name=row.constraint_name,
                column=row.column_name,
                ref_table=row.ref_table,
                ref_column=row.ref_column,
                ref_schema=row.ref_schema,
            )
        )

    # Mark FK columns
    for key, cols in col_map.items():
        for col in cols:
            col.is_foreign_key = (key[0], key[1], col.name) in fk_cols

    # Index indexes
    idx_map: dict[tuple, list[str]] = {}
    for row in idx_rows:
        key = (row.schemaname, row.tablename)
        idx_map.setdefault(key, []).append(row.indexname)

    tables = []
    for row in rows:
        key = (row.table_schema, row.table_name)
        tables.append(
            TableSchema(
                name=row.table_name,
                schema_name=row.table_schema,
                columns=col_map.get(key, []),
                foreign_keys=fk_map.get(key, []),
                row_count=row.row_count or 0,
                size_bytes=row.size_bytes or 0,
                indexes=idx_map.get(key, []),
            )
        )

    log.info("metadata_extracted", tables=len(tables))
    return tables


async def get_schemas(session: AsyncSession) -> list[str]:
    rows = (await session.execute(text(
        "SELECT DISTINCT table_schema FROM information_schema.tables "
        "WHERE table_type='BASE TABLE' AND table_schema NOT IN "
        "('pg_catalog','information_schema','pg_toast') ORDER BY table_schema"
    ))).fetchall()
    return [r[0] for r in rows]


async def get_db_version(session: AsyncSession) -> str:
    row = (await session.execute(text("SELECT version()"))).fetchone()
    return row[0] if row else "unknown"
