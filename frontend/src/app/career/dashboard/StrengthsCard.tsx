interface StrengthsCardProps {
  skills?: string[];
}

export default function StrengthsCard({ skills = [] }: StrengthsCardProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl text-white">
      <h2 className="mb-4 text-xl font-bold text-emerald-400">Validated Technical Strengths</h2>
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300"
            >
              ✅ {skill}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-400">
          Add technical skills to your profile or resume to display verified strengths.
        </p>
      )}
    </div>
  );
}