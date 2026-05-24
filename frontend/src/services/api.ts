import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export interface ConnectionRequest {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

export interface Column {
  name: string;
  data_type: string;
  nullable: boolean;
  default: string | null;
  is_primary_key: boolean;
  is_foreign_key: boolean;
}

export interface ForeignKey {
  constraint_name: string;
  column: string;
  ref_table: string;
  ref_column: string;
  ref_schema: string;
}

export interface Table {
  name: string;
  schema_name: string;
  columns: Column[];
  foreign_keys: ForeignKey[];
  row_count: number;
  size_bytes: number;
  indexes: string[];
}

export interface GraphNode {
  id: string;
  label: string;
  schema_name: string;
  table_name: string;
  row_count: number;
  size_bytes: number;
  column_count: number;
  degree: number;
  centrality: number;
  x: number;
  y: number;
  z: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  constraint_name: string;
  source_column: string;
  target_column: string;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  node_count: number;
  edge_count: number;
  schema_count: number;
}

export interface Metrics {
  total_tables: number;
  total_relationships: number;
  total_schemas: number;
  avg_degree: number;
  max_degree: number;
  isolated_tables: number;
  density: number;
  most_connected: { id: string; centrality: number }[];
}

export const dbApi = {
  testConnection: (req: ConnectionRequest) =>
    api.post<{ success: boolean; message: string; version?: string }>(
      "/connection/test",
      req
    ),
  getSchemas: () => api.get<string[]>("/schemas"),
  getTables: (schema?: string) =>
    api.get<Table[]>("/tables", { params: schema ? { schema } : {} }),
  getTable: (schema: string, table: string) =>
    api.get<Table>(`/table/${schema}/${table}`),
  getGraph: (layout?: string, schema?: string) =>
    api.get<GraphData>("/graph", {
      params: { ...(layout && { layout }), ...(schema && { schema }) },
    }),
  getRelationships: () => api.get("/relationships"),
  getMetrics: () => api.get<Metrics>("/metrics"),
  health: () => api.get("/health"),
};
