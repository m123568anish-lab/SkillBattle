"use client";

import { useMemo } from "react";
import { Check, X } from "lucide-react";

interface Props {
  password: string;
}

export default function PasswordStrength({ password }: Props) {
  const analysis = useMemo(() => {
    const checks = [
      { label: "At least 8 characters", met: password.length >= 8 },
      { label: "Uppercase letter", met: /[A-Z]/.test(password) },
      { label: "Number", met: /[0-9]/.test(password) },
      { label: "Special symbol", met: /[^A-Za-z0-9]/.test(password) },
    ];
    const score = checks.filter((c) => c.met).length;

    let tierLabel = "Too short";
    let tierColor = "bg-rose-500";
    let textColor = "text-rose-400";

    if (score === 1) {
      tierLabel = "Weak";
      tierColor = "bg-rose-500";
      textColor = "text-rose-400";
    } else if (score === 2) {
      tierLabel = "Fair";
      tierColor = "bg-amber-500";
      textColor = "text-amber-400";
    } else if (score === 3) {
      tierLabel = "Good";
      tierColor = "bg-lime-400";
      textColor = "text-lime-400";
    } else if (score === 4) {
      tierLabel = "Strong";
      tierColor = "bg-[var(--accent,#D8FF3E)]";
      textColor = "text-[var(--accent-strong,#D8FF3E)]";
    }

    return { checks, score, tierLabel, tierColor, textColor };
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2.5 rounded-xl border border-[var(--border-default,#202022)] bg-[var(--surface-elevated,#0D0D0D)] p-3">
      {/* 4 Segment Progress Bars */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-[var(--text-secondary,#999999)]">Password Security</span>
        <span className={`font-bold ${analysis.textColor}`} aria-live="polite">
          {analysis.tierLabel}
        </span>
      </div>

      <div className="flex gap-1.5" role="progressbar" aria-valuenow={analysis.score * 25} aria-valuemin={0} aria-valuemax={100}>
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-all duration-200 ${
              index < analysis.score ? analysis.tierColor : "bg-[var(--surface-input,#202024)]"
            }`}
          />
        ))}
      </div>

      {/* Micro Checklist */}
      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
        {analysis.checks.map(({ label, met }) => (
          <div
            key={label}
            className={`flex items-center gap-1.5 transition-colors ${
              met ? "text-[var(--text-primary,#F5F5F5)]" : "text-[var(--text-muted,#666666)]"
            }`}
          >
            {met ? (
              <Check size={11} className="shrink-0 text-[var(--accent,#D8FF3E)]" />
            ) : (
              <X size={11} className="shrink-0 text-[var(--text-muted,#666666)]" />
            )}
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
