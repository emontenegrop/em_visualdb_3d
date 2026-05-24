import { useGraphStore } from "@/store/graphStore";

export default function MetricsBar() {
  const { metrics } = useGraphStore();
  if (!metrics) return null;

  const items = [
    { label: "Tables", value: metrics.total_tables, color: "text-cyber-primary" },
    { label: "Relations", value: metrics.total_relationships, color: "text-cyber-secondary" },
    { label: "Schemas", value: metrics.total_schemas, color: "text-emerald-400" },
    { label: "Avg Degree", value: metrics.avg_degree, color: "text-cyber-text" },
    { label: "Isolated", value: metrics.isolated_tables, color: "text-yellow-400" },
  ];

  return (
    <div className="glass rounded-xl px-4 py-2 flex gap-6 items-center">
      {items.map(({ label, value, color }) => (
        <div key={label} className="text-center">
          <p className={`${color} text-sm font-mono font-semibold`}>{value}</p>
          <p className="text-cyber-muted text-xs">{label}</p>
        </div>
      ))}
    </div>
  );
}
