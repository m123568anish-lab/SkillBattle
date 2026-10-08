import React from "react";

export default function StrengthsCard({ skills }: { skills?: string[] }) {
  const items = skills && skills.length > 0 ? skills : ["Clear problem solving", "Consistent communication"];

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <h2 className="text-sm font-medium text-slate-300">Strengths</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-400">
        {items.map((skill) => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>
    </div>
  );
}
