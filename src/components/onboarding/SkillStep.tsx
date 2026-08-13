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

      <h1 className="text-4xl font-black text-white">
        Skill Assessment
      </h1>

      <p className="mt-3 text-slate-400">
        Tell us about your current level.
      </p>

      <div className="mt-10 grid gap-5 md:grid-cols-2">

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

      <div className="mt-12">

        <label className="text-white font-semibold">
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

            update({
              confidence: value,
            });
          }}
          className="mt-4 w-full"
        />

      </div>

      <div className="mt-10">

        <label className="text-white font-semibold">
          Placement Target
        </label>

        <div className="mt-4 flex flex-wrap gap-3">

          {targets.map((item) => (
            <button
              key={item}
              onClick={() =>
                update({
                  target: item,
                })
              }
              className={`
                rounded-full
                px-5
                py-2

                ${
                  target === item
                    ? "bg-cyan-500 text-white"
                    : "bg-white/5 text-slate-300"
                }
              `}
            >
              {item}
            </button>
          ))}

        </div>

      </div>

      <div className="mt-10">

        <label className="text-white font-semibold">
          Graduation Year
        </label>

        <select
          value={graduationYear}
          onChange={(e) =>
            update({
              graduationYear: e.target.value,
            })
          }
          className="
            mt-4
            h-14
            w-full
            rounded-xl
            border
            border-white/10
            bg-white/5
            px-4
            text-white
          "
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