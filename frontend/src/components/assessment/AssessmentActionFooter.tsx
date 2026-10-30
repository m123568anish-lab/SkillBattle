"use client";

import React from "react";
import { Play, Send, ChevronLeft, ChevronRight, LayoutGrid, Loader2 } from "lucide-react";

export interface AssessmentActionFooterProps {
  onRunTests?: () => void;
  onSubmit: () => void;
  isRunningTests?: boolean;
  isSubmitting?: boolean;
  canRunTests?: boolean;
  canSubmit?: boolean;
  submitLabel?: string;
  runLabel?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onOpenPalette?: () => void;
  answeredRatioText?: string;
  className?: string;
}

export function AssessmentActionFooter({
  onRunTests,
  onSubmit,
  isRunningTests = false,
  isSubmitting = false,
  canRunTests = true,
  canSubmit = true,
  submitLabel = "Submit",
  runLabel = "Run Tests",
  onPrevious,
  onNext,
  hasPrevious = false,
  hasNext = false,
  onOpenPalette,
  answeredRatioText,
  className = "",
}: AssessmentActionFooterProps) {
  return (
    <div
      className={`sticky bottom-0 z-40 w-full border-t border-white/[0.08] bg-[#0B0F17]/95 px-3 py-2.5 sm:px-5 backdrop-blur-xl pb-[calc(0.625rem+env(safe-area-inset-bottom))] ${className}`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2">
        {/* Left: Previous / Question Palette */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {onPrevious && (
            <button
              type="button"
              onClick={onPrevious}
              disabled={!hasPrevious || isSubmitting}
              className="flex h-10 items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>
          )}

          {onOpenPalette && (
            <button
              type="button"
              onClick={onOpenPalette}
              className="flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-[#141C2E] px-3 text-xs font-medium text-slate-200 transition hover:border-cyan-500/40 hover:text-cyan-300"
            >
              <LayoutGrid className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Questions</span>
              {answeredRatioText && (
                <span className="rounded-full bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300">
                  {answeredRatioText}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Right: Run Tests & Submit Action Buttons */}
        <div className="flex items-center gap-2">
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              disabled={!hasNext || isSubmitting}
              className="hidden sm:flex h-10 items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {onRunTests && (
            <button
              type="button"
              onClick={onRunTests}
              disabled={!canRunTests || isRunningTests || isSubmitting}
              className="flex h-10 min-w-[90px] sm:min-w-[110px] items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10 hover:border-white/25 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
              {isRunningTests ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 text-cyan-400 fill-cyan-400" />
                  <span>{runLabel}</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onSubmit}
            disabled={!canSubmit || isSubmitting || isRunningTests}
            className="flex h-10 min-w-[95px] sm:min-w-[120px] items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 text-xs font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.25)] transition hover:from-cyan-400 hover:to-blue-500 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                <span>{submitLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
