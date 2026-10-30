import React from "react";

interface TopicBadgeProps {
  label: string;
  variant?: "practice" | "battle" | "neutral";
  className?: string;
  size?: "sm" | "md";
}

export function TopicBadge({ label, variant = "neutral", className = "", size = "md" }: TopicBadgeProps) {
  const variantStyles = {
    practice: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:border-indigo-500/40",
    battle: "bg-purple-500/10 text-purple-300 border-purple-500/20 hover:border-purple-500/40",
    neutral: "bg-white/5 text-slate-300 border-white/10 hover:border-white/20",
  }[variant];

  const sizeStyles = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-medium";

  return (
    <span
      className={`inline-flex items-center rounded-md border transition-colors ${variantStyles} ${sizeStyles} ${className}`}
    >
      #{label}
    </span>
  );
}

export default TopicBadge;
