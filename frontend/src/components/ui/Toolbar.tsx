import { useGraphStore } from "@/store/graphStore";

export default function Toolbar() {
  const {
    layout,
    setLayout,
    schemas,
    activeSchema,
    setActiveSchema,
    searchQuery,
    setSearchQuery,
    graphData,
    metrics,
  } = useGraphStore();

  return (
    <div className="glass rounded-xl px-4 py-3 flex items-center gap-4 flex-wrap">
      {/* Search */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search tables..."
        className="bg-cyber-bg border border-cyber-border rounded px-3 py-1.5
                   text-cyber-text text-sm font-mono w-48
                   focus:outline-none focus:border-cyber-primary transition-colors"
      />

      {/* Schema filter */}
      <select
        value={activeSchema ?? ""}
        onChange={(e) => setActiveSchema(e.target.value || null)}
        className="bg-cyber-bg border border-cyber-border rounded px-3 py-1.5
                   text-cyber-text text-sm font-mono
                   focus:outline-none focus:border-cyber-primary transition-colors"
      >
        <option value="">All schemas</option>
        {schemas.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* Layout toggle */}
      <div className="flex gap-1">
        {(["force", "sphere"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLayout(l)}
            className={`px-3 py-1.5 rounded text-xs font-mono uppercase tracking-wider transition-colors ${
              layout === l
                ? "bg-cyber-primary text-cyber-bg"
                : "border border-cyber-border text-cyber-muted hover:text-cyber-text"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Stats */}
      {graphData && (
        <div className="flex gap-4 ml-auto text-xs font-mono text-cyber-muted">
          <span>
            <span className="text-cyber-primary">{graphData.node_count}</span> tables
          </span>
          <span>
            <span className="text-cyber-secondary">{graphData.edge_count}</span> relations
          </span>
          {metrics && (
            <span>
              density{" "}
              <span className="text-cyber-accent">{metrics.density}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
