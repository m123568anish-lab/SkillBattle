import { ExternalLink } from "lucide-react";

const jobBoards = [
  {
    name: "Internshala",
    description: "Browse current internships in India.",
    href: "https://internshala.com/internships/",
  },
  {
    name: "LinkedIn Jobs",
    description: "Search live internships and graduate roles.",
    href: (query: string) =>
      `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(query || "internship graduate placement")}`,
  },
  {
    name: "Wellfound",
    description: "Browse startup jobs and internships.",
    href: "https://wellfound.com/jobs",
  },
];

interface ExternalJobBoardsProps {
  query?: string;
}

export default function ExternalJobBoards({ query = "" }: ExternalJobBoardsProps) {
  return (
    <section
      aria-labelledby="external-job-boards-heading"
      className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.035] p-4 sm:p-5"
    >
      <div className="mb-3">
        <h2 id="external-job-boards-heading" className="text-base font-bold text-white">
          Search external job boards
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          These links open live results on the job boards. SkillBattle does not import or verify their listings;
          confirm the role and application details on the original site.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {jobBoards.map((board) => {
          const href = typeof board.href === "function" ? board.href(query.trim()) : board.href;
          return (
            <a
              key={board.name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-16 items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0b1020] px-3 py-3 transition hover:border-cyan-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-100">{board.name}</span>
                <span className="mt-1 block text-xs text-slate-400">{board.description}</span>
              </span>
              <ExternalLink size={15} aria-hidden="true" className="shrink-0 text-cyan-300" />
            </a>
          );
        })}
      </div>
    </section>
  );
}
