import React from "react";

export type DifficultyLevel = "Easy" | "Medium" | "Hard" | "Expert" | string;

interface DifficultyBadgeProps {
  difficulty: DifficultyLevel;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function DifficultyBadge({ difficulty, className = "", size = "md" }: DifficultyBadgeProps) {
  const diff = (difficulty || "Medium").toLowerCase();

  const styles = {
    easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    hard: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    expert: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  }[diff] || "bg-slate-500/10 text-slate-400 border-slate-500/20";

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs font-medium",
    lg: "px-3 py-1.5 text-sm font-semibold",
  }[size];

  const formatted = difficulty ? difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase() : "Medium";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase font-mono ${styles} ${sizeStyles} ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          diff === "easy"
            ? "bg-emerald-400"
            : diff === "medium"
            ? "bg-amber-400"
            : diff === "hard"
            ? "bg-rose-400"
            : "bg-purple-400"
        }`}
      />
      {formatted}
    </span>
  );
}

export default DifficultyBadge;
