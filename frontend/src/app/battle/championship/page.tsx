"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Breadcrumbs } from "@/components/arena";
import {
  Trophy,
  Flame,
  Clock,
  Users,
  Award,
  Zap,
  Shield,
  ChevronRight,
  Sparkles,
  Calendar,
  AlertCircle,
  Play,
  CheckCircle2,
} from "lucide-react";

function ChampionshipInner() {
  const [timeUntilStart, setTimeUntilStart] = useState({
    hours: 2,
    minutes: 42,
    seconds: 15,
  });

  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeUntilStart((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-6xl space-y-7 p-4 sm:p-7">
        <Breadcrumbs
          items={[
            { label: "Battle Arena", href: "/battle" },
            { label: "Daily Championship", href: "/battle/championship", active: true },
          ]}
        />

        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-[#1A1208] via-[#0E1524] to-[#120B1C] p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-24 -mt-24 h-80 w-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-72 w-72 rounded-full bg-rose-500/15 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-3.5 py-1 text-xs font-bold text-amber-300">
                <Trophy className="h-4 w-4 text-amber-400" />
                <span>OFFICIAL ARENA CUP #142</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                Daily Grand Championship
              </h1>
              <p className="max-w-xl text-sm sm:text-base text-slate-300">
                The premier daily arena competition. Compete in 3 back-to-back algorithmic rounds under identical time constraints to win verified badges and prize pool XP.
              </p>
            </div>

            {/* Countdown Box */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 text-center shrink-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center justify-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Tournament Starts In</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-3xl font-black text-white">
                <div className="rounded-xl bg-black/40 border border-white/10 px-3 py-2">
                  {timeUntilStart.hours.toString().padStart(2, "0")}h
                </div>
                <span>:</span>
                <div className="rounded-xl bg-black/40 border border-white/10 px-3 py-2">
                  {timeUntilStart.minutes.toString().padStart(2, "0")}m
                </div>
                <span>:</span>
                <div className="rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-amber-400">
                  {timeUntilStart.seconds.toString().padStart(2, "0")}s
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-2">1,248 Engineers Enrolled</div>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-400" /> +5,000 XP Prize Pool
              </span>
              <span className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-rose-400" /> 3 Algorithmic Rounds
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-cyan-400" /> Rated Competitive
              </span>
            </div>

            <div>
              {registered ? (
                <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 px-6 py-3 text-sm font-bold text-emerald-300">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span>Enrolled & Ready</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setRegistered(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-amber-500/25 hover:from-amber-400 hover:to-rose-500 transition active:scale-95"
                >
                  <Play className="h-4 w-4 fill-white" />
                  <span>Register Free Entry</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Tournament Structure & Rules */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0E1524] p-5 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Round 1: Rapid Algorithmic</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              15 minutes. 1 Medium question focused on HashMaps or Sliding Window. Fast submissions receive bonus multiplier.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0E1524] p-5 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
              <Flame className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Round 2: Tree / Graph Core</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              25 minutes. 1 Hard question requiring BFS/DFS or dynamic programming. Hidden edge test cases evaluate optimality.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0E1524] p-5 space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <Trophy className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Round 3: Grand Final</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Top 20% advance to the lightning showdown. Live spectator broadcast and server-verified anti-cheat evaluation.
            </p>
          </div>
        </div>

        {/* Podium Champions of Previous Cup */}
        <section className="rounded-2xl border border-white/[0.08] bg-[#0E1524] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Yesterday&apos;s Cup Champions</h3>
              <p className="text-xs text-slate-400">Top performers from Arena Cup #141</p>
            </div>
            <Link
              href="/leaderboard"
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <span>Full Leaderboards</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/15 p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-black text-sm">
                1st
              </div>
              <div>
                <div className="text-sm font-bold text-white">alex_algo</div>
                <div className="text-xs text-amber-400 font-mono">2,420 ELO • 14m 12s</div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-400/30 bg-slate-900/40 p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-400/20 text-slate-300 font-black text-sm">
                2nd
              </div>
              <div>
                <div className="text-sm font-bold text-white">byte_ninja</div>
                <div className="text-xs text-slate-300 font-mono">2,380 ELO • 16m 04s</div>
              </div>
            </div>

            <div className="rounded-xl border border-amber-700/30 bg-amber-950/10 p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-700/20 text-amber-500 font-black text-sm">
                3rd
              </div>
              <div>
                <div className="text-sm font-bold text-white">coder_priya</div>
                <div className="text-xs text-amber-500 font-mono">2,310 ELO • 18m 45s</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
}

export default function ChampionshipPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070A0F]" />}>
      <ChampionshipInner />
    </Suspense>
  );
}
