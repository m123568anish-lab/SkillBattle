"use client";

import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useDashboardStore } from "@/store/dashboardStore";
import toast from "react-hot-toast";
import { useBattleSocket, type BattleSocketMessage } from "@/hooks/useBattleSocket";
import { AssessmentCodeEditor, AssessmentConsole, type TestCaseResult } from "@/components/assessment";
import {
  Users,
  Wifi,
  WifiOff,
  Send,
  Play,
  Terminal,
  Activity,
  Award,
  Clock,
  Sparkles,
} from "lucide-react";

export interface BattleDetailClientProps {
  id: string;
  problemId?: number;
  problemTitle?: string;
}

export default function BattleDetailClient({ id, problemId = 1, problemTitle }: BattleDetailClientProps) {
  const [players, setPlayers] = useState<number>(1);
  const [telemetryEvents, setTelemetryEvents] = useState<
    Array<{ id: string; time: string; text: string; type: "system" | "join" | "submission" | "action" }>
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
  const [testCases, setTestCases] = useState<TestCaseResult[]>([
    { id: 1, input: "Sample input", expectedOutput: "Sample output" },
  ]);

  // Handle incoming WebSocket messages
  const handleSocketMessage = useCallback((msg: BattleSocketMessage) => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const { event, data } = msg;

    if (event === "player_joined") {
      setPlayers((p) => (typeof data?.players === "number" ? data.players : p + 1));
      setTelemetryEvents((prev) => [
        { id: Math.random().toString(), time, text: `Player joined the arena`, type: "join" },
        ...prev.slice(0, 30),
      ]);
    } else if (event === "player_left") {
      setPlayers((p) => Math.max(1, typeof data?.players === "number" ? data.players : p - 1));
      setTelemetryEvents((prev) => [
        { id: Math.random().toString(), time, text: `Player disconnected`, type: "system" },
        ...prev.slice(0, 30),
      ]);
    } else if (event === "submission") {
      setTelemetryEvents((prev) => [
        {
          id: Math.random().toString(),
          time,
          text: `Opponent submitted code (${String(data?.verdict || "Evaluating")})`,
          type: "submission",
        },
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
      setConsoleMemory(r.data.memory_used ?? 12.0);

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
    setSubmitting(true);
    setConsoleStatus("running");

    try {
      const resp = await api.post("/compiler/submit", {
        battle_id: id,
        problem_id: problemId || 1,
        language: editorLang,
        source_code: sourceCode,
      });

      const r = resp.data;
      setConsoleRuntime(r.execution_time);
      setConsoleMemory(r.memory_used);

      if (r.verdict === "Accepted") {
        setConsoleStatus("accepted");
        toast.success(`Solution accepted! +${r.xp_earned || 50} verified XP`);
        void useDashboardStore.getState().refresh();
      } else {
        setConsoleStatus("wrong_answer");
        toast.error(`Verdict: ${r.verdict} (${r.passed_tests}/${r.total_tests})`);
      }

      // Notify WebSocket peer of submission
      sendEvent("submission", {
        verdict: r.verdict,
        passed_tests: r.passed_tests,
        total_tests: r.total_tests,
      });
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
    <div className="flex flex-col gap-4">
      {/* Telemetry & Connection Header */}
      <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-[#0E1524] p-3 text-xs">
        <div className="flex items-center gap-2">
          {connected ? (
            <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
              <Wifi className="h-3.5 w-3.5" /> Live Sync
            </span>
          ) : (
            <span className="flex items-center gap-1.5 font-semibold text-rose-400">
              <WifiOff className="h-3.5 w-3.5" /> Reconnecting...
            </span>
          )}
          <span className="text-slate-600">•</span>
          <span className="text-slate-300 font-medium flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-cyan-400" /> {players} Active in Arena
          </span>
        </div>

        <button
          type="button"
          onClick={() => sendEvent("player_action", { type: "ping", time: Date.now() })}
          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          Send Arena Ping
        </button>
      </div>

      {/* Editor & Execution Panel */}
      <div className="min-h-[380px] h-[440px]">
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
      <div className="flex items-center justify-end gap-2.5 pt-1">
        <button
          type="button"
          onClick={handleRunTests}
          disabled={running || submitting}
          className="flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-semibold text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
        >
          <Play className="h-3.5 w-3.5 text-cyan-400 fill-cyan-400" />
          <span>{running ? "Testing..." : "Test Code"}</span>
        </button>

        <button
          type="button"
          onClick={handleSubmitCode}
          disabled={submitting || running}
          className="flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 text-xs font-bold text-white shadow-lg transition hover:from-cyan-400 hover:to-blue-500 active:scale-95 disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          <span>{submitting ? "Evaluating..." : "Submit to Battle Judge"}</span>
        </button>
      </div>

      {/* Live Arena Activity Log */}
      {telemetryEvents.length > 0 && (
        <div className="rounded-xl border border-white/[0.08] bg-[#0A0D14] p-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-400 text-[10px] mb-2">
            <Activity className="h-3 w-3 text-cyan-400" /> Arena Activity Feed
          </div>
          <div className="space-y-1.5 max-h-32 overflow-y-auto font-mono text-[11px] scrollbar-thin scrollbar-thumb-white/10">
            {telemetryEvents.map((evt) => (
              <div key={evt.id} className="flex items-center gap-2 text-slate-300">
                <span className="text-slate-500">{evt.time}</span>
                <span className="text-cyan-400">›</span>
                <span
                  className={
                    evt.type === "submission"
                      ? "text-amber-300 font-semibold"
                      : evt.type === "join"
                      ? "text-emerald-300"
                      : "text-slate-300"
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
