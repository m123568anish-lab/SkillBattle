"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { practiceService, type DailyPayload } from "@/services/practice.service";
import {
  CalendarDays,
  Flame,
  Play,
  Trophy,
  CheckCircle2,
  Sparkles,
  Award,
  Zap,
  Target,
  Clock,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
} from "lucide-react";

export default function ChallengePage() {
  const router = useRouter();
  const [daily, setDaily] = useState<DailyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    practiceService
      .daily()
      .then(setDaily)
      .catch(() => setError("Daily challenge details are unavailable."))
      .finally(() => setLoading(false));
  }, []);

  const start = async () => {
    setStarting(true);
    try {
      const next = await practiceService.startDaily();
      setDaily(next);
      if (next.problem) {
        router.push(`/tasks?daily=1&problem=${next.problem.id}`);
      }
    } catch {
      setError("Could not start today’s challenge.");
    } finally {
      setStarting(false);
    }
  };

  const isCompleted = daily?.session?.status === "COMPLETED";

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-7">
        {/* Hero Mission Card */}
        <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0E1524] via-[#0B0F17] to-[#141C2E] p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-72 w-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                <CalendarDays className="h-3.5 w-3.5 text-cyan-400" />
                <span>{todayDate}</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                Daily Coding Challenge
              </h1>
              <p className="max-w-xl text-sm sm:text-base text-slate-300">
                Keep your consistency sharp. Solve one curated algorithm challenge every day to build your streak and earn verified XP.
              </p>
            </div>

            {/* Streak Counter Box */}
            <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-6 py-5 text-center shadow-[0_0_30px_rgba(245,158,11,0.15)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <Flame className="h-7 w-7 fill-amber-400 animate-pulse" />
              </div>
              <div className="text-left">
                <div className="text-3xl font-black text-white">
                  {daily?.streak ?? 0}
                  <span className="text-lg font-bold text-amber-400"> days</span>
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-300/80">
                  Current Streak
                </div>
              </div>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mt-6 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-300">
              {error}
            </div>
          )}

          {/* Today's Problem Card */}
          {loading ? (
            <div className="mt-8 h-40 rounded-2xl border border-white/10 bg-white/5 animate-pulse" />
          ) : daily?.available && daily.problem ? (
            <div className="mt-8 rounded-2xl border border-white/10 bg-[#070A0F]/90 p-6 backdrop-blur">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                      {daily.problem.difficulty}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {daily.problem.category}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
                      <Award className="h-3.5 w-3.5" /> +{daily.problem.xp_reward || 100} XP
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {daily.problem.title}
                  </h2>

                  <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                    {daily.is_revision
                      ? "Review Challenge: All new matching challenges are solved! Keep your streak alive."
                      : "Today's challenge is assigned and locked until midnight UTC. Complete all test cases to claim reward."}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {isCompleted ? (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-5 py-3 text-sm font-bold text-emerald-300">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      <span>Completed Today</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={start}
                      disabled={starting}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_0_25px_rgba(6,182,212,0.3)] transition hover:from-cyan-400 hover:to-blue-500 active:scale-95 disabled:opacity-50"
                    >
                      <Play className="h-4 w-4 fill-white" />
                      <span>
                        {starting ? "Opening Workspace..." : daily.session ? "Resume Challenge" : "Start Today's Challenge"}
                      </span>
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-white/10 bg-[#070A0F]/80 p-8 text-center text-slate-400">
              <CalendarDays className="h-10 w-10 text-slate-500 mx-auto mb-3" />
              <p className="text-sm font-medium">
                {daily?.reason || "No daily challenge is available right now. Check back soon!"}
              </p>
            </div>
          )}
        </section>

        {/* Challenge Features & Mechanics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0E1524] p-5 space-y-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
              <Trophy className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Authoritative Rewards</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              XP and streaks are strictly persisted by PostgreSQL/SQLite validation. No local fabrication or client manipulation.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0E1524] p-5 space-y-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-400">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">24h UTC Refresh</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Assignments lock for the calendar day. Complete before midnight UTC to maintain your consecutive streak.
            </p>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#0E1524] p-5 space-y-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Real Test Sandbox</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Submissions run against real test cases in an isolated execution sandbox supporting Python, JavaScript, C++, and Java.
            </p>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
