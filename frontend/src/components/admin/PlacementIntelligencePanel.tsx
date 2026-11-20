"use client";

import { useEffect, useState } from "react";
import {
  adminService,
  type PlacementIntelligenceSummary,
  type PlacementProviderHealth,
} from "@/services/admin.service";

export default function PlacementIntelligencePanel() {
  const [summary, setSummary] = useState<PlacementIntelligenceSummary | null>(null);
  const [provider, setProvider] = useState<PlacementProviderHealth | null>(null);
  const [error, setError] = useState("");
  const [retryingJobId, setRetryingJobId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.all([
      adminService.getPlacementIntelligence(),
      adminService.getPlacementProviderHealth(),
    ])
      .then(([metrics, health]) => {
        if (!active) return;
        setSummary(metrics);
        setProvider(health);
        setError("");
      })
      .catch(() => {
        if (active) setError("Placement intelligence metrics are unavailable.");
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  async function retryJob(jobId: number) {
    setRetryingJobId(jobId);
    setError("");
    try {
      await adminService.retryPlacementJob(jobId);
      setRefreshKey((value) => value + 1);
    } catch {
      setError(`Could not retry job #${jobId}.`);
    } finally {
      setRetryingJobId(null);
    }
  }

  return (
    <section aria-label="Placement intelligence" className="space-y-5 rounded-lg border border-white/10 bg-slate-900/50 p-5">
      <div>
        <h2 className="text-base font-semibold text-white">Placement intelligence</h2>
        <p className="text-sm text-slate-400">Live catalogue and persistent worker data.</p>
      </div>
      {error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 text-sm text-amber-100">
          <span>{error}</span>
          <button type="button" className="text-white underline" onClick={() => setRefreshKey((value) => value + 1)}>
            Refresh
          </button>
        </div>
      ) : summary ? (
        <>
          <p className="text-sm text-slate-300">
            AI provider: {provider
              ? `${provider.provider} · ${provider.available ? "available" : `unavailable (${provider.detail})`}`
              : "checking"}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Approved questions" value={summary.total_approved_questions} />
            <Metric label="Pending review" value={summary.pending_review_count} />
            <Metric label="Duplicate candidates" value={summary.duplicate_candidates} />
            <Metric label="Source records" value={summary.source_records_processed} />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <h3 className="mb-1 font-medium text-white">Job queue</h3>
                <p className="text-sm text-slate-300">
                  Queued {summary.job_queue_status.queued} · Running {summary.job_queue_status.running} · Failed {summary.job_queue_status.failed} · Retries {summary.retry_history}
                </p>
              </div>
              <div>
                <h3 className="mb-2 font-medium text-white">Inventory shortages</h3>
                {summary.inventory_shortages.length ? (
                  <ul className="space-y-2 text-sm text-slate-300">
                    {summary.inventory_shortages.map((shortage) => (
                      <li key={`${shortage.company}-${shortage.role}-${shortage.topic}-${shortage.difficulty}-${shortage.question_type}`}>
                        {shortage.company} / {shortage.role} / {shortage.topic} ({shortage.difficulty}, {shortage.question_type}): {shortage.current}/{shortage.target}, short {shortage.missing}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-slate-400">No configured inventory shortages.</p>}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-medium text-white">Recent failed jobs</h3>
                {summary.recent_failed_jobs.length ? (
                  <ul className="space-y-3 text-sm text-slate-300">
                    {summary.recent_failed_jobs.map((job) => (
                      <li key={job.id} className="rounded-md bg-white/5 p-3">
                        <p>#{job.id} · {job.type} · retries {job.retry_count}/{job.max_retries}</p>
                        <p className="mt-1 break-words text-rose-300">{job.error_details}</p>
                        <button
                          type="button"
                          className="mt-2 rounded-md bg-white/10 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
                          disabled={retryingJobId !== null}
                          onClick={() => void retryJob(job.id)}
                        >
                          {retryingJobId === job.id ? "Retrying…" : "Retry job"}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-slate-400">No failed jobs.</p>}
              </div>
              <div>
                <h3 className="mb-2 font-medium text-white">Recent source ingestion</h3>
                {summary.recent_sources.length ? (
                  <ul className="space-y-2 text-sm text-slate-300">
                    {summary.recent_sources.map((source) => (
                      <li key={source.id} className="break-all">
                        {source.company || source.title} · {source.processed ? "processed" : "pending"} · {source.source_url}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-slate-400">No source records.</p>}
              </div>
            </div>
          </div>
        </>
      ) : <p role="status" className="text-sm text-slate-400">Loading placement metrics…</p>}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-white/5 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value.toLocaleString()}</p>
    </div>
  );
}
