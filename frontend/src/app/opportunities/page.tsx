"use client";

import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import Link from "next/link";
import { Bookmark, ExternalLink, MapPin, Search } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ExternalOpportunitySearch from "@/components/opportunities/ExternalOpportunitySearch";
import { opportunityService, type Opportunity } from "@/services/placement.service";

const categories = [
  "AI/ML and Data Science",
  "Web and Software Development",
  "Cloud, DevOps and Cybersecurity",
  "Data Analytics and SQL",
  "Business, Design and Product",
  "General Internships and Graduate Placements",
];

function errorMessage(error: unknown): string {
  if (axios.isAxiosError<{ detail?: string; message?: string }>(error)) {
    return error.response?.data?.detail ?? error.response?.data?.message ?? "Verified opportunities could not be loaded. Please retry.";
  }
  return error instanceof Error ? error.message : "Verified opportunities could not be loaded. Please retry.";
}

export default function OpportunitiesPage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [category, setCategory] = useState("");
  const [workMode, setWorkMode] = useState("");
  const [page, setPage] = useState(1);
  const [retryKey, setRetryKey] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busyJobId, setBusyJobId] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    void opportunityService.list(
      {
        q: appliedQuery || undefined,
        category: category || undefined,
        work_mode: workMode || undefined,
        page,
      },
      controller.signal,
    ).then((result) => {
      setItems(result.items);
      setTotal(result.total);
    }).catch((requestError: unknown) => {
      if (!controller.signal.aborted && !axios.isCancel(requestError)) {
        setItems([]);
        setTotal(0);
        setError(errorMessage(requestError));
      }
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false);
    });

    return () => controller.abort();
  }, [appliedQuery, category, workMode, page, retryKey]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = query.trim();
    if (nextQuery === appliedQuery && page === 1) {
      setRetryKey((current) => current + 1);
      return;
    }
    setAppliedQuery(nextQuery);
    setPage(1);
  }

  function setFilters(nextCategory: string, nextWorkMode = workMode) {
    setCategory(nextCategory);
    setWorkMode(nextWorkMode);
    setPage(1);
  }

  async function save(jobId: number) {
    setBusyJobId(jobId);
    setError("");
    setNotice("");
    try {
      await opportunityService.save(jobId);
      setNotice("Opportunity saved to your account.");
    } catch {
      setError("Could not save this opportunity. Please retry.");
    } finally {
      setBusyJobId(null);
    }
  }

  async function apply(job: Opportunity) {
    setBusyJobId(job.job_id);
    setError("");
    setNotice("");
    try {
      if (job.application_method === "external" && job.application_url) {
        window.open(job.application_url, "_blank", "noopener,noreferrer");
        await opportunityService.confirmExternal(job.job_id);
        setNotice("Opened the external application. This application is self-reported, not employer-confirmed.");
      } else {
        await opportunityService.apply(job.job_id);
        setNotice("Application submitted and saved to My Applications.");
      }
    } catch {
      setError("This application could not be completed. The opportunity may have closed.");
    } finally {
      setBusyJobId(null);
    }
  }

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-6xl space-y-5 pb-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Career opportunities</p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">Internships &amp; placements</h1>
              <p className="mt-1 text-sm text-slate-400">Verified company listings and attributed external openings.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/opportunities/saved" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-3 text-sm text-slate-200">Saved</Link>
              <Link href="/opportunities/applications" className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-3 text-sm text-slate-200">My applications</Link>
            </div>
          </div>
        </header>

        <ExternalOpportunitySearch />

        <form onSubmit={submitSearch} className="rounded-2xl border border-white/10 bg-[#0b1020] p-3 sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-xl bg-white/5 px-3">
              <Search aria-hidden="true" size={17} className="shrink-0 text-cyan-300" />
              <input
                aria-label="Search verified opportunities"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Company, role, or skill"
                className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-cyan-400"
              />
            </label>
            <select
              aria-label="Work mode"
              value={workMode}
              onChange={(event) => setFilters(category, event.target.value)}
              className="min-h-11 rounded-xl border border-white/10 bg-[#10172a] px-3 text-sm text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <option value="">All work modes</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="on_site">On-site</option>
            </select>
            <button className="min-h-11 rounded-xl bg-cyan-400 px-4 text-sm font-bold text-slate-950">Search verified</button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setFilters(category === item ? "" : item)}
                className={`min-h-10 shrink-0 rounded-full px-3 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${category === item ? "bg-cyan-400 text-slate-950" : "border border-white/10 text-slate-300"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </form>

        {error && (
          <div role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">
            {error}{" "}
            <button type="button" onClick={() => setRetryKey((current) => current + 1)} className="underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">
              Retry
            </button>
          </div>
        )}
        {notice && <div role="status" className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{notice}</div>}

        <section aria-label="Verified company opportunities" aria-busy={loading} className="space-y-3">
          {loading ? (
            <p className="p-6 text-sm text-slate-400">Loading verified opportunities…</p>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-slate-400">
              No matching verified company listings are currently available. Try changing the filters or searching the live external listings above.
            </div>
          ) : items.map((job) => (
            <article key={job.job_id} className="rounded-2xl border border-white/10 bg-[#0b1020] p-4 sm:p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{job.title}</h2>
                    <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase text-emerald-200">Company verified</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-300">{job.company_name} · {job.employment_type.replaceAll("_", " ")}</p>
                  <p className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <MapPin aria-hidden="true" size={14} />
                    {job.location || "Location not specified"} · {job.work_mode.replace("_", " ")}
                    {job.deadline_at ? ` · Deadline ${new Date(job.deadline_at).toLocaleDateString()}` : ""}
                  </p>
                  <p className="mt-3 text-sm text-slate-400">{job.required_skills || "Skills not specified"}</p>
                  {job.eligibility && <p className="mt-2 text-xs text-slate-500">Eligibility: {job.eligibility}</p>}
                  <p className="mt-2 text-xs text-slate-500">Source: {job.source_label}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                    {job.source_url && (
                      <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-1 text-cyan-300 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">
                        View original listing <ExternalLink aria-hidden="true" size={13} />
                      </a>
                    )}
                    <Link href={`/opportunities/${job.job_id}`} className="inline-flex min-h-10 items-center text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">Details</Link>
                  </div>
                </div>
                <div className="flex shrink-0 items-end gap-2">
                  <button
                    type="button"
                    aria-label={`Save ${job.title}`}
                    disabled={busyJobId === job.job_id}
                    onClick={() => void save(job.job_id)}
                    className="inline-flex min-h-11 items-center rounded-xl border border-white/10 px-3 text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-50"
                  >
                    <Bookmark aria-hidden="true" size={16} />
                  </button>
                  <button
                    type="button"
                    disabled={busyJobId === job.job_id}
                    onClick={() => void apply(job)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 text-sm font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-50"
                  >
                    {busyJobId === job.job_id ? "Working…" : job.application_method === "external" ? "Apply externally" : "Apply now"}
                    {job.application_method === "external" && <ExternalLink aria-hidden="true" size={15} />}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        {total > 20 && (
          <div className="flex items-center justify-between">
            <button type="button" disabled={page === 1 || loading} onClick={() => setPage((current) => current - 1)} className="min-h-10 rounded-lg border border-white/10 px-3 py-2 text-sm disabled:opacity-40">Previous</button>
            <span className="text-sm text-slate-400">{total} verified roles</span>
            <button type="button" disabled={page * 20 >= total || loading} onClick={() => setPage((current) => current + 1)} className="min-h-10 rounded-lg border border-white/10 px-3 py-2 text-sm disabled:opacity-40">Next</button>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
