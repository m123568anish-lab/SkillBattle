"use client";

interface Props {
  step: number;
  total: number;
}

export default function ProgressStepper({
  step,
  total,
}: Props) {
  const percent = ((step + 1) / total) * 100;

  return (
    <div className="mb-8 sm:mb-10">
      <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        <span>
          Step {step + 1} of {total}
        </span>
        <span className="font-mono text-[var(--accent-strong)]">
          {Math.round(percent)}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-elevated)] border border-[var(--border-subtle)]">
        <div
          style={{
            width: `${percent}%`,
          }}
          className="h-full rounded-full bg-[var(--accent)] shadow-[0_0_12px_var(--accent)] transition-all duration-500 ease-out"
        />
      </div>
    </div>
  );
}
