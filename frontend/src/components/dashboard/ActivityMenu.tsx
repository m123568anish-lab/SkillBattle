"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import api from "@/services/api";
import HeaderPanel from "./HeaderPanel";
import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { mergeActivityEntries } from "@/lib/dashboard-sync-activity.mjs";

type ActivityEntry = {
  id: string;
  action: string;
  module: string;
  entity_type: string | null;
  organization_type?: string | null;
  created_at: string;
};

export default function ActivityMenu() {
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const syncEvents = useDashboardStore((state) => state.syncEvents);
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const activityEntries = mergeActivityEntries(entries, syncEvents, userId);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    setLoading(true);
    void api.get<ActivityEntry[]>("/audit/me", {
      params: { limit: 20 },
      signal: controller.signal,
    }).then((response) => {
      setEntries(Array.isArray(response.data) ? response.data : []);
      setError(false);
    }).catch(() => {
      if (!controller.signal.aborted) setError(true);
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });

    return () => controller.abort();
  }, [open, refreshKey]);

  return (
    <div className="relative">
      <Link
        href="/activity"
        aria-label="Open activity page"
        title="Activity"
        className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)] transition hover:border-[var(--accent)]/60 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] max-[359px]:h-9 max-[359px]:w-9 md:hidden"
      >
        <Activity className="h-[18px] w-[18px]" />
      </Link>
      <button
        type="button"
        aria-label="Activity"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((previous) => !previous)}
        className="relative hidden h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)] transition hover:border-[var(--accent)]/60 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] md:inline-flex sm:h-10 sm:w-10"
      >
        <Activity className="h-[18px] w-[18px]" />
      </button>

      <HeaderPanel open={open} title="Activity" onClose={() => setOpen(false)}>
              {loading && activityEntries.length === 0 ? (
                <p role="status" className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">Loading activity…</p>
              ) : (
                <div>
                  {error && (
                    <div role="alert" className="flex items-center justify-between gap-3 px-4 py-4 text-sm text-[var(--status-danger)]">
                      <span>Activity could not be loaded.</span>
                      <button
                        type="button"
                        onClick={() => setRefreshKey((value) => value + 1)}
                        className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Retry
                      </button>
                    </div>
                  )}
                  {activityEntries.length === 0 ? (
                    <p className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No activity yet</p>
                  ) : (
                    activityEntries.map((entry) => {
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
                        <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
                          <StatusIcon
                            aria-hidden="true"
                            className={`mt-0.5 h-4 w-4 shrink-0 ${isFailed ? "text-rose-400" : isInProgress ? "animate-spin text-amber-400" : entry.status === "completed" ? "text-emerald-400" : "text-[var(--text-muted)]"}`}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center justify-between gap-2">
                              <span className="block text-sm font-semibold capitalize text-[var(--text-primary)]">{entry.title}</span>
                              {statusLabel && <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{statusLabel}</span>}
                            </span>
                            {entry.description && <span className="mt-0.5 block text-xs capitalize text-[var(--text-muted)]">{entry.description}</span>}
                            <time className="mt-1 block text-[11px] text-[var(--text-muted)]" dateTime={entry.created_at}>
                              {new Date(entry.created_at).toLocaleString()}
                            </time>
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
      </HeaderPanel>
    </div>
  );
}