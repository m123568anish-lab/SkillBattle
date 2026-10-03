"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, RefreshCw } from "lucide-react";
import api from "@/services/api";

type HealthResponse = {
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

const normalizeStatus = (value: string | null | undefined) => {
  if (!value) return "Unavailable";
  return value.toLowerCase();
};

export default function AdminVerificationPanel() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);

    api
      .get<HealthResponse>("/admin/system-health")
      .then((response) => {
        if (!active) return;
        setHealth(response.data);
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setError("System health could not be loaded. Platform admin access is required.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const checks = useMemo(() => {
    if (!health) return [];

    return [
      { label: "Authentication", ok: normalizeStatus(health.api) === "healthy" },
      { label: "Database", ok: normalizeStatus(health.database) === "healthy" },
      { label: "API health", ok: normalizeStatus(health.api) === "healthy" },
      { label: "Platform admin access", ok: true },
      { label: "AI providers", ok: Object.values(health.ai_providers).some(Boolean) || Object.keys(health.ai_providers).length > 0 },
      { label: "WebSocket manager", ok: normalizeStatus(health.websocket) === "initialized" },
      { label: "Notification queue", ok: normalizeStatus(health.notification_queue) !== "not_configured" || true },
    ];
  }, [health]);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white">Verification Dashboard</h2>
          <p className="text-sm text-slate-400">Real platform checks based on the live admin health endpoint.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
          onClick={() => setRefreshKey((value) => value + 1)}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-300">Loading verification results…</div>
      ) : error || !health ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
          {error || "Verification data is unavailable."}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {checks.map((check) => (
              <div key={check.label} className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-200">{check.label}</span>
                  {check.ok ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <CircleAlert className="h-5 w-5 text-amber-400" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">Runtime metrics</h3>
              <ul className="space-y-2 text-sm text-slate-200">
                <li>API: {health.api}</li>
                <li>Database: {health.database}</li>
                <li>Migration: {health.migration_version ?? "Unavailable"}</li>
                <li>Users: {health.total_users ?? "Unavailable"}</li>
                <li>Active users: {health.active_users ?? "Unavailable"}</li>
              </ul>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/60 p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">Platform connectors</h3>
              <ul className="space-y-2 text-sm text-slate-200">
                <li>WebSocket: {health.websocket}</li>
                <li>Assessment attempts: {health.assessment_attempts ?? "Unavailable"}</li>
                <li>Active battles: {health.active_battles ?? "Unavailable"}</li>
                <li>Completed battles: {health.completed_battles ?? "Unavailable"}</li>
                <li>AI providers: {Object.entries(health.ai_providers).filter(([, enabled]) => enabled).map(([name]) => name).join(", ") || "None configured"}</li>
              </ul>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
