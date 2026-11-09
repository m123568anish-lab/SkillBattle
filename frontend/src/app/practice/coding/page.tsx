"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import api from "@/lib/api";
import { practiceService, type PracticeProblem, type PracticeProblemDetail } from "@/services/practice.service";
import {
  AssessmentHeader,
  AssessmentCodeEditor,
  AssessmentConsole,
  AssessmentActionFooter,
  type TestCaseResult,
} from "@/components/assessment";
import { Breadcrumbs, PracticeNav } from "@/components/arena";
import { useDashboardStore } from "@/store/dashboardStore";
import {
  CheckCircle2,
  Play,
  Search,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Layers,
  Check,
  Copy,
} from "lucide-react";

const DEFAULT_STARTER_CODES: Record<string, string> = {
  python: `def solution():\n    # Read input from stdin\n    # line = input()\n    pass\n\nif __name__ == "__main__":\n    solution()\n`,
  javascript: `const fs = require("fs");\n\nfunction solution() {\n    const input = fs.readFileSync(0, "utf-8").trim();\n    // Parse input and print result\n}\nsolution();\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Read input and print result\n    return 0;\n}\n`,
  java: `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        // Read input and print result\n    }\n}\n`,
};

const LANGUAGES = ["python", "javascript", "cpp", "java"];

function CodingPracticeInner() {
  const params = useSearchParams();
  const router = useRouter();
  const requested = Number(params.get("problem"));

  const [items, setItems] = useState<PracticeProblem[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [availableTotal, setAvailableTotal] = useState(0);
  const [needsRepairTotal, setNeedsRepairTotal] = useState(0);
  const [summary, setSummary] = useState<{
    solved: number;
    attempted: number;
    accuracy: number | null;
  }>({
    solved: 0,
    attempted: 0,
    accuracy: null,
  });

  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [category, setCategory] = useState("");
  const [topic, setTopic] = useState("");
  const [sortBy, setSortBy] = useState<"problem_id" | "difficulty">("problem_id");
  const [status, setStatus] = useState<"all" | "solved" | "unsolved">("all");
  const [page, setPage] = useState(1);
  const [loadingList, setLoadingList] = useState(true);
  const [, setLoadingDetail] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [selected, setSelected] = useState<PracticeProblemDetail | null>(null);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");
  const [activeMobileView, setActiveMobileView] = useState<"problem" | "editor">("editor");
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(true);
  const [catalogRevision, setCatalogRevision] = useState(0);
  const [copiedCaseIdx, setCopiedCaseIdx] = useState<number | null>(null);

  // Console execution telemetry
  const [consoleStatus, setConsoleStatus] = useState<string>("idle");
  const [consoleStdout, setConsoleStdout] = useState<string>("");
  const [consoleStderr, setConsoleStderr] = useState<string>("");
  const [consoleRuntime, setConsoleRuntime] = useState<number | null>(null);
  const [consoleMemory, setConsoleMemory] = useState<number | null>(null);
  const [testCaseResults, setTestCaseResults] = useState<TestCaseResult[]>([]);

  const detailRequestIdRef = useRef(0);
  const selectedProblemIdRef = useRef<number | null>(null);
  const previousRequestedProblemIdRef = useRef<number | null>(null);

  // Fetch catalogue list
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoadingList(true);
      setCatalogError("");
      void practiceService
        .list(
          {
            q: query || undefined,
            difficulty: difficulty || undefined,
            category: category || undefined,
            topic: topic || undefined,
            sort_by: sortBy,
            status,
            page,
            page_size: 20,
          },
          controller.signal
        )
        .then((catalog) => {
          setItems(catalog.items || []);
          setTotal(catalog.total);
          setCategories(catalog.categories || []);
          setTopics(catalog.topics || []);
          setAvailableTotal(catalog.available_total || 0);
          setNeedsRepairTotal(catalog.needs_repair_total || 0);
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setCatalogError("Practice catalogue could not be loaded. Please retry.");
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoadingList(false);
        });
    }, 200);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, difficulty, category, topic, sortBy, status, page, catalogRevision]);

  // Fetch summary metrics
  useEffect(() => {
    let active = true;
    void practiceService
      .summary()
      .then((stats) => {
        if (active) setSummary(stats);
      })
      .catch(() => {
        if (active) setCatalogError("Practice progress could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [catalogRevision]);

  // Open problem detail
  const openProblem = async (id: number, updateUrl = true) => {
    const requestId = ++detailRequestIdRef.current;
    try {
      setLoadingDetail(true);
      setBannerMessage("");
      setConsoleStatus("idle");
      setConsoleStdout("");
      setConsoleStderr("");
      setConsoleRuntime(null);
      setConsoleMemory(null);

      const detail = await practiceService.get(id);
      if (requestId !== detailRequestIdRef.current) return;
      setSelected(detail);
      selectedProblemIdRef.current = id;

      const draftKey = `task_${id}`;
      const savedDraft = typeof window !== "undefined" ? localStorage.getItem(`skillbattle_draft_${draftKey}`) : null;

      const availableLangs = Object.keys(detail.starter_codes || {});
      const initialLang = availableLangs.includes(language) ? language : availableLangs[0] || "python";

      setLanguage(initialLang);
      setCode(savedDraft || detail.starter_codes?.[initialLang] || DEFAULT_STARTER_CODES[initialLang] || "");

      if (detail.samples && detail.samples.length > 0) {
        setTestCaseResults(
          detail.samples.map((ex, idx) => ({
            id: idx + 1,
            input: ex.input,
            expectedOutput: ex.output,
          }))
        );
      } else {
        setTestCaseResults([]);
      }

      if (updateUrl) {
        router.replace(`/practice/coding?problem=${id}`);
      }
    } catch {
      if (requestId === detailRequestIdRef.current) {
        setCatalogError("Could not load problem details.");
      }
    } finally {
      if (requestId === detailRequestIdRef.current) {
        setLoadingDetail(false);
      }
    }
  };

  useEffect(() => {
    if (requested && requested !== previousRequestedProblemIdRef.current) {
      previousRequestedProblemIdRef.current = requested;
      void openProblem(requested, false);
    }
  }, [requested]);

  const closeProblem = () => {
    setSelected(null);
    selectedProblemIdRef.current = null;
    previousRequestedProblemIdRef.current = null;
    setBannerMessage("");
    router.replace("/practice/coding");
  };

  const changeLanguage = (nextLang: string) => {
    setLanguage(nextLang);
    if (!selected) return;
    const starter = selected.starter_codes?.[nextLang] || DEFAULT_STARTER_CODES[nextLang] || "";
    setCode(starter);
  };

  const resetCode = () => {
    if (!selected) return;
    const starter = selected.starter_codes?.[language] || DEFAULT_STARTER_CODES[language] || "";
    setCode(starter);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`skillbattle_draft_task_${selected.id}`);
    }
  };

  const handleRunTests = async () => {
    if (!selected || !selected.can_solve || running) return;
    setRunning(true);
    setConsoleStatus("running");
    setBannerMessage("");
    try {
      const res = await practiceService.run({
        problem_id: selected.id,
        language,
        code,
        custom_input: customInput || undefined,
      });

      setConsoleStatus(res.status);
      setConsoleStdout(res.stdout || "");
      setConsoleStderr(res.stderr || "");
      setConsoleRuntime(res.execution_time ?? null);
      setConsoleMemory(res.memory_used ?? null);

      if (res.test_cases && res.test_cases.length > 0) {
        setTestCaseResults(
          res.test_cases.map((tc, idx) => ({
            id: idx + 1,
            input: tc.input,
            expectedOutput: tc.expected_output || "",
            actualOutput: tc.actual_output,
            passed: tc.passed,
            status: tc.status,
            runtimeMs: tc.execution_time,
          }))
        );
      }
    } catch {
      setConsoleStatus("failed");
      setConsoleStderr("Execution failed. Server error.");
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!selected || !selected.can_solve || submitting) return;
    setSubmitting(true);
    setBannerMessage("");
    try {
      const res = await practiceService.submit({
        problem_id: selected.id,
        language,
        code,
      });

      setConsoleStatus(res.status);
      setConsoleStdout(res.stdout || "");
      setConsoleStderr(res.stderr || "");
      setConsoleRuntime(res.execution_time ?? null);
      setConsoleMemory(res.memory_used ?? null);

      if (res.test_cases && res.test_cases.length > 0) {
        setTestCaseResults(
          res.test_cases.map((tc, idx) => ({
            id: idx + 1,
            input: tc.input,
            expectedOutput: tc.expected_output || "",
            actualOutput: tc.actual_output,
            passed: tc.passed,
            status: tc.status,
            runtimeMs: tc.execution_time,
          }))
        );
      }

      if (res.status === "passed") {
        setBannerMessage(
          res.xp_awarded
            ? `Challenge accepted. ${res.xp_awarded} XP was awarded and saved.`
            : "Challenge accepted. No additional XP was awarded for this problem."
        );
        setCatalogRevision((r) => r + 1);
        void useDashboardStore.getState().refresh();
        if (typeof window !== "undefined") {
          localStorage.removeItem(`skillbattle_draft_task_${selected.id}`);
        }
      } else {
        setBannerMessage(`Solution did not pass all tests: ${res.status.replace("_", " ").toUpperCase()}`);
      }
    } catch {
      setConsoleStatus("failed");
      setBannerMessage("Submission failed. Please check network connection.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyTestCase = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedCaseIdx(idx);
    setTimeout(() => setCopiedCaseIdx(null), 1500);
  };

  const completionPercent =
    availableTotal > 0
      ? Math.min(100, Math.round((summary.solved / availableTotal) * 100))
      : null;
  const bannerIsSuccess = bannerMessage.startsWith("Challenge accepted.");

  // FULL WORKSPACE MODE
  if (selected) {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#070A0F] text-slate-100">
        <AssessmentHeader
          title={selected.title ?? "Metadata repair required"}
          category={selected.category}
          difficulty={selected.difficulty}
          onBack={closeProblem}
        />

        {bannerMessage && (
          <div
            className={`flex items-center justify-between border-y px-4 py-2.5 text-xs font-semibold ${
              bannerIsSuccess
                ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                : "border-rose-500/40 bg-rose-500/15 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {bannerIsSuccess ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              )}
              <span>{bannerMessage}</span>
            </div>
            <button
              onClick={() => setBannerMessage("")}
              className="text-xs opacity-70 hover:opacity-100 ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Mobile View Toggle */}
        <div className="flex border-b border-white/[0.08] bg-[#0E1524] p-1.5 lg:hidden">
          <button
            type="button"
            onClick={() => setActiveMobileView("problem")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
              activeMobileView === "problem"
                ? "bg-white/10 text-cyan-300 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Problem Description
          </button>
          <button
            type="button"
            onClick={() => setActiveMobileView("editor")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-bold transition ${
              activeMobileView === "editor"
                ? "bg-white/10 text-cyan-300 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Code Editor & Console
          </button>
        </div>

        {/* Main Split Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Problem Details Panel */}
          <aside
            className={`w-full lg:w-[45%] lg:min-w-[380px] lg:max-w-xl flex-col border-r border-white/[0.08] bg-[#0A0E18] overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-white/10 ${
              activeMobileView === "problem" ? "flex" : "hidden lg:flex"
            }`}
          >
            <div className="space-y-3 pb-5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  {selected.category}
                </span>
                <span className="text-slate-600">•</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {selected.title ?? "Metadata repair required"}
              </h2>
              <p className="text-xs text-slate-500">Problem ID #{selected.id}</p>
              {selected.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selected.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-lime-400/20 bg-lime-400/5 px-2 py-0.5 text-[10px] text-lime-300">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {selected.metadata_status === "needs_repair" && (
              <div role="alert" className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">This problem needs metadata repair.</p>
                    <p className="mt-1 text-amber-100/80">{selected.metadata_warnings.join(" ")}</p>
                    {!selected.can_solve && (
                      <p className="mt-1 text-amber-100/80">Run and submit are disabled until a meaningful title and statement are restored.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6 pt-5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description</h3>
                <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {selected.description}
                </div>
              </div>

              {(selected.input_format || selected.output_format) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selected.input_format && (
                    <div className="rounded-xl border border-white/[0.08] bg-[#0E1524] p-3.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Input Format</div>
                      <p className="text-xs text-slate-300">{selected.input_format}</p>
                    </div>
                  )}
                  {selected.output_format && (
                    <div className="rounded-xl border border-white/[0.08] bg-[#0E1524] p-3.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Output Format</div>
                      <p className="text-xs text-slate-300">{selected.output_format}</p>
                    </div>
                  )}
                </div>
              )}

              {selected.constraints && (
                <div className="rounded-xl border border-white/[0.08] bg-[#0E1524] p-3.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Constraints</div>
                  <pre className="text-xs font-mono text-cyan-200 whitespace-pre-wrap">{selected.constraints}</pre>
                </div>
              )}

              {selected.samples && selected.samples.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Examples</h3>
                  {selected.samples.map((ex, idx) => (
                    <div key={idx} className="rounded-xl border border-white/[0.08] bg-[#0E1524] p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">Example {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => copyTestCase(ex.input, idx)}
                          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-cyan-300 transition"
                        >
                          {copiedCaseIdx === idx ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                          <span>{copiedCaseIdx === idx ? "Copied" : "Copy Input"}</span>
                        </button>
                      </div>

                      <div className="space-y-1.5 font-mono text-xs">
                        <div className="rounded-lg bg-[#070A0F] p-2 text-slate-300">
                          <span className="text-slate-500 select-none">Input: </span>{ex.input}
                        </div>
                        <div className="rounded-lg bg-[#070A0F] p-2 text-emerald-300">
                          <span className="text-slate-500 select-none">Output: </span>{ex.output}
                        </div>
                        {ex.explanation && (
                          <div className="text-[11px] text-slate-400 font-sans pt-1">
                            <span className="font-semibold text-slate-300">Explanation: </span>
                            {ex.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Right: Code Editor & Console */}
          <main
            className={`flex flex-1 flex-col overflow-hidden bg-[#070A0F] p-2 sm:p-4 gap-3 ${
              activeMobileView === "editor" ? "flex" : "hidden lg:flex"
            }`}
          >
            <div className="flex-1 min-h-[300px]">
              <AssessmentCodeEditor
                value={code}
                onChange={setCode}
                language={language}
                onLanguageChange={changeLanguage}
                availableLanguages={LANGUAGES}
                draftKey={`task_${selected.id}`}
                onReset={resetCode}
                readOnly={!selected.can_solve}
              />
            </div>

            <div className="shrink-0">
              <AssessmentConsole
                testCases={testCaseResults}
                customInput={customInput}
                onCustomInputChange={setCustomInput}
                stdout={consoleStdout}
                stderr={consoleStderr}
                status={consoleStatus}
                runtimeMs={consoleRuntime}
                memoryMb={consoleMemory}
              />
            </div>
          </main>
        </div>

        <AssessmentActionFooter
          onRunTests={handleRunTests}
          onSubmit={handleSubmitSolution}
          isRunningTests={running}
          isSubmitting={submitting}
          runLabel="Run Tests"
          submitLabel="Submit Solution"
          canRunTests={selected.can_solve}
          canSubmit={selected.can_solve}
        />
      </div>
    );
  }

  // CATALOG BROWSER VIEW
  return (
    <DashboardLayout>
      <main className="min-h-screen p-4 sm:p-7 space-y-6 max-w-7xl mx-auto">
        <Breadcrumbs
          items={[
            { label: "Practice Hub", href: "/practice" },
            { label: "Coding Practice", href: "/practice/coding", active: true },
          ]}
        />

        <PracticeNav />

        <section className="rounded-2xl border border-white/10 bg-[#0B0D10] p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-400">Qubira · Practice</p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">Coding Practice</h1>
              <p className="mt-2 text-sm text-slate-400">
                Find a verified challenge by title, topic, difficulty, and your saved progress.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:min-w-[390px]">
              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Available</p>
                <p className="mt-1 text-xl font-bold text-white">{availableTotal}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Solved</p>
                <p className="mt-1 text-xl font-bold text-lime-300">{summary.solved}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Completion</p>
                <p className="mt-1 text-xl font-bold text-white">
                  {completionPercent === null ? "—" : `${completionPercent}%`}
                </p>
                {completionPercent !== null && (
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-lime-400" style={{ width: `${completionPercent}%` }} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <div className="space-y-3 rounded-xl border border-white/10 bg-[#0B0D10] p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative w-full lg:flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search problem titles, categories, or topics"
              className="w-full rounded-lg border border-white/10 bg-[#070809] pl-9 pr-3 py-2.5 text-sm text-slate-200 outline-none focus:border-lime-400/60 placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-auto">
            <select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setPage(1);
              }}
              className="min-w-0 rounded-lg border border-white/10 bg-[#070809] px-3 py-2.5 text-xs font-semibold text-slate-300 outline-none hover:border-lime-400/50"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="min-w-0 rounded-lg border border-white/10 bg-[#070809] px-3 py-2.5 text-xs font-semibold text-slate-300 outline-none hover:border-lime-400/50"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                setPage(1);
              }}
              className="min-w-0 rounded-lg border border-white/10 bg-[#070809] px-3 py-2.5 text-xs font-semibold text-slate-300 outline-none hover:border-lime-400/50"
            >
              <option value="">All Verified Topics</option>
              {topics.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value === "difficulty" ? "difficulty" : "problem_id");
                setPage(1);
              }}
              className="min-w-0 rounded-lg border border-white/10 bg-[#070809] px-3 py-2.5 text-xs font-semibold text-slate-300 outline-none hover:border-lime-400/50"
            >
              <option value="problem_id">Newest problem ID</option>
              <option value="difficulty">Sort by difficulty</option>
            </select>
          </div>
          </div>

          <div className="flex w-fit items-center rounded-lg border border-white/10 bg-[#070809] p-0.5">
              <button
                type="button"
                onClick={() => setStatus("all")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  status === "all" ? "bg-lime-400/15 text-lime-200" : "text-slate-400 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setStatus("unsolved")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  status === "unsolved" ? "bg-lime-400/15 text-lime-200" : "text-slate-400 hover:text-white"
                }`}
              >
                Unsolved
              </button>
              <button
                type="button"
                onClick={() => setStatus("solved")}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  status === "solved" ? "bg-lime-400/15 text-lime-200" : "text-slate-400 hover:text-lime-300"
                }`}
              >
                Solved
              </button>
          </div>
        </div>

        {needsRepairTotal > 0 && (
          <div role="status" className="flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-3 text-xs text-amber-200">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              {needsRepairTotal} problem records need metadata repair. Their IDs and saved progress are preserved, but records without a meaningful title and statement cannot be solved or submitted.
            </p>
          </div>
        )}

        {catalogError && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{catalogError}</span>
          </div>
        )}

        {/* Problem Catalog */}
        {loadingList ? (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0B0D10]">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-16 border-b border-white/[0.06] bg-[#0E1012] animate-pulse last:border-0" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-[#0B0D10] p-12 text-center">
            <Layers className="h-10 w-10 text-slate-500 mb-3" />
            <h3 className="text-base font-semibold text-slate-200">No problems match these filters</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Try another title, topic, difficulty, or progress filter.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0B0D10]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead className="border-b border-white/10 bg-white/[0.025]">
                  <tr className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                    <th className="px-4 py-3">Problem</th>
                    <th className="px-4 py-3">Topics</th>
                    <th className="px-4 py-3">Difficulty</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {items.map((prob) => {
                    const diff = (prob.difficulty || "unknown").toLowerCase();
                    const diffBadge =
                      diff === "easy"
                        ? "border-lime-400/20 bg-lime-400/[0.06] text-lime-300"
                        : diff === "hard"
                          ? "border-rose-400/20 bg-rose-400/[0.06] text-rose-300"
                          : diff === "medium"
                            ? "border-amber-400/20 bg-amber-400/[0.06] text-amber-300"
                            : "border-white/10 bg-white/[0.04] text-slate-300";
                    const statusLabel =
                      prob.status === "solved" ? "Solved" : prob.status === "attempted" ? "Attempted" : "Unsolved";

                    return (
                      <tr key={prob.id} className="align-middle transition hover:bg-white/[0.025]">
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <h3 className={`text-sm font-semibold ${prob.title ? "text-white" : "text-amber-200"}`}>
                              {prob.title ?? "Metadata repair required"}
                            </h3>
                            <p className="font-mono text-[10px] text-slate-500">Problem ID #{prob.id}</p>
                            {prob.metadata_status === "needs_repair" && (
                              <p className="text-[11px] text-amber-300">{prob.metadata_warnings[0]}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex max-w-sm flex-wrap gap-1.5">
                            {prob.tags.length > 0 ? (
                              prob.tags.map((tag) => (
                                <span key={tag} className="rounded-full border border-lime-400/15 bg-lime-400/[0.04] px-2 py-0.5 text-[10px] text-lime-200">
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-500">No verified topics</span>
                            )}
                            {prob.category && (
                              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-400">
                                Category: {prob.category}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase ${diffBadge}`}>
                            {prob.difficulty || "Unknown"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 text-xs ${
                            prob.status === "solved" ? "text-lime-300" : prob.status === "attempted" ? "text-slate-300" : "text-slate-500"
                          }`}>
                            {prob.status === "solved" && <CheckCircle2 className="h-3.5 w-3.5" />}
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => openProblem(prob.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-lime-400/25 bg-lime-400/[0.06] px-3 py-2 text-xs font-semibold text-lime-200 transition hover:bg-lime-400/15"
                          >
                            {prob.can_solve ? <Play className="h-3 w-3 fill-current" /> : <AlertCircle className="h-3 w-3" />}
                            <span>{prob.can_solve ? (prob.status === "solved" ? "Review" : "Solve") : "Review metadata"}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between border-t border-white/[0.08] pt-4 text-xs text-slate-400">
            <div>
              Showing <span className="font-semibold text-slate-200">{(page - 1) * 20 + 1}</span> to{" "}
              <span className="font-semibold text-slate-200">{Math.min(page * 20, total)}</span> of{" "}
              <span className="font-semibold text-slate-200">{total}</span> problems
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </button>
              <span className="px-2 font-mono font-bold text-slate-200">
                {page} / {Math.ceil(total / 20)}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 20 >= total}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-medium text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}

export default function CodingPracticePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070A0F] flex items-center justify-center text-slate-400 text-sm">Loading Coding Workspace...</div>}>
      <CodingPracticeInner />
    </Suspense>
  );
}
