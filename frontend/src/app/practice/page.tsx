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
  Layers,
  Sparkles,
  Play,
  RotateCcw,
  Clock,
} from "lucide-react";

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
  const [availableProblemTotal, setAvailableProblemTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);

  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [summary, activeRes, availableRes, dash] = await Promise.all([
          practiceService.summary(),
          practiceService.list({ page: 1, page_size: 3, status: "attempted" }),
          practiceService.list({ page: 1, page_size: 4, status: "unsolved", ready_only: "true" }),
          dashboardService.getDashboard(),
        ]);

        if (!active) return;

        setActiveProblems(activeRes.items);
        setAvailableProblems(availableRes.items);
        setAvailableProblemTotal(availableRes.available_total);
        setCategories([...new Set(availableRes.categories)]);
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
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/25 bg-[var(--accent)]/10 px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Practice progress</span>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
                {getGreeting()}, {firstName}!
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-[var(--text-secondary)]">
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
            value={metricValue(availableProblemTotal)}
            subtext="Unsolved active problems"
            icon={BookOpen}
            variant="neutral"
          />
        </div>

        {/* Continue Learning Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
                <RotateCcw className="h-4 w-4 text-[var(--accent-strong)]" />
                <span>Unfinished Problems</span>
              </h3>
              <p className="text-xs text-[var(--text-muted)]">Problems with a saved attempt and no accepted solution.</p>
            </div>
            <Link
              href="/practice/topics"
              className="flex items-center gap-1 text-xs font-semibold text-[var(--accent-strong)] hover:text-[var(--text-primary)]"
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
                  className="flex flex-col justify-between space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 transition-colors hover:border-[var(--accent)]/30 hover:bg-[var(--surface-elevated)]"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-400">{prob.category || "Uncategorized"}</span>
                      <DifficultyBadge difficulty={prob.difficulty || "Unknown"} size="sm" />
                    </div>
                    <h4 className={`font-bold text-base line-clamp-1 ${prob.title ? "text-white" : "text-amber-200"}`}>
                      {prob.title ?? "Metadata repair required"}
                    </h4>
                    {!prob.can_solve && (
                      <p className="text-[11px] text-amber-300">This saved problem is unavailable until its metadata is repaired.</p>
                    )}
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
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[var(--accent)] px-3.5 py-1.5 text-xs font-bold text-[var(--text-on-accent)] transition-colors hover:bg-[var(--accent-strong)]"
                    >
                      <Play className="h-3 w-3 fill-current" />
                      <span>{prob.can_solve ? "Continue" : "Review metadata"}</span>
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
              <Layers className="h-4 w-4 text-[var(--accent-strong)]" />
              <span>Explore Categories</span>
            </h3>
            <p className="text-xs text-slate-400">Systematic learning modules organized by domain.</p>
          </div>

          {loadError ? (
            <p role="status" className="text-sm text-[var(--text-muted)]">
              Catalog categories are unavailable right now.
            </p>
          ) : loading && categories.length === 0 ? (
            <LoadingSkeleton count={4} />
          ) : categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/practice/coding?category=${encodeURIComponent(category)}`}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-3.5 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
                >
                  <Layers className="h-4 w-4 text-[var(--accent-strong)]" aria-hidden="true" />
                  {category}
                  <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)]" aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No categories available"
              description="Categories will appear when the problem catalog has active problems."
              actionLabel="Browse all problems"
              actionHref="/practice/coding"
            />
          )}
        </div>

        {/* Recommended for You */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>More Problems</span>
              </h3>
              <p className="text-xs text-slate-400">Unsolved problems available in the catalog.</p>
            </div>
            <Link
              href="/practice/coding"
              className="flex items-center gap-1 text-xs font-semibold text-[var(--accent-strong)] hover:text-[var(--text-primary)]"
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
                  className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] p-4 transition-colors hover:border-[var(--accent)]/30 hover:bg-[var(--surface-elevated)]"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400">{prob.category || "Uncategorized"}</span>
                      <DifficultyBadge difficulty={prob.difficulty || "Unknown"} size="sm" />
                    </div>
                    <h4 className="font-bold text-white text-sm sm:text-base line-clamp-1">
                      {prob.title ?? "Metadata repair required"}
                    </h4>
                  </div>

                  <Link
                    href={`/practice/coding?problem=${prob.id}`}
                    className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent)]/40 hover:text-[var(--accent-strong)]"
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
