"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Breadcrumbs, PracticeNav } from "@/components/arena";
import {
  Brain,
  Sparkles,
  Zap,
  Target,
  Clock,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Layers,
  ChevronRight,
  Flame,
  Award,
} from "lucide-react";

interface PresetMode {
  id: string;
  title: string;
  description: string;
  count: number;
  difficulty: "Easy" | "Medium" | "Hard" | "all";
  topic: string;
  badge: string;
  iconBg: string;
}

const PRESET_MODES: PresetMode[] = [
  {
    id: "quick_sprint",
    title: "Quick 5-Question Drill",
    description: "Rapid conceptual check. Great for warmups before coding.",
    count: 5,
    difficulty: "Medium",
    topic: "all",
    badge: "Popular",
    iconBg: "from-cyan-500/20 to-blue-500/20 text-cyan-400",
  },
  {
    id: "dsa_deep_dive",
    title: "Data Structures & Algorithms",
    description: "Trees, graphs, dynamic programming, and complexity analysis.",
    count: 10,
    difficulty: "Medium",
    topic: "Data Structures",
    badge: "Core",
    iconBg: "from-purple-500/20 to-pink-500/20 text-purple-400",
  },
  {
    id: "system_design",
    title: "System Design & Architecture",
    description: "Caching, microservices, load balancing, and distributed databases.",
    count: 10,
    difficulty: "Hard",
    topic: "System Design",
    badge: "Interview Heavy",
    iconBg: "from-amber-500/20 to-orange-500/20 text-amber-400",
  },
  {
    id: "mastery_test",
    title: "Full 20-Question Comprehensive",
    description: "Full length assessment covering CS fundamentals and language theory.",
    count: 20,
    difficulty: "all",
    topic: "all",
    badge: "Mixed difficulty",
    iconBg: "from-emerald-500/20 to-teal-500/20 text-emerald-400",
  },
];

function McqPracticeInner() {
  const router = useRouter();
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedCount, setSelectedCount] = useState("10");

  const startCustomSession = () => {
    const params = new URLSearchParams();
    if (selectedTopic !== "all") params.set("topic", selectedTopic);
    if (selectedDifficulty !== "all") params.set("difficulty", selectedDifficulty);
    params.set("count", selectedCount);
    router.push(`/practice/session?${params.toString()}`);
  };

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-6xl space-y-7 p-4 sm:p-7">
        <Breadcrumbs
          items={[
            { label: "Practice Hub", href: "/practice" },
            { label: "MCQ Practice", href: "/practice/mcq", active: true },
          ]}
        />

        <PracticeNav />

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0E1524] via-[#0B0F17] to-[#141C2E] p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                <Brain className="h-3.5 w-3.5 text-purple-400" />
                <span>Conceptual Drills & Practice</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                MCQ Practice Hub
              </h1>
              <p className="max-w-xl text-sm sm:text-base text-slate-300">
                Sharpen technical concepts, identify theoretical blind spots, and learn from in-depth step-by-step explanations at your own pace.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                <Target className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-black text-white">Calm & Focused</div>
                <div className="text-xs text-slate-400">Zero penalty practice mode</div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Launch Presets */}
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">Curated Practice Presets</h2>
            <p className="text-xs text-slate-400">Jump straight into high-yield interview conceptual questions</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRESET_MODES.map((mode) => (
              <div
                key={mode.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0E1524] p-5 sm:p-6 transition hover:border-purple-500/40 hover:bg-[#121B2F]"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-300">
                      {mode.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                    {mode.title}
                  </h3>
                  <p className="text-xs text-slate-300">{mode.description}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">
                    Up to {mode.count} available questions
                  </span>

                  <Link
                    href={`/practice/session?topic=${encodeURIComponent(mode.topic)}&count=${mode.count}&difficulty=${mode.difficulty}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500 border border-purple-500/30 px-4 py-2 text-xs font-bold text-purple-200 hover:text-white transition"
                  >
                    <span>Start Drill</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Custom Session Builder */}
        <section className="rounded-2xl border border-white/[0.08] bg-[#0E1524] p-6 space-y-5">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Custom Practice Session</h3>
            <p className="text-xs text-slate-400">
              Customize your topics, difficulty level, and question volume to target specific weaknesses.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Topic Area</label>
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0B0F17] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-purple-500"
              >
                <option value="all">All Topics (Mixed)</option>
                <option value="Data Structures">Data Structures</option>
                <option value="Algorithms">Algorithms</option>
                <option value="System Design">System Design</option>
                <option value="Operating Systems">Operating Systems</option>
                <option value="DBMS">Database Management</option>
                <option value="Computer Networks">Computer Networks</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Difficulty Level</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0B0F17] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-purple-500"
              >
                <option value="all">Any Difficulty</option>
                <option value="easy">Easy (Fundamentals)</option>
                <option value="medium">Medium (Standard Technical)</option>
                <option value="hard">Hard (Advanced / FAANG)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Number of Questions</label>
              <select
                value={selectedCount}
                onChange={(e) => setSelectedCount(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#0B0F17] px-3.5 py-2.5 text-xs text-slate-200 outline-none focus:border-purple-500"
              >
                <option value="5">5 Questions (~5 mins)</option>
                <option value="10">10 Questions (~10 mins)</option>
                <option value="15">15 Questions (~15 mins)</option>
                <option value="20">20 Questions (~20 mins)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={startCustomSession}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-purple-500/20 transition hover:from-purple-400 hover:to-indigo-500"
            >
              <Sparkles className="h-4 w-4" />
              <span>Launch Custom Practice</span>
            </button>
          </div>
        </section>
      </main>
    </DashboardLayout>
  );
}

export default function McqPracticePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070A0F]" />}>
      <McqPracticeInner />
    </Suspense>
  );
}
