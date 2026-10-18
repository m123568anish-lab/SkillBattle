import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Code2, ExternalLink } from "lucide-react";

export default function QuickSpeedrunWidget() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-slate-900/60 to-slate-950 p-5 shadow-xl sm:p-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
            <BriefcaseBusiness className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">Internships & placements</p>
            <h2 className="mt-1 text-lg font-bold text-white">Explore current opportunities</h2>
            <p className="mt-1 text-xs text-slate-400">
              Browse employer-posted listings or search external job boards. External listings open on their source site.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          <Link
            href="/opportunities"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Browse opportunities <ArrowRight size={14} />
          </Link>
          <Link
            href="/tasks"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            <Code2 size={14} /> Practice
          </Link>
          <a
            href="https://www.linkedin.com/jobs/search/?keywords=internship"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            LinkedIn Jobs <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </section>
  );
}
