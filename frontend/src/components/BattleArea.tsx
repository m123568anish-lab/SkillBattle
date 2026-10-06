"use client";

import Editor from "@monaco-editor/react";
import axios from "axios";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  FileCode,
  HelpCircle,
  Layers,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Terminal,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Language = "python" | "cpp" | "java" | "javascript" | "c" | "sql";
type MobileTab = "problem" | "code" | "test";
type TestResultTab = "cases" | "custom" | "console" | "submissions";

type Example = {
  input: string;
  output: string;
  explanation?: string;
};

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
  expectedComplexity?: string;
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
  expected_complexity?: string;
};

type DailyBattle = {
  id: string;
  status: string;
  duration_minutes?: number;
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
  execution_time_ms?: number;
  memory_kb?: number;
};

type RunResult = {
  status: string;
  stdout: string;
  stderr: string;
  execution_time: number;
  test_cases_results?: Array<{
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
  }>;
};

type PastSubmission = {
  id: string;
  submitted_at: string;
  verdict: string;
  passed_tests: number;
  total_tests: number;
  score: number;
  execution_time_ms: number;
  language: string;
  code_snippet?: string;
};

const boilerplate: Record<Language, string> = {
  python: `def solve():
    # Write your solution here
    pass

if __name__ == '__main__':
    solve()
`,
  cpp: `#include <iostream>
using namespace std;

int main() {
    // Fast I/O
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    // Write your solution here
    return 0;
}
`,
  java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Write your solution here
    }
}
`,
  javascript: `const fs = require('fs');

function solve() {
  // Write your solution here
}

solve();
`,
  c: `#include <stdio.h>

int main() {
    // Write your solution here
    return 0;
}
`,
  sql: `-- Write your SQL query solution below
SELECT *
FROM table_name;
`,
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
  // Battle state
  const [battle, setBattle] = useState<DailyBattle | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [submittedIds, setSubmittedIds] = useState<Set<number>>(new Set());

  // IDE & Code State
  const [language, setLanguage] = useState<Language>("python");
  const [code, setCode] = useState(boilerplate.python);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  // Layout & View State
  const [mobileTab, setMobileTab] = useState<MobileTab>("problem");
  const [testResultTab, setTestResultTab] = useState<TestResultTab>("cases");
  const [selectedTestCaseIndex, setSelectedTestCaseIndex] = useState(0);
  const [customInput, setCustomInput] = useState("");
  const [focusMode, setFocusMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [darkEditor, setDarkEditor] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState<"on" | "off">("on");

  // Execution & Submission State
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResult | null>(null);
  const [pastSubmissions, setPastSubmissions] = useState<PastSubmission[]>([]);
  const [finalResult, setFinalResult] = useState<Record<string, unknown> | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Timer State (Server-Authoritative countdown)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1800);

  const questions = useMemo<BattleQuestion[]>(
    () =>
      (battle?.questions_data || []).flatMap((section) =>
        section.questions.map((q) => ({
          id: q.id,
          title: q.title,
          description: q.description,
          difficulty: q.difficulty,
          sectionIndex: section.section_index,
          questionType: q.question_type || section.question_type,
          skillCategory: q.skill_category,
          constraints: q.constraints,
          examples: q.examples || [],
          options: q.options || [],
          topicTags: q.topic_tags || [],
          expectedComplexity: q.expected_complexity || "O(N) Time, O(1) Space",
        })),
      ),
    [battle],
  );

  const question = questions[activeIndex] || null;
  const completedCount = submittedIds.size;
  const allQuestionsSubmitted = questions.length > 0 && completedCount >= questions.length;
  const isQuestionSubmitted = question ? submittedIds.has(question.id) : false;

  // Load Daily Battle & History
  const loadDailyBattle = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await api.post<DailyBattle>("/battle/daily");
      const dailyBattle = response.data;
      const completed = new Set(dailyBattle.submitted_question_ids || []);
      const items = dailyBattle.questions_data.flatMap((section) => section.questions);

      setBattle(dailyBattle);
      setSubmittedIds(completed);
      setActiveIndex(Math.max(0, items.findIndex((item) => !completed.has(item.id))));
      setSecondsRemaining((dailyBattle.duration_minutes || 30) * 60);

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

  // Server Countdown Timer
  useEffect(() => {
    if (finalResult || secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsRemaining, finalResult]);

  // Handle Question Changes & Code Storage
  useEffect(() => {
    setRunResult(null);
    setSubmissionResult(null);
    setSelectedOption(null);
    setSelectedTestCaseIndex(0);

    if (question?.id) {
      // Check local session storage draft
      const savedDraft = localStorage.getItem(`sb_code_${question.id}_${language}`);
      if (savedDraft) {
        setCode(savedDraft);
        setAutoSaveStatus("saved");
      } else {
        setCode(boilerplate[language]);
        setAutoSaveStatus("saved");
      }

      // Populate default custom input from example
      if (question.examples && question.examples.length > 0) {
        setCustomInput(question.examples[0].input || "");
      }

      // Load submission history for problem
      void fetchPastSubmissions(question.id);
    }
  }, [question?.id, language]);

  // Auto-Save Draft to Local Storage
  const handleCodeChange = (newCode: string | undefined) => {
    const value = newCode || "";
    setCode(value);
    setAutoSaveStatus("saving");

    if (question?.id) {
      localStorage.setItem(`sb_code_${question.id}_${language}`, value);
      setTimeout(() => setAutoSaveStatus("saved"), 600);
    }
  };

  // Fetch Past Submissions
  const fetchPastSubmissions = async (questionId: number) => {
    try {
      const response = await api.get<PastSubmission[]>(`/compiler/problem/${questionId}/submissions`);
      setPastSubmissions(response.data || []);
    } catch {
      // Fallback empty if backend compiler submissions endpoint is empty
      setPastSubmissions([]);
    }
  };

  // Language Change Confirmation
  const handleLanguageChange = (newLang: Language) => {
    if (isQuestionSubmitted) return;
    const currentIsDefault = code === boilerplate[language];
    if (!currentIsDefault && code.trim().length > 30) {
      if (!window.confirm("Changing language will load starter code for the new language. Continue?")) {
        return;
      }
    }
    setLanguage(newLang);
  };

  // Reset Code to Starter
  const handleResetCode = () => {
    if (isQuestionSubmitted) return;
    if (window.confirm("Reset editor to default starter template?")) {
      const defaultCode = boilerplate[language];
      setCode(defaultCode);
      if (question?.id) {
        localStorage.removeItem(`sb_code_${question.id}_${language}`);
      }
      setAutoSaveStatus("saved");
    }
  };

  // Run Code (Test Run)
  const executeCode = async (useCustomInput = false) => {
    if (!question || isQuestionSubmitted || executing) return;
    setExecuting(true);
    setErrorMessage(null);
    setRunResult(null);
    setTestResultTab(useCustomInput ? "custom" : "cases");
    setMobileTab("test");

    const inputData = useCustomInput ? customInput : question.examples[selectedTestCaseIndex]?.input || "";

    try {
      const response = await api.post<RunResult>("/compiler/run", {
        language,
        source_code: code,
        stdin: inputData,
      });

      const res = response.data;
      setRunResult(res);

      // Generate structured test case results if backend didn't format them
      if (!res.test_cases_results && question.examples.length > 0) {
        const expected = question.examples[selectedTestCaseIndex]?.output || "";
        const actual = (res.stdout || "").trim();
        res.test_cases_results = [
          {
            input: inputData,
            expected: expected.trim(),
            actual,
            passed: actual === expected.trim() || res.status === "Success" || res.status === "ACCEPTED",
          },
        ];
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setExecuting(false);
    }
  };

  // Submit Answer (Official Server Evaluation)
  const submitAnswer = async () => {
    if (!battle || !question || submitting || isQuestionSubmitted) return;
    if (question.questionType === "mcq" && selectedOption === null) {
      setErrorMessage("Please choose an option before submitting.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSubmissionResult(null);
    setTestResultTab("cases");
    setMobileTab("test");

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

      const result = response.data;
      setSubmissionResult(result);

      // Add to completed set
      const updatedIds = new Set(submittedIds);
      updatedIds.add(question.id);
      setSubmittedIds(updatedIds);

      // Refresh past submissions tab
      void fetchPastSubmissions(question.id);

      // Refresh student skill profile in background evidence engine
      void api.get("/skills/profile").catch(() => {});

      // Move to next unattempted question or finish if all done
      const nextIndex = questions.findIndex((item) => !updatedIds.has(item.id));
      if (nextIndex >= 0) {
        // Keep user on current results for 2 seconds then navigate or let them click Next
      } else {
        const finishResponse = await api.post<Record<string, unknown>>(`/battle/${battle.id}/finish`);
        setFinalResult(finishResponse.data);
        setBattle({ ...battle, status: "completed" });
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const finishBattle = async () => {
    if (!battle || loading) return;
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

  const moveQuestion = (direction: -1 | 1) => {
    const nextIndex = activeIndex + direction;
    if (nextIndex >= 0 && nextIndex < questions.length) {
      setActiveIndex(nextIndex);
      setMobileTab("problem");
    }
  };

  // Format seconds into MM:SS
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // =========================================================
  // RENDER SUB-PANELS
  // =========================================================

  // 1. PROBLEM PANEL
  const renderProblemPanel = () => (
    <article className="flex h-full flex-col overflow-y-auto bg-slate-900/60 p-5 sm:p-6">
      {question ? (
        <div className="space-y-6">
          {/* Difficulty & Skill Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                question.difficulty.toUpperCase() === "HARD"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : question.difficulty.toUpperCase() === "MEDIUM"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              }`}
            >
              {question.difficulty}
            </span>
            {question.skillCategory && (
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                {question.skillCategory}
              </span>
            )}
            {question.topicTags.map((tag) => (
              <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                #{tag}
              </span>
            ))}
          </div>

          {/* Title */}
          <div>
            <h2 className="text-2xl font-black text-white">{question.title}</h2>
            <p className="mt-1 text-xs text-slate-400">Target Complexity: {question.expectedComplexity}</p>
          </div>

          {/* Problem Statement */}
          <div className="prose prose-invert max-w-none text-sm leading-relaxed text-slate-300">
            <p className="whitespace-pre-wrap">{question.description}</p>
          </div>

          {/* Constraints */}
          {question.constraints && (
            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                <HelpCircle size={14} className="text-cyan-400" /> Constraints
              </h3>
              <pre className="mt-2 font-mono text-xs text-slate-300 whitespace-pre-wrap">{question.constraints}</pre>
            </div>
          )}

          {/* MCQ Options (if MCQ question) */}
          {question.questionType === "mcq" && (
            <fieldset className="space-y-3 rounded-2xl border border-white/10 bg-slate-950/60 p-5">
              <legend className="mb-2 text-sm font-bold text-slate-200">Select the correct option:</legend>
              {question.options.map((option, index) => {
                const item = optionLabel(option);
                const value = item.key || String(index);
                return (
                  <label
                    key={`${value}-${index}`}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-sm transition-all ${
                      selectedOption === value
                        ? "border-cyan-400 bg-cyan-500/15 text-white shadow-lg shadow-cyan-950/40"
                        : "border-white/10 bg-slate-900/50 hover:border-cyan-500/40 text-slate-300"
                    } ${isQuestionSubmitted ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <input
                      type="radio"
                      name={`answer-${question.id}`}
                      className="mt-1 accent-cyan-400"
                      value={value}
                      checked={selectedOption === value}
                      disabled={isQuestionSubmitted}
                      onChange={() => setSelectedOption(value)}
                    />
                    <span className="font-mono text-xs font-bold uppercase text-cyan-400 me-2">{item.key}.</span>
                    <span>{item.text}</span>
                  </label>
                );
              })}
            </fieldset>
          )}

          {/* Examples */}
          {question.examples.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Sample Test Cases</h3>
              {question.examples.map((example, index) => (
                <div key={`${example.input}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-xs font-mono">
                  <div className="mb-2 flex items-center justify-between border-b border-white/5 pb-2 text-slate-400 font-sans">
                    <span className="font-bold text-cyan-400">Example {index + 1}</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-500">Input:</span>
                      <pre className="mt-1 rounded-lg bg-slate-900 p-2.5 text-slate-200 overflow-x-auto">{example.input}</pre>
                    </div>
                    <div>
                      <span className="text-slate-500">Output:</span>
                      <pre className="mt-1 rounded-lg bg-slate-900 p-2.5 text-emerald-300 overflow-x-auto">{example.output}</pre>
                    </div>
                    {example.explanation && (
                      <p className="mt-2 text-xs font-sans text-slate-400">
                        <span className="font-semibold text-slate-300">Explanation:</span> {example.explanation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
          {loading ? (
            <>
              <Sparkles className="animate-spin text-cyan-400 mb-3" size={24} />
              <p className="text-sm font-semibold">Loading problem workspace...</p>
            </>
          ) : (
            <p className="text-sm">No active problem selected.</p>
          )}
        </div>
      )}
    </article>
  );

  // 2. CODE EDITOR PANEL
  const renderEditorPanel = () => (
    <div className="flex h-full flex-col bg-slate-950">
      {/* Editor Sub-Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-900/90 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <label className="sr-only" htmlFor="ide-language-select">Programming language</label>
          <select
            id="ide-language-select"
            value={language}
            disabled={isQuestionSubmitted}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="rounded-lg border border-white/15 bg-slate-950 px-3 py-1.5 text-xs font-bold text-cyan-300 focus:border-cyan-400 focus:outline-none"
          >
            <option value="python">Python 3</option>
            <option value="cpp">C++ 17</option>
            <option value="java">Java 17</option>
            <option value="javascript">JavaScript (Node)</option>
            <option value="c">C (GCC)</option>
            <option value="sql">SQL</option>
          </select>

          {/* Auto-Save Status Badge */}
          <span className="hidden items-center gap-1 text-[11px] font-semibold text-slate-400 sm:inline-flex">
            <span
              className={`h-2 w-2 rounded-full ${
                autoSaveStatus === "saved" ? "bg-emerald-400" : autoSaveStatus === "saving" ? "bg-amber-400 animate-pulse" : "bg-slate-500"
              }`}
            />
            {autoSaveStatus === "saved" ? "Saved" : autoSaveStatus === "saving" ? "Saving..." : "Unsaved"}
          </span>
        </div>

        {/* Editor Controls */}
        <div className="flex items-center gap-2">
          {/* Word Wrap Toggle */}
          <button
            type="button"
            onClick={() => setWordWrap((prev) => (prev === "on" ? "off" : "on"))}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
              wordWrap === "on" ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" : "border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            Wrap
          </button>

          {/* Font Size Adjust */}
          <div className="hidden items-center rounded-lg border border-white/10 bg-slate-950 text-xs text-slate-300 sm:flex">
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.max(12, s - 1))}
              className="px-2 py-1 hover:text-white"
              title="Decrease font size"
            >
              A-
            </button>
            <span className="border-x border-white/10 px-2 py-1 font-mono text-[11px]">{fontSize}px</span>
            <button
              type="button"
              onClick={() => setFontSize((s) => Math.min(20, s + 1))}
              className="px-2 py-1 hover:text-white"
              title="Increase font size"
            >
              A+
            </button>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setDarkEditor((v) => !v)}
            className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:border-white/20"
          >
            {darkEditor ? "Dark" : "Light"}
          </button>

          {/* Reset Code */}
          <button
            type="button"
            onClick={handleResetCode}
            disabled={isQuestionSubmitted}
            className="rounded-lg border border-white/10 p-1.5 text-slate-400 hover:text-rose-300 disabled:opacity-40"
            title="Reset code to starter template"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Monaco Code Editor */}
      <div className="relative flex-1 min-h-[300px]">
        <Editor
          height="100%"
          language={language === "javascript" ? "javascript" : language === "cpp" ? "cpp" : language}
          theme={darkEditor ? "vs-dark" : "light"}
          value={code}
          onChange={handleCodeChange}
          options={{
            minimap: { enabled: false },
            automaticLayout: true,
            fontSize,
            wordWrap,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            readOnly: isQuestionSubmitted,
            tabSize: 4,
            insertSpaces: true,
            bracketPairColorization: { enabled: true },
            formatOnPaste: true,
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
    </div>
  );

  // 3. TEST CASES & OUTPUT CONSOLE PANEL
  const renderOutputPanel = () => (
    <div className="flex h-full flex-col border-t border-white/10 bg-slate-950 text-xs">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/80 px-4">
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTestResultTab("cases")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 font-bold transition-colors ${
              testResultTab === "cases" ? "border-cyan-400 text-cyan-300" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 size={13} /> Test Cases
          </button>
          <button
            type="button"
            onClick={() => setTestResultTab("custom")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 font-bold transition-colors ${
              testResultTab === "custom" ? "border-cyan-400 text-cyan-300" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Terminal size={13} /> Custom Input
          </button>
          <button
            type="button"
            onClick={() => setTestResultTab("console")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 font-bold transition-colors ${
              testResultTab === "console" ? "border-cyan-400 text-cyan-300" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers size={13} /> Console Output
            {runResult && <span className="h-2 w-2 rounded-full bg-cyan-400" />}
          </button>
          <button
            type="button"
            onClick={() => setTestResultTab("submissions")}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 font-bold transition-colors ${
              testResultTab === "submissions" ? "border-cyan-400 text-cyan-300" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FileCode size={13} /> History ({pastSubmissions.length})
          </button>
        </div>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* TAB 1: TEST CASES */}
        {testResultTab === "cases" && (
          <div className="space-y-4">
            {question?.examples && question.examples.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2 border-b border-white/5 pb-3">
                  {question.examples.map((_, idx) => {
                    const tcResult = runResult?.test_cases_results?.[idx];
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedTestCaseIndex(idx)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                          selectedTestCaseIndex === idx
                            ? "border-cyan-400 bg-cyan-500/15 text-white"
                            : "border-white/10 bg-slate-900 text-slate-400 hover:border-white/20"
                        }`}
                      >
                        {tcResult ? (
                          tcResult.passed ? (
                            <CheckCircle2 size={13} className="text-emerald-400" />
                          ) : (
                            <XCircle size={13} className="text-rose-400" />
                          )
                        ) : null}
                        Case {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Active Test Case Detail */}
                {question.examples[selectedTestCaseIndex] && (
                  <div className="space-y-3 font-mono">
                    <div>
                      <span className="text-slate-400 font-sans font-semibold">Input:</span>
                      <pre className="mt-1 rounded-xl bg-slate-900 p-3 text-slate-200 overflow-x-auto">
                        {question.examples[selectedTestCaseIndex].input}
                      </pre>
                    </div>

                    <div>
                      <span className="text-slate-400 font-sans font-semibold">Expected Output:</span>
                      <pre className="mt-1 rounded-xl bg-slate-900 p-3 text-emerald-300 overflow-x-auto">
                        {question.examples[selectedTestCaseIndex].output}
                      </pre>
                    </div>

                    {/* Server Execution Feedback */}
                    {runResult?.test_cases_results?.[selectedTestCaseIndex] && (
                      <div>
                        <span className="text-slate-400 font-sans font-semibold">Actual Output:</span>
                        <pre
                          className={`mt-1 rounded-xl p-3 overflow-x-auto border ${
                            runResult.test_cases_results[selectedTestCaseIndex].passed
                              ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-300"
                              : "border-rose-500/30 bg-rose-950/30 text-rose-300"
                          }`}
                        >
                          {runResult.test_cases_results[selectedTestCaseIndex].actual || "(No output)"}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-500">No sample test cases configured for this question.</p>
            )}

            {/* Official Submission Verdict Card */}
            {submissionResult && (
              <div className="mt-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-4 font-sans">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {submissionResult.verdict === "Accepted" || submissionResult.verdict === "Correct" ? (
                      <CheckCircle2 className="text-emerald-400" size={18} />
                    ) : (
                      <XCircle className="text-rose-400" size={18} />
                    )}
                    <span className="text-base font-black text-white">{submissionResult.verdict}</span>
                  </div>
                  <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-300">
                    +{submissionResult.score_earned} XP
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-300">
                  Passed {submissionResult.passed_tests} / {submissionResult.total_tests} test cases. Server-authoritative submission saved.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CUSTOM INPUT */}
        {testResultTab === "custom" && (
          <div className="space-y-3 font-sans">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Custom Stdin Input</span>
              <span className="text-[11px] text-amber-400">Non-Scoring Test</span>
            </div>
            <textarea
              rows={4}
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Enter custom input lines here..."
              className="w-full rounded-xl border border-white/10 bg-slate-900 p-3 font-mono text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                type="button"
                disabled={executing || isQuestionSubmitted}
                onClick={() => void executeCode(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/15 px-4 py-2 text-xs font-bold text-white transition-all disabled:opacity-50"
              >
                <Play size={13} className="text-cyan-400" /> Run Custom Input
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: CONSOLE OUTPUT */}
        {testResultTab === "console" && (
          <div className="space-y-3 font-mono">
            {runResult ? (
              <>
                <div className="flex items-center justify-between border-b border-white/10 pb-2 font-sans">
                  <span
                    className={`font-bold ${
                      runResult.status === "Success" || runResult.status === "ACCEPTED" ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {runResult.status}
                  </span>
                  <span className="text-slate-400 text-xs">Runtime: {runResult.execution_time} ms</span>
                </div>
                {runResult.stdout && (
                  <div>
                    <span className="text-slate-400 font-sans">stdout:</span>
                    <pre className="mt-1 rounded-xl bg-slate-900 p-3 text-slate-200 overflow-x-auto whitespace-pre-wrap">
                      {runResult.stdout}
                    </pre>
                  </div>
                )}
                {runResult.stderr && (
                  <div>
                    <span className="text-rose-400 font-sans">stderr / error:</span>
                    <pre className="mt-1 rounded-xl bg-rose-950/40 border border-rose-500/30 p-3 text-rose-300 overflow-x-auto whitespace-pre-wrap">
                      {runResult.stderr}
                    </pre>
                  </div>
                )}
                {!runResult.stdout && !runResult.stderr && <p className="text-slate-500">Program executed cleanly with no output.</p>}
              </>
            ) : (
              <p className="text-slate-500 font-sans">Run code to inspect execution output and console logs.</p>
            )}
          </div>
        )}

        {/* TAB 4: SUBMISSION HISTORY */}
        {testResultTab === "submissions" && (
          <div className="space-y-3 font-sans">
            {pastSubmissions.length > 0 ? (
              <div className="space-y-2">
                {pastSubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/60 p-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      {sub.verdict === "Accepted" || sub.verdict === "Correct" ? (
                        <CheckCircle2 size={16} className="text-emerald-400" />
                      ) : (
                        <XCircle size={16} className="text-rose-400" />
                      )}
                      <div>
                        <p className="font-bold text-white">{sub.verdict}</p>
                        <p className="text-[11px] text-slate-400">
                          {sub.passed_tests}/{sub.total_tests} passed · {sub.language}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-cyan-300">+{sub.score} XP</p>
                      <p className="text-[11px] text-slate-500">{sub.execution_time_ms} ms</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">No prior submissions recorded for this problem yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // =========================================================
  // MAIN COMPONENT RETURN
  // =========================================================

  return (
    <section
      className={`${
        fullscreen
          ? "fixed inset-0 z-50 flex flex-col bg-slate-950"
          : focusMode
            ? "relative flex flex-col rounded-3xl border border-white/10 bg-slate-950 text-white shadow-2xl"
            : "relative flex flex-col rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-xl dark:border-white/10 dark:bg-[#0b0f17] dark:text-white"
      } min-w-0 overflow-hidden min-h-[82vh]`}
    >
      {/* --------------------------------------------------------- */}
      {/* TOP HEADER & BATTLE TOOLBAR                               */}
      {/* --------------------------------------------------------- */}
      <header className="border-b border-slate-200 bg-slate-900/90 px-4 py-3 text-white backdrop-blur dark:border-white/10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Brand & Problem Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-black">
              SB
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-400">Battle IDE</span>
                <span className="text-slate-500">•</span>
                <span className="text-xs font-semibold text-slate-400">Q{activeIndex + 1}/{questions.length}</span>
              </div>
              <h1 className="truncate text-base font-black text-white sm:text-lg">
                {question?.title || (loading ? "Preparing workspace..." : "Battle Arena")}
              </h1>
            </div>
          </div>

          {/* Question Nav Pills & Server Timer */}
          <div className="flex items-center gap-4">
            {/* Timer */}
            <div className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-black text-cyan-300">
              <Clock size={14} className="text-cyan-400 animate-pulse" />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>

            {/* Focus & Fullscreen controls */}
            <div className="hidden items-center gap-1.5 sm:flex">
              <button
                type="button"
                onClick={() => setFocusMode((v) => !v)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                  focusMode ? "border-cyan-400 bg-cyan-500/20 text-cyan-300" : "border-white/10 text-slate-300 hover:border-white/25"
                }`}
              >
                {focusMode ? "Exit Focus" : "Focus Mode"}
              </button>

              <button
                type="button"
                onClick={() => setFullscreen((v) => !v)}
                className="rounded-lg border border-white/10 p-1.5 text-slate-300 hover:border-white/25"
                aria-label={fullscreen ? "Exit full-screen mode" : "Expand full-screen mode"}
              >
                {fullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Question Selector Progress Ribbon */}
        {questions.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-white/5 scrollbar-none">
            {questions.map((item, index) => {
              const isSubmitted = submittedIds.has(item.id);
              const isActive = index === activeIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? "border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-md shadow-cyan-950/50"
                      : isSubmitted
                        ? "border-emerald-500/30 bg-emerald-950/30 text-emerald-300"
                        : "border-white/10 bg-slate-950/50 text-slate-400 hover:border-white/20"
                  }`}
                >
                  {isSubmitted ? <Check size={12} className="text-emerald-400" /> : <span className="text-[10px]">{index + 1}</span>}
                  <span className="truncate max-w-[80px] sm:max-w-[120px]">{item.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Error Alert */}
      {errorMessage && (
        <div role="alert" className="m-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/40 p-3 text-xs text-rose-200">
          <AlertTriangle size={16} className="text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Final Battle Completed Screen */}
      {finalResult ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-white">
          <div className="rounded-full bg-emerald-500/20 p-4 border border-emerald-500/30 text-emerald-400 mb-4">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black">Adaptive Battle Completed!</h2>
          <p className="mt-2 max-w-md text-xs text-slate-400 leading-relaxed">
            Your submissions have been evaluated by the server. Your verified skill performance has been fed into your Skill Profile and AI Learning Engine.
          </p>
          <div className="mt-6 w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-4 text-left font-mono text-xs overflow-auto max-h-60">
            <pre>{JSON.stringify(finalResult, null, 2)}</pre>
          </div>
        </div>
      ) : (
        <>
          {/* --------------------------------------------------------- */}
          {/* MOBILE CONTENT TAB NAVIGATION                             */}
          {/* --------------------------------------------------------- */}
          <nav className="grid grid-cols-3 border-b border-white/10 bg-slate-900 text-xs font-extrabold md:hidden">
            <button
              type="button"
              onClick={() => setMobileTab("problem")}
              className={`py-3 capitalize transition-colors ${
                mobileTab === "problem" ? "border-b-2 border-cyan-400 text-cyan-300" : "text-slate-400"
              }`}
            >
              📋 Problem
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("code")}
              className={`py-3 capitalize transition-colors ${
                mobileTab === "code" ? "border-b-2 border-cyan-400 text-cyan-300" : "text-slate-400"
              }`}
            >
              💻 Editor
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("test")}
              className={`py-3 capitalize transition-colors ${
                mobileTab === "test" ? "border-b-2 border-cyan-400 text-cyan-300" : "text-slate-400"
              }`}
            >
              ⚡ Tests & Output
            </button>
          </nav>

          {/* --------------------------------------------------------- */}
          {/* DESKTOP & MOBILE IDE WORKSPACE BODY                       */}
          {/* --------------------------------------------------------- */}
          <div className="grid flex-1 min-w-0 md:grid-cols-12 min-h-[500px]">
            {/* LEFT PANEL: PROBLEM STATEMENT (5/12 cols on desktop) */}
            <div
              className={`${
                mobileTab === "problem" ? "block" : "hidden"
              } min-w-0 border-r border-white/10 md:col-span-5 md:block h-full overflow-hidden`}
            >
              {renderProblemPanel()}
            </div>

            {/* CENTER & RIGHT PANELS (7/12 cols on desktop) */}
            <div
              className={`${
                mobileTab === "code" || mobileTab === "test" ? "flex" : "hidden"
              } min-w-0 md:col-span-7 md:flex flex-col h-full overflow-hidden`}
            >
              {/* CODE EDITOR REGION */}
              <div className={`${mobileTab === "code" ? "block flex-1" : "hidden"} md:block md:h-[60%]`}>
                {renderEditorPanel()}
              </div>

              {/* TEST & OUTPUT CONSOLE REGION */}
              <div className={`${mobileTab === "test" ? "block flex-1" : "hidden"} md:block md:h-[40%]`}>
                {renderOutputPanel()}
              </div>
            </div>
          </div>

          {/* --------------------------------------------------------- */}
          {/* STICKY FOOTER & PRIMARY ACTION CONTROLS                   */}
          {/* --------------------------------------------------------- */}
          <footer className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-900/95 px-4 py-3 backdrop-blur sm:px-6">
            {/* Question Prev/Next Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={activeIndex === 0 || loading}
                onClick={() => moveQuestion(-1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-xs font-bold text-slate-300 hover:border-white/20 disabled:opacity-40"
              >
                <ChevronLeft size={15} /> Prev
              </button>
              <button
                type="button"
                disabled={activeIndex >= questions.length - 1 || loading}
                onClick={() => moveQuestion(1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-950 px-3.5 py-2 text-xs font-bold text-slate-300 hover:border-white/20 disabled:opacity-40"
              >
                Next <ChevronRight size={15} />
              </button>
            </div>

            {/* Run Code & Submit Actions */}
            <div className="flex items-center gap-3">
              {question?.questionType === "coding" || question?.questionType === "debugging" ? (
                <button
                  type="button"
                  disabled={executing || isQuestionSubmitted}
                  onClick={() => void executeCode(false)}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-extrabold text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-40 transition-all"
                >
                  <Play size={14} className="fill-cyan-400 text-cyan-400" />
                  {executing ? "Executing..." : "Run Code"}
                </button>
              ) : null}

              <button
                type="button"
                disabled={submitting || !question || isQuestionSubmitted || allQuestionsSubmitted}
                onClick={() => void submitAnswer()}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 px-5 py-2 text-xs font-black text-slate-950 hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-cyan-950/50"
              >
                <Send size={14} />
                {submitting ? "Evaluating..." : isQuestionSubmitted ? "Submitted" : "Submit Answer"}
              </button>

              {allQuestionsSubmitted && (
                <button
                  type="button"
                  disabled={loading || battle?.status === "completed"}
                  onClick={() => void finishBattle()}
                  className="rounded-xl bg-emerald-400 px-5 py-2 text-xs font-black text-slate-950 hover:brightness-110 disabled:opacity-50 transition-all shadow-lg shadow-emerald-950/50"
                >
                  Finish Battle
                </button>
              )}
            </div>
          </footer>
        </>
      )}
    </section>
  );
}
