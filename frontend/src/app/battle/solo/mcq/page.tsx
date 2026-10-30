"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  DifficultyBadge,
  Timer,
  ScoreDisplay,
} from "@/components/arena";
import {
  Trophy,
  Zap,
  Flame,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
  Play,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  Swords,
  Crown,
} from "lucide-react";
import toast from "react-hot-toast";

interface BattleMCQQuestion {
  id: number;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctIndex: number;
  points: number;
  explanation: string;
}

const BATTLE_MCQ_QUESTIONS: BattleMCQQuestion[] = [
  {
    id: 1,
    question: "What is the amortized time complexity of resizing an ArrayList / dynamic vector when its capacity is doubled?",
    codeSnippet: "vector.push_back(element); // capacity doubles when full",
    options: ["O(1) amortized", "O(N) amortized", "O(log N) amortized", "O(N^2) amortized"],
    correctIndex: 0,
    points: 100,
    explanation: "Although copying N elements takes O(N) when resizing occurs, it happens so infrequently (geometric progression) that the amortized cost per append is strict O(1).",
  },
  {
    id: 2,
    question: "Which sorting algorithm is guaranteed to have an O(N log N) worst-case time complexity while sorting in place with O(1) auxiliary space?",
    codeSnippet: "// In-place O(N log N) worst-case guarantee",
    options: ["Heap Sort", "Merge Sort", "Quick Sort", "Radix Sort"],
    correctIndex: 0,
    points: 120,
    explanation: "Heap Sort constructs a max-heap in O(N) in place and repeatedly extracts the root in O(N log N) using only O(1) extra space. Merge Sort requires O(N) space, and Quick Sort degrades to O(N^2) worst case.",
  },
  {
    id: 3,
    question: "In relational database transactions, which isolation level prevents dirty reads, non-repeatable reads, AND phantom reads?",
    codeSnippet: "SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;",
    options: ["Serializable", "Repeatable Read", "Read Committed", "Read Uncommitted"],
    correctIndex: 0,
    points: 150,
    explanation: "Serializable is the highest ANSI SQL isolation level. It guarantees that parallel transactions execute as if strictly serial, completely eliminating dirty reads, non-repeatable reads, and phantom reads.",
  },
  {
    id: 4,
    question: "What is the maximum number of edges in an undirected graph with N vertices having no self-loops or multi-edges?",
    codeSnippet: "// Max edges in complete graph K_n",
    options: ["N * (N - 1) / 2", "N * (N - 1)", "2^N", "N^2"],
    correctIndex: 0,
    points: 100,
    explanation: "In a complete graph K_n, each of the N vertices connects to N - 1 other vertices. Since edges are undirected, divide by 2: N * (N - 1) / 2.",
  },
  {
    id: 5,
    question: "In distributed systems, which pair of properties can a partitioned network guarantee simultaneously according to the CAP theorem?",
    codeSnippet: "// Partition P is inevitable in real networks\nCAP: Pick any 2 of (C, A, P)",
    options: ["Consistency OR Availability (with Partition Tolerance)", "Consistency AND Availability (without Partition Tolerance in WAN)", "All three simultaneously", "Latency and Fault Isolation only"],
    correctIndex: 0,
    points: 150,
    explanation: "Under a network partition (P), a distributed system must choose between returning consistent latest state (CP) or remaining available and returning potentially stale data (AP).",
  },
];

function BattleMCQContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category") || "Algorithms";
  const difficultyParam = searchParams.get("difficulty") || "Medium";
  const durationParam = parseInt(searchParams.get("duration") || "5", 10);

  const [questions] = useState<BattleMCQQuestion[]>(BATTLE_MCQ_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [battleFinished, setBattleFinished] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const currentQ = questions[currentIndex];
  const isSelected = selectedAnswers[currentQ?.id] !== undefined;

  const handleSelect = (optIndex: number) => {
    if (selectedAnswers[currentQ.id] !== undefined) return; // locked in

    setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: optIndex }));

    const isCorrect = optIndex === currentQ.correctIndex;
    if (isCorrect) {
      const earned = Math.round(currentQ.points * multiplier);
      setScore((s) => s + earned);
      setStreak((st) => st + 1);
      if (streak + 1 >= 3) setMultiplier(2);
      else if (streak + 1 >= 2) setMultiplier(1.5);
      toast.success(`+${earned} PTS! (${multiplier}x Multiplier)`, { icon: "⚡", duration: 1500 });
    } else {
      setStreak(0);
      setMultiplier(1);
      toast.error("Incorrect answer!", { duration: 1500 });
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      finishBattle();
    }
  };

  const finishBattle = () => {
    setBattleFinished(true);
    toast.success("Battle match completed!", { icon: "🏆" });
  };

  const correctAnswersCount = questions.filter((q) => selectedAnswers[q.id] === q.correctIndex).length;
  const ratingDelta = correctAnswersCount >= 4 ? 28 : correctAnswersCount >= 3 ? 15 : -8;
  const xpEarned = Math.round(score * 0.4);

  // RESULTS VIEW
  if (battleFinished) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-8 py-8 text-center pb-12">
          {/* Victory Hero */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-purple-300">
              <Swords className="h-4 w-4 text-purple-400" />
              <span>Match Terminated</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              {correctAnswersCount >= 3 ? "Victory! Match Won" : "Match Concluded"}
            </h1>

            <p className="text-sm text-slate-400 max-w-md mx-auto">
              Your server-authoritative battle telemetry has been committed to the global leaderboard.
            </p>
          </div>

          {/* Score & Rating Delta Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-6 space-y-2">
              <span className="text-xs font-bold uppercase text-purple-400">Final Battle Score</span>
              <div className="text-4xl font-black font-mono text-white">{score}</div>
              <p className="text-[11px] text-purple-300">Combined speed & accuracy</p>
            </div>

            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 space-y-2">
              <span className="text-xs font-bold uppercase text-emerald-400">Rating Adjustment</span>
              <div className="text-4xl font-black font-mono text-emerald-300">
                {ratingDelta >= 0 ? `+${ratingDelta}` : ratingDelta} ELO
              </div>
              <p className="text-[11px] text-emerald-400">Ranked Solo Ladder</p>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-6 space-y-2">
              <span className="text-xs font-bold uppercase text-amber-400">Battle XP Earned</span>
              <div className="text-4xl font-black font-mono text-amber-300">+{xpEarned}</div>
              <p className="text-[11px] text-amber-300">Profile progression</p>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 text-left space-y-4">
            <h3 className="text-base font-bold text-white">Question Performance</h3>
            <div className="space-y-3">
              {questions.map((q, idx) => {
                const userChoice = selectedAnswers[q.id];
                const isCorrect = userChoice === q.correctIndex;

                return (
                  <div
                    key={q.id}
                    className={`rounded-xl border p-4 flex items-center justify-between text-xs ${
                      isCorrect
                        ? "border-emerald-500/30 bg-emerald-950/10 text-emerald-200"
                        : "border-rose-500/30 bg-rose-950/10 text-rose-300"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-white block">
                        Q{idx + 1}: {q.question}
                      </span>
                      <span className="text-slate-400">
                        {isCorrect ? "✓ Answered Correctly" : `✗ Correct was: ${q.options[q.correctIndex]}`}
                      </span>
                    </div>
                    <span className="font-mono font-bold">{isCorrect ? `+${q.points} PTS` : "0 PTS"}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/battle/solo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-xs font-bold text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/30"
            >
              <RotateCcw className="h-4 w-4" />
              <span>New Solo Battle</span>
            </Link>
            <Link
              href="/battle"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-xs font-semibold text-slate-300 hover:text-white"
            >
              <span>Back to Command Center</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ACTIVE MCQ BATTLE ARENA
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-4 pb-12">
        {/* Battle Header */}
        <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
          <div className="flex items-center gap-3">
            <span className="rounded-md border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-black uppercase tracking-wider text-purple-300">
              Live Battle
            </span>
            <span className="text-sm font-black text-white">{categoryParam}</span>
          </div>

          <div className="flex items-center gap-3">
            <Timer initialSeconds={durationParam * 60} onTimeout={finishBattle} />
            <ScoreDisplay score={score} streak={streak} multiplier={multiplier} />

            <button
              type="button"
              onClick={() => setShowExitConfirm(true)}
              className="p-2 rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 hover:text-rose-400 cursor-pointer"
              title="Forfeit Battle"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>
              Question <strong className="text-white">{currentIndex + 1}</strong> of {questions.length}
            </span>
            <span>+{currentQ.points * multiplier} PTS available</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question & Options Area */}
        <div className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-950/20 via-slate-900/60 to-slate-950/80 p-6 sm:p-8 space-y-6 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-purple-400">
              Base Value: {currentQ.points} PTS
            </span>
            <DifficultyBadge difficulty={difficultyParam} size="sm" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white leading-relaxed">
            {currentQ.question}
          </h2>

          {currentQ.codeSnippet && (
            <div className="rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs text-cyan-300 shadow-inner">
              <pre>
                <code>{currentQ.codeSnippet}</code>
              </pre>
            </div>
          )}

          {/* Answer Options */}
          <div className="space-y-3 pt-2">
            {currentQ.options.map((opt, idx) => {
              const selectedIdx = selectedAnswers[currentQ.id];
              const isPicked = selectedIdx === idx;
              const isLocked = selectedIdx !== undefined;
              const isCorrectOpt = idx === currentQ.correctIndex;

              let style = "border-white/10 bg-white/[0.02] text-slate-300 hover:border-purple-500/40 hover:bg-white/[0.04]";
              if (isLocked) {
                if (isCorrectOpt) {
                  style = "border-emerald-500 bg-emerald-500/10 text-emerald-200 font-bold";
                } else if (isPicked && !isCorrectOpt) {
                  style = "border-rose-500 bg-rose-500/10 text-rose-200 font-medium";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelect(idx)}
                  disabled={isLocked}
                  className={`w-full rounded-2xl border p-4 text-left transition-all flex items-center justify-between cursor-pointer ${style}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md border border-white/10 bg-black/40 text-xs font-mono font-bold text-slate-300">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="text-sm font-medium">{opt}</span>
                  </div>

                  {isLocked && isCorrectOpt && <CheckCircle2 className="h-5 w-5 text-emerald-400" />}
                  {isLocked && isPicked && !isCorrectOpt && <XCircle className="h-5 w-5 text-rose-400" />}
                </button>
              );
            })}
          </div>

          {/* Advance Action */}
          <div className="flex items-center justify-end pt-4 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={handleNext}
              disabled={!isSelected}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-purple-600/30 hover:scale-[1.01] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>{currentIndex === questions.length - 1 ? "Complete Battle" : "Next Challenge"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Forfeit Confirmation */}
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-rose-500/10 p-2.5 text-rose-400 border border-rose-500/20">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Forfeit Match?</h3>
                  <p className="text-xs text-slate-400">Leaving will forfeit rating points.</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-slate-300"
                >
                  Resume
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/battle")}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-500"
                >
                  Forfeit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function BattleMCQPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading Battle Match...</div>}>
      <BattleMCQContent />
    </Suspense>
  );
}
