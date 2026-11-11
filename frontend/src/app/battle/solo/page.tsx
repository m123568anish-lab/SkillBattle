"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function SoloBattleSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const preferredMode = (searchParams.get("mode") || "mcq").toLowerCase();

  // MCQ Config state
  const [mcqCategory, setMcqCategory] = useState("Algorithms & Data Structures");
  const [mcqDifficulty, setMcqDifficulty] = useState("Medium");
  const [mcqQuestionsCount, setMcqQuestionsCount] = useState(10);

  // Coding Config state
  const [codingDifficulty, setCodingDifficulty] = useState("Medium");
  const [codingLanguage, setCodingLanguage] = useState("python");
  const [creatingBattle, setCreatingBattle] = useState(false);
  const [activeMode, setActiveMode] = useState<"mcq" | "coding">(
    preferredMode === "coding" ? "coding" : "mcq",
  );

  useEffect(() => {
    setActiveMode(preferredMode === "coding" ? "coding" : "mcq");
  }, [preferredMode]);

  const handleStartMcq = () => {
    const params = new URLSearchParams({
      topic: mcqCategory,
      difficulty: mcqDifficulty.toLowerCase(),
      count: String(mcqQuestionsCount),
    });
    router.push(`/battle/solo/mcq?${params.toString()}`);
  };

  const handleStartCoding = async () => {
    setCreatingBattle(true);
    try {
      const { data } = await api.post<{ id: string }>("/battle/create", {
        title: "Solo coding challenge",
        difficulty: codingDifficulty.toLowerCase(),
        battle_type: "general",
        battle_mode: "solo",
        max_players: 1,
        question_type: "coding",
        question_count: 1,
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
      <div className="space-y-6 pb-12 sm:space-y-8">
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8">
          {/* Card 1: MCQ Practice */}
          <section
            aria-labelledby="solo-mcq-title"
            className={`relative flex flex-col justify-between space-y-5 overflow-hidden rounded-[24px] border p-4 transition-colors sm:space-y-6 sm:rounded-3xl sm:p-8 ${
              activeMode === "mcq"
                ? "border-[#D8FF3E]/45 bg-[#101010] ring-1 ring-[#D8FF3E]/20"
                : "border-[#252525] bg-[#101010]"
            }`}
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="rounded-2xl border border-[#D8FF3E]/30 bg-[#D8FF3E]/10 p-3 text-[#D8FF3E]">
                  <BookOpen className="h-6 w-6" />
                </div>
                <button
                  type="button"
                  aria-pressed={activeMode === "mcq"}
                  onClick={() => setActiveMode("mcq")}
                  className={`min-h-10 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors sm:text-xs ${
                    activeMode === "mcq"
                      ? "border-[#D8FF3E]/40 bg-[#D8FF3E]/10 text-[#D8FF3E]"
                      : "border-[#252525] bg-[#0B0B0B] text-[#A1A1AA] hover:text-[#F5F5F5]"
                  }`}
                >
                  {activeMode === "mcq" ? "Selected mode" : "Select MCQ"}
                </button>
              </div>

              <div>
                <h2 id="solo-mcq-title" className="text-xl font-black text-[#F5F5F5] sm:text-2xl">MCQ Practice</h2>
                <p className="mt-1 text-xs leading-relaxed text-[#A1A1AA] sm:text-sm">
                  Answer eligible questions from the database. Your submitted answers and qualifying rewards are saved to your account.
                </p>
              </div>

              {/* Configuration Controls */}
              <div className="space-y-4 border-t border-[#252525] pt-4">
                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                    Category Track
                  </label>
                  <select
                    value={mcqCategory}
                    onChange={(e) => setMcqCategory(e.target.value)}
                    className="min-h-12 w-full rounded-xl border border-[#252525] bg-[#050505] px-3.5 py-2.5 text-xs font-semibold text-[#F5F5F5] focus:border-[#D8FF3E]/60 focus:outline-none"
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
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                      Difficulty
                    </label>
                    <div className="flex items-center gap-1.5">
                      {["Easy", "Medium", "Hard"].map((d) => (
                        <button
                          key={d}
                          type="button"
                          aria-pressed={mcqDifficulty === d}
                          onClick={() => setMcqDifficulty(d)}
                          className={`min-h-11 flex-1 rounded-lg text-xs font-bold transition-colors ${
                            mcqDifficulty === d
                              ? "border border-[#D8FF3E]/40 bg-[#D8FF3E] text-[#101010]"
                              : "border border-[#252525] bg-[#0B0B0B] text-[#A1A1AA] hover:text-[#F5F5F5]"
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                      Number of questions
                    </label>
                    <select
                      value={mcqQuestionsCount}
                      onChange={(event) => setMcqQuestionsCount(Number(event.target.value))}
                      className="min-h-11 w-full rounded-lg border border-[#252525] bg-[#050505] px-3 py-2 text-xs font-bold text-[#F5F5F5] focus:border-[#D8FF3E]/60 focus:outline-none"
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
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D8FF3E] px-4 py-3 text-sm font-black text-[#101010] transition-colors hover:bg-[#EAFCCB] sm:rounded-2xl sm:px-6 sm:py-4"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Start MCQ Practice ({mcqQuestionsCount} Questions)</span>
              </button>
            </div>
          </section>

          {/* Card 2: Coding Solo Battle */}
          <section
            aria-labelledby="solo-coding-title"
            className={`relative flex flex-col justify-between space-y-5 overflow-hidden rounded-[24px] border p-4 transition-colors sm:space-y-6 sm:rounded-3xl sm:p-8 ${
              activeMode === "coding"
                ? "border-[#D8FF3E]/45 bg-[#101010] ring-1 ring-[#D8FF3E]/20"
                : "border-[#252525] bg-[#101010]"
            }`}
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <div className="rounded-2xl border border-[#D8FF3E]/30 bg-[#D8FF3E]/10 p-3 text-[#D8FF3E]">
                  <Code2 className="h-6 w-6" />
                </div>
                <button
                  type="button"
                  aria-pressed={activeMode === "coding"}
                  onClick={() => setActiveMode("coding")}
                  className={`min-h-10 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors sm:text-xs ${
                    activeMode === "coding"
                      ? "border-[#D8FF3E]/40 bg-[#D8FF3E]/10 text-[#D8FF3E]"
                      : "border-[#252525] bg-[#0B0B0B] text-[#A1A1AA] hover:text-[#F5F5F5]"
                  }`}
                >
                  {activeMode === "coding" ? "Selected mode" : "Select coding"}
                </button>
              </div>

              <div>
                <h2 id="solo-coding-title" className="text-xl font-black text-[#F5F5F5] sm:text-2xl">Algorithmic Coding Battle</h2>
                <p className="mt-1 text-xs leading-relaxed text-[#A1A1AA] sm:text-sm">
                  Solve LeetCode-style algorithmic challenges in our Monaco IDE. Run test cases against hidden unit tests and submit before the clock expires.
                </p>
              </div>

              {/* Configuration Controls */}
              <div className="space-y-4 border-t border-[#252525] pt-4">
                {/* Language Picker */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">
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
                        aria-pressed={codingLanguage === lang.id}
                        onClick={() => setCodingLanguage(lang.id)}
                        className={`min-h-11 rounded-xl border px-2 text-xs font-bold transition-colors ${
                          codingLanguage === lang.id
                            ? "border-[#D8FF3E]/40 bg-[#D8FF3E] text-[#101010]"
                            : "border-[#252525] bg-[#0B0B0B] text-[#A1A1AA] hover:text-[#F5F5F5]"
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                    Challenge Difficulty
                  </label>
                  <div className="flex items-center gap-2">
                    {["Easy", "Medium", "Hard"].map((d) => (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={codingDifficulty === d}
                        onClick={() => setCodingDifficulty(d)}
                        className={`min-h-11 flex-1 rounded-lg border text-xs font-bold transition-colors ${
                          codingDifficulty === d
                            ? "border-[#D8FF3E]/40 bg-[#D8FF3E]/10 text-[#D8FF3E]"
                            : "border-[#252525] bg-[#0B0B0B] text-[#A1A1AA] hover:text-[#F5F5F5]"
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
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#D8FF3E] px-4 py-3 text-sm font-black text-[#101010] transition-colors hover:bg-[#EAFCCB] disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-2xl sm:px-6 sm:py-4"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>{creatingBattle ? "Creating battle..." : `Launch Coding IDE (${codingDifficulty})`}</span>
              </button>
            </div>
          </section>
        </div>

        {/* Rules & Guidelines */}
        <div className="space-y-3 rounded-2xl border border-[#252525] bg-[#101010] p-4 text-xs text-[#A1A1AA] sm:p-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-[#F5F5F5]">
            <ShieldAlert className="h-4 w-4 text-[#F0BC58]" />
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
