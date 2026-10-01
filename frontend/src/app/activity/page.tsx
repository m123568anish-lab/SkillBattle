"use client";

import { useEffect, useState } from "react";
import { Activity, RefreshCw } from "lucide-react";
import api from "@/services/api";

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
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
    <main className="mx-auto max-w-4xl px-5 py-10 text-slate-100 sm:py-14">
      <header className="mb-8 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <Activity aria-hidden="true" className="h-5 w-5 text-cyan-300" />
          <h1 className="text-2xl font-semibold text-white">Activity</h1>
        </div>
        <p className="mt-2 text-sm text-slate-400">Your recorded platform events</p>
      </header>

      {loading ? (
        <p role="status" className="text-sm text-slate-400">Loading activity…</p>
      ) : error ? (
        <div role="alert" className="flex items-center justify-between gap-4 border-l-2 border-rose-300 px-4 py-3 text-sm text-rose-100">
          <span>{error}</span>
          <button type="button" onClick={() => { setLoading(true); setRefreshKey((value) => value + 1); }} className="flex items-center gap-2 text-white">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      ) : entries.length === 0 ? (
        <p className="border-l-2 border-white/15 px-4 py-3 text-sm text-slate-400">No activity recorded yet.</p>
      ) : (
        <ol className="divide-y divide-white/10">
          {entries.map((entry) => (
            <li key={entry.id} className="flex gap-4 py-4">
              <span aria-hidden="true" className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-300" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{entry.action.replaceAll("_", " ")}</p>
                <p className="mt-1 text-xs capitalize text-slate-400">
                  {entry.module}{entry.entity_type ? ` · ${entry.entity_type}` : ""}
                  {entry.organization_type ? ` · ${entry.organization_type}` : ""}
                </p>
                <time className="mt-1 block text-xs text-slate-500" dateTime={entry.created_at}>
                  {new Date(entry.created_at).toLocaleString()}
                </time>
              </div>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}