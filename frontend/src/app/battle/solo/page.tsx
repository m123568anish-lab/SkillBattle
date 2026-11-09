"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  PageHeader,
  BattleNav,
} from "@/components/arena";
import {
  BookOpen,
  Code2,
  ShieldAlert,
  Play,
} from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { practiceService } from "@/services/practice.service";

export default function SoloBattleSelectionPage() {
  const router = useRouter();

  // MCQ Config state
  const [mcqCategory, setMcqCategory] = useState("Algorithms & Data Structures");
  const [mcqDifficulty, setMcqDifficulty] = useState("Medium");
  const [mcqQuestionsCount, setMcqQuestionsCount] = useState(10);

  // Coding Config state
  const [codingDifficulty, setCodingDifficulty] = useState("Medium");
  const [codingLanguage, setCodingLanguage] = useState("python");
  const [creatingBattle, setCreatingBattle] = useState(false);

  const handleStartMcq = () => {
    const params = new URLSearchParams({
      topic: mcqCategory,
      difficulty: mcqDifficulty.toLowerCase(),
      count: String(mcqQuestionsCount),
    });
    router.push(`/practice/session?${params.toString()}`);
  };

  const handleStartCoding = async () => {
    setCreatingBattle(true);
    try {
      const catalog = await practiceService.list({
        difficulty: codingDifficulty.toLowerCase(),
        page: 1,
        page_size: 1,
      });
      const problem = catalog.items[0];
      if (!problem) {
        toast.error(`No ${codingDifficulty.toLowerCase()} coding problems are available right now.`);
        return;
      }

      const { data } = await api.post<{ id: string }>("/battle/create", {
        title: "Solo coding challenge",
        difficulty: codingDifficulty.toLowerCase(),
        problem_id: problem.id,
        battle_type: "general",
        battle_mode: "solo",
        max_players: 1,
      });
      if (!data.id) throw new Error("The server did not return a battle ID.");
      router.push(`/battle/${encodeURIComponent(data.id)}?lang=${encodeURIComponent(codingLanguage)}`);
    } catch {
      toast.error("Unable to create a coding battle. Please try again.");
    } finally {
      setCreatingBattle(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-12">
        <PageHeader
          title="Solo Challenges"
          subtitle="Practice with database-backed MCQ questions or create a server-managed coding challenge."
          theme="battle"
          breadcrumbs={[
            { label: "Qubira Arena", href: "/battle" },
            { label: "Solo Challenges", href: "/battle/solo", current: true },
          ]}
        />

        <BattleNav />

        {/* Two Large Distinct Mode Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Card 1: MCQ Practice */}
          <div className="relative flex flex-col justify-between space-y-6 overflow-hidden rounded-3xl border border-purple-500/30 bg-[var(--surface-card)] p-6 shadow-2xl sm:p-8">
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="rounded-2xl border border-purple-500/40 bg-purple-500/10 p-3 text-purple-300">
                  <BookOpen className="h-6 w-6" />
                </div>
                <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-300">
                  Question practice
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">MCQ Practice</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Answer eligible questions from the database. Your submitted answers and qualifying rewards are saved to your account.
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
                    className="min-h-11 w-full rounded-xl border border-white/10 bg-black/50 px-3.5 py-2.5 text-xs font-semibold text-white focus:border-purple-500 focus:outline-none"
                  >
                    <option value="Algorithms & Data Structures">Algorithms & Data Structures</option>
                    <option value="System Design & Caching">System Design & Caching</option>
                    <option value="SQL & Database Internals">SQL & Database Internals</option>
                    <option value="Web & JavaScript Core">Web & JavaScript Core</option>
                  </select>
                </div>

                {/* Difficulty and question count */}
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
                          className={`min-h-11 flex-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                      Number of questions
                    </label>
                    <select
                      value={mcqQuestionsCount}
                      onChange={(event) => setMcqQuestionsCount(Number(event.target.value))}
                      className="min-h-11 w-full rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-xs font-bold text-white focus:border-purple-500 focus:outline-none"
                    >
                      {[5, 10, 20].map((count) => (
                        <option key={count} value={count}>{count}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Launch MCQ Button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleStartMcq}
                className="min-h-12 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 px-6 py-4 text-sm font-black text-white shadow-xl shadow-purple-600/30 hover:scale-[1.01] hover:shadow-purple-500/40 transition-all cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Start MCQ Practice ({mcqQuestionsCount} Questions)</span>
              </button>
            </div>
          </div>

          {/* Card 2: Coding Solo Battle */}
          <div className="relative flex flex-col justify-between space-y-6 overflow-hidden rounded-3xl border border-cyan-500/30 bg-[var(--surface-card)] p-6 shadow-2xl sm:p-8">
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
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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
                        className={`min-h-11 rounded-xl px-2 text-xs font-bold transition-all cursor-pointer ${
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
                        className={`min-h-11 flex-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                disabled={creatingBattle}
                className="min-h-12 w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 px-6 py-4 text-sm font-black text-slate-950 shadow-xl shadow-cyan-500/25 hover:scale-[1.01] hover:shadow-cyan-400/40 transition-all cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>{creatingBattle ? "Creating battle..." : `Launch Coding IDE (${codingDifficulty})`}</span>
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
            1. Battle status and any recorded result are determined by the server.
            <br />
            2. Coding submissions are evaluated by the server-side judge.
            <br />
            3. Rewards and rating changes are shown only when returned by the server.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
