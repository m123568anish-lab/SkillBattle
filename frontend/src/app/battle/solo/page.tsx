"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  PageHeader,
  DifficultyBadge,
  StatCard,
  BattleNav,
} from "@/components/arena";
import {
  BookOpen,
  Code2,
  Clock,
  Zap,
  Target,
  Trophy,
  Flame,
  ArrowRight,
  ShieldAlert,
  Play,
  Layers,
  Sparkles,
} from "lucide-react";

function SoloBattleSelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") || "all";

  // MCQ Config state
  const [mcqCategory, setMcqCategory] = useState("Algorithms & Data Structures");
  const [mcqDifficulty, setMcqDifficulty] = useState("Medium");
  const [mcqDuration, setMcqDuration] = useState(5); // minutes
  const [mcqQuestionsCount, setMcqQuestionsCount] = useState(10);

  // Coding Config state
  const [codingDifficulty, setCodingDifficulty] = useState("Medium");
  const [codingLanguage, setCodingLanguage] = useState("python");

  const handleStartMcq = () => {
    router.push(
      `/battle/solo/mcq?category=${encodeURIComponent(mcqCategory)}&difficulty=${mcqDifficulty}&duration=${mcqDuration}&count=${mcqQuestionsCount}`
    );
  };

  const handleStartCoding = () => {
    router.push(`/battle/1?mode=solo&lang=${codingLanguage}&diff=${codingDifficulty}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <PageHeader
          title="Solo Battle Arena"
          subtitle="Challenge yourself in high-intensity timed MCQ sprints or deep algorithmic coding battles. Beat your personal best and gain Battle Rating."
          theme="battle"
          breadcrumbs={[
            { label: "Battle Arena", href: "/battle" },
            { label: "Solo Battle", href: "/battle/solo", current: true },
          ]}
        />

        <BattleNav />

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Solo Rating"
            value="1,240 ELO"
            subtext="Platinum Tier Competitor"
            icon={Trophy}
            variant="battle"
          />
          <StatCard
            label="Fastest Solve"
            value="42s"
            subtext="Arrays & Two Pointers sprint"
            icon={Zap}
            variant="amber"
          />
          <StatCard
            label="Win Streak"
            value="6 Battles"
            subtext="Flawless completion rate"
            icon={Flame}
            variant="emerald"
          />
          <StatCard
            label="Battle XP"
            value="+1,850"
            subtext="Earned through timed duels"
            icon={Target}
            variant="neutral"
          />
        </div>

        {/* Two Large Distinct Mode Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: MCQ Solo Battle */}
          <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/30 via-slate-900/60 to-slate-950/90 p-6 sm:p-8 space-y-6 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl border border-purple-500/40 bg-purple-500/10 p-3 text-purple-300">
                  <BookOpen className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-300">
                  Speed Duel
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">MCQ Solo Sprint</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Rapid-fire conceptual challenges under strict time pressure. Test your mastery of algorithmic invariants, system design, and language runtimes.
                </p>
              </div>

              {/* Configuration Controls */}
              <div className="space-y-4 pt-2 border-t border-white/[0.08]">
                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Category Track
                  </label>
                  <select
                    value={mcqCategory}
                    onChange={(e) => setMcqCategory(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-xs font-semibold text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Algorithms & Data Structures">Algorithms & Data Structures</option>
                    <option value="System Design & Caching">System Design & Caching</option>
                    <option value="SQL & Database Internals">SQL & Database Internals</option>
                    <option value="Web & JavaScript Core">Web & JavaScript Core</option>
                  </select>
                </div>

                {/* Difficulty & Duration Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Difficulty
                    </label>
                    <div className="flex items-center gap-1.5">
                      {["Easy", "Medium", "Hard"].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setMcqDifficulty(d)}
                          className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer ${
                            mcqDifficulty === d
                              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                              : "border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Duration
                    </label>
                    <div className="flex items-center gap-1.5">
                      {[3, 5, 10].map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => setMcqDuration(mins)}
                          className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition-all cursor-pointer ${
                            mcqDuration === mins
                              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                              : "border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white"
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Launch MCQ Button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleStartMcq}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-6 py-4 text-sm font-black text-white shadow-xl shadow-purple-600/30 hover:scale-[1.01] hover:shadow-purple-500/40 transition-all cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Launch MCQ Sprint ({mcqDuration} Mins)</span>
              </button>
            </div>
          </div>

          {/* Card 2: Coding Solo Battle */}
          <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/30 via-slate-900/60 to-slate-950/90 p-6 sm:p-8 space-y-6 backdrop-blur-xl shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl border border-cyan-500/40 bg-cyan-500/10 p-3 text-cyan-300">
                  <Code2 className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
                  Full IDE Suite
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">Algorithmic Coding Battle</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Solve LeetCode-style algorithmic challenges in our Monaco IDE. Run test cases against hidden unit tests and submit before the clock expires.
                </p>
              </div>

              {/* Configuration Controls */}
              <div className="space-y-4 pt-2 border-t border-white/[0.08]">
                {/* Language Picker */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Programming Language
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: "python", label: "Python 3" },
                      { id: "javascript", label: "JavaScript" },
                      { id: "cpp", label: "C++ 20" },
                      { id: "java", label: "Java 17" },
                    ].map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setCodingLanguage(lang.id)}
                        className={`rounded-xl py-2 text-xs font-bold transition-all cursor-pointer ${
                          codingLanguage === lang.id
                            ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30"
                            : "border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white"
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Challenge Difficulty
                  </label>
                  <div className="flex items-center gap-2">
                    {["Easy", "Medium", "Hard"].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setCodingDifficulty(d)}
                        className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all cursor-pointer ${
                          codingDifficulty === d
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            : "border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white"
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Launch Coding Button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleStartCoding}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-6 py-4 text-sm font-black text-slate-950 shadow-xl shadow-cyan-500/25 hover:scale-[1.01] hover:shadow-cyan-400/40 transition-all cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Launch Coding IDE ({codingDifficulty})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Rules & Guidelines */}
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6 space-y-3 text-xs text-slate-400">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-400" />
            <span>Solo Battle Rules & Rating Invariants</span>
          </h3>
          <p className="leading-relaxed">
            1. Leaving an active timed battle counts as a forfeit and will record an incomplete attempt.
            <br />
            2. In Coding battles, all test cases must pass within execution limits (2.0s runtime, 256MB memory).
            <br />
            3. Rating points (ELO) are awarded upon completion based on execution speed and accuracy.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function SoloBattleSelectionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Solo Battle Arena...</div>}>
      <SoloBattleSelectionContent />
    </Suspense>
  );
}
