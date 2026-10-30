import React from "react";
import { Zap, Flame } from "lucide-react";

interface ScoreDisplayProps {
  score: number;
  streak?: number;
  multiplier?: number;
  className?: string;
}

export function ScoreDisplay({ score, streak = 0, multiplier = 1, className = "" }: ScoreDisplayProps) {
  return (
    <div className={`flex items-center gap-2 sm:gap-3 ${className}`}>
      <div className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-950/30 px-3 py-1.5 backdrop-blur-sm">
        <Zap className="h-4 w-4 text-purple-400 fill-purple-400/30" />
        <span className="text-xs uppercase tracking-wider text-purple-300 font-medium">Score</span>
        <span className="font-mono text-base font-extrabold text-white">{score}</span>
      </div>

      {streak > 1 && (
        <div className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-950/30 px-2.5 py-1.5 text-xs font-bold text-amber-300">
          <Flame className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
          <span>{streak}x Streak</span>
        </div>
      )}

      {multiplier > 1 && (
        <span className="rounded bg-gradient-to-r from-cyan-500 to-purple-500 px-1.5 py-0.5 text-xs font-black text-white">
          {multiplier}x
        </span>
      )}
    </div>
  );
}

export default ScoreDisplay;
