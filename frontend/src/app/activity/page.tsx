"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import api from "@/services/api";
import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { mergeActivityEntries } from "@/lib/dashboard-sync-activity.mjs";

type ActivityEntry = {
  id: string;
  user_id: string | null;
  action: string;
  module: string;
  organization_type: string | null;
  organization_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata_json: Record<string, unknown>;
  created_at: string;
};

export default function ActivityPage() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const syncEvents = useDashboardStore((state) => state.syncEvents);
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const activityEntries = mergeActivityEntries(entries, syncEvents, userId);

  useEffect(() => {
    const controller = new AbortController();
    void api.get<ActivityEntry[]>("/audit/me", {
      params: { limit: 50 },
      signal: controller.signal,
    }).then((response) => {
      setEntries(response.data);
      setError(null);
    }).catch(() => {
      if (!controller.signal.aborted) setError("Activity could not be loaded.");
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });
    return () => controller.abort();
  }, [refreshKey]);

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-4xl pb-16">
        <section className="rounded-[28px] border border-white/10 bg-[#070B14]/80 p-5 shadow-2xl shadow-cyan-950/10 sm:p-8">
          <header className="mb-6 flex items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-2">
                <Activity aria-hidden="true" className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Timeline</p>
                <h1 className="text-2xl font-black text-white">Activity</h1>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300 sm:flex">
              <Sparkles className="h-3.5 w-3.5 text-violet-300" />
              Live feed
            </div>
          </header>

          {loading && activityEntries.length === 0 ? (
            <div className="space-y-3" role="status">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                  <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-cyan-400/60" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/2 animate-pulse rounded bg-white/10" />
                    <div className="h-2.5 w-3/4 animate-pulse rounded bg-white/5" />
                    <div className="h-2.5 w-1/3 animate-pulse rounded bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {error && (
                <div role="alert" className="flex items-center justify-between gap-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLoading(true);
                      setRefreshKey((value) => value + 1);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 font-semibold text-white"
                  >
                    <RefreshCw className="h-4 w-4" /> Retry
                  </button>
                </div>
              )}
              {activityEntries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center">
                  <p className="text-lg font-semibold text-white">No activity yet</p>
                  <p className="mt-2 text-sm text-slate-400">Your platform activity will appear here once you start learning, competing, or engaging with the community.</p>
                </div>
              ) : (
                <ol className="space-y-3">
                  {activityEntries.map((entry) => {
                    const isInProgress = entry.status === "in_progress";
                    const isFailed = entry.status === "failed";
                    const StatusIcon = isInProgress
                      ? LoaderCircle
                      : isFailed
                        ? AlertCircle
                        : entry.status === "completed"
                          ? CheckCircle2
                          : Activity;
                    const statusLabel = isInProgress ? "In Progress" : isFailed ? "Failed" : entry.status === "completed" ? "Completed" : null;
                    return (
                      <li key={entry.id} className="flex gap-4 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                        <StatusIcon
                          aria-hidden="true"
                          className={`mt-0.5 h-4 w-4 shrink-0 ${isFailed ? "text-rose-300" : isInProgress ? "animate-spin text-amber-300" : entry.status === "completed" ? "text-emerald-300" : "text-slate-400"}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold capitalize text-white">{entry.title}</p>
                            {statusLabel && (
                              <span className={`text-[10px] font-semibold uppercase tracking-wide ${isFailed ? "text-rose-300" : isInProgress ? "text-amber-300" : "text-emerald-300"}`}>
                                {statusLabel}
                              </span>
                            )}
                          </div>
                          {entry.description && <p className="mt-1 text-xs capitalize text-slate-400">{entry.description}</p>}
                          <time className="mt-1 block text-[11px] text-slate-500" dateTime={entry.created_at}>
                            {new Date(entry.created_at).toLocaleString()}
                          </time>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          )}
        </section>
      </main>
    </DashboardLayout>
  );
}