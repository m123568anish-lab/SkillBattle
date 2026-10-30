"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, Terminal, Cpu, Clock, ChevronDown, ChevronUp, FileCode } from "lucide-react";

export interface TestCaseResult {
  id?: number;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  passed?: boolean;
  error?: string | null;
  runtimeMs?: number;
}

export interface AssessmentConsoleProps {
  testCases?: TestCaseResult[];
  customInput: string;
  onCustomInputChange: (val: string) => void;
  stdout?: string | null;
  stderr?: string | null;
  status?: "idle" | "running" | "accepted" | "wrong_answer" | "runtime_error" | "time_limit_exceeded" | string;
  runtimeMs?: number | null;
  memoryMb?: number | null;
  className?: string;
  defaultExpanded?: boolean;
}

export function AssessmentConsole({
  testCases = [],
  customInput,
  onCustomInputChange,
  stdout,
  stderr,
  status = "idle",
  runtimeMs,
  memoryMb,
  className = "",
  defaultExpanded = true,
}: AssessmentConsoleProps) {
  const [activeTab, setActiveTab] = useState<"results" | "custom_input" | "terminal">("results");
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [selectedCaseIdx, setSelectedCaseIdx] = useState(0);

  const passedCount = testCases.filter((tc) => tc.passed).length;
  const totalCount = testCases.length;

  const statusBadge = () => {
    switch (status) {
      case "accepted":
        return <span className="flex items-center gap-1 text-xs font-bold text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> All Tests Passed</span>;
      case "wrong_answer":
        return <span className="flex items-center gap-1 text-xs font-bold text-rose-400"><XCircle className="h-3.5 w-3.5" /> Tests Failed</span>;
      case "runtime_error":
        return <span className="flex items-center gap-1 text-xs font-bold text-amber-400">Runtime Error</span>;
      case "time_limit_exceeded":
        return <span className="flex items-center gap-1 text-xs font-bold text-amber-400">Time Limit Exceeded</span>;
      case "running":
        return <span className="text-xs font-bold text-cyan-400 animate-pulse">Executing code...</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col rounded-xl border border-white/[0.08] bg-[#0E1524] overflow-hidden ${className}`}>
      {/* Console Tab Header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#0A0E18] px-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab("results");
              setIsExpanded(true);
            }}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              activeTab === "results"
                ? "bg-white/10 text-cyan-300"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
            <span>Test Results</span>
            {totalCount > 0 && (
              <span className={`text-[10px] font-mono px-1.5 rounded-full ${passedCount === totalCount ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-slate-300"}`}>
                {passedCount}/{totalCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("custom_input");
              setIsExpanded(true);
            }}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              activeTab === "custom_input"
                ? "bg-white/10 text-cyan-300"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileCode className="h-3.5 w-3.5 text-cyan-400" />
            <span>Custom Input</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("terminal");
              setIsExpanded(true);
            }}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
              activeTab === "terminal"
                ? "bg-white/10 text-cyan-300"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Terminal className="h-3.5 w-3.5 text-cyan-400" />
            <span>Terminal</span>
          </button>
        </div>

        {/* Right: Metrics & Collapse */}
        <div className="flex items-center gap-3">
          {statusBadge()}

          {runtimeMs !== null && runtimeMs !== undefined && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400">
              <Clock className="h-3 w-3 text-cyan-400" />
              <span>{runtimeMs}ms</span>
            </div>
          )}

          {memoryMb !== null && memoryMb !== undefined && (
            <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-slate-400">
              <Cpu className="h-3 w-3 text-cyan-400" />
              <span>{memoryMb.toFixed(1)}MB</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-slate-400 hover:text-white transition"
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Console Body */}
      {isExpanded && (
        <div className="max-h-64 min-h-[140px] overflow-y-auto p-3.5 font-mono text-xs scrollbar-thin scrollbar-thumb-white/10 bg-[#0B0F17]">
          {/* Tab 1: Test Results */}
          {activeTab === "results" && (
            <div>
              {testCases.length === 0 ? (
                <div className="flex h-24 items-center justify-center text-slate-500">
                  Run tests to view output and assertions.
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Test case selector pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {testCases.map((tc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedCaseIdx(idx)}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                          selectedCaseIdx === idx
                            ? "border-cyan-500 bg-cyan-500/15 text-cyan-300"
                            : tc.passed
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border-rose-500/30 bg-rose-500/10 text-rose-400"
                        }`}
                      >
                        {tc.passed ? (
                          <CheckCircle2 className="h-3 w-3" />
                        ) : (
                          <XCircle className="h-3 w-3" />
                        )}
                        <span>Case {idx + 1}</span>
                      </button>
                    ))}
                  </div>

                  {/* Selected Case Detail */}
                  {testCases[selectedCaseIdx] && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-white/5 bg-[#121927] p-2.5">
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Standard Input</div>
                        <pre className="text-slate-200 whitespace-pre-wrap">{testCases[selectedCaseIdx].input || "(empty)"}</pre>
                      </div>

                      <div className="rounded-lg border border-white/5 bg-[#121927] p-2.5">
                        <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Expected Output</div>
                        <pre className="text-emerald-300 whitespace-pre-wrap">{testCases[selectedCaseIdx].expectedOutput}</pre>
                      </div>

                      {testCases[selectedCaseIdx].actualOutput !== undefined && (
                        <div className="sm:col-span-2 rounded-lg border border-white/5 bg-[#121927] p-2.5">
                          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Actual Output</div>
                          <pre className={`whitespace-pre-wrap ${testCases[selectedCaseIdx].passed ? "text-emerald-300" : "text-rose-300"}`}>
                            {testCases[selectedCaseIdx].actualOutput || "(no output returned)"}
                          </pre>
                        </div>
                      )}

                      {testCases[selectedCaseIdx].error && (
                        <div className="sm:col-span-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-2.5 text-rose-300">
                          <div className="text-[10px] uppercase font-bold text-rose-400 mb-1">Error Trace</div>
                          <pre className="whitespace-pre-wrap">{testCases[selectedCaseIdx].error}</pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Custom Input */}
          {activeTab === "custom_input" && (
            <div className="flex flex-col space-y-2">
              <label className="text-[11px] text-slate-400">
                Provide custom standard input (stdin) for execution:
              </label>
              <textarea
                value={customInput}
                onChange={(e) => onCustomInputChange(e.target.value)}
                placeholder="Enter input parameters here..."
                rows={4}
                className="w-full rounded-lg border border-white/10 bg-[#121927] p-2.5 font-mono text-xs text-slate-200 outline-none focus:border-cyan-500 resize-none"
              />
            </div>
          )}

          {/* Tab 3: Terminal / Logs */}
          {activeTab === "terminal" && (
            <div className="space-y-2">
              {stdout ? (
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">stdout:</div>
                  <pre className="text-slate-300 whitespace-pre-wrap bg-[#121927] p-2 rounded-lg">{stdout}</pre>
                </div>
              ) : null}

              {stderr ? (
                <div>
                  <div className="text-[10px] uppercase font-bold text-rose-500 mb-1">stderr:</div>
                  <pre className="text-rose-300 whitespace-pre-wrap bg-rose-950/20 p-2 rounded-lg border border-rose-500/20">{stderr}</pre>
                </div>
              ) : null}

              {!stdout && !stderr && (
                <div className="text-slate-500 flex h-20 items-center justify-center">
                  No terminal output recorded for this run.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
