"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Breadcrumbs, BattleNav } from "@/components/arena";
import { battleService, type BattleHistoryItem } from "@/services/battle.service";
import { ArrowRight, Swords } from "lucide-react";
import Link from "next/link";

type HistoryFilter = "all" | "wins" | "other";

export default function BattleHistoryPage() {
  const [history, setHistory] = useState<BattleHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    battleService.getHistory(50, 0)
      .then((response) => {
        if (!active) return;
        setHistory(response.history);
        setTotal(response.total);
        setError(null);
      })
      .catch(() => {
        if (!active) return;
        setHistory([]);
        setTotal(0);
        setError("Battle history could not be retrieved from the server.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const filteredHistory = history.filter((record) => {
    if (filter === "wins") return record.is_winner;
    if (filter === "other") return !record.is_winner;
    return true;
  });
  const wins = history.filter((record) => record.is_winner).length;
  const xpEarned = history.reduce((sum, record) => sum + record.xp_earned, 0);

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-6xl space-y-7 p-4 sm:p-7">
        <Breadcrumbs
          items={[
            { label: "Qubira Arena", href: "/battle" },
            { label: "Battle History", href: "/battle/history", active: true },
          ]}
        />
        <BattleNav />

        <section className="rounded-3xl border border-rose-500/20 bg-gradient-to-br from-[#1A0B12] via-[#0E1524] to-[#120B1C] p-6 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 text-xs font-bold text-rose-300">
            <Swords className="h-4 w-4" />
            Authenticated battle records
          </div>
          <h1 className="mt-4 text-3xl font-black text-white sm:text-5xl">Battle History</h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Results and rewards shown here are loaded from your saved battle records.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">Recorded battles</p>
            <p className="mt-2 text-3xl font-black text-white">{loading ? "…" : error ? "Unavailable" : total}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">Wins in recent records</p>
            <p className="mt-2 text-3xl font-black text-emerald-300">{loading ? "…" : error ? "Unavailable" : wins}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">XP in recent records</p>
            <p className="mt-2 text-3xl font-black text-amber-300">{loading ? "…" : error ? "Unavailable" : xpEarned.toLocaleString()}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#0E1524] p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-white">Saved results</h2>
            <label className="text-xs text-slate-400">
              Filter
              <select
                aria-label="Filter battle history"
                value={filter}
                onChange={(event) => setFilter(event.target.value as HistoryFilter)}
                className="ml-2 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-white"
              >
                <option value="all">All records</option>
                <option value="wins">Wins</option>
                <option value="other">Other completed battles</option>
              </select>
            </label>
          </div>

          {loading ? (
            <p className="py-12 text-center text-slate-400">Loading saved battle history…</p>
          ) : error ? (
            <div role="alert" className="py-10 text-center text-rose-300">
              <p>{error}</p>
              <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="mt-3 font-bold underline">
                Retry
              </button>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p>{history.length ? "No records match this filter." : "No battle history has been recorded yet."}</p>
              {!history.length && (
                <Link href="/battle/lobby" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold text-white">
                  Open battle lobby <ArrowRight size={15} />
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pr-4">Battle</th>
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Score</th>
                    <th className="pb-3 pr-4">Result</th>
                    <th className="pb-3 pr-4">XP</th>
                    <th className="pb-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredHistory.map((record) => (
                    <tr key={record.battle_id}>
                      <td className="py-3 pr-4 font-medium text-white">{record.title}</td>
                      <td className="py-3 pr-4 text-slate-300">{record.battle_type}</td>
                      <td className="py-3 pr-4 text-slate-300">{record.status}</td>
                      <td className="py-3 pr-4 font-semibold text-white">{record.score}</td>
                      <td className="py-3 pr-4">{record.is_winner ? "Win" : "Completed"}</td>
                      <td className="py-3 pr-4 font-semibold text-amber-300">{record.xp_earned}</td>
                      <td className="py-3 text-right text-slate-400">
                        {record.created_at ? new Date(record.created_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </DashboardLayout>
  );
}
