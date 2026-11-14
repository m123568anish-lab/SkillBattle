"use client";

interface Props {
  step: number;
  total: number;
}

export default function ProgressStepper({
  step,
  total,
}: Props) {
  const safeTotal = Math.max(1, total);
  const currentStep = Math.min(safeTotal, Math.max(1, step + 1));
  const percent = (currentStep / safeTotal) * 100;
  const currentLabel = [
    "Welcome",
    "Languages",
    "Companies",
    "Skill profile",
    "Learning goals",
    "Roadmap",
    "Preview",
  ][step] ?? "Setup";

  return (
    <div className="mb-7 sm:mb-8">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Personalization
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{currentLabel}</p>
        </div>
        <p className="shrink-0 text-xs font-medium text-[var(--text-muted)]">
          <span className="font-mono tabular-nums text-[var(--text-primary)]">{currentStep}</span>
          {" / "}
          {safeTotal}
        </p>
      </div>

      <div
        className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-hover)]"
        role="progressbar"
        aria-label="Onboarding progress"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={safeTotal}
      >
        <div
          style={{ width: `${percent}%` }}
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300 ease-out motion-reduce:transition-none"
        />
      </div>
    </div>
  );
}
