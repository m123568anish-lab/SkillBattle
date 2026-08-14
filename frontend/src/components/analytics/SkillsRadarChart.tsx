import React from "react";

interface Props {
  skills: {
    name: string;
    value: number;
  }[];
}

export default function SkillsRadarChart({ skills }: Props) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <h3 className="text-sm font-medium text-slate-300">Skills Overview</h3>
      <p className="mt-2 text-sm text-slate-400">{skills.length ? "Skills data available" : "No skills data yet"}</p>
    </div>
  );
}
