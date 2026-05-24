import { useEffect } from "react";
import { useGraphStore } from "@/store/graphStore";

export function useGraph() {
  const { fetchGraph, fetchMetrics, fetchSchemas, connected } = useGraphStore();

  useEffect(() => {
    if (!connected) return;
    fetchGraph();
    fetchMetrics();
    fetchSchemas();
  }, [connected]);

  return useGraphStore();
}
