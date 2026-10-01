"use client";

import { useEffect, useState } from "react";
import { CircleCheck, CircleDashed, RefreshCw } from "lucide-react";
import api from "@/services/api";

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
    return <main className="mx-auto max-w-3xl px-5 py-12 text-sm text-slate-400">Loading setup status…</main>;
  }

  if (!progress) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-12">
        <div role="alert" className="flex items-center justify-between gap-4 border-l-2 border-amber-300 px-4 py-3 text-sm text-amber-100">
          <span>{error}</span>
          <button type="button" onClick={() => { setLoading(true); setRefreshKey((value) => value + 1); }} className="flex items-center gap-2 text-white hover:text-cyan-200">
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-10 text-slate-100 sm:py-14">
      <header className="border-b border-white/10 pb-6">
        <p className="text-xs font-semibold uppercase text-cyan-300">{progress.organization_type} setup</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">{progress.organization_name}</h1>
        <div className="mt-6 flex items-end justify-between gap-4">
          <span className="text-sm text-slate-400">Setup progress</span>
          <span className="text-sm font-medium text-white">{progress.progress_percent}% · {progress.completed_steps}/{progress.available_steps}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={progress.progress_percent} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${progress.progress_percent}%` }} />
        </div>
      </header>

      <ol className="divide-y divide-white/10">
        {progress.steps.map((step) => (
          <li key={step.key} className="flex items-center gap-4 py-4">
            {step.available && step.complete
              ? <CircleCheck aria-hidden="true" className="h-5 w-5 shrink-0 text-emerald-300" />
              : <CircleDashed aria-hidden="true" className="h-5 w-5 shrink-0 text-slate-500" />}
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-white">{step.title}</span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {!step.available ? "Not available in this platform workflow" : step.complete ? "Complete" : "Needs setup"}
              </span>
            </span>
            {step.count !== null && <span className="text-sm tabular-nums text-slate-400">{step.count}</span>}
          </li>
        ))}
      </ol>
    </main>
  );
}