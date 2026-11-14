import Link from "next/link";
import { ArrowUpRight, Swords, Users, Zap } from "lucide-react";

export default function BattleDock() {
  return (
    <section
      aria-labelledby="battle-arena-title"
      className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--accent)]/25 bg-[var(--accent)]/[0.08] text-[var(--accent-strong)]">
            <Swords size={19} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Put your skills to the test
            </p>
            <h2 id="battle-arena-title" className="mt-0.5 text-lg font-semibold text-[var(--text-primary)]">
              Battle Arena
            </h2>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-default)] bg-[var(--surface-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)]">
          <Zap size={13} className="text-[var(--accent-strong)]" aria-hidden="true" />
          Choose your format
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Link
          href="/battle/solo"
          className="group flex min-h-24 items-center justify-between gap-4 rounded-xl border border-[var(--border-default)] bg-[#090909] p-4 transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition-colors group-hover:text-[var(--accent-strong)]">
              <Swords size={17} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-[var(--text-primary)]">Solo practice</span>
              <span className="mt-1 block text-xs text-[var(--text-muted)]">Train at your own pace.</span>
            </span>
          </span>
          <ArrowUpRight size={17} aria-hidden="true" className="shrink-0 text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent-strong)]" />
        </Link>

        <Link
          href="/battle/lobby"
          className="group flex min-h-24 items-center justify-between gap-4 rounded-xl border border-[var(--border-default)] bg-[#090909] p-4 transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--surface-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition-colors group-hover:text-[var(--accent-strong)]">
              <Users size={17} aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-[var(--text-primary)]">Multiplayer arena</span>
              <span className="mt-1 block text-xs text-[var(--text-muted)]">Find a player or join a room.</span>
            </span>
          </span>
          <ArrowUpRight size={17} aria-hidden="true" className="shrink-0 text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent-strong)]" />
        </Link>
      </div>
    </section>
  );
}
