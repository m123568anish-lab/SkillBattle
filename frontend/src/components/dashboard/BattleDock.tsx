import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Code2,
  Flame,
  Swords,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import type { DashboardStats, RecentActivity } from "@/types/dashboard";

const modes = [
  {
    title: "Solo MCQ",
    detail: "Fast-paced aptitude & core computer science questions.",
    href: "/battle/solo?mode=mcq",
    tag: "Solo Practice",
    badge: "MCQ Duel",
    icon: BookOpen,
    accentColor: "border-sky-500/25 bg-sky-500/10 text-sky-400",
  },
  {
    title: "Solo Coding",
    detail: "Solve algorithmic problems under competitive time limits.",
    href: "/battle/solo?mode=coding",
    tag: "Solo Practice",
    badge: "Algorithms",
    icon: Code2,
    accentColor: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  },
  {
    title: "Multiplayer MCQ",
    detail: "Join matchmaking or challenge peers to rapid fire quiz rounds.",
    href: "/battle/lobby?question_type=mcq",
    tag: "Multiplayer",
    badge: "Live 1v1",
    icon: Users,
    accentColor: "border-amber-500/25 bg-amber-500/10 text-amber-400",
  },
  {
    title: "Multiplayer Coding",
    detail: "Real-time head-to-head duel with live test-case judging.",
    href: "/battle/lobby?question_type=coding",
    tag: "Multiplayer",
    badge: "Arena Battle",
    icon: Swords,
    accentColor: "border-[var(--accent)]/30 bg-[var(--accent)]/15 text-[var(--accent-strong)]",
  },
];

export default function BattleDock({
  stats,
  recentActivity = [],
}: {
  stats: DashboardStats;
  recentActivity?: RecentActivity[];
}) {
  const winRate =
    stats.battles_played > 0
      ? Math.round((stats.battles_won / stats.battles_played) * 100)
      : null;
  const recentBattles = recentActivity
    .filter((activity) => /battle/i.test(activity.activity_type))
    .slice(0, 3);

  return (
    <section
      aria-labelledby="battle-arena-title"
      className="relative overflow-hidden rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-xl"
    >
      {/* Header Banner */}
      <div className="flex flex-col gap-5 border-b border-[var(--border-subtle)] bg-[linear-gradient(110deg,rgba(216,255,62,0.06)_0%,transparent_60%)] p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--accent-strong)]">
              <Zap size={11} className="text-[var(--accent)]" />
              Live Competitive Arena
            </span>
          </div>

          <div className="mt-2.5 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent-strong)] shadow-md">
              <Swords size={20} aria-hidden="true" />
            </span>
            <div>
              <h2
                id="battle-arena-title"
                className="text-xl font-bold tracking-tight text-[var(--text-primary)] sm:text-2xl"
              >
                Competitive Battle Arena
              </h2>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                Challenge peers, gain ELO rating, and prove algorithmic dominance.
              </p>
            </div>
          </div>
        </div>

        {/* Live Arena Stats Bar */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 sm:justify-end">
          <BattleStatChip
            label="ELO Rating"
            value={stats.rating.toLocaleString()}
            icon={Trophy}
            accent
          />
          <BattleStatChip
            label="Battles Fought"
            value={stats.battles_completed.toLocaleString()}
          />
          <BattleStatChip
            label="Win Rate"
            value={winRate === null ? "—" : `${winRate}%`}
            icon={Flame}
          />
        </div>
      </div>

      {/* 4 Interactive Game Modes Grid */}
      <div className="grid gap-3.5 p-4 sm:grid-cols-2 sm:p-6">
        {modes.map(
          ({ title, detail, href, tag, badge, icon: Icon, accentColor }) => (
            <Link
              key={title}
              href={href}
              className="group relative flex min-h-[6.5rem] min-w-0 items-start gap-4 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-elevated)] p-4 sm:p-5 transition-all duration-200 hover:border-[var(--accent)]/50 hover:bg-[var(--surface-subtle)] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
            >
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${accentColor} shadow-sm transition-transform duration-200 group-hover:scale-105`}
              >
                <Icon size={19} aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-strong)] transition-colors">
                    {title}
                  </h3>
                  <span className="rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    {tag}
                  </span>
                  <span className="rounded-md border border-[var(--accent)]/20 bg-[var(--accent)]/5 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[var(--accent-strong)]">
                    {badge}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)] line-clamp-2">
                  {detail}
                </p>
              </div>

              <ArrowUpRight
                size={17}
                aria-hidden="true"
                className="shrink-0 text-[var(--text-muted)] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--accent-strong)]"
              />
            </Link>
          )
        )}
      </div>

      {/* Competitive Progress Telemetry Row */}
      <div className="grid gap-4 border-t border-[var(--border-subtle)] bg-[var(--surface-elevated)]/40 p-5 sm:grid-cols-[minmax(0,1.2fr)_minmax(15rem,0.8fr)] sm:items-center sm:px-6">
        <div>
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-bold text-[var(--text-secondary)]">
              Competitive Win Rate Performance
            </span>
            <span className="font-mono font-bold tabular-nums text-[var(--accent-strong)]">
              {winRate === null ? "No duels recorded" : `${winRate}% Win Ratio`}
            </span>
          </div>

          <div
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-subtle)] border border-[var(--border-subtle)]"
            role="progressbar"
            aria-label="Battle win rate"
            aria-valuenow={winRate ?? 0}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(216,255,62,0.4)] transition-all duration-500 ease-out"
              style={{ width: `${winRate ?? 0}%` }}
            />
          </div>

          <p className="mt-2 text-[11px] text-[var(--text-muted)]">
            <strong className="font-mono text-[var(--text-primary)]">
              {stats.battles_won.toLocaleString()}
            </strong>{" "}
            victories out of{" "}
            <strong className="font-mono text-[var(--text-primary)]">
              {stats.battles_played.toLocaleString()}
            </strong>{" "}
            total matches played
          </p>
        </div>

        {recentBattles.length > 0 ? (
          <div className="sm:border-l sm:border-[var(--border-subtle)] sm:pl-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Recent Matches
            </p>
            <ul className="mt-2 space-y-1.5">
              {recentBattles.map((battle, index) => {
                const date = new Date(battle.activity_date);
                const dateLabel = Number.isNaN(date.getTime())
                  ? battle.activity_date
                  : new Intl.DateTimeFormat(undefined, {
                      month: "short",
                      day: "numeric",
                    }).format(date);
                return (
                  <li
                    key={`${battle.activity_date}-${battle.activity_type}-${index}`}
                    className="flex min-w-0 items-center justify-between gap-3 text-xs"
                  >
                    <span className="truncate font-medium text-[var(--text-secondary)]">
                      {battle.activity_type}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-[var(--accent-strong)]">
                      {dateLabel}
                      {battle.xp_earned > 0 ? ` · +${battle.xp_earned} XP` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="sm:border-l sm:border-[var(--border-subtle)] sm:pl-6">
            <p className="text-xs text-[var(--text-muted)]">
              No recent battle history. Choose a mode above to start your first duel!
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function BattleStatChip({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  icon?: any;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-1.5 sm:px-3.5 sm:py-2 ${
        accent
          ? "border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent-strong)]"
          : "border-[var(--border-default)] bg-[var(--surface-elevated)] text-[var(--text-primary)]"
      }`}
    >
      <div className="flex items-center gap-1.5">
        {Icon && <Icon size={12} className={accent ? "text-[var(--accent)]" : "text-amber-400"} />}
        <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </p>
      </div>
      <p className="mt-0.5 font-mono text-sm font-black tabular-nums">{value}</p>
    </div>
  );
}
