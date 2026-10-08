import React from "react";

export default function RecentResumes({ resumeTitle }: { resumeTitle?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <h2 className="text-sm font-medium text-slate-300">Recent Resumes</h2>
      <p className="mt-2 text-sm text-slate-400">
        {resumeTitle ? `Current resume: ${resumeTitle}` : "No resumes uploaded yet."}
      </p>
    </div>
  );
}
