"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useDashboardStore } from "@/store/dashboardStore";
import { useBattleSocket, type BattleSocketMessage } from "@/hooks/useBattleSocket";
import { AssessmentCodeEditor, AssessmentConsole, type TestCaseResult } from "@/components/assessment";
import type { BattleRecord } from "@/services/battle.service";
import { Play, Send, Wifi, WifiOff } from "lucide-react";

interface BattleDetailClientProps {
  id: string;
  battle: BattleRecord;
  onRefresh: () => Promise<void>;
}

const STARTER_CODE: Record<string, string> = {
  python: "import sys\n\ndef solve():\n    data = sys.stdin.read().strip()\n    print(data)\n\nif __name__ == '__main__':\n    solve()\n",
  javascript: "const fs = require('fs');\nconst input = fs.readFileSync(0, 'utf8').trim();\nconsole.log(input);\n",
  cpp: "#include <iostream>\n#include <string>\nusing namespace std;\nint main() { string input; getline(cin, input); cout << input << endl; return 0; }\n",
};

function optionData(option: string | { key?: string; text?: string }, index: number) {
  if (typeof option === "string") {
    return { key: String.fromCharCode(65 + index), label: option };
  }
  return {
    key: option.key || String.fromCharCode(65 + index),
    label: option.text || option.key || `Option ${index + 1}`,
  };
}

export default function BattleDetailClient({ id, battle, onRefresh }: BattleDetailClientProps) {
  const [language, setLanguage] = useState("python");
  const [sourceCode, setSourceCode] = useState(STARTER_CODE.python);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [localSubmittedIds, setLocalSubmittedIds] = useState<number[]>([]);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [stdout, setStdout] = useState("");
  const [stderr, setStderr] = useState("");
  const [runtime, setRuntime] = useState<number | null>(null);
  const [memory, setMemory] = useState<number | null>(null);
  const [testCases, setTestCases] = useState<TestCaseResult[]>([]);
  const submissionInFlight = useRef(false);
  const lastNetworkFailurePayload = useRef<string | null>(null);

  const section = battle.questions_data?.[battle.current_section_index ?? 0];
  const assignedQuestions = section?.questions ?? [];
  const submittedIds = useMemo(
    () => new Set([...(battle.submitted_question_ids ?? []), ...localSubmittedIds]),
    [battle.submitted_question_ids, localSubmittedIds],
  );
  const currentQuestion = assignedQuestions.find((question) => !submittedIds.has(question.id));
  const allQuestionsSubmitted = assignedQuestions.length > 0 && !currentQuestion;
  const examples = currentQuestion?.examples ?? [];

  const handleSocketMessage = useCallback((message: BattleSocketMessage) => {
    if ([
      "player_joined",
      "player_left",
      "battle_started",
      "score_updated",
      "battle_finished",
      "state_sync",
    ].includes(message.event)) {
      void onRefresh();
    }
  }, [onRefresh]);
  const { connected } = useBattleSocket({ battleId: id, onMessage: handleSocketMessage });

  const submitAnswer = async () => {
    if (!section || !currentQuestion || submitting || submissionInFlight.current || battle.status !== "running") return;
    if (section.question_type === "mcq" && !selectedOption) return;
    if (section.question_type === "coding" && !sourceCode.trim()) return;

    const payload = {
      battle_id: id,
      question_id: currentQuestion.id,
      section_index: section.section_index,
      question_type: section.question_type,
      mcq_option: section.question_type === "mcq" ? selectedOption : undefined,
      source_code: section.question_type === "coding" ? sourceCode : undefined,
      language,
    };
    const payloadSignature = JSON.stringify(payload);
    const retryingAfterNetworkFailure = lastNetworkFailurePayload.current === payloadSignature;
    submissionInFlight.current = true;
    setSubmitting(true);
    setError(null);
    setNotice(null);
    const restorePersistedAnswer = async () => {
      const { data: persistedSubmission } = await api.post<{
        verified: boolean;
        submission_id?: string | null;
        verdict?: string | null;
        score_earned?: number | null;
        detail: string;
      }>(
        `/battle/${encodeURIComponent(id)}/submission/${currentQuestion.id}/verify`,
        {
          question_type: payload.question_type,
          mcq_option: payload.mcq_option,
          source_code: payload.source_code,
          language: payload.language,
        },
      );
      if (!persistedSubmission.verified) {
        setError(
          persistedSubmission.detail ||
          "The server could not confirm this saved answer. Refresh the battle before retrying.",
        );
        return true;
      }
      lastNetworkFailurePayload.current = null;
      setLocalSubmittedIds((previous) => [...new Set([...previous, currentQuestion.id])]);
      setSelectedOption(null);
      setVerdict(persistedSubmission.verdict ?? "Submitted");
      setScore(persistedSubmission.score_earned ?? null);
      setNotice("Your previous submission was accepted. Battle state has been restored.");
      await onRefresh();
      void useDashboardStore.getState().refresh();
      return true;
    };
    try {
      const { data } = await api.post<{
        id: string;
        verdict: string;
        score_earned: number;
        passed_tests: number;
        total_tests: number;
      }>("/battle/submit-answer", payload);
      lastNetworkFailurePayload.current = null;
      setVerdict(data.verdict);
      setScore(data.score_earned);
      setLocalSubmittedIds((previous) => [...new Set([...previous, currentQuestion.id])]);
      setSelectedOption(null);
      await onRefresh();
      void useDashboardStore.getState().refresh();
    } catch (submitError: unknown) {
      let recoveryError = submitError;
      let detail = apiErrorDetail(submitError);
      const status = apiErrorStatus(submitError);
      const transientNetworkFailure = status === null || [502, 503, 504].includes(status);
      if (transientNetworkFailure) {
        lastNetworkFailurePayload.current = payloadSignature;
        try {
          const { data } = await api.post<{
            verdict: string;
            score_earned: number;
          }>("/battle/submit-answer", payload);
          lastNetworkFailurePayload.current = null;
          setVerdict(data.verdict);
          setScore(data.score_earned);
          setLocalSubmittedIds((previous) => [...new Set([...previous, currentQuestion.id])]);
          setSelectedOption(null);
          setNotice("Submission retry succeeded.");
          await onRefresh();
          void useDashboardStore.getState().refresh();
          return;
        } catch (retryError: unknown) {
          recoveryError = retryError;
          detail = apiErrorDetail(retryError);
          if (
            apiErrorStatus(retryError) === 400 &&
            detail === "This question has already been submitted."
          ) {
            try {
              if (await restorePersistedAnswer()) return;
            } catch {
              // Keep the duplicate response visible if the persisted room cannot be checked.
            }
          }
        }
      } else if (
        retryingAfterNetworkFailure &&
        status === 400 &&
        detail === "This question has already been submitted."
      ) {
        try {
          if (await restorePersistedAnswer()) return;
        } catch {
          // Keep the duplicate response visible if the persisted room cannot be checked.
        }
      }
      if (apiErrorStatus(recoveryError) === null) {
        lastNetworkFailurePayload.current = payloadSignature;
      } else {
        lastNetworkFailurePayload.current = null;
      }
      setError(detail || "Submission failed.");
    } finally {
      submissionInFlight.current = false;
      setSubmitting(false);
    }
  };

  const runSamples = async () => {
    if (!section || running || submitting || section.question_type !== "coding") return;
    const cases = examples.length
      ? examples.filter((example) => example.input !== undefined && example.output !== undefined)
      : [{ input: "", output: "" }];
    if (!cases.length) {
      setError("This question has no complete public sample cases.");
      return;
    }
    setRunning(true);
    setError(null);
    setTestCases([]);
    try {
      const results: TestCaseResult[] = [];
      for (const [index, sample] of cases.entries()) {
        const { data } = await api.post("/compiler/run", {
          language,
          source_code: sourceCode,
          stdin: sample.input || "",
          custom_input: true,
        });
        const actualOutput = String(data.stdout ?? "").trim();
        const expectedOutput = String(sample.output ?? "").trim();
        results.push({
          id: index + 1,
          input: sample.input || "",
          expectedOutput,
          actualOutput,
          passed: !data.stderr && actualOutput === expectedOutput,
          runtimeMs: data.execution_time,
        });
        setStdout(data.stdout || "");
        setStderr(data.stderr || "");
        setRuntime(data.execution_time ?? null);
        setMemory(data.memory_used ?? null);
      }
      setTestCases(results);
    } catch (runError: unknown) {
      setError(apiErrorDetail(runError) || "Sample execution failed.");
    } finally {
      setRunning(false);
    }
  };

  const finishBattle = async () => {
    if (finishing || !allQuestionsSubmitted) return;
    setFinishing(true);
    setError(null);
    setNotice(null);
    try {
      await api.post(`/battle/${encodeURIComponent(id)}/finish`);
      await onRefresh();
      void useDashboardStore.getState().refresh();
    } catch (finishError: unknown) {
      const detail = apiErrorDetail(finishError);
      setNotice(
        detail || "Your submissions are saved. Waiting for the other participants to finish.",
      );
    } finally {
      setFinishing(false);
    }
  };

  if (battle.status === "completed" || battle.status === "finished" || battle.status === "finalized") {
    return (
      <div role="status" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
        Battle results are saved. View your individual score and reward in <Link className="underline" href="/battle/history">battle history</Link>.
      </div>
    );
  }

  if (battle.status !== "running") {
    return (
      <div role="status" className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] p-4 text-sm text-[var(--text-secondary)]">
        {battle.status === "ready" ? "The host can start the battle now." : "Gameplay will appear when the host starts the battle."}
      </div>
    );
  }

  if (!section || !assignedQuestions.length) {
    return <p role="alert" className="text-sm text-rose-300">This battle has no assigned questions for its selected type.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <span className="font-semibold capitalize">{section.question_type} · {assignedQuestions.length} assigned</span>
        <span className={connected ? "inline-flex items-center gap-1 text-emerald-300" : "inline-flex items-center gap-1 text-amber-300"}>
          {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {connected ? "Live sync" : "Refreshing room"}
        </span>
      </div>

      {currentQuestion ? (
        <article className="space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] p-4">
          <div>
            <h3 className="font-bold text-[var(--text-primary)]">{currentQuestion.title}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">{currentQuestion.description}</p>
            {currentQuestion.constraints && (
              <p className="mt-3 whitespace-pre-wrap text-xs text-[var(--text-muted)]">{currentQuestion.constraints}</p>
            )}
          </div>

          {section.question_type === "mcq" ? (
            <fieldset className="space-y-2">
              <legend className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">Select one answer</legend>
              {(currentQuestion.options ?? []).map((option, index) => {
                const normalized = optionData(option, index);
                return (
                  <label key={`${currentQuestion.id}-${normalized.key}`} className="flex cursor-pointer items-start gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-3 text-sm text-[var(--text-primary)]">
                    <input
                      type="radio"
                      name={`battle-question-${currentQuestion.id}`}
                      value={normalized.key}
                      checked={selectedOption === normalized.key}
                      onChange={() => setSelectedOption(normalized.key)}
                    />
                    <span>{normalized.label}</span>
                  </label>
                );
              })}
            </fieldset>
          ) : section.question_type === "coding" ? (
            <>
              {examples.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Public sample cases</h4>
                  {examples.map((example, index) => (
                    <pre key={index} className="overflow-x-auto rounded-lg bg-black/40 p-3 text-xs text-[var(--text-secondary)]">
                      Input: {example.input ?? ""}{"\n"}Output: {example.output ?? ""}
                    </pre>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {["python", "javascript", "cpp"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    aria-pressed={language === item}
                    onClick={() => {
                      setLanguage(item);
                      setSourceCode(STARTER_CODE[item]);
                    }}
                    className={`min-h-9 rounded-lg border px-3 text-xs font-semibold capitalize ${language === item ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent-strong)]" : "border-[var(--border-default)] text-[var(--text-secondary)]"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="h-[min(50svh,420px)] min-h-[280px]">
                <AssessmentCodeEditor
                  value={sourceCode}
                  onChange={setSourceCode}
                  language={language}
                  onLanguageChange={(value) => {
                    if (STARTER_CODE[value]) {
                      setLanguage(value);
                      setSourceCode(STARTER_CODE[value]);
                    }
                  }}
                  availableLanguages={Object.keys(STARTER_CODE)}
                  draftKey={`battle_${id}_${currentQuestion.id}`}
                  onReset={() => setSourceCode(STARTER_CODE[language])}
                />
              </div>
              <AssessmentConsole
                testCases={testCases}
                customInput=""
                onCustomInputChange={() => undefined}
                stdout={stdout}
                stderr={stderr}
                status={running ? "running" : verdict ?? "idle"}
                runtimeMs={runtime}
                memoryMb={memory}
              />
            </>
          ) : (
            <p role="alert" className="text-sm text-rose-300">The assigned question type cannot be played in this arena.</p>
          )}

          {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
          {notice && <p role="status" className="text-xs text-amber-200">{notice}</p>}
          <div className="flex flex-wrap gap-2">
            {section.question_type === "coding" && (
              <button type="button" onClick={runSamples} disabled={running || submitting} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--border-default)] px-4 text-xs font-semibold text-[var(--text-primary)] disabled:opacity-50">
                <Play className="h-3.5 w-3.5" /> {running ? "Running samples…" : "Run public samples"}
              </button>
            )}
            <button
              type="button"
              onClick={submitAnswer}
              disabled={submitting || running || (section.question_type === "mcq" && !selectedOption)}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--accent)] px-4 text-xs font-bold text-black disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" /> {submitting ? "Judging…" : "Submit to Battle"}
            </button>
          </div>
        </article>
      ) : (
        <div className="space-y-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] p-4">
          <p className="text-sm text-[var(--text-secondary)]">All your assigned questions are submitted.</p>
          {notice && <p role="status" className="text-xs text-amber-200">{notice}</p>}
          {error && <p role="alert" className="text-xs text-rose-300">{error}</p>}
          <button type="button" onClick={finishBattle} disabled={finishing} className="min-h-10 rounded-lg bg-[var(--accent)] px-4 text-xs font-bold text-black disabled:opacity-50">
            {finishing ? "Finalizing…" : "Finalize Results"}
          </button>
        </div>
      )}
      {verdict && (
        <p role="status" className="text-sm font-semibold text-[var(--accent-strong)]">
          Last verdict: {verdict}{score === null ? "" : ` · ${score} points`}
        </p>
      )}
    </div>
  );
}

function apiErrorDetail(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("response" in error)) return null;
  const response = (error as { response?: { data?: { detail?: unknown } } }).response;
  return typeof response?.data?.detail === "string" ? response.data.detail : null;
}

function apiErrorStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null || !("response" in error)) return null;
  const status = (error as { response?: { status?: unknown } }).response?.status;
  return typeof status === "number" ? status : null;
}
