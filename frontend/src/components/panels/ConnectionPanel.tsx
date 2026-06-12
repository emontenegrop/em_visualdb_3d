import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { dbApi, setConnectionHeaders, ConnectionRequest } from "@/services/api";
import { useGraphStore } from "@/store/graphStore";

const DEFAULT: ConnectionRequest = {
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "",
  database: "postgres",
};

export default function ConnectionPanel() {
  const [form, setForm] = useState<ConnectionRequest>(DEFAULT);
  const [status, setStatus] = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [message, setMessage] = useState("");
  const { setConnected, fetchGraph, fetchSchemas, fetchMetrics } =
    useGraphStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.name === "port" ? Number(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [e.target.name]: val }));
  };

  const handleConnect = async () => {
    setStatus("testing");
    try {
      const { data } = await dbApi.testConnection(form);
      if (data.success) {
        setConnectionHeaders(form);
        setStatus("ok");
        setMessage(data.version ?? "Connected");
        setConnected(true);
        await Promise.all([fetchGraph(), fetchSchemas(), fetchMetrics()]);
      } else {
        setStatus("fail");
        setMessage(data.message);
      }
    } catch (e: any) {
      setStatus("fail");
      setMessage(e.message);
    }
  };

  const fields: { label: string; name: keyof ConnectionRequest; type?: string }[] = [
    { label: "Host", name: "host" },
    { label: "Port", name: "port", type: "number" },
    { label: "User", name: "user" },
    { label: "Password", name: "password", type: "password" },
    { label: "Database", name: "database" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-6 w-96"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-2 h-2 rounded-full bg-cyber-primary animate-pulse" />
        <h2 className="text-cyber-primary font-mono text-lg font-semibold tracking-widest uppercase">
          Connect PostgreSQL
        </h2>
      </div>

      <div className="space-y-3">
        {fields.map((f) => (
          <div key={f.name}>
            <label className="text-cyber-muted text-xs uppercase tracking-wider block mb-1">
              {f.label}
            </label>
            <input
              type={f.type ?? "text"}
              name={f.name}
              value={form[f.name]}
              onChange={handleChange}
              className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-2
                         text-cyber-text text-sm font-mono
                         focus:outline-none focus:border-cyber-primary transition-colors"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleConnect}
        disabled={status === "testing"}
        className="mt-5 w-full py-2 rounded bg-cyber-primary text-cyber-bg font-mono
                   font-semibold text-sm uppercase tracking-widest
                   hover:brightness-110 disabled:opacity-50 transition-all"
      >
        {status === "testing" ? "Connecting..." : "Connect"}
      </button>

      <AnimatePresence>
        {status !== "idle" && status !== "testing" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`mt-3 text-xs font-mono ${
              status === "ok" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {status === "ok" ? "✓ " : "✗ "}
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
