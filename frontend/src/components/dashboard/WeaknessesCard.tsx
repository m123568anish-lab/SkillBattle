import React from "react";

export default function WeaknessesCard() {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <h2 className="text-sm font-medium text-slate-300">Improvement Areas</h2>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-400">
        <li>System design depth</li>
        <li>More hands-on project examples</li>
      </ul>
    </div>
  );
}
