import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  variant?: "practice" | "battle" | "neutral" | "emerald" | "amber";
  className?: string;
}

export function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  variant = "neutral",
  className = "",
}: StatCardProps) {
  const variantStyles = {
    practice: {
      card: "border-indigo-500/20 bg-indigo-950/20 hover:border-indigo-500/40",
      iconBg: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
    },
    battle: {
      card: "border-purple-500/20 bg-purple-950/20 hover:border-purple-500/40",
      iconBg: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    },
    emerald: {
      card: "border-emerald-500/20 bg-emerald-950/20 hover:border-emerald-500/40",
      iconBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    },
    amber: {
      card: "border-amber-500/20 bg-amber-950/20 hover:border-amber-500/40",
      iconBg: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    },
    neutral: {
      card: "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.16]",
      iconBg: "bg-white/[0.06] text-slate-300 border border-white/[0.1]",
    },
  }[variant];

  return (
    <div
      className={`relative overflow-hidden rounded-xl border p-4 sm:p-5 transition-all duration-200 backdrop-blur-sm ${variantStyles.card} ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs sm:text-sm font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <div className={`rounded-lg p-2.5 ${variantStyles.iconBg}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono">{value}</div>
        {subtext && <p className="mt-1 text-xs text-slate-400 leading-snug">{subtext}</p>}
      </div>
    </div>
  );
}

export default StatCard;
