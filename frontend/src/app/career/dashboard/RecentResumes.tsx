interface RecentResumesProps {
  resumeTitle?: string | null;
}

export default function RecentResumes({ resumeTitle }: RecentResumesProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl text-white">
      <h2 className="mb-4 text-xl font-bold">Saved Resumes</h2>
      {resumeTitle ? (
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm font-semibold text-cyan-200">
          📄 {resumeTitle}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 p-4 text-xs text-slate-400 text-center">
          No saved resume document found.
        </div>
      )}
    </div>
  );
}