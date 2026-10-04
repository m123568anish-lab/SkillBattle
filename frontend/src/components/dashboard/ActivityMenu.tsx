"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, RefreshCw } from "lucide-react";
import api from "@/services/api";
import HeaderPanel from "./HeaderPanel";

type ActivityEntry = {
  id: string;
  action: string;
  module: string;
  entity_type: string | null;
  created_at: string;
};

export default function ActivityMenu() {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!open) return;

    const controller = new AbortController();
    setLoading(true);
    void api.get<ActivityEntry[]>("/audit/me", {
      params: { limit: 20 },
      signal: controller.signal,
    }).then((response) => {
      setEntries(response.data);
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
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:border-cyan-400/60 hover:text-white md:hidden"
      >
        <Activity className="h-[18px] w-[18px]" />
      </Link>
      <button
        type="button"
        aria-label="Activity"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((previous) => !previous)}
        className="relative hidden h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:border-cyan-400/60 hover:text-white md:inline-flex sm:h-10 sm:w-10"
      >
        <Activity className="h-[18px] w-[18px]" />
      </button>

      <HeaderPanel open={open} title="Activity" onClose={() => setOpen(false)}>
              {loading ? (
                <p role="status" className="px-4 py-8 text-center text-sm text-slate-400">Loading activity…</p>
              ) : error ? (
                <div role="alert" className="flex items-center justify-between gap-3 px-4 py-5 text-sm text-rose-200">
                  <span>Activity could not be loaded.</span>
                  <button
                    type="button"
                    onClick={() => setRefreshKey((value) => value + 1)}
                    className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-white"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Retry
                  </button>
                </div>
              ) : entries.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">No activity yet</p>
              ) : (
                entries.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 px-4 py-3">
                    <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-cyan-300" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold capitalize text-white">{entry.action.replaceAll("_", " ")}</span>
                      <span className="mt-0.5 block text-xs capitalize text-slate-400">
                        {entry.module}{entry.entity_type ? ` · ${entry.entity_type}` : ""}
                      </span>
                      <time className="mt-1 block text-[11px] text-slate-500" dateTime={entry.created_at}>
                        {new Date(entry.created_at).toLocaleString()}
                      </time>
                    </span>
                  </div>
                ))
              )}
      </HeaderPanel>
    </div>
  );
}