"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PracticeNav from "@/components/practice/PracticeNav";
import {
  PageHeader,
  StatCard,
  DifficultyBadge,
} from "@/components/arena";
import { practiceService } from "@/services/practice.service";
import { useAuthStore } from "@/store/authStore";
import {
  TrendingUp,
  CheckCircle2,
  Flame,
  Target,
  ArrowRight,
  Brain,
  AlertTriangle,
  Award,
  Calendar,
  Layers,
  Sparkles,
  BarChart3,
  RotateCcw,
} from "lucide-react";

interface TopicMastery {
  topic: string;
  category: string;
  masteryPct: number;
  solved: number;
  total: number;
  status: "strong" | "learning" | "weak";
}

export default function MyProgressPage() {
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    solved: 34,
    attempted: 48,
    accuracy: 71,
    streak: 5,
    xpTotal: 2150,
  });

  const topicMasteries: TopicMastery[] = [
    { topic: "Arrays & Two Pointers", category: "Data Structures", masteryPct: 85, solved: 17, total: 20, status: "strong" },
    { topic: "Binary Search & Bounds", category: "Algorithms", masteryPct: 78, solved: 14, total: 18, status: "strong" },
    { topic: "Linked Lists & Fast/Slow", category: "Data Structures", masteryPct: 65, solved: 10, total: 15, status: "learning" },
    { topic: "Sliding Window Substrings", category: "Algorithms", masteryPct: 50, solved: 6, total: 12, status: "learning" },
    { topic: "Dynamic Programming (2D)", category: "Algorithms", masteryPct: 28, solved: 4, total: 14, status: "weak" },
    { topic: "Graph Traversal & BFS/DFS", category: "Algorithms", masteryPct: 35, solved: 5, total: 14, status: "weak" },
  ];

  useEffect(() => {
    practiceService
      .summary()
      .then((res) => {
        if (res) {
          setStats((prev) => ({
            ...prev,
            solved: res.solved || prev.solved,
            attempted: res.attempted || prev.attempted,
            accuracy: res.accuracy ? Math.round(res.accuracy) : prev.accuracy,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const strongTopics = topicMasteries.filter((t) => t.status === "strong");
  const weakTopics = topicMasteries.filter((t) => t.status === "weak");

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          title="My Learning Progress"
          subtitle="Detailed analytics, topic mastery indices, and data-driven revision recommendations."
          theme="practice"
          breadcrumbs={[
            { label: "Practice Arena", href: "/practice" },
            { label: "My Progress", href: "/practice/progress", current: true },
          ]}
        />

        <PracticeNav />

        {/* Primary Metric Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Solved"
            value={stats.solved}
            subtext={`${stats.attempted} attempted problems`}
            icon={CheckCircle2}
            variant="emerald"
          />
          <StatCard
            label="Overall Accuracy"
            value={`${stats.accuracy}%`}
            subtext="Across all practice categories"
            icon={TrendingUp}
            variant="practice"
          />
          <StatCard
            label="Current Streak"
            value={`${stats.streak} Days`}
            subtext="Active daily practice"
            icon={Flame}
            variant="amber"
          />
          <StatCard
            label="Practice XP"
            value={stats.xpTotal}
            subtext="Earned through problem solving"
            icon={Award}
            variant="neutral"
          />
        </div>

        {/* Weak vs Strong Concept Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weak Topics Card */}
          <div className="rounded-2xl border border-rose-500/20 bg-rose-950/10 p-6 space-y-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span>Priority Revision Areas</span>
              </h3>
              <span className="text-xs text-rose-300 font-medium">Needs Attention</span>
            </div>
            <p className="text-xs text-slate-400">
              Concepts where your first-attempt accuracy was under 40%. Practice these to boost interview confidence.
            </p>

            <div className="space-y-3 pt-1">
              {weakTopics.map((item) => (
                <div
                  key={item.topic}
                  className="rounded-xl border border-white/5 bg-black/40 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{item.topic}</span>
                    <span className="font-mono text-rose-400 font-semibold">{item.masteryPct}% Mastery</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-rose-500 transition-all"
                      style={{ width: `${item.masteryPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">{item.solved} of {item.total} Solved</span>
                    <Link
                      href={`/practice/session?topic=${encodeURIComponent(item.topic)}&mode=learn`}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                    >
                      <span>Practice Topic</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strong Concepts Card */}
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/10 p-6 space-y-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Brain className="h-4 w-4 text-emerald-400" />
                <span>Mastered Strengths</span>
              </h3>
              <span className="text-xs text-emerald-300 font-medium">High Proficiency</span>
            </div>
            <p className="text-xs text-slate-400">
              Topics where your accuracy exceeds 75%. You consistently solve these with optimal algorithmic complexity.
            </p>

            <div className="space-y-3 pt-1">
              {strongTopics.map((item) => (
                <div
                  key={item.topic}
                  className="rounded-xl border border-white/5 bg-black/40 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{item.topic}</span>
                    <span className="font-mono text-emerald-400 font-semibold">{item.masteryPct}% Mastery</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${item.masteryPct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">{item.solved} of {item.total} Solved</span>
                    <span className="text-[11px] font-semibold text-emerald-300">Interview Ready</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detailed Topic Mastery Table */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-400" />
              <span>Full Topic Mastery Breakdown</span>
            </h3>
            <span className="text-xs text-slate-400">{topicMasteries.length} Tracked Topics</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.08] text-slate-400 font-semibold">
                <tr>
                  <th className="pb-3">Topic</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Solved / Total</th>
                  <th className="pb-3">Mastery</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {topicMasteries.map((item) => (
                  <tr key={item.topic} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3.5 font-bold text-white">{item.topic}</td>
                    <td className="py-3.5 text-slate-400">{item.category}</td>
                    <td className="py-3.5 font-mono text-slate-300">
                      {item.solved} / {item.total}
                    </td>
                    <td className="py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              item.status === "strong"
                                ? "bg-emerald-400"
                                : item.status === "learning"
                                ? "bg-indigo-400"
                                : "bg-rose-400"
                            }`}
                            style={{ width: `${item.masteryPct}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-300">{item.masteryPct}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 text-right">
                      <Link
                        href={`/practice/session?topic=${encodeURIComponent(item.topic)}&mode=learn`}
                        className="inline-flex items-center gap-1 rounded-lg bg-white/[0.05] border border-white/10 px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                      >
                        <span>Practice</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
