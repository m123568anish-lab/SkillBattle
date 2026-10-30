"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Breadcrumbs, DifficultyBadge, PracticeNav } from "@/components/arena";
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
  Check,
  Brain,
  Code2,
  ListTodo,
} from "lucide-react";

interface Quest {
  id: string;
  title: string;
  category: "coding" | "mcq" | "learning";
  xp: number;
  progress: number;
  total: number;
  completed: boolean;
  actionText: string;
  href: string;
}

function PracticeTasksInner() {
  const router = useRouter();
  const [daily, setDaily] = useState<DailyPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const [quests, setQuests] = useState<Quest[]>([
    {
      id: "quest_1",
      title: "Daily Algorithm Challenge",
      category: "coding",
      xp: 50,
      progress: 0,
      total: 1,
      completed: false,
      actionText: "Solve Algorithm",
      href: "/practice/coding",
    },
    {
      id: "quest_2",
      title: "Complete 10 MCQ Practice Drills",
      category: "mcq",
      xp: 35,
      progress: 6,
      total: 10,
      completed: false,
      actionText: "Continue Drills",
      href: "/practice/session?topic=all&count=10",
    },
    {
      id: "quest_3",
      title: "Explore System Architecture Topics",
      category: "learning",
      xp: 25,
      progress: 1,
      total: 1,
      completed: true,
      actionText: "Completed",
      href: "/practice/topics/system-design",
    },
  ]);

  useEffect(() => {
    practiceService
      .daily()
      .then((data) => {
        setDaily(data);
        if (data.session?.status === "COMPLETED") {
          setQuests((prev) =>
            prev.map((q) => (q.id === "quest_1" ? { ...q, completed: true, progress: 1 } : q))
          );
        }
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
                Consistency is how engineers master system design and algorithms. Solve daily challenges to maintain your streak and earn verified badges.
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
                  {daily?.challenge?.title || "Daily Algorithmic Focus"}
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Solve today&apos;s curated problem to extend your streak and gain +50 verified XP.
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
                    disabled={starting || loading}
                    className="inline-flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 active:scale-95"
                  >
                    <Play className="h-4 w-4 fill-white" />
                    <span>{starting ? "Launching..." : "Start Daily Problem"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Today's Quests & Progress */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-cyan-400" />
                <span>Today&apos;s Learning Quests</span>
              </h2>
              <p className="text-xs text-slate-400">
                Complete daily quests to maximize XP and keep your study routine structured.
              </p>
            </div>
            <div className="text-xs font-semibold text-cyan-400">
              {quests.filter((q) => q.completed).length} / {quests.length} Completed
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quests.map((q) => (
              <div
                key={q.id}
                className={`relative rounded-2xl border p-5 transition flex flex-col justify-between ${
                  q.completed
                    ? "border-emerald-500/20 bg-emerald-950/10"
                    : "border-white/[0.08] bg-[#0E1524] hover:border-cyan-500/30"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        q.category === "coding"
                          ? "bg-blue-500/15 text-blue-300"
                          : q.category === "mcq"
                          ? "bg-purple-500/15 text-purple-300"
                          : "bg-emerald-500/15 text-emerald-300"
                      }`}
                    >
                      {q.category === "coding" ? (
                        <Code2 className="h-3 w-3" />
                      ) : q.category === "mcq" ? (
                        <Brain className="h-3 w-3" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      {q.category}
                    </span>
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                      <Award className="h-3.5 w-3.5" /> +{q.xp} XP
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white">{q.title}</h3>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Progress</span>
                      <span className="font-mono">
                        {q.progress} / {q.total}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          q.completed ? "bg-emerald-400" : "bg-cyan-400"
                        }`}
                        style={{ width: `${Math.min(100, (q.progress / q.total) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/[0.06]">
                  {q.completed ? (
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400 py-1">
                      <Check className="h-4 w-4" />
                      <span>Quest Completed</span>
                    </div>
                  ) : (
                    <Link
                      href={q.href}
                      className="flex items-center justify-center gap-1 rounded-xl bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:text-cyan-300"
                    >
                      <span>{q.actionText}</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Weekly Milestone Track */}
        <section className="rounded-2xl border border-white/[0.08] bg-[#0E1524] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" />
                <span>Weekly Mastery Goals</span>
              </h3>
              <p className="text-xs text-slate-400">
                Reach weekly milestones to unlock bonus rating points and platform achievements.
              </p>
            </div>
            <span className="text-xs font-mono text-amber-400">+250 Weekly Bonus</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="rounded-xl border border-white/5 bg-[#0B0F17] p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-bold text-white">7-Day Consistency Master</div>
                <div className="text-xs text-slate-400">Maintain streak without missing a day</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-cyan-400">
                  {Math.min(7, daily?.streak ?? 0)} / 7
                </div>
                <div className="text-[10px] text-slate-500 uppercase">Days</div>
              </div>
            </div>

            <div className="rounded-xl border border-white/5 bg-[#0B0F17] p-4 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-bold text-white">Algorithm Marathon</div>
                <div className="text-xs text-slate-400">Solve 5 medium-difficulty coding problems</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-emerald-400">3 / 5</div>
                <div className="text-[10px] text-slate-500 uppercase">Solved</div>
              </div>
            </div>
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
