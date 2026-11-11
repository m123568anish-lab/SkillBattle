"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Trophy, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { practiceService, type MCQQuestion } from "@/services/practice.service";

interface BattleSubmissionState {
  correct: boolean;
  score: number;
  verdict: string;
  questionId: number;
}

function normalizeDifficulty(input: string | null) {
  const value = (input || "medium").toLowerCase();
  if (value === "easy" || value === "medium" || value === "hard") return value;
  return "medium";
}

export default function SoloBattleMCQPage() {
  const searchParams = useSearchParams();
  const requestedCount = Number(searchParams.get("count") || "10");
  const requestedDifficulty = normalizeDifficulty(searchParams.get("difficulty"));
  const requestedTopic = searchParams.get("topic") || "Algorithms & Data Structures";

  const [questions, setQuestions] = useState<MCQQuestion[]>([]);
  const [battleId, setBattleId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Record<number, BattleSubmissionState>>({});

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const scoreTotal = useMemo(
    () => Object.values(submitted).reduce((sum, record) => sum + record.score, 0),
    [submitted]
  );
  const correctAnswers = Object.values(submitted).filter((record) => record.correct).length;

  useEffect(() => {
    let active = true;

    async function loadBattle() {
      try {
        setLoading(true);
        setError(null);

        const questionResult = await practiceService.mcqQuestions({
          count: [5, 10, 15, 20].includes(requestedCount) ? requestedCount : 10,
          difficulty: requestedDifficulty,
          topic: requestedTopic,
        });

        if (!active) return;

        if (!questionResult.questions.length) {
          setError("No active MCQ questions are available for this topic and difficulty.");
          setQuestions([]);
          return;
        }

        const battleResponse = await api.post<{ id: string }>("/battle/create", {
          title: `Solo MCQ Challenge · ${requestedTopic}`,
          difficulty: requestedDifficulty,
          problem_id: 1,
          battle_type: "general",
          battle_mode: "solo",
          max_players: 1,
        });

        if (!active) return;

        setQuestions(questionResult.questions);
        setBattleId(battleResponse.data.id);
      } catch (loadError: any) {
        if (!active) return;
        const detail = loadError?.response?.data?.detail || "The battle cannot be created right now.";
        setError(detail);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadBattle();
    return () => {
      active = false;
    };
  }, [requestedCount, requestedDifficulty, requestedTopic]);

  const submitCurrentAnswer = async () => {
    if (!currentQuestion || selectedChoice === null || !battleId || submitting) return;

    const selectedOption = currentQuestion.options[selectedChoice];
    const optionKey = String.fromCharCode(65 + selectedChoice);
    const answerText = typeof selectedOption === "string" ? selectedOption : optionKey;

    setSubmitting(true);
    setError(null);

    try {
      const result = await api.post<{ verdict: string; score_earned: number }>("/battle/submit-answer", {
        battle_id: battleId,
        question_id: currentQuestion.id,
        section_index: 0,
        question_type: "mcq",
        mcq_option: answerText,
      });

      setSubmitted((previous) => ({
        ...previous,
        [currentQuestion.id]: {
          correct: result.data.verdict === "Correct",
          score: Number(result.data.score_earned ?? 0),
          verdict: result.data.verdict,
          questionId: currentQuestion.id,
        },
      }));

      setSelectedChoice(null);
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex((index) => index + 1);
      }
    } catch (submitError: any) {
      const detail = submitError?.response?.data?.detail || "Answer submission failed.";
      setError(detail);
    } finally {
      setSubmitting(false);
    }
  };

  const isComplete = questions.length > 0 && Object.keys(submitted).length >= questions.length;

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[100svh] max-w-4xl items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-[24px] border border-[#252525] bg-[#101010] p-6 text-center text-[#F5F5F5] shadow-[0_20px_60px_rgba(0,0,0,0.28)] sm:p-8">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#D8FF3E]" />
          <p className="mt-4 text-sm font-semibold">Creating your MCQ battle room…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-[100svh] max-w-3xl items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg rounded-[24px] border border-[#F08A7A]/25 bg-[#101010] p-6 text-center text-[#F5F5F5] shadow-[0_20px_60px_rgba(0,0,0,0.28)] sm:p-8">
          <XCircle className="mx-auto h-8 w-8 text-[#F08A7A]" />
          <h1 className="mt-4 text-2xl font-black">Battle unavailable</h1>
          <p className="mt-2 text-sm text-[#A1A1AA]">{error}</p>
          <Link href="/battle/solo" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#D8FF3E] px-4 py-2 text-sm font-bold text-[#101010]">
            Return to solo battles
          </Link>
        </div>
      </main>
    );
  }

  if (!currentQuestion) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <div className="rounded-[24px] border border-[#252525] bg-[#101010] p-5 text-center text-[#A1A1AA] shadow-[0_20px_60px_rgba(0,0,0,0.24)] sm:p-8">
          <Trophy className="mx-auto h-8 w-8 text-[#D8FF3E]" />
          <h1 className="mt-4 text-2xl font-black text-[#F5F5F5]">Battle complete</h1>
          <p className="mt-2 text-sm text-[#A1A1AA]">Your MCQ challenge result has been saved.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#252525] bg-[#0B0B0B] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#A1A1AA]">Score</p>
              <p className="mt-2 text-2xl font-black text-[#F5F5F5]">{scoreTotal}</p>
            </div>
            <div className="rounded-xl border border-[#D8FF3E]/25 bg-[#D8FF3E]/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#D8FF3E]">Correct</p>
              <p className="mt-2 text-2xl font-black text-[#F5F5F5]">{correctAnswers}</p>
            </div>
            <div className="rounded-xl border border-[#252525] bg-[#0B0B0B] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#A1A1AA]">Played</p>
              <p className="mt-2 text-2xl font-black text-[#F5F5F5]">{totalQuestions}</p>
            </div>
          </div>
          <Link href="/battle/solo" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#D8FF3E] px-4 py-2 text-sm font-bold text-[#101010]">
            Start another challenge
          </Link>
        </div>
      </main>
    );
  }

  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;
  const answeredCurrent = submitted[currentQuestion.id];

  return (
    <main className="mx-auto max-w-4xl px-4 py-5 sm:py-10">
      <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-[#252525] bg-[#101010] p-4 text-sm text-[#A1A1AA] sm:mb-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D8FF3E]">Solo MCQ arena</p>
          <p className="mt-1 font-semibold text-[#F5F5F5]">Question {currentIndex + 1} of {totalQuestions}</p>
        </div>
        <div className="shrink-0 rounded-full border border-[#D8FF3E]/25 bg-[#D8FF3E]/10 px-3 py-1.5 text-xs font-bold text-[#D8FF3E]">
          {scoreTotal} XP score
        </div>
      </div>

      <div className="rounded-[24px] border border-[#252525] bg-[#101010] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.24)] sm:p-7">
        <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-[#252525]">
          <div className="h-full rounded-full bg-[#D8FF3E] transition-[width] duration-300" style={{ width: `${progressPercent}%` }} />
        </div>

        <div className="mb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A1A1AA]">{currentQuestion.concept}</p>
          <h1 className="mt-3 break-words text-[1.35rem] font-black leading-tight text-[#F5F5F5] sm:text-2xl">{currentQuestion.question}</h1>
        </div>

        {currentQuestion.code_snippet ? (
          <pre className="mb-6 overflow-x-auto rounded-2xl border border-[#252525] bg-[#050505] p-4 text-sm text-[#D8FF3E]">{currentQuestion.code_snippet}</pre>
        ) : null}

        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => {
            const active = selectedChoice === index;
            const alreadyAnswered = answeredCurrent && selectedChoice === null;
            const isCorrectIndex = answeredCurrent && answeredCurrent.correct && index === currentQuestion.options.length - 1;

            return (
              <button
                key={`${currentQuestion.id}-${index}`}
                type="button"
                onClick={() => setSelectedChoice(index)}
                className={`flex min-h-14 w-full items-start gap-3 rounded-2xl border px-3.5 py-4 text-left transition-colors sm:px-4 ${
                  active
                    ? "border-[#D8FF3E]/55 bg-[#D8FF3E]/10 text-[#F5F5F5]"
                    : "border-[#252525] bg-[#0B0B0B] text-[#F5F5F5] hover:border-[#D8FF3E]/30"
                } ${alreadyAnswered ? "pointer-events-none opacity-80" : ""}`}
                disabled={Boolean(answeredCurrent) || submitting}
              >
                <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-current/30 bg-black/10 text-xs font-black">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="flex-1 text-sm font-medium leading-relaxed">{option}</span>
                {answeredCurrent && isCorrectIndex ? <CheckCircle2 className="h-5 w-5 shrink-0 text-[#D8FF3E]" /> : null}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-[#252525] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-[#A1A1AA]">
            {answeredCurrent ? (
              <span className={answeredCurrent.correct ? "text-[#D8FF3E]" : "text-[#F08A7A]"}>
                {answeredCurrent.verdict}: {answeredCurrent.correct ? "+" : "-"}{answeredCurrent.score} points
              </span>
            ) : (
              <span>Select one answer to lock it in.</span>
            )}
          </div>

          <button
            type="button"
            onClick={submitCurrentAnswer}
            disabled={submitting || selectedChoice === null || Boolean(answeredCurrent)}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[#D8FF3E] px-5 py-3 text-sm font-black text-[#101010] transition hover:bg-[#EAFCCB] disabled:cursor-not-allowed disabled:bg-[#252525] disabled:text-[#737373] sm:w-auto"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {answeredCurrent ? "Answered" : currentIndex === totalQuestions - 1 ? "Finish challenge" : "Submit answer"}
          </button>
        </div>
      </div>
    </main>
  );
}
