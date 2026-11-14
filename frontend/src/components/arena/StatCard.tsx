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
    practice: { accent: "var(--status-info)" },
    battle: { accent: "var(--accent-strong)" },
    emerald: { accent: "var(--status-success)" },
    amber: { accent: "var(--status-warning)" },
    neutral: { accent: "var(--text-secondary)" },
  }[variant];

  return (
    <div
      className={`q-panel relative overflow-hidden p-4 transition-all duration-200 hover:-translate-y-0.5 sm:p-5 ${className}`}
      style={{ borderTopColor: variantStyles.accent }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">{label}</p>
        <div className="rounded-[10px] border border-[var(--border-default)] bg-[var(--surface-elevated)] p-2.5" style={{ color: variantStyles.accent }}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
      <div className="mt-3">
        <div className="mt-1 font-mono text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">{value}</div>
        {subtext && <p className="mt-1 text-xs leading-snug text-[var(--text-muted)]">{subtext}</p>}
      </div>
    </div>
  );
}

export default StatCard;
