"use client";

import GradientButton from "@/components/ui/gradient-button";
import GoalCard from "./GoalCard";

import { goals } from "@/data/goals";

interface Props {
  selected: string[];

  dailyHours: number;

  onChange: (
    goals: string[],
    dailyHours: number
  ) => void;

  onNext: () => void;

  onBack: () => void;
}

export default function GoalStep({
  selected,
  dailyHours,
  onChange,
  onNext,
  onBack,
}: Props) {
  function toggle(goal: string) {
    if (selected.includes(goal)) {
      onChange(
        selected.filter((g) => g !== goal),
        dailyHours
      );
    } else {
      onChange(
        [...selected, goal],
        dailyHours
      );
    }
  }

  const weeks = Math.max(
    2,
    Math.round(20 / dailyHours)
  );

  return (
    <div>

      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
        Learning Goals
      </h1>

      <p className="mt-3 text-sm sm:text-base text-[var(--text-secondary)]">
        Choose your focus areas to tailor your study program.
      </p>

      <div className="mt-8 grid gap-4 sm:gap-5 md:grid-cols-2">

        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            title={goal.title}
            description={goal.description}
            recommended={goal.recommended}
            selected={selected.includes(
              goal.title
            )}
            onClick={() =>
              toggle(goal.title)
            }
          />
        ))}

      </div>

      {/* Daily Hours */}
      <div className="mt-8 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
        <label className="text-sm font-semibold text-[var(--text-primary)]">
          Daily Study Hours
        </label>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {dailyHours} {dailyHours === 1 ? "Hour" : "Hours"} / Day
        </p>
        <input
          type="range"
          min={1}
          max={10}
          value={dailyHours}
          onChange={(e) =>
            onChange(
              selected,
              Number(e.target.value)
            )
          }
          className="mt-4 w-full accent-[var(--accent)] cursor-pointer"
        />
      </div>

      {/* Timeline */}
      <div className="mt-6 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-elevated)] p-6">
        <h3 className="text-base font-bold text-[var(--accent)]">
          AI Estimate
        </h3>
        <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
          Based on your selected goals and <strong className="text-[var(--text-primary)]">{dailyHours} hour(s)</strong> of study each day, your estimated roadmap completion is <strong className="text-[var(--text-primary)]">{weeks} weeks</strong>.
        </p>
      </div>

      {/* Navigation */}

      <div className="mt-12 flex justify-between">

        <GradientButton
          variant="ghost"
          onClick={onBack}
        >
          ← Back
        </GradientButton>

        <GradientButton
          onClick={onNext}
          disabled={selected.length === 0}
        >
          Generate My AI Roadmap
        </GradientButton>

      </div>

    </div>
  );
}