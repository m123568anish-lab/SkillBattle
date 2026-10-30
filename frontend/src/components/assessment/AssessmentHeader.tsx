"use client";

import React from "react";
import { ArrowLeft, Clock, Maximize2, Minimize2, PanelLeftClose, PanelLeftOpen, ShieldAlert } from "lucide-react";

export interface AssessmentHeaderProps {
  title: string;
  category?: string;
  difficulty?: "easy" | "medium" | "hard" | string;
  timeRemainingSeconds?: number | null;
  currentIndex?: number;
  totalQuestions?: number;
  onExit?: () => void;
  isCollapsiblePanelOpen?: boolean;
  onToggleCollapsiblePanel?: () => void;
  panelToggleLabel?: string;
  className?: string;
}

export function AssessmentHeader({
  title,
  category,
  difficulty = "medium",
  timeRemainingSeconds,
  currentIndex,
  totalQuestions,
  onExit,
  isCollapsiblePanelOpen,
  onToggleCollapsiblePanel,
  panelToggleLabel = "Problem Details",
  className = "",
}: AssessmentHeaderProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const diffLower = (difficulty || "medium").toLowerCase();
  const difficultyBadge =
    diffLower === "easy"
      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
      : diffLower === "hard"
      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
      : "bg-amber-500/10 text-amber-400 border-amber-500/20";

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isTimeCritical = timeRemainingSeconds !== null && timeRemainingSeconds !== undefined && timeRemainingSeconds < 120;

  return (
    <header
      className={`sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-white/[0.08] bg-[#0B0F17]/95 px-3 md:px-5 backdrop-blur-md ${className}`}
    >
      {/* Left: Back & Question Meta */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {onExit && (
          <button
            type="button"
            onClick={onExit}
            aria-label="Exit assessment"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xs md:text-sm font-semibold text-slate-100 max-w-[180px] sm:max-w-xs md:max-w-md">
              {title}
            </h1>
            <span
              className={`hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${difficultyBadge}`}
            >
              {difficulty}
            </span>
            {category && (
              <span className="hidden md:inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-400">
                {category}
              </span>
            )}
          </div>

          {currentIndex !== undefined && totalQuestions !== undefined && totalQuestions > 1 && (
            <div className="text-[10px] text-slate-400">
              Question <span className="font-semibold text-slate-200">{currentIndex + 1}</span> of{" "}
              <span className="font-semibold text-slate-200">{totalQuestions}</span>
            </div>
          )}
        </div>
      </div>

      {/* Center: Mobile Collapsible Panel Toggle */}
      {onToggleCollapsiblePanel && (
        <div className="flex items-center lg:hidden">
          <button
            type="button"
            onClick={onToggleCollapsiblePanel}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            {isCollapsiblePanelOpen ? (
              <>
                <PanelLeftClose className="h-3.5 w-3.5 text-cyan-400" />
                <span className="hidden xs:inline">Hide</span>
              </>
            ) : (
              <>
                <PanelLeftOpen className="h-3.5 w-3.5 text-cyan-400" />
                <span className="hidden xs:inline">{panelToggleLabel}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Right: Timer & Tools */}
      <div className="flex items-center gap-2 md:gap-3">
        {timeRemainingSeconds !== null && timeRemainingSeconds !== undefined && (
          <div
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-mono font-bold transition-colors ${
              isTimeCritical
                ? "border-rose-500/40 bg-rose-500/15 text-rose-300 animate-pulse"
                : "border-white/10 bg-white/5 text-slate-200"
            }`}
          >
            {isTimeCritical ? (
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
            )}
            <span>{formatTimer(Math.max(0, timeRemainingSeconds))}</span>
          </div>
        )}

        <button
          type="button"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>
    </header>
  );
}
