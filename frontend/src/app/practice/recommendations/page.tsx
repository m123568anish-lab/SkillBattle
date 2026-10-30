"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Breadcrumbs, DifficultyBadge } from "@/components/arena";
import {
  Sparkles,
  Zap,
  Target,
  ArrowRight,
  TrendingUp,
  Brain,
  Code2,
  CheckCircle2,
  Award,
  Layers,
  ChevronRight,
  Compass,
} from "lucide-react";

interface Recommendation {
  id: string;
  type: "coding" | "mcq" | "topic";
  title: string;
  category: string;
  difficulty: string;
  reason: string;
  roi: "High" | "Critical" | "Recommended";
  xp: number;
  href: string;
}

const DEFAULT_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "rec_1",
    type: "coding",
    title: "Binary Tree Maximum Path Sum",
    category: "Trees & Graphs",
    difficulty: "Hard",
    reason: "Your tree traversal accuracy is 45%. Mastering recursion base cases will unlock +15% overall accuracy in technical interviews.",
    roi: "Critical",
    xp: 60,
    href: "/practice/coding",
  },
  {
    id: "rec_2",
    type: "mcq",
    title: "Sliding Window & Two Pointer Drill",
    category: "Algorithms",
    difficulty: "Medium",
    reason: "Frequently asked by Meta and Amazon for entry-level SDE II interviews. Takes under 10 minutes to review.",
    roi: "High",
    xp: 35,
    href: "/practice/session?topic=Algorithms&count=10",
  },
  {
    id: "rec_3",
    type: "topic",
    title: "Distributed Caching (Redis & Memcached)",
    category: "System Design",
    difficulty: "Intermediate",
    reason: "You have not completed any system architecture modules this week. Solidify your distributed systems foundation.",
    roi: "Recommended",
    xp: 50,
    href: "/practice/topics/system-design",
  },
  {
    id: "rec_4",
    type: "coding",
    title: "Merge Intervals",
    category: "Arrays & Sorting",
    difficulty: "Medium",
    reason: "Fastest path to reinforce in-place sorting and overlap conditions.",
    roi: "High",
    xp: 40,
    href: "/practice/coding",
  },
];

function RecommendationsInner() {
  const [recommendations] = useState<Recommendation[]>(DEFAULT_RECOMMENDATIONS);

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-6xl space-y-7 p-4 sm:p-7">
        <Breadcrumbs
          items={[
            { label: "Practice Hub", href: "/practice" },
            { label: "AI Recommendations", href: "/practice/recommendations", active: true },
          ]}
        />

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0E1524] via-[#0B0F17] to-[#141C2E] p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                <Compass className="h-3.5 w-3.5 text-cyan-400" />
                <span>Intelligent Learning Guidance</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                Personalized Next Steps
              </h1>
              <p className="max-w-xl text-sm sm:text-base text-slate-300">
                Our algorithm analyzes your submission history, time-per-question, and error patterns to recommend the highest-impact concepts to study next.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">+24%</div>
                <div className="text-xs text-slate-400">Projected Accuracy Boost</div>
              </div>
            </div>
          </div>
        </section>

        {/* Recommendations Feed */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">Recommended Focus Areas Today</h2>
            <p className="text-xs text-slate-400">Ranked by estimated improvement to your interview readiness score</p>
          </div>

          <div className="space-y-4">
            {recommendations.map((rec) => {
              const roiColor =
                rec.roi === "Critical"
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                  : rec.roi === "High"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  : "bg-cyan-500/20 text-cyan-300 border-cyan-500/30";

              return (
                <div
                  key={rec.id}
                  className="rounded-2xl border border-white/[0.08] bg-[#0E1524] p-5 sm:p-6 transition hover:border-cyan-500/30 hover:bg-[#121B2F] flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${roiColor}`}>
                        {rec.roi} Impact
                      </span>
                      <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-mono text-slate-300">
                        {rec.category}
                      </span>
                      <DifficultyBadge difficulty={rec.difficulty} />
                      <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
                        <Award className="h-3.5 w-3.5" /> +{rec.xp} XP
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{rec.title}</h3>

                    <div className="rounded-xl bg-[#070A0F] p-3 border border-white/5 text-xs text-slate-300 flex items-start gap-2.5">
                      <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                      <p>{rec.reason}</p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Link
                      href={rec.href}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500 active:scale-95"
                    >
                      <span>Start Practice</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
}

export default function RecommendationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070A0F]" />}>
      <RecommendationsInner />
    </Suspense>
  );
}
