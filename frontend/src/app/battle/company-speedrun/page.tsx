"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { practiceService, type PracticeProblem, type PracticeProblemDetail } from "@/services/practice.service";
import {
  AssessmentHeader,
  AssessmentCodeEditor,
  AssessmentConsole,
  AssessmentActionFooter,
  type TestCaseResult,
} from "@/components/assessment";
import {
  Zap,
  Timer,
  Award,
  Clock,
  Sparkles,
  Trophy,
  ArrowRight,
  Flame,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Play,
  BriefcaseBusiness,
} from "lucide-react";

const SPEEDRUN_PRESETS = [
  {
    id: "sprint",
    title: "15-Min Sprint",
    durationMinutes: 15,
    difficulty: "Medium",
    description: "High-intensity quick sprint. Optimize for rapid problem recognition and accurate syntax.",
    badge: "Fast Pace",
    xpBonus: 150,
  },
  {
    id: "marathon",
    title: "30-Min Technical Assessment",
    durationMinutes: 30,
    difficulty: "Medium",
    description: "Standard engineering interview duration. Complete optimal edge-case handling and time complexity.",
    badge: "Standard",
    xpBonus: 300,
  },
  {
    id: "hardcore",
    title: "45-Min Elite Simulation",
    durationMinutes: 45,
    difficulty: "Hard",
    description: "Rigorous algorithmic problem simulation matching top-tier tech bar challenges.",
    badge: "Elite",
    xpBonus: 500,
  },
];

export default function CompanySpeedrunPage() {
  const router = useRouter();
  const [selectedPreset, setSelectedPreset] = useState(SPEEDRUN_PRESETS[0]);
  const [inProgress, setInProgress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [problem, setProblem] = useState<PracticeProblemDetail | null>(null);

  // Speedrun timer
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(15 * 60);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Editor & Execution state
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testCases, setTestCaseResults] = useState<TestCaseResult[]>([]);

  // Console telemetry
  const [consoleStatus, setConsoleStatus] = useState<string>("idle");
  const [consoleStdout, setConsoleStdout] = useState<string>("");
  const [consoleStderr, setConsoleStderr] = useState<string>("");
  const [consoleRuntime, setConsoleRuntime] = useState<number | null>(null);
  const [consoleMemory, setConsoleMemory] = useState<number | null>(null);

  // Submission result modal
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [completedResult, setCompletedResult] = useState<{
    verdict: string;
    xpEarned: number;
    passedTests: number;
    totalTests: number;
    timeTakenSeconds: number;
    speedrunRank: string;
  } | null>(null);

  // Mobile layout
  const [isMobilePanelOpen, setIsMobilePanelOpen] = useState(true);
  const [activeMobileView, setActiveMobileView] = useState<"problem" | "editor">("editor");

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start speedrun session
  const startSpeedrun = async (preset = selectedPreset) => {
    try {
      setLoading(true);
      // Fetch suitable problems from the real practice catalogue
      const diffFilter = preset.difficulty.toLowerCase();
      const list = await practiceService.list({
        difficulty: diffFilter,
        page_size: 10,
      });

      const items = list.items || [];
      if (items.length === 0) {
        // Fallback to any difficulty
        const fallbackList = await practiceService.list({ page_size: 10 });
        if (!fallbackList.items || fallbackList.items.length === 0) {
          alert("No practice problems available for speedrun.");
          return;
        }
        items.push(...fallbackList.items);
      }

      // Pick a random problem from the pool
      const randomItem = items[Math.floor(Math.random() * items.length)];
      const detail = await practiceService.get(randomItem.id);

      setProblem(detail);
      setLanguage("python");
      setCode(detail.starter_codes?.["python"] || "def solution():\n    pass\n\nif __name__ == '__main__':\n    solution()\n");

      if (detail.samples && detail.samples.length > 0) {
        setTestCaseResults(
          detail.samples.map((ex, idx) => ({
            id: idx + 1,
            input: ex.input,
            expectedOutput: ex.output,
          }))
        );
      }

      setTimeRemainingSeconds(preset.durationMinutes * 60);
      setElapsedSeconds(0);
      setInProgress(true);
    } catch {
      alert("Failed to start Speedrun session. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  // Timer tick
  useEffect(() => {
    if (!inProgress) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [inProgress]);

  // Run tests
  const handleRunTests = async () => {
    if (!problem || running || submitting) return;
    setRunning(true);
    setConsoleStatus("running");
    setConsoleStdout("Running test execution in speedrun sandbox...");
    setConsoleStderr("");

    try {
      const startMs = Date.now();
      const r = await api.post("/compiler/run", {
        language,
        source_code: code,
        stdin: customInput || (problem.samples?.[0]?.input ?? ""),
        custom_input: true,
      });
      const endMs = Date.now();

      setConsoleRuntime(r.data.execution_time ?? endMs - startMs);
      setConsoleMemory(r.data.memory_used ?? 14.2);

      if (r.data.stderr) {
        setConsoleStderr(r.data.stderr);
        setConsoleStatus("runtime_error");
      } else {
        setConsoleStdout(r.data.stdout || "Execution finished with no output.");
        setConsoleStatus("accepted");
      }

      if (testCases.length > 0) {
        setTestCaseResults((prev) =>
          prev.map((tc, idx) => {
            if (idx === 0) {
              const actual = (r.data.stdout || "").trim();
              const expected = (tc.expectedOutput || "").trim();
              return {
                ...tc,
                actualOutput: actual,
                passed: actual === expected,
              };
            }
            return tc;
          })
        );
      }
    } catch (err: any) {
      setConsoleStderr(err?.response?.data?.detail || "Execution failed.");
      setConsoleStatus("runtime_error");
    } finally {
      setRunning(false);
    }
  };

  // Final submission evaluation
  const handleFinalSubmit = async (timeExpired = false) => {
    if (!problem || submitting) return;
    setSubmitting(true);
    setShowConfirmSubmit(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    try {
      const r = (
        await api.post("/compiler/submit", {
          problem_id: problem.id,
          language,
          source_code: code,
        })
      ).data;

      const isAccepted = r.verdict === "Accepted";
      const speedrunRank = isAccepted
        ? elapsedSeconds < 300
          ? "Speed Demon (S-Tier)"
          : elapsedSeconds < 600
          ? "Grandmaster (A-Tier)"
          : "Ace Solver (B-Tier)"
        : "Attempted (C-Tier)";

      setCompletedResult({
        verdict: timeExpired && !isAccepted ? "Time Expired" : r.verdict,
        xpEarned: isAccepted ? r.xp_earned + selectedPreset.xpBonus : 25,
        passedTests: r.passed_tests,
        totalTests: r.total_tests,
        timeTakenSeconds: elapsedSeconds,
        speedrunRank,
      });
    } catch (e: any) {
      setCompletedResult({
        verdict: "Evaluation Error",
        xpEarned: 10,
        passedTests: 0,
        totalTests: 1,
        timeTakenSeconds: elapsedSeconds,
        speedrunRank: "Unranked",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ACTIVE IN-SESSION SPEEDRUN WORKSPACE
  if (inProgress && problem) {
    return (
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#070A0F] text-slate-100">
        <AssessmentHeader
          title={`${selectedPreset.title}: ${problem.title}`}
          category={problem.category}
          difficulty={problem.difficulty}
          timeRemainingSeconds={timeRemainingSeconds}
          onExit={() => {
            if (confirm("Abandon speedrun session? Your time and score will not be saved.")) {
              setInProgress(false);
            }
          }}
          isCollapsiblePanelOpen={isMobilePanelOpen}
          onToggleCollapsiblePanel={() => setIsMobilePanelOpen(!isMobilePanelOpen)}
          panelToggleLabel="Problem"
        />

        {/* Mobile View Toggle Bar */}
        <div className="flex lg:hidden items-center border-b border-white/[0.08] bg-[#0A0D14] p-1.5">
          <button
            type="button"
            onClick={() => setActiveMobileView("problem")}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
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
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
              activeMobileView === "editor"
                ? "bg-white/10 text-cyan-300 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Code Editor & Console
          </button>
        </div>

        {/* Main Split Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Problem Details */}
          <aside
            className={`w-full lg:w-[42%] lg:min-w-[360px] lg:max-w-xl flex-col border-r border-white/[0.08] bg-[#0A0E18] overflow-y-auto p-4 sm:p-6 scrollbar-thin scrollbar-thumb-white/10 ${
              activeMobileView === "problem" ? "flex" : "hidden lg:flex"
            }`}
          >
            <div className="space-y-4 pb-4 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                  <Flame className="h-3 w-3" /> {selectedPreset.title}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-cyan-400 font-semibold">
                  +{selectedPreset.xpBonus} Speed Bonus
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">{problem.title}</h2>
            </div>

            <div className="space-y-5 pt-4 text-xs sm:text-sm text-slate-300">
              <div className="prose prose-invert prose-sm leading-relaxed whitespace-pre-wrap">
                {problem.description}
              </div>

              {problem.constraints && (
                <div className="rounded-xl border border-white/[0.08] bg-[#0E1524] p-3.5 space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Constraints</div>
                  <pre className="font-mono text-cyan-200 text-xs whitespace-pre-wrap">{problem.constraints}</pre>
                </div>
              )}

              {problem.samples && problem.samples.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Sample Cases</div>
                  {problem.samples.map((ex, idx) => (
                    <div key={idx} className="rounded-xl border border-white/[0.08] bg-[#0E1524] p-3 font-mono text-xs space-y-1">
                      <div className="text-slate-300"><span className="text-slate-500">Input:</span> {ex.input}</div>
                      <div className="text-emerald-300"><span className="text-slate-500">Output:</span> {ex.output}</div>
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
            <div className="flex-1 min-h-[280px]">
              <AssessmentCodeEditor
                value={code}
                onChange={setCode}
                language={language}
                onLanguageChange={setLanguage}
                availableLanguages={["python", "javascript", "cpp", "java"]}
                draftKey={`speedrun_${problem.id}`}
                onReset={() => setCode(problem.starter_codes?.[language] || "")}
              />
            </div>

            <div className="shrink-0">
              <AssessmentConsole
                testCases={testCases}
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

        {/* Footer */}
        <AssessmentActionFooter
          onRunTests={handleRunTests}
          onSubmit={() => setShowConfirmSubmit(true)}
          isRunningTests={running}
          isSubmitting={submitting}
          runLabel="Run Tests"
          submitLabel="Finish Speedrun"
        />

        {/* Confirmation Modal */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0E1524] p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Ready to Finish?</h3>
                  <p className="text-xs text-slate-400">Your solution will be evaluated against all hidden test cases.</p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#070A0F] p-3 text-xs space-y-1">
                <div className="flex justify-between text-slate-300">
                  <span>Elapsed Time:</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Target Time:</span>
                  <span className="font-mono text-slate-400">{selectedPreset.durationMinutes}m 00s</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
                >
                  Keep Solving
                </button>
                <button
                  type="button"
                  onClick={() => handleFinalSubmit(false)}
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white hover:from-cyan-400 hover:to-blue-500 shadow-md"
                >
                  Submit & Complete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Speedrun Result Modal */}
        {completedResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <div className="w-full max-w-lg rounded-3xl border border-cyan-500/30 bg-[#0E1524] p-6 sm:p-8 space-y-6 shadow-2xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400">
                {completedResult.verdict === "Accepted" ? (
                  <Trophy className="h-8 w-8 text-amber-400 animate-bounce" />
                ) : (
                  <Clock className="h-8 w-8 text-cyan-400" />
                )}
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                  Speedrun Completed
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  {completedResult.verdict === "Accepted" ? "Challenge Conquered!" : completedResult.verdict}
                </h3>
                <p className="text-xs text-slate-400">
                  Performance Rank:{" "}
                  <span className="font-bold text-amber-400">{completedResult.speedrunRank}</span>
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-[#070A0F] p-3 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Time Taken</div>
                  <div className="text-base sm:text-lg font-black text-white mt-1">
                    {Math.floor(completedResult.timeTakenSeconds / 60)}m {completedResult.timeTakenSeconds % 60}s
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#070A0F] p-3 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Tests Passed</div>
                  <div className="text-base sm:text-lg font-black text-emerald-400 mt-1">
                    {completedResult.passedTests}/{completedResult.totalTests}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#070A0F] p-3 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-400">XP Awarded</div>
                  <div className="text-base sm:text-lg font-black text-cyan-400 mt-1">
                    +{completedResult.xpEarned}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCompletedResult(null);
                    setInProgress(false);
                  }}
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
                >
                  Exit to Hub
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCompletedResult(null);
                    startSpeedrun();
                  }}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:from-cyan-400 hover:to-blue-500"
                >
                  Play Another Speedrun
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // DEFAULT SPEEDRUN LAUNCHPAD
  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 p-4 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Top Header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0E1524] via-[#0B0F17] to-[#141C2E] p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              <Zap className="h-3.5 w-3.5 text-cyan-400" />
              <span>Competitive Speed Assessment</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Company Speedrun
            </h1>
            <p className="max-w-xl text-sm sm:text-base text-slate-300">
              Test your algorithmic agility under strict interview countdown clocks. Submit working solutions before time expires to claim high-multiplier speed bonuses.
            </p>
          </div>
        </div>

        {/* Preset Cards Selection */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-200">Select Speedrun Format:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SPEEDRUN_PRESETS.map((preset) => {
              const isSelected = selectedPreset.id === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPreset(preset)}
                  className={`relative flex flex-col justify-between rounded-2xl border p-5 text-left transition-all ${
                    isSelected
                      ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_25px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500"
                      : "border-white/[0.08] bg-[#0E1524] hover:border-white/20 hover:bg-[#121B2E]"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase text-slate-300">
                        {preset.badge}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-mono font-bold text-cyan-300">
                        <Timer className="h-3.5 w-3.5 text-cyan-400" /> {preset.durationMinutes}m
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white">{preset.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{preset.description}</p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                      <Award className="h-3 w-3" /> +{preset.xpBonus} XP Bonus
                    </span>
                    {isSelected && <CheckCircle2 className="h-4 w-4 text-cyan-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-[#0E1524] p-5">
          <div className="text-xs text-slate-400">
            Current mode: <span className="font-bold text-white">{selectedPreset.title}</span> ({selectedPreset.durationMinutes} min countdown)
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => router.push("/battle")}
              className="flex-1 sm:flex-initial rounded-xl border border-white/10 px-4 py-3 text-xs font-semibold text-slate-300 hover:bg-white/10"
            >
              Back to Battle Hub
            </button>
            <button
              type="button"
              onClick={() => startSpeedrun(selectedPreset)}
              disabled={loading}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-xs font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] transition hover:from-cyan-400 hover:to-blue-500 active:scale-95 disabled:opacity-50"
            >
              <Play className="h-4 w-4 fill-white" />
              <span>{loading ? "Preparing Session..." : "Launch Speedrun"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
