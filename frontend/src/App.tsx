import { Suspense } from "react";
import { useGraphStore } from "@/store/graphStore";
import GraphScene from "@/scenes/GraphScene";
import ConnectionPanel from "@/components/panels/ConnectionPanel";
import TableDetailPanel from "@/components/panels/TableDetailPanel";
import Toolbar from "@/components/ui/Toolbar";
import MetricsBar from "@/components/ui/MetricsBar";

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-cyber-bg/60 z-20">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-cyber-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-cyber-muted text-sm font-mono">Building graph...</p>
      </div>
    </div>
  );
}

export default function App() {
  const { connected, loading } = useGraphStore();

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-cyber-bg">
      {/* 3D Canvas — always rendered */}
      <div className="absolute inset-0">
        <Suspense fallback={null}>
          <GraphScene />
        </Suspense>
      </div>

      {loading && <LoadingOverlay />}

      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-3">
        <div className="glass rounded-xl px-4 py-2">
          <span className="text-cyber-primary font-mono font-semibold tracking-widest uppercase text-sm">
            VisualDB
          </span>
          <span className="text-cyber-muted font-mono text-xs ml-2">3D</span>
        </div>

        {connected && <Toolbar />}
      </div>

      {/* Bottom metrics */}
      {connected && (
        <div className="absolute bottom-4 left-4 z-10">
          <MetricsBar />
        </div>
      )}

      {/* Connection panel — centered when not connected */}
      {!connected && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <ConnectionPanel />
        </div>
      )}

      {/* Right panel — table detail */}
      <div className="absolute top-20 right-4 z-10">
        <TableDetailPanel />
      </div>
    </div>
  );
}
