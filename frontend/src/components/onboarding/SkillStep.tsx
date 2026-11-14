"use client";

import { useState } from "react";

import GradientButton from "@/components/ui/gradient-button";
import SkillCard from "./SkillCard";

const skillLevels = [
  {
    title: "Beginner",
    description: "Learning programming fundamentals.",
  },
  {
    title: "Intermediate",
    description: "Comfortable with DSA and projects.",
  },
  {
    title: "Advanced",
    description: "Strong coding and interview skills.",
  },
  {
    title: "Expert",
    description: "Ready for top product companies.",
  },
];

const targets = [
  "Internship",
  "5 LPA",
  "10 LPA",
  "20+ LPA",
];

const graduationYears = [
  "2026",
  "2027",
  "2028",
  "2029",
];

interface Props {
  level: string;
  confidence: number;
  target: string;
  graduationYear: string;

  onChange: (
    values: {
      level: string;
      confidence: number;
      target: string;
      graduationYear: string;
    }
  ) => void;

  onNext: () => void;
  onBack: () => void;
}

export default function SkillStep({
  level,
  confidence,
  target,
  graduationYear,
  onChange,
  onNext,
  onBack,
}: Props) {
  const [localConfidence, setLocalConfidence] =
    useState(confidence);

  function update(values: Partial<{
    level: string;
    confidence: number;
    target: string;
    graduationYear: string;
  }>) {
    onChange({
      level,
      confidence: localConfidence,
      target,
      graduationYear,
      ...values,
    });
  }

  return (
    <div>

      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text-primary)]">
        Skill Assessment
      </h1>

      <p className="mt-3 text-sm sm:text-base text-[var(--text-secondary)]">
        Tell us about your current level to personalize recommendations.
      </p>

      <div className="mt-8 grid gap-4 sm:gap-5 md:grid-cols-2">

        {skillLevels.map((item) => (
          <SkillCard
            key={item.title}
            title={item.title}
            description={item.description}
            selected={level === item.title}
            onClick={() =>
              update({
                level: item.title,
              })
            }
          />
        ))}

      </div>

      <div className="mt-10 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
        <label className="text-sm font-semibold text-[var(--text-primary)]">
          Confidence ({localConfidence}%)
        </label>

        <input
          type="range"
          min={0}
          max={100}
          value={localConfidence}
          onChange={(e) => {
            const value = Number(e.target.value);
            setLocalConfidence(value);
            update({ confidence: value });
          }}
          className="mt-4 w-full accent-[var(--accent)] cursor-pointer"
        />
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
        <label className="text-sm font-semibold text-[var(--text-primary)]">
          Placement Target
        </label>

        <div className="mt-4 flex flex-wrap gap-2.5">
          {targets.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => update({ target: item })}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                target === item
                  ? "bg-[var(--accent)] text-[var(--text-on-accent)] shadow-sm font-semibold"
                  : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:text-[var(--text-primary)]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6">
        <label className="text-sm font-semibold text-[var(--text-primary)]">
          Graduation Year
        </label>

        <select
          value={graduationYear}
          onChange={(e) => update({ graduationYear: e.target.value })}
          className="mt-4 h-12 w-full rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] px-4 text-sm font-medium text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          <option value="">
            Select Graduation Year
          </option>

          {graduationYears.map((year) => (
            <option
              key={year}
              value={year}
            >
              {year}
            </option>
          ))}
        </select>

      </div>

      <div className="mt-12 flex justify-between">

        <GradientButton
          variant="ghost"
          onClick={onBack}
        >
          ← Back
        </GradientButton>

        <GradientButton
          onClick={onNext}
          disabled={
            !level ||
            !target ||
            !graduationYear
          }
        >
          Continue
        </GradientButton>

      </div>

    </div>
  );
}