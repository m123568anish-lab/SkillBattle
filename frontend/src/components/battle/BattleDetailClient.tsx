"use client";

import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useDashboardStore } from "@/store/dashboardStore";
import toast from "react-hot-toast";
import { useBattleSocket, type BattleSocketMessage } from "@/hooks/useBattleSocket";
import { AssessmentCodeEditor, AssessmentConsole, type TestCaseResult } from "@/components/assessment";
import { practiceService } from "@/services/practice.service";
import {
  Users,
  Wifi,
  WifiOff,
  Send,
  Play,
  Activity,
} from "lucide-react";

export interface BattleDetailClientProps {
  id: string;
  problemId?: number;
}

export default function BattleDetailClient({ id, problemId }: BattleDetailClientProps) {
  const [players, setPlayers] = useState<number | null>(null);
  const [telemetryEvents, setTelemetryEvents] = useState<
    Array<{ id: string; time: string; text: string; type: "system" | "join" | "action" }>
  >([]);

  // Code editor state
  const [editorLang, setEditorLang] = useState("python");
  const [sourceCode, setSourceCode] = useState(
    "def solution():\n    # Implement optimal solution\n    pass\n\nif __name__ == '__main__':\n    solution()\n"
  );
  const [customInput, setCustomInput] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Console telemetry
  const [consoleStatus, setConsoleStatus] = useState<string>("idle");
  const [consoleStdout, setConsoleStdout] = useState<string>("");
  const [consoleStderr, setConsoleStderr] = useState<string>("");
  const [consoleRuntime, setConsoleRuntime] = useState<number | null>(null);
  const [consoleMemory, setConsoleMemory] = useState<number | null>(null);
  const [testCases, setTestCases] = useState<TestCaseResult[]>([]);
  const [loadedProblemTitle, setLoadedProblemTitle] = useState<string | null>(null);
  const [problemLoadError, setProblemLoadError] = useState<string | null>(null);
  const [problemMetadataWarning, setProblemMetadataWarning] = useState<string | null>(null);
  const [problemCanSolve, setProblemCanSolve] = useState(false);
  const [problemLoading, setProblemLoading] = useState(Boolean(problemId));

  useEffect(() => {
    setProblemLoadError(null);
    setProblemMetadataWarning(null);
    setProblemCanSolve(false);
    setLoadedProblemTitle(null);
    setTestCases([]);

    if (!problemId) {
      setProblemLoadError("This battle does not reference a valid coding problem.");
      setProblemLoading(false);
      return;
    }

    let active = true;
    setProblemLoading(true);
    practiceService.get(problemId).then((problem) => {
      if (!active) return;
      setLoadedProblemTitle(problem.title);
      setProblemCanSolve(problem.can_solve);
      setProblemMetadataWarning(problem.can_solve ? null : problem.metadata_warnings.join(" "));
      setProblemLoadError(null);
      setTestCases(
        problem.samples.map((sample, index) => ({
          id: index + 1,
          input: sample.input,
          expectedOutput: sample.output,
        }))
      );
    }).catch((error: unknown) => {
      if (!active) return;
      console.error("Failed to load battle problem samples:", error);
      setProblemLoadError("Battle problem details are unavailable.");
      setTestCases([]);
    }).finally(() => {
      if (active) setProblemLoading(false);
    });

    return () => {
      active = false;
    };
  }, [problemId]);

  // Handle incoming WebSocket messages
  const handleSocketMessage = useCallback((msg: BattleSocketMessage) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const { event, data } = msg;

    if (event === "player_joined") {
      if (typeof data?.players === "number") setPlayers(data.players);
      setTelemetryEvents((prev) => [
        { id: Math.random().toString(), time, text: `Player joined the arena`, type: "join" },
        ...prev.slice(0, 30),
      ]);
    } else if (event === "player_left") {
      if (typeof data?.players === "number") setPlayers(data.players);
      setTelemetryEvents((prev) => [
        { id: Math.random().toString(), time, text: `Player disconnected`, type: "system" },
        ...prev.slice(0, 30),
      ]);
    } else if (event === "battle_finished") {
      void useDashboardStore.getState().refresh();
      setTelemetryEvents((prev) => [
        { id: Math.random().toString(), time, text: "Battle concluded! Scores finalized.", type: "system" },
        ...prev.slice(0, 30),
      ]);
    } else if (event === "chat" || event === "system") {
      setTelemetryEvents((prev) => [
        { id: Math.random().toString(), time, text: String(data?.text || event), type: "action" },
        ...prev.slice(0, 30),
      ]);
    }
  }, []);

  const { connected, sendEvent } = useBattleSocket({
    battleId: id,
    onMessage: handleSocketMessage,
  });

  // Run test code
  const handleRunTests = async () => {
    if (running || submitting) return;
    setRunning(true);
    setConsoleStatus("running");
    setConsoleStdout("Running sandbox evaluation...");
    setConsoleStderr("");

    try {
      const startMs = Date.now();
      const r = await api.post("/compiler/run", {
        language: editorLang,
        source_code: sourceCode,
        stdin: customInput || "",
        custom_input: true,
      });
      const endMs = Date.now();

      setConsoleRuntime(r.data.execution_time ?? endMs - startMs);
      setConsoleMemory(r.data.memory_used ?? null);

      if (r.data.stderr) {
        setConsoleStderr(r.data.stderr);
        setConsoleStatus("runtime_error");
      } else {
        setConsoleStdout(r.data.stdout || "Execution finished with no output.");
        setConsoleStatus("accepted");
      }
    } catch (err: any) {
      setConsoleStderr(err?.response?.data?.detail || "Execution failed.");
      setConsoleStatus("runtime_error");
    } finally {
      setRunning(false);
    }
  };

  // Submit code to authoritative compiler judge
  const handleSubmitCode = async () => {
    if (submitting) return;
    if (!problemId || problemLoading || problemLoadError) {
      toast.error(problemLoadError || "Battle problem details are still loading or unavailable.");
      return;
    }
    if (!problemCanSolve) {
      toast.error(problemMetadataWarning || "Problem metadata needs repair before submission.");
      return;
    }
    setSubmitting(true);
    setConsoleStatus("running");

    try {
      const resp = await api.post("/compiler/submit", {
        battle_id: id,
        problem_id: problemId,
        language: editorLang,
        source_code: sourceCode,
      });

      const r = resp.data;
      setConsoleRuntime(r.execution_time);
      setConsoleMemory(r.memory_used);

      if (r.verdict === "Accepted") {
        setConsoleStatus("accepted");
        toast.success(
          typeof r.xp_earned === "number"
            ? `Solution accepted! +${r.xp_earned} verified XP`
            : "Solution accepted."
        );
        void useDashboardStore.getState().refresh();
      } else {
        setConsoleStatus("wrong_answer");
        toast.error(`Verdict: ${r.verdict} (${r.passed_tests}/${r.total_tests})`);
      }

    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || "Submission failed";
      setConsoleStderr(errMsg);
      setConsoleStatus("runtime_error");
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Telemetry & Connection Header */}
      <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-[#252525] bg-[#101010] p-3 text-xs sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          {connected ? (
            <span className="flex items-center gap-1.5 font-semibold text-[#D8FF3E]">
              <Wifi className="h-3.5 w-3.5" /> Live Sync
            </span>
          ) : (
            <span className="flex items-center gap-1.5 font-semibold text-rose-400">
              <WifiOff className="h-3.5 w-3.5" /> Reconnecting...
            </span>
          )}
          <span className="text-slate-600">•</span>
          <span className="text-[#F5F5F5] font-medium flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-[#D8FF3E]" /> {players ?? "—"} Active in Arena
          </span>
        </div>

        <button
          type="button"
          onClick={() => sendEvent("player_action", { type: "ping", time: Date.now() })}
          className="rounded-lg border border-[#252525] bg-[#101010] px-2.5 py-1 text-[11px] font-semibold text-[#F5F5F5] transition hover:bg-[#151515] hover:text-[#D8FF3E]"
        >
          Send Arena Ping
        </button>
      </div>

      {/* Editor & Execution Panel */}
      {loadedProblemTitle && <h3 className="text-sm font-semibold text-[#F5F5F5]">{loadedProblemTitle}</h3>}
      {problemLoadError && <p role="alert" className="text-sm text-[#F0BC58]">{problemLoadError}</p>}
      {problemMetadataWarning && <p role="status" className="text-sm text-[#F0BC58]">{problemMetadataWarning}</p>}
      <div       className="h-[min(58svh,440px)] min-h-[320px] sm:h-[440px] sm:min-h-[380px]">
        <AssessmentCodeEditor
          value={sourceCode}
          onChange={setSourceCode}
          language={editorLang}
          onLanguageChange={setEditorLang}
          availableLanguages={["python", "javascript", "cpp"]}
          draftKey={`battle_${id}`}
          onReset={() =>
            setSourceCode("def solution():\n    pass\n\nif __name__ == '__main__':\n    solution()\n")
          }
        />
      </div>

      {/* Console output */}
      <AssessmentConsole
        testCases={testCases}
        customInput={customInput}
        onCustomInputChange={setCustomInput}
        stdout={consoleStdout}
        stderr={consoleStderr}
        status={consoleStatus}
        runtimeMs={consoleRuntime}
        memoryMb={consoleMemory}
        defaultExpanded={false}
      />

      {/* Action Buttons */}
      <div className="flex flex-col-reverse gap-2.5 pt-1 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={handleRunTests}
          disabled={running || submitting}
          className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-[#252525] bg-[#101010] px-4 text-xs font-semibold text-[#F5F5F5] transition hover:bg-[#151515] disabled:opacity-50 sm:w-auto"
        >
          <Play className="h-3.5 w-3.5 text-[#D8FF3E] fill-[#D8FF3E]" />
          <span>{running ? "Testing..." : "Test Code"}</span>
        </button>

        <button
          type="button"
          onClick={handleSubmitCode}
          disabled={submitting || running || problemLoading || Boolean(problemLoadError) || !problemCanSolve}
          className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[#D8FF3E] px-5 text-xs font-bold text-[#101010] transition hover:bg-[#EAFCCB] active:scale-95 disabled:opacity-50 sm:w-auto sm:shadow-[0_10px_30px_rgba(216,255,62,0.16)]"
        >
          <Send className="h-3.5 w-3.5" />
          <span>{submitting ? "Evaluating..." : "Submit to Battle Judge"}</span>
        </button>
      </div>

      {/* Live Arena Activity Log */}
      {telemetryEvents.length > 0 && (
        <div className="rounded-xl border border-[#252525] bg-[#0B0B0B] p-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#A1A1AA] text-[10px] mb-2">
            <Activity className="h-3 w-3 text-[#D8FF3E]" /> Arena Activity Feed
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto font-mono text-[11px] scrollbar-thin scrollbar-thumb-[#252525]/80">
            {telemetryEvents.map((evt) => (
              <div key={evt.id} className="flex items-center gap-2 text-[#F5F5F5]">
                <span className="text-[#737373]">{evt.time}</span>
                <span className="text-[#D8FF3E]">›</span>
                <span
                  className={
                    evt.type === "join"
                        ? "text-[#D8FF3E]"
                        : "text-[#F5F5F5]"
                  }
                >
                  {evt.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
