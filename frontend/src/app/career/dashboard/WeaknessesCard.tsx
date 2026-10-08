interface WeaknessesCardProps {
  projectCount?: number;
}

export default function WeaknessesCard({ projectCount = 0 }: WeaknessesCardProps) {
  const recommendations: string[] = [];

  if (projectCount < 2) {
    recommendations.push("Add at least 2 full-stack or system design projects to your resume");
  }
  if (projectCount === 0) {
    recommendations.push("Include quantitative metrics (e.g., latency, user scale) in project bullet points");
  }
  recommendations.push("Complete practice coding battles to improve DSA accuracy");

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl shadow-xl text-white">
      <h2 className="mb-4 text-xl font-bold text-amber-400">Targeted Improvement Areas</h2>
      <ul className="space-y-2.5">
        {recommendations.map((item) => (
          <li key={item} className="flex items-center gap-2 text-xs font-medium text-amber-200">
            <span>⚠️</span> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}