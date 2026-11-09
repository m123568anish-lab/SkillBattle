"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AssessmentHeader,
  AssessmentCodeEditor,
  AssessmentConsole,
  AssessmentActionFooter,
  type TestCaseResult,
} from "@/components/assessment";
import { practiceService, type PracticeProblemDetail } from "@/services/practice.service";
import {
  Swords,
  AlertTriangle,
  Award,
  CheckCircle2,
} from "lucide-react";

const STARTER_CODES: Record<string, string> = {
  python: `def solve():\n    # Enter competitive solution\n    pass\n\nif __name__ == "__main__":\n    solve()\n`,
  javascript: `const fs = require("fs");\nfunction solve() {\n    const input = fs.readFileSync(0, "utf-8").trim();\n}\nsolve();\n`,
  cpp: `#include <iostream>\nusing namespace std;\nint main() {\n    // Fast I/O\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    return 0;\n}\n`,
  java: `import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n    }\n}\n`,
};

const LANGUAGES = ["python", "javascript", "cpp", "java"];

function SoloCodingBattleInner() {
  const searchParams = useSearchParams();
  const problemIdParam = searchParams.get("id");

  const [problem, setProblem] = useState<PracticeProblemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState(STARTER_CODES.python);
  const [customInput, setCustomInput] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [battleFinished, setBattleFinished] = useState(false);
  const [xpAwarded, setXpAwarded] = useState<number | null>(null);

  // Telemetry
  const [consoleStatus, setConsoleStatus] = useState<string>("idle");
  const [consoleStdout, setConsoleStdout] = useState<string>("");
  const [consoleStderr, setConsoleStderr] = useState<string>("");
  const [consoleRuntime, setConsoleRuntime] = useState<number | null>(null);
  const [consoleMemory, setConsoleMemory] = useState<number | null>(null);
  const [testCaseResults, setTestCaseResults] = useState<TestCaseResult[]>([]);

  useEffect(() => {
    // Fetch problem or default to first available
    const fetchTargetProblem = async () => {
      try {
        setLoading(true);
        if (problemIdParam) {
          const detail = await practiceService.get(Number(problemIdParam));
          setProblem(detail);
          setCode(detail.starter_codes?.[language] || STARTER_CODES[language]);
          if (detail.samples) {
            setTestCaseResults(
              detail.samples.map((s, idx) => ({
                id: idx + 1,
                input: s.input,
                expectedOutput: s.output,
              }))
            );
          }
        } else {
          const catalog = await practiceService.list({
            difficulty: "medium",
            page: 1,
            page_size: 1,
            ready_only: "true",
          });
          if (catalog.items && catalog.items.length > 0) {
            const detail = await practiceService.get(catalog.items[0].id);
            setProblem(detail);
            setCode(detail.starter_codes?.[language] || STARTER_CODES[language]);
            if (detail.samples) {
              setTestCaseResults(
                detail.samples.map((s, idx) => ({
                  id: idx + 1,
                  input: s.input,
                  expectedOutput: s.output,
                }))
              );
            }
          } else {
            setError("No battle problem available right now.");
          }
        }
      } catch {
        setError("Failed to load competitive challenge.");
      } finally {
        setLoading(false);
      }
    };

    void fetchTargetProblem();
  }, [problemIdParam]);

  const handleRunTests = async () => {
    if (!problem || !problem.can_solve || running || battleFinished) return;
    setRunning(true);
    setConsoleStatus("running");
    try {
      const res = await practiceService.run({
        problem_id: problem.id,
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
      setConsoleStderr("Submission failed. Please retry.");
      setConsoleStderr("Execution failed.");
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (!problem || !problem.can_solve || submitting || battleFinished) return;
    setSubmitting(true);
    try {
      const res = await practiceService.submit({
        problem_id: problem.id,
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
        setXpAwarded(res.xp_awarded ?? null);
        setBattleFinished(true);
      }
    } catch {
      setConsoleStatus("failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#070A0F] text-slate-300">
        <Swords className="h-10 w-10 text-rose-500 animate-pulse mb-3" />
        <p className="text-sm font-semibold">Initializing Solo Coding Battle Arena...</p>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#070A0F] text-slate-300 gap-4">
        <AlertTriangle className="h-10 w-10 text-amber-500" />
        <p className="text-sm font-semibold">{error || "Challenge not found."}</p>
        <Link
          href="/battle/solo"
          className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/20 transition"
        >
          Return to Arena
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#070A0F] text-slate-100">
      {/* Competitive Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-rose-500/20 bg-[#0B0F17] px-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-rose-500/15 border border-rose-500/30 px-2.5 py-1 text-xs font-bold text-rose-400">
            <Swords className="h-4 w-4" />
            <span>CODING PRACTICE</span>
          </div>
          <span className="text-sm font-bold text-white hidden sm:inline">
            {problem.title ?? "Metadata repair required"}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/battle/solo" className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10">
            Exit practice
          </Link>
        </div>
      </header>

      {/* Main Split Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Problem Details Panel */}
        <aside className="w-full lg:w-[45%] lg:min-w-[380px] lg:max-w-xl flex-col border-r border-white/[0.08] bg-[#0A0E18] overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-white/10 flex">
          <div className="space-y-3 pb-5 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                {problem.category}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-amber-400" /> Configured reward: {problem.xp_reward} XP
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {problem.title ?? "Metadata repair required"}
            </h2>
          </div>

          {!problem.can_solve && (
            <div role="alert" className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">This problem needs metadata repair.</p>
                  <p className="mt-1 text-amber-100/80">{problem.metadata_warnings.join(" ")}</p>
                  <p className="mt-1 text-amber-100/80">Run and submit are disabled until its title and statement are restored.</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6 pt-5">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Description</h3>
              <div className="prose prose-invert prose-sm max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap">
                {problem.description}
              </div>
            </div>

            {problem.constraints && (
              <div className="rounded-xl border border-white/[0.08] bg-[#0E1524] p-3.5">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Constraints</div>
                <pre className="text-xs font-mono text-cyan-200 whitespace-pre-wrap">{problem.constraints}</pre>
              </div>
            )}

            {problem.samples && problem.samples.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Sample Cases</h3>
                {problem.samples.map((ex, idx) => (
                  <div key={idx} className="rounded-xl border border-white/[0.08] bg-[#0E1524] p-3 space-y-1.5 font-mono text-xs">
                    <div className="text-slate-400">Example {idx + 1}</div>
                    <div className="rounded bg-[#070A0F] p-2 text-slate-300">
                      <span className="text-slate-500">Input: </span>{ex.input}
                    </div>
                    <div className="rounded bg-[#070A0F] p-2 text-emerald-300">
                      <span className="text-slate-500">Output: </span>{ex.output}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right: Code Editor & Console */}
        <main className="flex flex-1 flex-col overflow-hidden bg-[#070A0F] p-2 sm:p-4 gap-3">
          <div className="flex-1 min-h-[300px]">
            <AssessmentCodeEditor
              value={code}
              onChange={setCode}
              language={language}
              onLanguageChange={setLanguage}
              availableLanguages={LANGUAGES}
              readOnly={battleFinished || !problem.can_solve}
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

      {/* Action Footer */}
      <AssessmentActionFooter
        onRunTests={handleRunTests}
        onSubmit={handleSubmitSolution}
        isRunningTests={running}
        isSubmitting={submitting}
        runLabel="Test Cases"
        submitLabel="Submit Final Solution"
        canRunTests={!battleFinished && problem.can_solve}
        canSubmit={!battleFinished && problem.can_solve}
      />

      {/* Persisted submission result */}
      {battleFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-gradient-to-br from-[#0E1524] via-[#0B0F17] to-[#141C2E] p-8 text-center space-y-6 shadow-2xl">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-lg mx-auto">
              <CheckCircle2 className="h-8 w-8 text-yellow-300" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Submission accepted</h2>
              <p className="text-xs text-slate-400 mt-1">
                The server evaluated the submission and recorded its result.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">XP awarded by server</div>
              <div className="text-2xl font-black text-amber-300 mt-1">
                {xpAwarded === null ? "Not returned" : `${xpAwarded} XP`}
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Link
                href="/battle/solo"
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/10 transition"
              >
                Solo Arena
              </Link>
              <Link
                href="/leaderboard"
                className="rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-500/20 hover:opacity-95 transition"
              >
                View Leaderboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SoloCodingBattlePage() {
  return (
    <Suspense fallback={<div className="h-screen w-screen bg-[#070A0F]" />}>
      <SoloCodingBattleInner />
    </Suspense>
  );
}
