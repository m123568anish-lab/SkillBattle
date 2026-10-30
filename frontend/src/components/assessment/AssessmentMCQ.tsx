"use client";

import React, { useEffect } from "react";
import { CheckCircle2, Flag, HelpCircle } from "lucide-react";

export interface MCQOption {
  key: string;
  text: string;
}

export interface AssessmentMCQProps {
  questionId: number | string;
  questionText: string;
  options: MCQOption[];
  selectedKey: string | null;
  onSelectOption: (key: string) => void;
  isFlagged?: boolean;
  onToggleFlag?: () => void;
  explanation?: string | null;
  showExplanation?: boolean;
  readOnly?: boolean;
  className?: string;
}

export function AssessmentMCQ({
  questionText,
  options,
  selectedKey,
  onSelectOption,
  isFlagged = false,
  onToggleFlag,
  explanation,
  showExplanation = false,
  readOnly = false,
  className = "",
}: AssessmentMCQProps) {
  // Listen for keyboard shortcuts: 1-4 or a-d
  useEffect(() => {
    if (readOnly) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      const key = e.key.toUpperCase();
      // Handle 1, 2, 3, 4
      if (["1", "2", "3", "4"].includes(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        if (options[index]) {
          onSelectOption(options[index].key);
        }
      }
      // Handle A, B, C, D
      const matching = options.find((opt) => opt.key.toUpperCase() === key);
      if (matching) {
        onSelectOption(matching.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options, onSelectOption, readOnly]);

  return (
    <div className={`flex flex-col space-y-6 ${className}`}>
      {/* Question Stem and Flag */}
      <div className="rounded-xl border border-white/[0.08] bg-[#0E1524]/90 p-5 md:p-6 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div className="prose prose-invert max-w-none text-sm md:text-base leading-relaxed text-slate-100 font-medium">
            {questionText}
          </div>

          {onToggleFlag && (
            <button
              type="button"
              onClick={onToggleFlag}
              title={isFlagged ? "Remove review flag" : "Flag for review"}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                isFlagged
                  ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                  : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Flag className={`h-3.5 w-3.5 ${isFlagged ? "fill-amber-400 text-amber-400" : ""}`} />
              <span className="hidden sm:inline">{isFlagged ? "Flagged" : "Flag"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Options List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Choose one answer:</span>
          <span className="hidden sm:inline text-[11px] text-slate-500 font-mono">
            Keyboard: [1-4] or [A-D]
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {options.map((option, idx) => {
            const isSelected = selectedKey?.toUpperCase() === option.key.toUpperCase();
            const optionNumber = idx + 1;

            return (
              <button
                key={option.key}
                type="button"
                onClick={() => !readOnly && onSelectOption(option.key)}
                disabled={readOnly}
                className={`group relative flex w-full items-center gap-3.5 rounded-xl border p-4 text-left transition-all ${
                  isSelected
                    ? "border-cyan-500/80 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/50"
                    : "border-white/[0.08] bg-[#0E1524]/60 hover:border-white/20 hover:bg-[#141C2E]"
                }`}
              >
                {/* Key Badge */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-all ${
                    isSelected
                      ? "border-cyan-400 bg-cyan-500 text-slate-950 font-black shadow-md"
                      : "border-white/10 bg-white/5 text-slate-300 group-hover:border-cyan-500/40 group-hover:text-cyan-300"
                  }`}
                >
                  {option.key.toUpperCase()}
                </div>

                {/* Text Content */}
                <span
                  className={`flex-1 text-sm md:text-base leading-snug transition-colors ${
                    isSelected ? "text-cyan-100 font-semibold" : "text-slate-200 group-hover:text-white"
                  }`}
                >
                  {option.text}
                </span>

                {/* Indicator */}
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-block text-[10px] font-mono text-slate-600">
                    [{optionNumber}]
                  </span>
                  {isSelected && <CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation Block (for Practice review) */}
      {showExplanation && explanation && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 md:p-5 text-slate-200">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
            <HelpCircle className="h-4 w-4" /> Explanation & Key Insight
          </div>
          <p className="text-sm leading-relaxed text-slate-300">{explanation}</p>
        </div>
      )}
    </div>
  );
}
