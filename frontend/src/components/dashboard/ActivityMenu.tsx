"use client";

import { useEffect, useState } from "react";
import { Activity, RefreshCw, X } from "lucide-react";
import api from "@/services/api";

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
      <button
        type="button"
        aria-label="Activity"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-200 transition hover:border-cyan-400/60 hover:text-white"
      >
        <Activity className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close activity"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <section
            aria-label="Recent activity"
            className="fixed inset-x-0 bottom-0 z-50 max-h-[72dvh] overflow-hidden rounded-t-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-black/50 md:absolute md:inset-x-auto md:right-0 md:top-11 md:max-h-[min(30rem,calc(100dvh-6rem))] md:w-[min(24rem,calc(100vw-1.5rem))] md:rounded-xl"
          >
            <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-sm font-bold text-white">Activity</span>
              <button
                type="button"
                aria-label="Close activity"
                onClick={() => setOpen(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="max-h-[calc(72dvh-3.25rem)] divide-y divide-white/5 overflow-y-auto md:max-h-[calc(min(30rem,100dvh-6rem)-3.25rem)]">
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
            </div>
          </section>
        </>
      )}
    </div>
  );
}