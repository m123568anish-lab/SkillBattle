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
} from "lucide-react";

interface PracticeCategory {
  id: string;
  name: string;
  description: string;
  icon: typeof Cpu;
  accent: string;
}

function PracticeHomeContent() {
  const user = useAuthStore((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [stats, setStats] = useState({
    solved: 0,
    attempted: 0,
    accuracy: null as number | null,
    streak: 0,
  });
  const [activeProblems, setActiveProblems] = useState<PracticeProblem[]>([]);
  const [availableProblems, setAvailableProblems] = useState<PracticeProblem[]>([]);

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
      accent: "from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400",
    },
    {
      id: "data-structures",
      name: "Data Structures Mastery",
      description: "Arrays, linked lists, trees, graphs, heaps, hash maps, and tries.",
      icon: Layers,
      accent: "from-indigo-500/20 to-purple-500/10 border-indigo-500/30 text-indigo-400",
    },
    {
      id: "system-design",
      name: "System Design & Architecture",
      description: "Distributed systems, caching, microservices, load balancing, and CAP theorem.",
      icon: Database,
      accent: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400",
    },
    {
      id: "frontend-backend",
      name: "Full-Stack & Web Core",
      description: "JavaScript, TypeScript, React internals, Node.js concurrency, and SQL queries.",
      icon: Code2,
      accent: "from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400",
    },
  ];

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [summary, activeRes, availableRes, dash] = await Promise.all([
          practiceService.summary(),
          practiceService.list({ page: 1, page_size: 3, status: "attempted" }),
          practiceService.list({ page: 1, page_size: 4, status: "unsolved" }),
          dashboardService.getDashboard(),
        ]);

        if (!active) return;

        setActiveProblems(activeRes.items);
        setAvailableProblems(availableRes.items);
        setStats({
          solved: summary.solved,
          attempted: summary.attempted,
          accuracy: summary.accuracy,
          streak: dash.stats.streak,
        });
      } catch (err) {
        console.error("Practice Home load error:", err);
        if (active) setLoadError("Practice metrics could not be loaded. Please try again later.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const firstName = user?.full_name ? user.full_name.split(" ")[0] : "Learner";
  const metricValue = (value: string | number) => loading || loadError ? "—" : value;

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        {/* Practice Header & Sub Navigation */}
        <PageHeader
          title="Qubira Learn"
          subtitle="A focused, calm, distraction-free environment to master core software concepts and prepare for technical interviews."
          theme="practice"
          breadcrumbs={[{ label: "Qubira Learn", href: "/practice", current: true }]}
        />

        <PracticeNav />

        {loadError && (
          <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
            {loadError}
          </div>
        )}

        {/* Student Welcome */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-slate-900/60 to-slate-950/80 p-6 sm:p-8 backdrop-blur-md shadow-xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
                <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                <span>Practice progress</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {getGreeting()}, {firstName}!
              </h2>
              <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
                Your practice metrics reflect saved submissions and activity recorded for your account.
              </p>
            </div>
          </div>
        </div>

        {/* Learning Metric Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Learning Streak"
            value={metricValue(`${stats.streak} Days`)}
            subtext="Current recorded streak"
            icon={Flame}
            variant="amber"
          />
          <StatCard
            label="Problems Solved"
            value={metricValue(stats.solved)}
            subtext={`${metricValue(stats.attempted)} attempted problems`}
            icon={CheckCircle2}
            variant="emerald"
          />
          <StatCard
            label="Success Accuracy"
            value={metricValue(stats.accuracy === null ? "N/A" : `${Math.round(stats.accuracy)}%`)}
            subtext="Problems with an accepted solution"
            icon={TrendingUp}
            variant="practice"
          />
          <StatCard
            label="Available Problems"
            value={metricValue(availableProblems.length)}
            subtext="Unsolved active problems"
            icon={BookOpen}
            variant="neutral"
          />
        </div>

        {/* Continue Learning Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <RotateCcw className="h-4 w-4 text-indigo-400" />
                <span>Unfinished Problems</span>
              </h3>
              <p className="text-xs text-slate-400">Problems with a saved attempt and no accepted solution.</p>
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
          ) : !loadError && activeProblems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeProblems.map((prob) => (
                <div
                  key={prob.id}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 space-y-4 hover:border-indigo-500/30 hover:bg-indigo-950/10 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">{prob.category || "Uncategorized"}</span>
                      <DifficultyBadge difficulty={prob.difficulty || "Unknown"} size="sm" />
                    </div>
                    <h4 className="font-bold text-white text-base line-clamp-1">{prob.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {prob.tags.length > 0 ? `Tags: ${prob.tags.join(", ")}` : "No problem tags provided."}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Saved attempt</span>
                    </div>
                    <Link
                      href={`/practice/coding?problem=${prob.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition-colors cursor-pointer"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>Continue</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : !loadError ? (
            <EmptyState
              title="No unfinished problems"
              description="No attempted problems are currently waiting for an accepted solution."
              actionLabel="Explore Topics"
              actionHref="/practice/topics"
            />
          ) : null}
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
              return (
                <Link
                  key={cat.id}
                  href="/practice/coding"
                  className={`group relative overflow-hidden rounded-2xl border p-5 transition-all duration-200 bg-gradient-to-br hover:scale-[1.01] ${cat.accent}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="rounded-xl bg-white/[0.08] p-3 text-white group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-400">Browse</span>
                  </div>

                  <h4 className="text-base font-bold text-white mb-1 group-hover:text-indigo-200 transition-colors">
                    {cat.name}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {cat.description}
                  </p>

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
                <span>More Problems</span>
              </h3>
              <p className="text-xs text-slate-400">Unsolved problems available in the catalog.</p>
            </div>
            <Link
              href="/practice/coding"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <span>Start Assessment Session</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadError ? (
              <div role="alert" className="col-span-2 text-center py-6 text-rose-300 text-xs">
                Available problems could not be loaded.
              </div>
            ) : availableProblems.length > 0 ? (
              availableProblems.map((prob) => (
                <div
                  key={prob.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400">{prob.category || "Uncategorized"}</span>
                      <DifficultyBadge difficulty={prob.difficulty || "Unknown"} size="sm" />
                    </div>
                    <h4 className="font-bold text-white text-sm sm:text-base line-clamp-1">{prob.title}</h4>
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
                {loading ? "Loading available problems…" : "No unsolved active problems are available."}
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
