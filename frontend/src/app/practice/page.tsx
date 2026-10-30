"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PracticeNav from "@/components/practice/PracticeNav";
import {
  PageHeader,
  StatCard,
  DifficultyBadge,
  EmptyState,
  LoadingSkeleton,
} from "@/components/arena";
import { useAuthStore } from "@/store/authStore";
import { practiceService, type PracticeProblem } from "@/services/practice.service";
import { dashboardService } from "@/services/dashboard.service";
import {
  BookOpen,
  CheckCircle2,
  Flame,
  Target,
  ArrowRight,
  TrendingUp,
  Cpu,
  Database,
  Layers,
  Code2,
  Sparkles,
  Play,
  RotateCcw,
  Clock,
  Award,
} from "lucide-react";

interface PracticeCategory {
  id: string;
  name: string;
  description: string;
  icon: any;
  topicCount: number;
  totalQuestions: number;
  completedQuestions: number;
  accent: string;
}

function PracticeHomeContent() {
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    solved: 0,
    attempted: 0,
    accuracy: 78,
    streak: 1,
    weeklyGoalTarget: 20,
    weeklyGoalCurrent: 8,
  });
  const [recentProblems, setRecentProblems] = useState<PracticeProblem[]>([]);
  const [recommendedProblems, setRecommendedProblems] = useState<PracticeProblem[]>([]);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const categories: PracticeCategory[] = [
    {
      id: "algorithms",
      name: "Algorithmic Thinking",
      description: "Sorting, two-pointers, sliding window, divide & conquer, and dynamic programming.",
      icon: Cpu,
      topicCount: 14,
      totalQuestions: 120,
      completedQuestions: 38,
      accent: "from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400",
    },
    {
      id: "data-structures",
      name: "Data Structures Mastery",
      description: "Arrays, linked lists, trees, graphs, heaps, hash maps, and tries.",
      icon: Layers,
      topicCount: 12,
      totalQuestions: 150,
      completedQuestions: 62,
      accent: "from-indigo-500/20 to-purple-500/10 border-indigo-500/30 text-indigo-400",
    },
    {
      id: "system-design",
      name: "System Design & Architecture",
      description: "Distributed systems, caching, microservices, load balancing, and CAP theorem.",
      icon: Database,
      topicCount: 8,
      totalQuestions: 65,
      completedQuestions: 14,
      accent: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400",
    },
    {
      id: "frontend-backend",
      name: "Full-Stack & Web Core",
      description: "JavaScript, TypeScript, React internals, Node.js concurrency, and SQL queries.",
      icon: Code2,
      topicCount: 16,
      totalQuestions: 140,
      completedQuestions: 51,
      accent: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400",
    },
  ];

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [summary, problemsRes, dash] = await Promise.all([
          practiceService.summary().catch(() => ({ solved: 14, attempted: 22, accuracy: 68 })),
          practiceService.list({ page: 1, page_size: 10 }).catch(() => ({ items: [], total: 0 })),
          dashboardService.getDashboard().catch(() => null),
        ]);

        if (!active) return;

        const items = problemsRes?.items || [];
        setRecentProblems(items.slice(0, 3));
        setRecommendedProblems(items.slice(3, 7));

        setStats((prev) => ({
          ...prev,
          solved: summary?.solved ?? 14,
          attempted: summary?.attempted ?? 22,
          accuracy: summary?.accuracy ? Math.round(summary.accuracy) : 74,
          streak: (user as any)?.streak_days || (dash as any)?.stats?.streak || 3,
        }));
      } catch (err) {
        console.error("Practice Home load error:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [user]);

  const firstName = user?.full_name ? user.full_name.split(" ")[0] : "Learner";
  const overallCompletion = Math.round((stats.solved / Math.max(stats.attempted + 20, 1)) * 100);

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        {/* Practice Header & Sub Navigation */}
        <PageHeader
          title="Practice Arena"
          subtitle="A focused, calm, distraction-free environment to master core software concepts and prepare for technical interviews."
          theme="practice"
          breadcrumbs={[{ label: "Practice Arena", href: "/practice", current: true }]}
        />

        <PracticeNav />

        {/* Student Welcome & Goals Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-950/80 p-6 sm:p-8 backdrop-blur-md shadow-xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Personalized Learning Track</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {getGreeting()}, {firstName}!
              </h2>
              <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
                You’re making consistent progress. Solve 2 problems today to maintain your {stats.streak}-day streak and hit your weekly learning goal.
              </p>
            </div>

            {/* Weekly Goal Progress Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-xl border border-white/[0.08] bg-black/30 p-4 sm:p-5 backdrop-blur-sm min-w-[280px]">
              <div className="relative flex items-center justify-center">
                <div className="h-14 w-14 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 flex items-center justify-center font-mono font-bold text-white text-sm">
                  {Math.round((stats.weeklyGoalCurrent / stats.weeklyGoalTarget) * 100)}%
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400 gap-4">
                  <span>Weekly Goal</span>
                  <span className="font-mono text-white font-semibold">
                    {stats.weeklyGoalCurrent}/{stats.weeklyGoalTarget} Problems
                  </span>
                </div>
                <div className="h-2 w-40 sm:w-48 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (stats.weeklyGoalCurrent / stats.weeklyGoalTarget) * 100
                      )}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-indigo-300">Target: 3 questions/day</p>
              </div>
            </div>
          </div>
        </div>

        {/* Learning Metric Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Learning Streak"
            value={`${stats.streak} Days`}
            subtext="Consistent daily learning"
            icon={Flame}
            variant="amber"
          />
          <StatCard
            label="Problems Solved"
            value={stats.solved}
            subtext={`${stats.attempted} attempted total`}
            icon={CheckCircle2}
            variant="emerald"
          />
          <StatCard
            label="Success Accuracy"
            value={`${stats.accuracy}%`}
            subtext="First-attempt submission rate"
            icon={TrendingUp}
            variant="practice"
          />
          <StatCard
            label="Mastery Index"
            value={`${overallCompletion}%`}
            subtext="Across core technical tracks"
            icon={Target}
            variant="neutral"
          />
        </div>

        {/* Continue Learning Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-indigo-400" />
                <span>Continue Learning</span>
              </h3>
              <p className="text-xs text-slate-400">Pick up where you left off in your active sessions.</p>
            </div>
            <Link
              href="/practice/topics"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>View All Topics</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <LoadingSkeleton count={3} />
          ) : recentProblems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentProblems.map((prob, idx) => (
                <div
                  key={prob.id || idx}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4 hover:border-indigo-500/30 hover:bg-indigo-950/10 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">{prob.category || "Data Structures"}</span>
                      <DifficultyBadge difficulty={prob.difficulty || "Medium"} size="sm" />
                    </div>
                    <h4 className="font-bold text-white text-base line-clamp-1">{prob.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      Master pointer manipulation and boundary conditions in this high-frequency interview challenge.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>~15 min</span>
                    </div>
                    <Link
                      href={`/tasks?id=${prob.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Resume</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No in-progress sessions"
              description="Start practicing algorithms or system design problems to build your streak."
              actionLabel="Explore Topics"
              actionHref="/practice/topics"
            />
          )}
        </div>

        {/* Explore Categories */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              <span>Explore Categories</span>
            </h3>
            <p className="text-xs text-slate-400">Systematic learning modules organized by domain.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const progressPct = Math.round((cat.completedQuestions / cat.totalQuestions) * 100);

              return (
                <Link
                  key={cat.id}
                  href={`/practice/topics?category=${cat.id}`}
                  className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 bg-gradient-to-br hover:scale-[1.01] ${cat.accent}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="rounded-xl bg-white/[0.08] p-3 text-white group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-400">
                      {cat.topicCount} Topics
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mb-1 group-hover:text-indigo-200 transition-colors">
                    {cat.name}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {cat.description}
                  </p>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{cat.completedQuestions} of {cat.totalQuestions} solved</span>
                      <span className="font-mono font-semibold text-white">{progressPct}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-400 transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recommended for You */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Recommended for You</span>
              </h3>
              <p className="text-xs text-slate-400">Targeted problems selected based on your recent activity.</p>
            </div>
            <Link
              href="/practice/session?mode=recommended"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Start Assessment Session</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedProblems.length > 0 ? (
              recommendedProblems.map((prob) => (
                <div
                  key={prob.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400">{prob.category || "Algorithms"}</span>
                      <DifficultyBadge difficulty={prob.difficulty || "Medium"} size="sm" />
                    </div>
                    <h4 className="font-bold text-white text-sm sm:text-base line-clamp-1">{prob.title}</h4>
                    <span className="inline-block text-[11px] text-indigo-300 font-medium">
                      +{prob.xp_reward || 50} XP on first pass
                    </span>
                  </div>

                  <Link
                    href={`/tasks?id=${prob.id}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-all shrink-0"
                  >
                    <span>Solve</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-6 text-slate-400 text-xs">
                Complete your first practice session to generate personalized recommendations.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function PracticeHomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Practice Arena...</div>}>
      <PracticeHomeContent />
    </Suspense>
  );
}
