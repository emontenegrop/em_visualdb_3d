import { motion, AnimatePresence } from "framer-motion";
import { useGraphStore } from "@/store/graphStore";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export default function TableDetailPanel() {
  const { selectedNode, selectedTable, selectNode } = useGraphStore();

  return (
    <AnimatePresence>
      {selectedNode && (
        <motion.div
          key={selectedNode.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="glass rounded-xl p-5 w-80 max-h-[80vh] overflow-y-auto"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-cyber-muted text-xs uppercase tracking-wider">
                {selectedNode.schema_name}
              </p>
              <h3 className="text-cyber-primary font-mono text-base font-semibold">
                {selectedNode.table_name}
              </h3>
            </div>
            <button
              onClick={() => selectNode(null)}
              className="text-cyber-muted hover:text-cyber-text text-lg leading-none"
            >
              ×
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              { label: "Rows", value: selectedNode.row_count.toLocaleString() },
              { label: "Size", value: formatBytes(selectedNode.size_bytes) },
              { label: "Columns", value: selectedNode.column_count },
              { label: "Degree", value: selectedNode.degree },
              {
                label: "Centrality",
                value: selectedNode.centrality.toFixed(3),
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-cyber-bg rounded p-2 border border-cyber-border"
              >
                <p className="text-cyber-muted text-xs">{label}</p>
                <p className="text-cyber-text text-sm font-mono">{value}</p>
              </div>
            ))}
          </div>

          {/* Columns */}
          {selectedTable && (
            <>
              <p className="text-cyber-muted text-xs uppercase tracking-wider mb-2">
                Columns
              </p>
              <div className="space-y-1 mb-4">
                {selectedTable.columns.map((col) => (
                  <div
                    key={col.name}
                    className="flex items-center justify-between text-xs font-mono
                               py-1 px-2 rounded bg-cyber-bg border border-cyber-border"
                  >
                    <span className="flex items-center gap-1">
                      {col.is_primary_key && (
                        <span className="text-yellow-400">PK</span>
                      )}
                      {col.is_foreign_key && !col.is_primary_key && (
                        <span className="text-cyber-secondary">FK</span>
                      )}
                      <span className="text-cyber-text">{col.name}</span>
                    </span>
                    <span className="text-cyber-muted">{col.data_type}</span>
                  </div>
                ))}
              </div>

              {/* Foreign keys */}
              {selectedTable.foreign_keys.length > 0 && (
                <>
                  <p className="text-cyber-muted text-xs uppercase tracking-wider mb-2">
                    Foreign Keys
                  </p>
                  <div className="space-y-1">
                    {selectedTable.foreign_keys.map((fk) => (
                      <div
                        key={fk.constraint_name}
                        className="text-xs font-mono py-1 px-2 rounded
                                   bg-cyber-bg border border-cyber-border"
                      >
                        <span className="text-cyber-secondary">{fk.column}</span>
                        <span className="text-cyber-muted"> → </span>
                        <span className="text-cyber-primary">
                          {fk.ref_schema}.{fk.ref_table}.{fk.ref_column}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
