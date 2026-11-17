import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Code2,
  Swords,
  Users,
} from "lucide-react";
import type { DashboardStats, RecentActivity } from "@/types/dashboard";

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

export default function BattleDock({
  stats,
  recentActivity = [],
}: {
  stats: DashboardStats;
  recentActivity?: RecentActivity[];
}) {
  const winRate = stats.battles_played > 0
    ? Math.round((stats.battles_won / stats.battles_played) * 100)
    : null;
  const recentBattles = recentActivity
    .filter((activity) => /battle/i.test(activity.activity_type))
    .slice(0, 3);

  return (
    <section
      aria-labelledby="battle-arena-title"
      className="q-panel min-w-0 overflow-hidden"
    >
      <div className="flex flex-col gap-5 border-b border-[var(--border-subtle)] bg-[linear-gradient(110deg,color-mix(in_srgb,var(--accent)_5%,transparent),transparent_58%)] p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
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

      <div className="grid gap-4 border-t border-[var(--border-subtle)] p-5 sm:grid-cols-[minmax(0,1fr)_minmax(14rem,0.8fr)] sm:items-center sm:px-6">
        <div>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-[var(--text-secondary)]">Competitive progress</span>
            <span className="font-mono tabular-nums text-[var(--text-primary)]">
              {winRate === null ? "No battles yet" : `${winRate}% win rate`}
            </span>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-hover)]"
            role="progressbar"
            aria-label="Battle win rate"
            aria-valuenow={winRate ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-[width] motion-reduce:transition-none"
              style={{ width: `${winRate ?? 0}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-[var(--text-muted)]">
            {stats.battles_won.toLocaleString()} wins from {stats.battles_played.toLocaleString()} battles played
          </p>
        </div>

        {recentBattles.length > 0 && (
          <div className="sm:border-l sm:border-[var(--border-subtle)] sm:pl-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Recent battles
            </p>
            <ul className="mt-2 space-y-1.5">
              {recentBattles.map((battle, index) => {
                const date = new Date(battle.activity_date);
                const dateLabel = Number.isNaN(date.getTime())
                  ? battle.activity_date
                  : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date);
                return (
                  <li
                    key={`${battle.activity_date}-${battle.activity_type}-${index}`}
                    className="flex min-w-0 items-center justify-between gap-3 text-xs"
                  >
                    <span className="truncate text-[var(--text-secondary)]">{battle.activity_type}</span>
                    <span className="shrink-0 text-[var(--text-muted)]">
                      {dateLabel}{battle.xp_earned > 0 ? ` · +${battle.xp_earned} XP` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
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
