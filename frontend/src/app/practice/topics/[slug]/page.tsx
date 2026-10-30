"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PracticeNav from "@/components/practice/PracticeNav";
import {
  PageHeader,
  DifficultyBadge,
  TopicBadge,
  StatCard,
} from "@/components/arena";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  Target,
  Award,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Building,
  Layers,
  ArrowRight,
  Lock,
} from "lucide-react";

interface SubQuestion {
  id: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  status: "solved" | "attempted" | "unsolved";
  xp: number;
  estMinutes: number;
}

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawSlug = (params?.slug as string) || "arrays-and-hashing";
  const topicTitle = rawSlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const [activeTab, setActiveTab] = useState<"curriculum" | "objectives">("curriculum");

  const sampleQuestions: SubQuestion[] = [
    { id: 101, title: "Two Sum & Hash Map Complements", difficulty: "Easy", status: "solved", xp: 50, estMinutes: 10 },
    { id: 102, title: "Valid Anagram & Frequency Arrays", difficulty: "Easy", status: "solved", xp: 50, estMinutes: 10 },
    { id: 103, title: "Group Anagrams by Sorted Tuples", difficulty: "Medium", status: "solved", xp: 75, estMinutes: 15 },
    { id: 104, title: "Top K Frequent Elements (Min-Heap / Bucket Sort)", difficulty: "Medium", status: "attempted", xp: 75, estMinutes: 20 },
    { id: 105, title: "Product of Array Except Self (Prefix/Suffix)", difficulty: "Medium", status: "unsolved", xp: 75, estMinutes: 20 },
    { id: 106, title: "Longest Consecutive Sequence (HashSet Exploration)", difficulty: "Medium", status: "unsolved", xp: 75, estMinutes: 25 },
    { id: 107, title: "Encode and Decode Strings (Length-Delimited)", difficulty: "Medium", status: "unsolved", xp: 75, estMinutes: 20 },
    { id: 108, title: "First Missing Positive (In-place Cyclic Sort)", difficulty: "Hard", status: "unsolved", xp: 120, estMinutes: 35 },
  ];

  const solvedCount = sampleQuestions.filter((q) => q.status === "solved").length;
  const progressPct = Math.round((solvedCount / sampleQuestions.length) * 100);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12">
        <PageHeader
          title={topicTitle}
          subtitle="Comprehensive conceptual guide, pattern breakdowns, and graded challenge roadmap."
          theme="practice"
          breadcrumbs={[
            { label: "Practice Arena", href: "/practice" },
            { label: "Explore Topics", href: "/practice/topics" },
            { label: topicTitle, href: "#", current: true },
          ]}
        />

        <PracticeNav />

        {/* Topic Hero Card */}
        <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-950/80 p-6 sm:p-8 backdrop-blur-md shadow-xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-300">
                  Core Track
                </span>
                <DifficultyBadge difficulty="Medium" size="sm" />
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                  Tier 1 Interview Essential
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white">{topicTitle}</h2>

              <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                Master hash tables, contiguous memory access, sliding windows, and amortized complexity. This pattern represents over 35% of algorithmic interview questions asked at top-tier technology companies.
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-slate-400" />
                  <span>Asked at: Google, Meta, Microsoft, Uber, Amazon</span>
                </span>
              </div>
            </div>

            {/* Topic Actions */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[240px]">
              <Link
                href={`/practice/session?topic=${rawSlug}&mode=learn`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>{solvedCount > 0 ? "Continue Practice" : "Start Practice"}</span>
              </Link>

              <Link
                href={`/practice/session?topic=${rawSlug}&mode=assessment`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/[0.08] transition-all cursor-pointer"
              >
                <Award className="h-4 w-4 text-amber-400" />
                <span>Topic Assessment</span>
              </Link>

              <Link
                href={`/practice/session?topic=${rawSlug}&mode=review`}
                className="inline-flex items-center justify-center gap-2 text-xs font-medium text-slate-400 hover:text-indigo-300 transition-colors py-1"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Review Mistakes & Notes</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Curriculum Progress"
            value={`${progressPct}%`}
            subtext={`${solvedCount} of ${sampleQuestions.length} completed`}
            icon={Target}
            variant="practice"
          />
          <StatCard
            label="Easy Distribution"
            value="2 Questions"
            subtext="Foundation principles"
            icon={CheckCircle2}
            variant="emerald"
          />
          <StatCard
            label="Medium Distribution"
            value="5 Questions"
            subtext="Core interview patterns"
            icon={Layers}
            variant="amber"
          />
          <StatCard
            label="Hard Distribution"
            value="1 Question"
            subtext="Advanced optimizations"
            icon={ShieldCheck}
            variant="neutral"
          />
        </div>

        {/* Learning Objectives & Overview */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-indigo-400" />
            <span>Key Learning Objectives</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4 space-y-2">
              <h4 className="text-sm font-bold text-indigo-300">1. Time-Space Tradeoffs</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Learn how to reduce quadratic O(N²) brute force searches down to linear O(N) time using extra hash set or hash map auxiliary storage.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4 space-y-2">
              <h4 className="text-sm font-bold text-indigo-300">2. In-place Mutability</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Master array indexing tricks, swapping elements into their target cyclic positions, and prefix product accumulation with O(1) additional memory.
              </p>
            </div>
            <div className="rounded-xl border border-white/[0.06] bg-black/20 p-4 space-y-2">
              <h4 className="text-sm font-bold text-indigo-300">3. Edge Case Defensiveness</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Anticipate empty inputs, duplicate keys, integer overflow bounds, and negative values before writing production code.
              </p>
            </div>
          </div>
        </div>

        {/* Graded Question Curriculum List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              <span>Step-by-Step Curriculum</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {solvedCount} / {sampleQuestions.length} Complete
            </span>
          </div>

          <div className="space-y-2.5">
            {sampleQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full font-mono text-xs font-bold shrink-0">
                    {q.status === "solved" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 fill-emerald-500/20" />
                    ) : q.status === "attempted" ? (
                      <span className="rounded-full bg-amber-500/20 text-amber-400 px-2 py-0.5 text-xs">
                        {idx + 1}
                      </span>
                    ) : (
                      <span className="text-slate-500">{idx + 1}</span>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white hover:text-indigo-200 transition-colors">
                        {q.title}
                      </h4>
                      <DifficultyBadge difficulty={q.difficulty} size="sm" />
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>+{q.xp} XP</span>
                      <span>•</span>
                      <span>~{q.estMinutes} mins</span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/tasks?id=${q.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all self-end sm:self-auto shrink-0 cursor-pointer"
                >
                  <span>{q.status === "solved" ? "Review" : "Solve"}</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
