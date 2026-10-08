import React from "react";

export default function AnalysisSummary({ summary }: { summary?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <h2 className="text-sm font-medium text-slate-300">Analysis Summary</h2>
      <p className="mt-2 text-sm text-slate-400">
        {summary || "Your profile is strong and ready for the next step."}
      </p>
    </div>
  );
}
