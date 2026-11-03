"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PracticeNav from "@/components/practice/PracticeNav";
import { PageHeader, StatCard } from "@/components/arena";
import { dashboardService, type DashboardResponse } from "@/services/dashboard.service";
import {
  ArrowRight,
  Award,
  Brain,
  CheckCircle2,
  Flame,
  TrendingUp,
} from "lucide-react";

export default function MyProgressPage() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    dashboardService
      .getDashboard()
      .then((data) => {
        if (active) setDashboard(data);
      })
      .catch(() => {
        if (active) setError("Saved practice progress could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const stats = dashboard?.stats;
  const skills = dashboard?.skill_progress ?? [];
  const lowerAccuracySkills = skills.filter((skill) => skill.accuracy_percent < 40);
  const higherAccuracySkills = skills.filter((skill) => skill.accuracy_percent >= 75);
  const metric = (value: string | number) => loading || error ? "—" : value;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          title="My Learning Progress"
          subtitle="Practice totals and skill accuracy from activity saved to your account."
          theme="practice"
          breadcrumbs={[
            { label: "Qubira Learn", href: "/practice" },
            { label: "My Progress", href: "/practice/progress", current: true },
          ]}
        />
        <PracticeNav />

        {error && (
          <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            label="Problems Solved"
            value={metric(stats?.practice_completed ?? 0)}
            subtext={`${metric(stats?.practice_attempted ?? 0)} attempted`}
            icon={CheckCircle2}
            variant="emerald"
          />
          <StatCard
            label="Success Accuracy"
            value={metric(stats?.practice_accuracy == null ? "N/A" : `${Math.round(stats.practice_accuracy)}%`)}
            subtext="Problems with an accepted solution"
            icon={TrendingUp}
            variant="practice"
          />
          <StatCard
            label="Current Streak"
            value={metric(`${stats?.streak ?? 0} Days`)}
            subtext="Recorded qualifying activity"
            icon={Flame}
            variant="amber"
          />
          <StatCard
            label="Total XP"
            value={metric(stats?.xp ?? 0)}
            subtext="Persisted XP balance"
            icon={Award}
            variant="neutral"
          />
          <StatCard
            label="Daily Assignments"
            value={metric(stats?.practice_tasks_completed ?? 0)}
            subtext="Completed and recorded"
            icon={Brain}
            variant="neutral"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-6 space-y-4">
            <h2 className="text-base font-bold text-white">Skills to revisit</h2>
            <p className="text-xs text-slate-400">Recorded skill accuracy below 40%.</p>
            {loading ? (
              <p className="text-sm text-slate-400">Loading recorded skills…</p>
            ) : error ? null : lowerAccuracySkills.length ? (
              <ul className="space-y-3">
                {lowerAccuracySkills.map((skill) => (
                  <li key={skill.subject} className="rounded-xl border border-white/5 bg-black/40 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-white">{skill.subject}</span>
                      <span className="font-mono text-rose-300">{skill.accuracy_percent}%</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {skill.correct_attempts} accepted of {skill.total_attempts} recorded attempts
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No recorded skills in this range.</p>
            )}
          </section>

          <section className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-6 space-y-4">
            <h2 className="text-base font-bold text-white">Higher-accuracy skills</h2>
            <p className="text-xs text-slate-400">Recorded skill accuracy of 75% or higher.</p>
            {loading ? (
              <p className="text-sm text-slate-400">Loading recorded skills…</p>
            ) : error ? null : higherAccuracySkills.length ? (
              <ul className="space-y-3">
                {higherAccuracySkills.map((skill) => (
                  <li key={skill.subject} className="rounded-xl border border-white/5 bg-black/40 p-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-white">{skill.subject}</span>
                      <span className="font-mono text-emerald-300">{skill.accuracy_percent}%</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {skill.correct_attempts} accepted of {skill.total_attempts} recorded attempts
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">No recorded skills in this range.</p>
            )}
          </section>
        </div>

        <Link
          href="/practice/coding"
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 hover:text-indigo-200"
        >
          Continue practicing <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </DashboardLayout>
  );
}
