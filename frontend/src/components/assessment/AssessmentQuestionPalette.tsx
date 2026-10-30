"use client";

import React, { useState } from "react";
import { Check, Flag, LayoutGrid, X } from "lucide-react";

export type QuestionStatus = "unanswered" | "answered" | "flagged" | "solved";

export interface QuestionPaletteItem {
  id: string | number;
  number: number;
  status: QuestionStatus;
  isFlagged?: boolean;
}

export interface AssessmentQuestionPaletteProps {
  items: QuestionPaletteItem[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  className?: string;
}

export function AssessmentQuestionPalette({
  items,
  currentIndex,
  onSelectIndex,
  isOpen,
  onClose,
  title = "Question Palette",
  className = "",
}: AssessmentQuestionPaletteProps) {
  const [filter, setFilter] = useState<"all" | "answered" | "unanswered" | "flagged">("all");

  if (!isOpen) return null;

  const answeredCount = items.filter((i) => i.status === "answered" || i.status === "solved").length;
  const flaggedCount = items.filter((i) => i.isFlagged || i.status === "flagged").length;
  const unansweredCount = items.length - answeredCount;

  const filteredItems = items.filter((item) => {
    if (filter === "answered") return item.status === "answered" || item.status === "solved";
    if (filter === "flagged") return item.isFlagged || item.status === "flagged";
    if (filter === "unanswered") return item.status !== "answered" && item.status !== "solved";
    return true;
  });

  return (
    <aside
      className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-xs sm:max-w-sm flex-col border-l border-white/[0.08] bg-[#0E1524] shadow-2xl backdrop-blur-xl ${className}`}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-white/[0.08] px-4">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-mono text-slate-300">
            {items.length}
          </span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Progress Breakdown Pills */}
      <div className="flex items-center gap-1.5 border-b border-white/[0.06] bg-[#0B0F17] p-2 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${
            filter === "all" ? "bg-white/15 text-white" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          All <span className="text-[10px] opacity-70">({items.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("answered")}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${
            filter === "answered" ? "bg-emerald-500/20 text-emerald-300" : "text-slate-400 hover:text-emerald-400"
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Answered <span className="text-[10px] opacity-70">({answeredCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter("unanswered")}
          className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${
            filter === "unanswered" ? "bg-slate-700/50 text-slate-200" : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <span className="h-2 w-2 rounded-full border border-slate-400" />
          Unanswered <span className="text-[10px] opacity-70">({unansweredCount})</span>
        </button>

        {flaggedCount > 0 && (
          <button
            type="button"
            onClick={() => setFilter("flagged")}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-medium transition ${
              filter === "flagged" ? "bg-amber-500/20 text-amber-300" : "text-slate-400 hover:text-amber-400"
            }`}
          >
            <Flag className="h-3 w-3 text-amber-400" />
            Flagged <span className="text-[10px] opacity-70">({flaggedCount})</span>
          </button>
        )}
      </div>

      {/* Grid of Question Items */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/10">
        <div className="grid grid-cols-5 gap-2.5 sm:grid-cols-5">
          {filteredItems.map((item, idx) => {
            const isCurrent = items.indexOf(item) === currentIndex;
            const isAnswered = item.status === "answered" || item.status === "solved";
            const isFlagged = item.isFlagged || item.status === "flagged";

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectIndex(items.indexOf(item));
                  if (onClose && window.innerWidth < 768) onClose();
                }}
                className={`relative flex h-11 w-11 items-center justify-center rounded-xl border text-xs font-mono font-bold transition-all ${
                  isCurrent
                    ? "border-cyan-400 bg-cyan-500/20 text-cyan-200 ring-2 ring-cyan-400/50 scale-105 z-10"
                    : isAnswered
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:border-emerald-400"
                    : "border-white/10 bg-[#141B2B] text-slate-400 hover:border-white/20 hover:text-white hover:bg-[#1E293B]"
                }`}
              >
                {item.number}

                {/* Answered check mark dot */}
                {isAnswered && !isCurrent && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[8px] text-slate-950 font-black">
                    <Check className="h-2 w-2 stroke-[3]" />
                  </span>
                )}

                {/* Flagged icon */}
                {isFlagged && (
                  <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] text-slate-950">
                    <Flag className="h-2 w-2 fill-slate-950" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend Footer */}
      <div className="border-t border-white/[0.08] bg-[#0A0D14] p-3 text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span>Flagged</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full border border-slate-500" />
            <span>Pending</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
