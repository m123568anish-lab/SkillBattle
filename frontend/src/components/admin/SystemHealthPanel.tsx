"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import api from "@/services/api";

type SystemHealth = {
  api: string;
  database: string;
  migration_version: string | null;
  total_users: number | null;
  active_users: number | null;
  assessment_attempts: number | null;
  active_battles: number | null;
  completed_battles: number | null;
  ai_providers: Record<string, boolean>;
  websocket: string;
  failed_jobs: number | null;
  notification_queue: string;
};

function HealthRow({ label, value }: { label: string; value: string | number | null }) {
  const rendered = value === null ? "Unavailable" : String(value);
  const healthy = rendered === "healthy" || rendered === "initialized";
  const configured = rendered === "configured";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 py-3 last:border-0">
      <span className="text-sm text-slate-300">{label}</span>
      <span className={`text-sm font-medium ${healthy || configured ? "text-emerald-300" : "text-amber-200"}`}>
        {rendered}
      </span>
    </div>
  );
}

export default function SystemHealthPanel() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void api.get<SystemHealth>("/admin/system-health", { signal: controller.signal })
      .then((response) => {
        setHealth(response.data);
        setError(null);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError("System health could not be loaded. Verify platform administrator access.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refreshKey]);

  if (loading) {
    return <p role="status" className="text-sm text-slate-400">Loading system health…</p>;
  }

  if (error || !health) {
    return (
      <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300/20 bg-amber-300/5 p-4">
        <p className="text-sm text-amber-100">{error || "System health is unavailable."}</p>
        <button type="button" onClick={() => { setLoading(true); setRefreshKey((value) => value + 1); }} className="flex items-center gap-2 text-sm text-white hover:text-cyan-200">
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <section aria-label="Platform system health" className="grid gap-6 md:grid-cols-2">
      <div className="rounded-lg border border-white/10 bg-slate-900/50 p-5">
        <h2 className="mb-2 text-base font-semibold text-white">Runtime and data</h2>
        <HealthRow label="API" value={health.api} />
        <HealthRow label="Database" value={health.database} />
        <HealthRow label="Alembic revision" value={health.migration_version} />
        <HealthRow label="Registered users" value={health.total_users} />
        <HealthRow label="Active users" value={health.active_users} />
        <HealthRow label="Assessment attempts" value={health.assessment_attempts} />
        <HealthRow label="Active battles" value={health.active_battles} />
        <HealthRow label="Completed battles" value={health.completed_battles} />
      </div>
      <div className="rounded-lg border border-white/10 bg-slate-900/50 p-5">
        <h2 className="mb-2 text-base font-semibold text-white">Integrations</h2>
        <HealthRow label="WebSocket manager" value={health.websocket} />
        {Object.entries(health.ai_providers).map(([name, configured]) => (
          <HealthRow key={name} label={`${name} AI`} value={configured ? "configured" : "not configured"} />
        ))}
        <HealthRow label="Failed jobs" value={health.failed_jobs} />
        <HealthRow label="Notification queue" value={health.notification_queue} />
      </div>
    </section>
  );
}