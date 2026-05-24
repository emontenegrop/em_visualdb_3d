from pydantic import BaseModel, Field
from typing import Optional


class ConnectionRequest(BaseModel):
    host: str
    port: int = 5432
    user: str
    password: str
    database: str


class ConnectionResponse(BaseModel):
    success: bool
    message: str
    version: Optional[str] = None


class ColumnSchema(BaseModel):
    name: str
    data_type: str
    nullable: bool
    default: Optional[str] = None
    is_primary_key: bool = False
    is_foreign_key: bool = False


class ForeignKeySchema(BaseModel):
    constraint_name: str
    column: str
    ref_table: str
    ref_column: str
    ref_schema: str


class TableSchema(BaseModel):
    name: str
    schema_name: str
    columns: list[ColumnSchema] = []
    foreign_keys: list[ForeignKeySchema] = []
    row_count: Optional[int] = None
    size_bytes: Optional[int] = None
    indexes: list[str] = []


class NodeSchema(BaseModel):
    id: str
    label: str
    schema_name: str
    table_name: str
    row_count: int = 0
    size_bytes: int = 0
    column_count: int = 0
    degree: int = 0
    centrality: float = 0.0
    x: float = 0.0
    y: float = 0.0
    z: float = 0.0


class EdgeSchema(BaseModel):
    id: str
    source: str
    target: str
    constraint_name: str
    source_column: str
    target_column: str
    weight: float = 1.0


class GraphSchema(BaseModel):
    nodes: list[NodeSchema]
    edges: list[EdgeSchema]
    node_count: int
    edge_count: int
    schema_count: int


class MetricsSchema(BaseModel):
    total_tables: int
    total_relationships: int
    total_schemas: int
    avg_degree: float
    max_degree: int
    isolated_tables: int
    density: float
    most_connected: list[dict]
