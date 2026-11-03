"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Breadcrumbs, DifficultyBadge, PracticeNav } from "@/components/arena";
import { practiceService, type DailyPayload } from "@/services/practice.service";
import {
  CalendarDays,
  Flame,
  Play,
  CheckCircle2,
  ListTodo,
} from "lucide-react";

function PracticeTasksInner() {
  const router = useRouter();
  const [daily, setDaily] = useState<DailyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    practiceService
      .daily()
      .then((data) => {
        setDaily(data);
      })
      .catch(() => setError("Daily challenge details are unavailable."))
      .finally(() => setLoading(false));
  }, []);

  const startDailyChallenge = async () => {
    setStarting(true);
    try {
      const next = await practiceService.startDaily();
      setDaily(next);
      if (next.problem) {
        router.push(`/practice/coding?daily=1&problem=${next.problem.id}`);
      } else {
        router.push("/practice/coding");
      }
    } catch {
      setError("Could not start today's challenge.");
    } finally {
      setStarting(false);
    }
  };

  const isCompleted = daily?.session?.status === "COMPLETED";

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-6xl space-y-7 p-4 sm:p-7">
        <Breadcrumbs
          items={[
            { label: "Practice Hub", href: "/practice" },
            { label: "Daily Tasks & Challenges", href: "/practice/tasks", active: true },
          ]}
        />

        <PracticeNav />

        {/* Daily Streak & Mission Hero */}
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
                Daily Tasks & Missions
              </h1>
              <p className="max-w-xl text-sm sm:text-base text-slate-300">
                Your daily assignment and streak are updated from qualifying activity recorded for your account.
              </p>
            </div>

            {/* Streak Counter Box */}
            <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-6 py-5 text-center shadow-[0_0_30px_rgba(245,158,11,0.15)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                <Flame className="h-7 w-7 fill-amber-400 animate-pulse" />
              </div>
              <div className="text-left">
                <div className="text-3xl font-black text-white">
                  {daily ? daily.streak ?? 0 : "—"}
                  <span className="text-lg font-bold text-amber-400"> days</span>
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-300/80">
                  Current Streak
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Daily Challenge Highlight Card */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#070A0F]/80 p-5 sm:p-7 backdrop-blur-md">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[11px] font-bold text-cyan-300">
                    TODAY&apos;S PROBLEM
                  </span>
                  {daily?.challenge?.difficulty && (
                    <DifficultyBadge difficulty={daily.challenge.difficulty} />
                  )}
                  {daily?.challenge?.category && (
                    <span className="text-xs text-slate-400 font-mono">
                      {daily.challenge.category}
                    </span>
                  )}
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  {daily?.challenge?.title || (daily?.available ? "Daily challenge" : "No daily challenge available")}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  A successful submission is evaluated and saved before its progress is shown as complete.
                </p>
              </div>

              <div>
                {isCompleted ? (
                  <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 px-5 py-3 text-sm font-bold text-emerald-300">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                    <span>Completed for Today</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={startDailyChallenge}
                    disabled={starting || loading || !daily?.available}
                    className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 active:scale-95"
                  >
                    <Play className="h-4 w-4 fill-white" />
                    <span>{starting ? "Launching..." : daily?.available ? "Start Daily Problem" : "Unavailable"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Persisted daily assignment */}
        <section className="space-y-4">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0E1524] p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-cyan-400" />
              Today&apos;s recorded assignment
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              {loading
                ? "Loading the assignment saved for your account."
                : daily?.session?.status === "COMPLETED"
                  ? "Your daily assignment is recorded as complete."
                  : daily?.session
                    ? "Your daily assignment is saved and in progress."
                    : daily?.available
                      ? "No assignment has been started today."
                      : daily?.reason || "No assignment is currently available."}
            </p>
            {daily?.problem && (
              <p className="mt-3 text-xs text-slate-500">Assigned problem: {daily.problem.title}</p>
            )}
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
}

export default function PracticeTasksPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070A0F]" />}>
      <PracticeTasksInner />
    </Suspense>
  );
}
