import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, Code2, ExternalLink } from "lucide-react";

export default function QuickSpeedrunWidget() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-[#252525] bg-[#101010] p-5 shadow-[0_12px_36px_rgba(0,0,0,0.18)] sm:p-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#D8FF3E]/25 bg-[#D8FF3E]/10 text-[#D8FF3E]">
            <BriefcaseBusiness className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#D8FF3E]">Internships & placements</p>
            <h2 className="mt-1 text-lg font-bold text-[#F5F5F5]">Explore current opportunities</h2>
            <p className="mt-1 text-xs text-[#A1A1AA]">
              Browse employer-posted listings or search external job boards. External listings open on their source site.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 sm:shrink-0">
          <Link
            href="/opportunities"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#D8FF3E] px-4 py-2 text-xs font-bold text-[#101010] transition hover:bg-[#EAFCCB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8FF3E]"
          >
            Browse opportunities <ArrowRight size={14} />
          </Link>
          <Link
            href="/tasks"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#252525] bg-[#0B0B0B] px-3 py-2 text-xs font-semibold text-[#F5F5F5] transition hover:bg-[#151515] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8FF3E]"
          >
            <Code2 size={14} /> Practice
          </Link>
          <a
            href="https://www.linkedin.com/jobs/search/?keywords=internship"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#252525] bg-[#0B0B0B] px-3 py-2 text-xs font-semibold text-[#F5F5F5] transition hover:bg-[#151515] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D8FF3E]"
          >
            LinkedIn Jobs <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </section>
  );
}
