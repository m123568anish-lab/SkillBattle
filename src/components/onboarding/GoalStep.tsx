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

      <h1 className="text-4xl font-black text-white">
        Learning Goals
      </h1>

      <p className="mt-3 text-slate-400">
        Choose your focus areas.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2">

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

      <div className="mt-12">

        <label className="text-lg font-semibold text-white">

          Daily Study Hours

        </label>

        <p className="mt-2 text-slate-400">

          {dailyHours} Hours / Day

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
          className="mt-5 w-full"
        />

      </div>

      {/* Timeline */}

      <div className="mt-10 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6">

        <h3 className="text-xl font-bold text-cyan-300">

          AI Estimate

        </h3>

        <p className="mt-3 text-slate-300">

          Based on your selected goals and

          <strong> {dailyHours} hour(s)</strong>

          of study each day, your estimated

          roadmap completion is

          <strong> {weeks} weeks.</strong>

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