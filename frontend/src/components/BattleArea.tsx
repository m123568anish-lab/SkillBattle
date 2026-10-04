"use client";

import Editor from "@monaco-editor/react";
import axios from "axios";
import { CheckCircle2, ChevronLeft, ChevronRight, Maximize2, Minimize2, Play, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Language = "python" | "cpp" | "java" | "javascript";
type MobilePanel = "question" | "code" | "results";
type Example = { input: string; output: string };
type QuestionOption = string | { key?: string; text?: string };
type BattleQuestion = {
  id: number;
  sectionIndex: number;
  title: string;
  description: string;
  difficulty: string;
  questionType: string;
  skillCategory?: string | null;
  constraints?: string;
  examples: Example[];
  options: QuestionOption[];
  topicTags: string[];
};
type ApiBattleQuestion = {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  question_type: string;
  skill_category?: string | null;
  constraints?: string;
  examples?: Example[] | null;
  options?: QuestionOption[] | null;
  topic_tags?: string[] | null;
};
type DailyBattle = {
  id: string;
  status: string;
  questions_data: Array<{
    section_index: number;
    question_type: string;
    questions: ApiBattleQuestion[];
  }>;
  submitted_question_ids: number[];
};
type SubmissionResult = {
  verdict: string;
  passed_tests: number;
  total_tests: number;
  score_earned: number;
};
type RunResult = {
  status: string;
  stdout: string;
  stderr: string;
  execution_time: number;
};

const boilerplate: Record<Language, string> = {
  python: "def solve():\n    # Write your solution here\n    pass\n\nif __name__ == '__main__':\n    solve()\n",
  cpp: "#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Write your solution here\n    return 0;\n}\n",
  java: "import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // Write your solution here\n    }\n}\n",
  javascript: "const fs = require('fs');\n\nfunction solve() {\n  // Write your solution here\n}\n\nsolve();\n",
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ detail?: string }>(error)) {
    return error.response?.data?.detail || error.message;
  }
  return error instanceof Error ? error.message : "The request could not be completed.";
}

function optionLabel(option: QuestionOption): { key: string; text: string } {
  if (typeof option === "string") return { key: option, text: option };
  return { key: option.key || option.text || "", text: option.text || option.key || "" };
}

export default function BattleArea() {
  const [battle, setBattle] = useState<DailyBattle | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [submittedIds, setSubmittedIds] = useState<Set<number>>(new Set());
  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState(boilerplate.python);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("question");
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [finalResult, setFinalResult] = useState<Record<string, unknown> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [darkEditor, setDarkEditor] = useState(true);

  const questions = useMemo<BattleQuestion[]>(
    () => (battle?.questions_data || []).flatMap((section) =>
      section.questions.map((question) => ({
        id: question.id,
        title: question.title,
        description: question.description,
        difficulty: question.difficulty,
        sectionIndex: section.section_index,
        questionType: question.question_type || section.question_type,
        skillCategory: question.skill_category,
        constraints: question.constraints,
        examples: question.examples || [],
        options: question.options || [],
        topicTags: question.topic_tags || [],
      })),
    ),
    [battle],
  );
  const question = questions[activeIndex] || null;
  const completedCount = submittedIds.size;
  const allQuestionsSubmitted = questions.length > 0 && completedCount >= questions.length;
  const isQuestionSubmitted = question ? submittedIds.has(question.id) : false;

  const loadDailyBattle = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.post<DailyBattle>("/battle/daily");
      const dailyBattle = response.data;
      const completed = new Set(dailyBattle.submitted_question_ids);
      const items = dailyBattle.questions_data.flatMap((section) => section.questions);
      setBattle(dailyBattle);
      setSubmittedIds(completed);
      setActiveIndex(Math.max(0, items.findIndex((item) => !completed.has(item.id))));
      if (dailyBattle.status === "completed") {
        const resultResponse = await api.get<Record<string, unknown>>(`/battle/${dailyBattle.id}/result`);
        setFinalResult(resultResponse.data);
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDailyBattle();
  }, [loadDailyBattle]);

  useEffect(() => {
    setRunResult(null);
    setSubmissionResult(null);
    setSelectedOption(null);
    if (question?.questionType === "coding" || question?.questionType === "debugging") {
      setCode(boilerplate[language]);
    }
  }, [question?.id, question?.questionType, language]);

  const executeCode = async () => {
    if (!question || isQuestionSubmitted) return;
    setLoading(true);
    setErrorMessage(null);
    setRunResult(null);
    setMobilePanel("results");
    try {
      const response = await api.post<RunResult>("/compiler/run", {
        language,
        source_code: code,
        stdin: question.examples[0]?.input || "",
      });
      setRunResult(response.data);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const finishBattle = async () => {
    if (!battle || !allQuestionsSubmitted || loading) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.post<Record<string, unknown>>(`/battle/${battle.id}/finish`);
      setFinalResult(response.data);
      setBattle({ ...battle, status: "completed" });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!battle || !question || loading || isQuestionSubmitted) return;
    if (question.questionType === "mcq" && selectedOption === null) {
      setErrorMessage("Choose an answer before submitting.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    setSubmissionResult(null);
    setMobilePanel("results");
    try {
      const response = await api.post<SubmissionResult>("/battle/submit-answer", {
        battle_id: battle.id,
        question_id: question.id,
        section_index: question.sectionIndex,
        question_type: question.questionType,
        mcq_option: selectedOption,
        language,
        source_code: code,
      });
      setSubmissionResult(response.data);
      const updatedIds = new Set(submittedIds);
      updatedIds.add(question.id);
      setSubmittedIds(updatedIds);
      const nextIndex = questions.findIndex((item) => !updatedIds.has(item.id));
      if (nextIndex >= 0) {
        setActiveIndex(nextIndex);
        setMobilePanel("question");
      } else {
        const finishResponse = await api.post<Record<string, unknown>>(`/battle/${battle.id}/finish`);
        setFinalResult(finishResponse.data);
        setBattle({ ...battle, status: "completed" });
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const moveQuestion = (direction: -1 | 1) => {
    const nextIndex = activeIndex + direction;
    if (nextIndex >= 0 && nextIndex < questions.length) setActiveIndex(nextIndex);
  };

  const renderQuestion = () => (
    <article className="min-h-[320px] overflow-y-auto p-5 sm:p-6">
      {question ? (
        <>
          <div className="mb-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-300">
              {question.difficulty}
            </span>
            {question.skillCategory && (
              <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300">
                {question.skillCategory}
              </span>
            )}
            {question.topicTags.map((tag) => (
              <span key={tag} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 dark:border-white/10 dark:text-slate-300">
                {tag}
              </span>
            ))}
          </div>
          <h2 className="text-xl font-extrabold">{question.title}</h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600 dark:text-slate-300">
            {question.description}
          </p>
          {question.constraints && (
            <div className="mt-5 rounded-xl bg-slate-50 p-4 dark:bg-slate-900">
              <h3 className="font-bold">Constraints</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{question.constraints}</p>
            </div>
          )}
          {question.questionType === "mcq" && (
            <fieldset className="mt-6 space-y-3">
              <legend className="mb-3 text-sm font-bold">Choose one answer</legend>
              {question.options.map((option, index) => {
                const item = optionLabel(option);
                const value = item.key || String(index);
                return (
                  <label
                    key={`${value}-${index}`}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition-colors ${
                      selectedOption === value
                        ? "border-cyan-500 bg-cyan-500/10"
                        : "border-slate-200 hover:border-cyan-400 dark:border-white/10"
                    } ${isQuestionSubmitted ? "cursor-not-allowed opacity-70" : ""}`}
                  >
                    <input
                      type="radio"
                      name={`answer-${question.id}`}
                      className="mt-1 accent-cyan-500"
                      value={value}
                      checked={selectedOption === value}
                      disabled={isQuestionSubmitted}
                      onChange={() => setSelectedOption(value)}
                    />
                    <span>{item.text}</span>
                  </label>
                );
              })}
            </fieldset>
          )}
          {question.examples.map((example, index) => (
            <div key={`${example.input}-${index}`} className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-white/10">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Example {index + 1}</p>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-sm">{`Input: ${example.input}\nOutput: ${example.output}`}</pre>
            </div>
          ))}
        </>
      ) : (
        <p className="text-sm text-slate-500">{loading ? "Loading today’s battle…" : "No daily battle is available."}</p>
      )}
    </article>
  );

  const renderEditor = () => (
    <div className="flex min-h-[360px] min-w-0 flex-col bg-slate-950">
      {question?.questionType === "coding" || question?.questionType === "debugging" ? (
        <>
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <label className="sr-only" htmlFor="battle-language">Programming language</label>
            <select
              id="battle-language"
              value={language}
              disabled={isQuestionSubmitted}
              onChange={(event) => setLanguage(event.target.value as Language)}
              className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white"
            >
              <option value="python">Python 3</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="javascript">JavaScript</option>
            </select>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDarkEditor((value) => !value)} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-200">
                {darkEditor ? "Light editor" : "Dark editor"}
              </button>
              <button
                type="button"
                onClick={() => setFullscreen((value) => !value)}
                className="rounded-lg border border-white/15 p-2 text-slate-200"
                aria-label={fullscreen ? "Exit full-screen editor" : "Expand editor"}
              >
                {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>
          <Editor
            height="min(62vh, 720px)"
            language={language === "javascript" ? "javascript" : language}
            theme={darkEditor ? "vs-dark" : "light"}
            value={code}
            onChange={(value) => setCode(value || "")}
            options={{
              minimap: { enabled: false },
              automaticLayout: true,
              fontSize: 14,
              scrollBeyondLastLine: false,
              readOnly: isQuestionSubmitted,
              wordWrap: "on",
            }}
          />
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-400">
          This question is answered in the Problem panel.
        </div>
      )}
    </div>
  );

  return (
    <section className={`${fullscreen ? "fixed inset-2 z-50" : ""} min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-xl dark:border-white/10 dark:bg-[#111827] dark:text-white`}>
      <header className="border-b border-slate-200 p-4 dark:border-white/10 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">Daily Adaptive Battle</p>
            <h1 className="mt-1 truncate text-xl font-black">{question?.title || (loading ? "Preparing your battle…" : "Battle unavailable")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-xs font-semibold text-slate-500">
              {completedCount}/{questions.length || "—"} completed
            </span>
            <button
              type="button"
              onClick={() => void loadDailyBattle()}
              disabled={loading}
              className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold disabled:opacity-50 dark:border-white/10"
            >
              Resume
            </button>
          </div>
        </div>
        {questions.length > 0 && (
          <div className="mt-4 flex gap-2" aria-label="Battle question progress">
            {questions.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Question ${index + 1}${submittedIds.has(item.id) ? ", completed" : ""}`}
                className={`h-2 flex-1 rounded-full ${
                  submittedIds.has(item.id) ? "bg-emerald-500" : index === activeIndex ? "bg-cyan-500" : "bg-slate-200 dark:bg-slate-700"
                }`}
              />
            ))}
          </div>
        )}
      </header>

      {errorMessage && (
        <div role="alert" className="m-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {errorMessage}
        </div>
      )}

      {finalResult ? (
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-emerald-500" />
            <h2 className="text-xl font-black">Daily battle complete</h2>
          </div>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Your verified submissions have been recorded. Battle rewards and results are calculated by the server.
          </p>
          <pre className="mt-5 max-h-72 overflow-auto rounded-xl bg-slate-50 p-4 text-xs dark:bg-slate-900">
            {JSON.stringify(finalResult, null, 2)}
          </pre>
        </div>
      ) : (
        <>
          <nav className="grid grid-cols-3 border-b border-slate-200 text-sm font-bold dark:border-white/10 md:hidden" aria-label="Coding workspace panels">
            {(["question", "code", "results"] as const).map((panel) => (
              <button
                key={panel}
                type="button"
                onClick={() => setMobilePanel(panel)}
                aria-current={mobilePanel === panel ? "page" : undefined}
                className={`px-3 py-3 capitalize ${mobilePanel === panel ? "border-b-2 border-cyan-500 text-cyan-600 dark:text-cyan-300" : "text-slate-500"}`}
              >
                {panel === "question" ? "Problem" : panel === "code" ? "Code" : "Results"}
              </button>
            ))}
          </nav>

          <div className="grid min-w-0 md:grid-cols-2">
            <div className={`${mobilePanel === "question" ? "block" : "hidden"} min-w-0 border-b border-slate-200 dark:border-white/10 md:block md:border-b-0 md:border-r`}>
              {renderQuestion()}
            </div>
            <div className={`${mobilePanel === "code" ? "block" : "hidden"} min-w-0 md:block`}>
              {renderEditor()}
            </div>
          </div>

          <section className={`${mobilePanel === "results" ? "block" : "hidden"} border-t border-slate-200 p-4 dark:border-white/10 md:block`} aria-live="polite">
            <h2 className="text-sm font-bold">Execution & submission results</h2>
            {runResult && (
              <div className="mt-3 rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-100">
                <p className={runResult.status === "Success" ? "text-emerald-300" : "text-amber-300"}>
                  {runResult.status} · {runResult.execution_time} ms
                </p>
                {runResult.stdout && <pre className="mt-2 whitespace-pre-wrap">{runResult.stdout}</pre>}
                {runResult.stderr && <pre className="mt-2 whitespace-pre-wrap text-rose-300">{runResult.stderr}</pre>}
                {!runResult.stdout && !runResult.stderr && <p className="mt-2 text-slate-400">No output.</p>}
              </div>
            )}
            {submissionResult && (
              <div className="mt-3 rounded-xl border border-slate-200 p-4 text-sm dark:border-white/10">
                <p className={submissionResult.verdict === "Accepted" || submissionResult.verdict === "Correct" ? "font-bold text-emerald-600" : "font-bold text-amber-600"}>
                  {submissionResult.verdict}
                </p>
                <p className="mt-1 text-slate-500">
                  {submissionResult.passed_tests}/{submissionResult.total_tests} tests passed · {submissionResult.score_earned} points
                </p>
              </div>
            )}
            {!runResult && !submissionResult && <p className="mt-2 text-sm text-slate-500">Run your code or submit an answer to see server feedback.</p>}
          </section>

          <footer className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white/95 p-3 backdrop-blur dark:border-white/10 dark:bg-[#111827]/95 sm:p-4">
            <div className="flex gap-2">
              <button
                type="button"
                disabled={activeIndex === 0 || loading}
                onClick={() => moveQuestion(-1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold disabled:opacity-40 dark:border-white/10"
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                type="button"
                disabled={activeIndex >= questions.length - 1 || loading}
                onClick={() => moveQuestion(1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold disabled:opacity-40 dark:border-white/10"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {question?.questionType === "coding" || question?.questionType === "debugging" ? (
                <button
                  type="button"
                  disabled={loading || isQuestionSubmitted}
                  onClick={() => void executeCode()}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-50 dark:border-white/10"
                >
                  <Play size={15} /> Run example
                </button>
              ) : null}
              <button
                type="button"
                disabled={loading || !question || isQuestionSubmitted || allQuestionsSubmitted}
                onClick={() => void submitAnswer()}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50"
              >
                <Send size={15} /> {loading ? "Submitting…" : isQuestionSubmitted ? "Submitted" : "Submit answer"}
              </button>
              {allQuestionsSubmitted && (
                <button
                  type="button"
                  disabled={loading || battle?.status === "completed"}
                  onClick={() => void finishBattle()}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50"
                >
                  Finish battle
                </button>
              )}
            </div>
          </footer>
        </>
      )}
    </section>
  );
}
