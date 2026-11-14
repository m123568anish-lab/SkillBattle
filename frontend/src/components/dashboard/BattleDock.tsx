import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Code2,
  Swords,
  Users,
} from "lucide-react";
import type { DashboardStats } from "@/types/dashboard";

const modes = [
  {
    title: "Solo MCQ",
    detail: "Sharpen concepts at your pace.",
    href: "/battle/solo?mode=mcq",
    label: "Solo",
    icon: BookOpen,
  },
  {
    title: "Solo coding",
    detail: "Solve a coding challenge.",
    href: "/battle/solo?mode=coding",
    label: "Solo",
    icon: Code2,
  },
  {
    title: "Multiplayer MCQ",
    detail: "Create an MCQ room or join the lobby.",
    href: "/battle/lobby?question_type=mcq",
    label: "Multiplayer",
    icon: Users,
  },
  {
    title: "Multiplayer coding",
    detail: "Create a coding room or join the lobby.",
    href: "/battle/lobby?question_type=coding",
    label: "Multiplayer",
    icon: Swords,
  },
];

export default function BattleDock({ stats }: { stats: DashboardStats }) {
  const winRate = stats.battles_played > 0
    ? Math.round((stats.battles_won / stats.battles_played) * 100)
    : null;

  return (
    <section
      aria-labelledby="battle-arena-title"
      className="q-panel min-w-0 overflow-hidden"
    >
      <div className="flex flex-col gap-5 border-b border-[var(--border-subtle)] p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div>
          <p className="q-kicker">Compete on your terms</p>
          <div className="mt-2 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-[var(--accent)]/25 bg-[var(--accent)]/[0.08] text-[var(--accent-strong)]">
              <Swords size={19} aria-hidden="true" />
            </span>
            <div>
              <h2 id="battle-arena-title" className="text-xl font-semibold text-[var(--text-primary)]">
                Battle Arena
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">Choose a format and put your skills to work.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-2 sm:justify-end">
          <BattleStat label="Rating" value={stats.rating.toLocaleString()} />
          <BattleStat label="Battles" value={stats.battles_completed.toLocaleString()} />
          <BattleStat label="Win rate" value={winRate === null ? "—" : `${winRate}%`} />
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
        {modes.map(({ title, detail, href, label, icon: Icon }) => (
          <Link
            key={title}
            href={href}
            className="group flex min-h-[6.25rem] min-w-0 items-center gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] p-4 transition-colors duration-150 hover:border-[var(--accent)]/40 hover:bg-[var(--surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] motion-reduce:transition-none"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)] transition-colors group-hover:text-[var(--accent-strong)]">
              <Icon size={17} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-[var(--text-primary)]">{title}</span>
                <span className="rounded border border-[var(--border-default)] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  {label}
                </span>
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-[var(--text-muted)]">{detail}</span>
            </span>
            <ArrowUpRight size={16} aria-hidden="true" className="shrink-0 text-[var(--text-muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--accent-strong)]" />
          </Link>
        ))}
      </div>
    </section>
  );
}

function BattleStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[4rem]">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">{label}</p>
      <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
