"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Breadcrumbs, PracticeNav } from "@/components/arena";
import { practiceService, type MCQAnswerResult, type MCQQuestion } from "@/services/practice.service";
import { useDashboardStore } from "@/store/dashboardStore";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, XCircle } from "lucide-react";

function PracticeSessionContent() {
  const searchParams = useSearchParams();
  const requestedCount = Number(searchParams.get("count"));
  const [count, setCount] = useState(
    [5, 10, 15, 20].includes(requestedCount) ? requestedCount : 5
  );
  const [difficulty, setDifficulty] = useState(() => {
    const value = searchParams.get("difficulty")?.toLowerCase();
    switch (value) {
      case "easy":
        return "Easy";
      case "medium":
        return "Medium";
      case "hard":
        return "Hard";
      default:
        return "Any";
    }
  });
  const topic = searchParams.get("topic") || "all";
  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [evaluations, setEvaluations] = useState<Record<number, MCQAnswerResult>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const currentEvaluation = currentQuestion ? evaluations[currentQuestion.id] : undefined;
  const correctCount = Object.values(evaluations).filter((result) => result.correct).length;
  const incorrectCount = Object.values(evaluations).filter((result) => !result.correct).length;
  const earnedXp = Object.values(evaluations).reduce((total, result) => total + result.xp_earned, 0);

  const startSession = async () => {
    setLoading(true);
    setError("");
    setComplete(false);
    try {
      const result = await practiceService.mcqQuestions({
        count,
        difficulty: difficulty === "Any" ? undefined : difficulty,
        topic,
      });
      if (result.questions.length === 0) {
        setQuestions([]);
        setError("No matching active multiple-choice questions are available.");
        return;
      }
      setQuestions(result.questions);
      setAnswers({});
      setEvaluations({});
      setCurrentIndex(0);
    } catch {
      setError("Questions could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentQuestion || currentAnswer === undefined || currentEvaluation || answering) return;
    setAnswering(true);
    setError("");
    try {
      const result = await practiceService.answerMcq({
        question_id: currentQuestion.id,
        selected_index: currentAnswer,
      });
      setEvaluations((previous) => ({ ...previous, [currentQuestion.id]: result }));
      if (result.correct) {
        void useDashboardStore.getState().refresh();
      }
    } catch {
      setError("Your answer could not be saved. It has not been marked as complete.");
    } finally {
      setAnswering(false);
    }
  };

  if (complete) {
    return (
      <DashboardLayout>
        <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-7">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0E1524] p-6 sm:p-8 text-center">
            <h1 className="text-3xl font-black text-white">Practice session complete</h1>
            <p className="mt-2 text-sm text-slate-400">
              Results reflect answers saved by the practice service.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-xs uppercase text-emerald-300">Correct</p>
                <p className="mt-1 text-3xl font-bold text-white">{correctCount}</p>
              </div>
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                <p className="text-xs uppercase text-rose-300">Incorrect</p>
                <p className="mt-1 text-3xl font-bold text-white">{incorrectCount}</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-300">{earnedXp} XP awarded and saved in this session.</p>
            <button
              type="button"
              onClick={() => {
                setComplete(false);
                setQuestions([]);
              }}
              className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500"
            >
              Start another session
            </button>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-7">
        <Breadcrumbs
          items={[
            { label: "Practice Hub", href: "/practice" },
            { label: "MCQ Practice", href: "/practice/mcq" },
            { label: "Session", href: "/practice/session", active: true },
          ]}
        />
        <PracticeNav />

        {questions.length === 0 ? (
          <section className="rounded-2xl border border-white/[0.08] bg-[#0E1524] p-6 sm:p-8">
            <h1 className="text-2xl font-black text-white">Configure Practice Session</h1>
            <p className="mt-2 text-sm text-slate-400">
              The session uses active questions from the database. Only answers confirmed by the service count as completed.
            </p>
            <div className="mt-6 space-y-5">
              <div>
                <h2 className="mb-2 text-xs font-bold uppercase text-slate-400">Question count</h2>
                <div className="flex flex-wrap gap-2">
                  {[5, 10, 15, 20].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setCount(value)}
                      className={`rounded-lg px-4 py-2 text-sm ${count === value ? "bg-indigo-600 text-white" : "border border-white/10 text-slate-300"}`}
                    >
                      Up to {value}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="mb-2 text-xs font-bold uppercase text-slate-400">Difficulty</h2>
                <div className="flex flex-wrap gap-2">
                  {["Any", "Easy", "Medium", "Hard"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setDifficulty(value)}
                      className={`rounded-lg px-4 py-2 text-sm ${difficulty === value ? "bg-indigo-600 text-white" : "border border-white/10 text-slate-300"}`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
              <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
                <Link href="/practice/mcq" className="text-sm text-slate-400 hover:text-white">Cancel</Link>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => void startSession()}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Load available questions
                </button>
              </div>
            </div>
          </section>
        ) : currentQuestion ? (
          <section className="rounded-2xl border border-white/[0.08] bg-[#0E1524] p-5 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-indigo-300">
                  {currentQuestion.concept} · {currentQuestion.difficulty}
                </p>
                <h1 className="mt-2 text-xl font-bold text-white">
                  Question {currentIndex + 1} of {questions.length}
                </h1>
              </div>
              <button
                type="button"
                onClick={() => setQuestions([])}
                className="text-xs text-slate-400 hover:text-white"
              >
                End session
              </button>
            </div>

            <div className="mt-6 rounded-xl bg-black/20 p-5">
              <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-100">{currentQuestion.question}</p>
              {currentQuestion.code_snippet && (
                <pre className="mt-4 overflow-x-auto rounded-lg bg-black/40 p-4 text-sm text-cyan-100">
                  <code>{currentQuestion.code_snippet}</code>
                </pre>
              )}
            </div>

            <div className="mt-5 space-y-3">
              {currentQuestion.options.map((option, index) => {
                const isCorrect = currentEvaluation?.correct_index === index;
                const isSelected = currentAnswer === index;
                const resultStyle = currentEvaluation
                  ? isCorrect
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-100"
                    : isSelected
                      ? "border-rose-500 bg-rose-500/10 text-rose-100"
                      : "border-white/10 text-slate-400"
                  : isSelected
                    ? "border-indigo-500 bg-indigo-500/10 text-white"
                    : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-indigo-500/40";
                return (
                  <button
                    key={`${currentQuestion.id}-${index}`}
                    type="button"
                    disabled={Boolean(currentEvaluation)}
                    onClick={() => setAnswers((previous) => ({ ...previous, [currentQuestion.id]: index }))}
                    className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${resultStyle} disabled:cursor-default`}
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-white/10 font-mono text-xs">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-sm leading-relaxed">{option}</span>
                    {currentEvaluation && isCorrect && <CheckCircle2 className="ml-auto h-5 w-5" />}
                    {currentEvaluation && isSelected && !isCorrect && <XCircle className="ml-auto h-5 w-5" />}
                  </button>
                );
              })}
            </div>

            {currentEvaluation && (
              <div className="mt-5 rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-4 text-sm text-slate-200">
                <p>{currentEvaluation.explanation || "No explanation is configured for this question."}</p>
                <p className="mt-2 text-xs text-slate-400">
                  {currentEvaluation.xp_earned > 0
                    ? `${currentEvaluation.xp_earned} XP awarded and saved.`
                    : currentEvaluation.already_solved
                      ? "This question was already solved; no duplicate XP was awarded."
                      : "No XP was awarded for this answer."}
                </p>
              </div>
            )}

            {error && <p role="alert" className="mt-4 text-sm text-rose-300">{error}</p>}

            <div className="mt-6 flex items-center justify-between border-t border-white/[0.08] pt-4">
              <button
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((index) => index - 1)}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" /> Previous
              </button>
              {!currentEvaluation ? (
                <button
                  type="button"
                  disabled={currentAnswer === undefined || answering}
                  onClick={() => void submitAnswer()}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40"
                >
                  {answering && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save and check answer
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (currentIndex === questions.length - 1) setComplete(true);
                    else setCurrentIndex((index) => index + 1);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white"
                >
                  {currentIndex === questions.length - 1 ? "Finish session" : "Next question"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </section>
        ) : null}
      </main>
    </DashboardLayout>
  );
}

export default function PracticeSessionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070A0F]" />}>
      <PracticeSessionContent />
    </Suspense>
  );
}
