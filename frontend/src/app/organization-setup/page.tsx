"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleCheck, CircleDashed, RefreshCw, ArrowLeft } from "lucide-react";
import api from "@/services/api";
import { QubiraLogo } from "@/components/brand/QubiraLogo";

type OnboardingStep = {
  key: string;
  title: string;
  available: boolean;
  complete: boolean;
  count: number | null;
};

type OnboardingProgress = {
  organization_type: "college" | "company";
  organization_id: number;
  organization_name: string;
  progress_percent: number;
  completed_steps: number;
  available_steps: number;
  steps: OnboardingStep[];
};

export default function OrganizationSetupPage() {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void api.get<OnboardingProgress>("/organization-onboarding/progress", { signal: controller.signal })
      .then((response) => {
        setProgress(response.data);
        setError(null);
      })
      .catch((requestError: { response?: { status?: number } }) => {
        if (controller.signal.aborted) return;
        const status = requestError.response?.status;
        setError(status === 404
          ? "No organization is linked to this account."
          : status === 403
            ? "Organization setup is available to college and company accounts."
            : "Organization setup could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [refreshKey]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--surface-canvas)] flex items-center justify-center p-6 text-sm text-[var(--text-muted)]">
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          <span>Loading setup status…</span>
        </div>
      </main>
    );
  }

  if (!progress) {
    return (
      <main className="min-h-screen bg-[var(--surface-canvas)] flex items-center justify-center p-6 text-[var(--text-primary)]">
        <div className="w-full max-w-lg rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-2xl">
          <div role="alert" className="flex items-center justify-between gap-4 border-l-2 border-[var(--status-warning)] pl-4 py-2 text-sm text-[var(--text-secondary)]">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => { setLoading(true); setRefreshKey((value) => value + 1); }}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent-strong)] transition"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
          <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent-strong)] hover:underline">
              <ArrowLeft size={14} /> Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const dashboardHref = progress.organization_type === "college" ? "/college/dashboard" : "/company/dashboard";

  return (
    <main className="min-h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <QubiraLogo variant="full" size="sm" />
          <Link
            href={dashboardHref}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] transition"
          >
            <span>Go to Dashboard</span>
          </Link>
        </div>

        <div className="rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 sm:p-10 shadow-2xl">
          <header className="border-b border-[var(--border-subtle)] pb-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-strong)]">{progress.organization_type} setup</p>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)]">{progress.organization_name}</h1>
            <div className="mt-6 flex items-end justify-between gap-4">
              <span className="text-xs font-semibold text-[var(--text-muted)]">Setup Progress</span>
              <span className="text-xs font-mono font-bold text-[var(--accent-strong)]">{progress.progress_percent}% · {progress.completed_steps}/{progress.available_steps} steps</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-elevated)] border border-[var(--border-subtle)]" role="progressbar" aria-valuenow={progress.progress_percent} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)] transition-all duration-500" style={{ width: `${progress.progress_percent}%` }} />
            </div>
          </header>

          <ol className="divide-y divide-[var(--border-subtle)] mt-2">
            {progress.steps.map((step) => (
              <li key={step.key} className="flex items-center gap-4 py-4.5">
                {step.available && step.complete ? (
                  <CircleCheck aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--status-success)]" />
                ) : (
                  <CircleDashed aria-hidden="true" className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[var(--text-primary)]">{step.title}</span>
                  <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
                    {!step.available ? "Not available in this platform workflow" : step.complete ? "Complete" : "Needs setup"}
                  </span>
                </span>
                {step.count !== null && (
                  <span className="rounded-md border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2.5 py-1 text-xs font-mono text-[var(--text-secondary)]">
                    {step.count}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </main>
  );
}
