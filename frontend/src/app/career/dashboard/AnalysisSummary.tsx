interface AnalysisSummaryProps {
  summary?: string | null;
}

export default function AnalysisSummary({ summary }: AnalysisSummaryProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl text-white">
      <h2 className="text-xl font-bold text-cyan-400 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
        AI Career & Resume Summary
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-slate-300">
        {summary || "No active resume evaluation found. Build or upload your resume in Career Studio to get automated ATS scoring and AI feedback."}
      </p>
    </div>
  );
}