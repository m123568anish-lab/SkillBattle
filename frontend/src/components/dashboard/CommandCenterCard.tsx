import Link from "next/link";
import { ArrowRight, BookOpen, Compass, ShieldCheck } from "lucide-react";
import type { DashboardCommandCenter } from "@/services/dashboard.service";

export default function CommandCenterCard({
  commandCenter,
}: {
  commandCenter: DashboardCommandCenter;
}) {
  const progress = Number.isFinite(commandCenter.roadmap?.progress)
    ? Math.min(100, Math.max(0, commandCenter.roadmap.progress))
    : 0;
  const readiness = commandCenter.placement_readiness?.state || "BUILDING";
  const confidence = commandCenter.placement_readiness?.confidence || "LOW";
  const nextBest = commandCenter.next_best_action;
  const actions = commandCenter.daily_actions ?? [];
  const skillGaps = commandCenter.skill_gaps ?? [];

  return (
    <section
      aria-labelledby="roadmap-card-title"
      className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] text-[var(--accent-strong)]">
            <Compass size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              Active roadmap
            </p>
            <h2 id="roadmap-card-title" className="mt-0.5 text-base font-semibold text-[var(--text-primary)]">
              {commandCenter.roadmap?.title || "Your learning path"}
            </h2>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border-default)] bg-[var(--surface-elevated)] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
          <ShieldCheck size={13} aria-hidden="true" className="text-[var(--accent-strong)]" />
          {readiness}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-[var(--text-secondary)]">Roadmap progress</p>
          <span className="font-mono text-xs font-semibold tabular-nums text-[var(--text-primary)]">{progress}%</span>
        </div>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-elevated)]"
          role="progressbar"
          aria-label="Roadmap progress"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-[var(--accent)] transition-[width] motion-reduce:transition-none" style={{ width: `${progress}%` }} />
        </div>
        {commandCenter.roadmap?.milestone && (
          <p className="mt-2 text-xs text-[var(--text-muted)]">{commandCenter.roadmap.milestone}</p>
        )}
      </div>

      {nextBest && (
        <div className="mt-5 rounded-xl border border-[var(--border-default)] bg-[#090909] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
            Recommended next step
          </p>
          <h3 className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{nextBest.title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{nextBest.why}</p>
          <Link
            href="/career/roadmap"
            className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-md text-xs font-semibold text-[var(--text-primary)] transition-colors hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
          >
            View next steps <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
      )}

      {(actions.length > 0 || skillGaps.length > 0) && (
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          {actions.length > 0 && (
            <div className="min-w-0">
              <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                <BookOpen size={13} aria-hidden="true" />
                Suggested today
              </p>
              <ul className="space-y-2">
                {actions.slice(0, 3).map((action) => (
                  <li key={`${action.type}-${action.title}`} className="rounded-lg border border-[var(--border-subtle)] bg-[#090909] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-[var(--text-primary)]">{action.title}</p>
                      {action.time && <span className="shrink-0 text-[10px] text-[var(--text-muted)]">{action.time}</span>}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">{action.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {skillGaps.length > 0 && (
            <div className="min-w-0">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Skills to strengthen
              </p>
              <ul className="space-y-2">
                {skillGaps.slice(0, 3).map((gap) => (
                  <li key={gap.skill_id ?? gap.skill_name} className="rounded-lg border border-[var(--border-subtle)] bg-[#090909] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-[var(--text-primary)]">{gap.skill_name}</p>
                      <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">{gap.priority}</span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">{gap.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-[var(--border-subtle)] pt-4 text-[11px] text-[var(--text-muted)]">
        <span>Placement confidence: <strong className="font-semibold text-[var(--text-secondary)]">{confidence}</strong></span>
      </div>
    </section>
  );
}
