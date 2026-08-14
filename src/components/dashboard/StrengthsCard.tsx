import React from "react";

export default function StrengthsCard() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <h2 className="text-sm font-medium text-slate-300">Strengths</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-400">
        <li>Clear problem solving</li>
        <li>Consistent communication</li>
      </ul>
    </div>
  );
}
