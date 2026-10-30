"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Breadcrumbs, BattleNav } from "@/components/arena";
import {
  Swords,
  Trophy,
  XCircle,
  Clock,
  Award,
  TrendingUp,
  Search,
  Filter,
  ArrowRight,
  Shield,
  Zap,
} from "lucide-react";

interface BattleRecord {
  id: string;
  type: "Solo MCQ" | "Solo Coding" | "Multiplayer 1v1" | "Championship";
  outcome: "Victory" | "Defeat" | "Draw";
  opponent?: string;
  eloDelta: number;
  xpEarned: number;
  duration: string;
  date: string;
  accuracy: string;
}

const DEFAULT_HISTORY: BattleRecord[] = [
  {
    id: "match_101",
    type: "Multiplayer 1v1",
    outcome: "Victory",
    opponent: "dev_marcus (1410 ELO)",
    eloDelta: 24,
    xpEarned: 150,
    duration: "4m 12s",
    date: "Today, 4:15 PM",
    accuracy: "9/10 (90%)",
  },
  {
    id: "match_100",
    type: "Solo Coding",
    outcome: "Victory",
    opponent: "System Arena Bot",
    eloDelta: 30,
    xpEarned: 100,
    duration: "11m 45s",
    date: "Yesterday",
    accuracy: "All Testcases Passed",
  },
  {
    id: "match_099",
    type: "Solo MCQ",
    outcome: "Defeat",
    opponent: "Solo Sprint",
    eloDelta: -12,
    xpEarned: 25,
    duration: "3m 00s",
    date: "2 days ago",
    accuracy: "4/10 (40%)",
  },
  {
    id: "match_098",
    type: "Multiplayer 1v1",
    outcome: "Victory",
    opponent: "priya_k (1390 ELO)",
    eloDelta: 18,
    xpEarned: 120,
    duration: "5m 30s",
    date: "3 days ago",
    accuracy: "8/10 (80%)",
  },
];

function BattleHistoryInner() {
  const [history] = useState<BattleRecord[]>(DEFAULT_HISTORY);
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = history.filter((h) => {
    if (filterType === "all") return true;
    if (filterType === "victories") return h.outcome === "Victory";
    if (filterType === "defeats") return h.outcome === "Defeat";
    return true;
  });

  const totalMatches = history.length;
  const wins = history.filter((h) => h.outcome === "Victory").length;
  const winRate = totalMatches ? Math.round((wins / totalMatches) * 100) : 0;
  const netElo = history.reduce((sum, h) => sum + h.eloDelta, 0);

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-6xl space-y-7 p-4 sm:p-7">
        <Breadcrumbs
          items={[
            { label: "Battle Arena", href: "/battle" },
            { label: "Battle History", href: "/battle/history", active: true },
          ]}
        />

        <BattleNav />

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-gradient-to-br from-[#1A0B12] via-[#0E1524] to-[#120B1C] p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 text-xs font-bold text-rose-300">
                <Swords className="h-4 w-4 text-rose-400" />
                <span>Competitive Match Log</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                Battle History
              </h1>
              <p className="max-w-xl text-sm sm:text-base text-slate-300">
                Review your recent matches, rating progression, and combat telemetry across Solo and Multiplayer showdowns.
              </p>
            </div>

            {/* Quick Record Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Win Rate</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">{winRate}%</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Matches</div>
                <div className="text-2xl font-black text-white mt-1">{totalMatches}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Net ELO</div>
                <div className="text-2xl font-black text-cyan-400 mt-1">+{netElo}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Filter bar */}
        <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#0E1524] p-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filterType === "all" ? "bg-white/15 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              All Matches
            </button>
            <button
              type="button"
              onClick={() => setFilterType("victories")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filterType === "victories" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:text-emerald-400"
              }`}
            >
              Victories
            </button>
            <button
              type="button"
              onClick={() => setFilterType("defeats")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                filterType === "defeats" ? "bg-rose-500/20 text-rose-300" : "text-slate-400 hover:text-rose-400"
              }`}
            >
              Defeats
            </button>
          </div>

          <Link
            href="/battle"
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500 border border-rose-500/30 px-3 py-1.5 text-xs font-bold text-rose-300 hover:text-white transition"
          >
            <span>Enter Battle</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Matches Feed */}
        <div className="space-y-3">
          {filtered.map((match) => {
            const isWin = match.outcome === "Victory";
            return (
              <div
                key={match.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#0E1524] p-5 transition hover:border-white/20 hover:bg-[#121B2F]"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      isWin
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {isWin ? <Trophy className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-white">
                        {match.type}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-400">{match.date}</span>
                    </div>

                    <div className="text-sm font-semibold text-slate-200">
                      {match.opponent ? `vs ${match.opponent}` : "Solo Battle Session"}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                      <span>Acc: {match.accuracy}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {match.duration}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rewards / Rating delta */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-white/5">
                  <div
                    className={`text-lg font-black font-mono ${
                      match.eloDelta > 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {match.eloDelta > 0 ? `+${match.eloDelta}` : match.eloDelta} ELO
                  </div>
                  <div className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                    <Award className="h-3 w-3" /> +{match.xpEarned} XP
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </DashboardLayout>
  );
}

export default function BattleHistoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070A0F]" />}>
      <BattleHistoryInner />
    </Suspense>
  );
}
