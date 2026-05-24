import { create } from "zustand";
import { GraphData, GraphNode, Table, Metrics, dbApi } from "@/services/api";

interface GraphStore {
  graphData: GraphData | null;
  selectedNode: GraphNode | null;
  selectedTable: Table | null;
  hoveredNode: string | null;
  metrics: Metrics | null;
  schemas: string[];
  activeSchema: string | null;
  layout: "force" | "sphere";
  loading: boolean;
  error: string | null;
  searchQuery: string;
  connected: boolean;

  setConnected: (v: boolean) => void;
  setLayout: (l: "force" | "sphere") => void;
  setActiveSchema: (s: string | null) => void;
  setSearchQuery: (q: string) => void;
  setHoveredNode: (id: string | null) => void;
  selectNode: (node: GraphNode | null) => void;
  fetchGraph: () => Promise<void>;
  fetchMetrics: () => Promise<void>;
  fetchSchemas: () => Promise<void>;
  fetchTableDetail: (schema: string, table: string) => Promise<void>;
}

export const useGraphStore = create<GraphStore>((set, get) => ({
  graphData: null,
  selectedNode: null,
  selectedTable: null,
  hoveredNode: null,
  metrics: null,
  schemas: [],
  activeSchema: null,
  layout: "force",
  loading: false,
  error: null,
  searchQuery: "",
  connected: false,

  setConnected: (v) => set({ connected: v }),
  setLayout: (l) => {
    set({ layout: l });
    get().fetchGraph();
  },
  setActiveSchema: (s) => {
    set({ activeSchema: s });
    get().fetchGraph();
  },
  setSearchQuery: (q) => set({ searchQuery: q }),
  setHoveredNode: (id) => set({ hoveredNode: id }),

  selectNode: (node) => {
    set({ selectedNode: node, selectedTable: null });
    if (node) {
      get().fetchTableDetail(node.schema_name, node.table_name);
    }
  },

  fetchGraph: async () => {
    const { layout, activeSchema } = get();
    set({ loading: true, error: null });
    try {
      const { data } = await dbApi.getGraph(layout, activeSchema ?? undefined);
      set({ graphData: data, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchMetrics: async () => {
    try {
      const { data } = await dbApi.getMetrics();
      set({ metrics: data });
    } catch {}
  },

  fetchSchemas: async () => {
    try {
      const { data } = await dbApi.getSchemas();
      set({ schemas: data });
    } catch {}
  },

  fetchTableDetail: async (schema, table) => {
    try {
      const { data } = await dbApi.getTable(schema, table);
      set({ selectedTable: data });
    } catch {}
  },
}));
