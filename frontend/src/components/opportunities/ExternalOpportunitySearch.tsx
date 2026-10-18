"use client";

import { useState, type FormEvent } from "react";
import axios from "axios";
import { Bot, ExternalLink, MapPin, Search } from "lucide-react";
import {
  opportunityService,
  type ExternalOpportunity,
  type ExternalOpportunitySearch as ExternalOpportunitySearchResult,
} from "@/services/placement.service";

const openingTypes = [
  { value: "all", label: "All opportunity types" },
  { value: "internship", label: "Internships" },
  { value: "entry_level", label: "Entry-level jobs" },
  { value: "graduate_program", label: "Graduate / placement programs" },
];

function requestError(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ detail?: string }>(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return fallback;
}

function postedDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString();
}

export default function ExternalOpportunitySearch() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [openingType, setOpeningType] = useState("all");
  const [result, setResult] = useState<ExternalOpportunitySearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [summaryErrors, setSummaryErrors] = useState<Record<string, string>>({});
  const [summarizingId, setSummarizingId] = useState<string | null>(null);

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length < 2) {
      setError("Enter at least two characters to search live opportunities.");
      return;
    }
    setLoading(true);
    setError("");
    setSummaries({});
    setSummaryErrors({});
    try {
      const data = await opportunityService.searchExternal({
        q: query.trim(),
        opening_type: openingType,
        location: location.trim() || undefined,
      });
      setResult(data);
    } catch (requestFailure) {
      setResult(null);
      setError(requestError(requestFailure, "Live opportunities could not be loaded. Please retry."));
    } finally {
      setLoading(false);
    }
  }

  async function summarize(listing: ExternalOpportunity) {
    setSummarizingId(listing.job_id);
    setSummaryErrors((current) => ({ ...current, [listing.job_id]: "" }));
    try {
      const response = await opportunityService.summarizeExternal(listing);
      setSummaries((current) => ({ ...current, [listing.job_id]: response.summary }));
    } catch (requestFailure) {
      setSummaryErrors((current) => ({
        ...current,
        [listing.job_id]: requestError(requestFailure, "AI summary unavailable. The original listing is still available below."),
      }));
    } finally {
      setSummarizingId(null);
    }
  }

  return (
    <section aria-labelledby="external-opportunities-heading" className="space-y-4 rounded-2xl border border-cyan-400/15 bg-[#0b1020] p-4 sm:p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Live external search</p>
        <h2 id="external-opportunities-heading" className="mt-1 text-lg font-bold text-white">
          Search internships &amp; placements
        </h2>
        <p className="mt-1 text-xs leading-relaxed text-slate-400">
          Search listings provided by JSearch across configured countries. These listings are third-party content, not verified by SkillBattle. Apply on the original site; external applications are not tracked in My Applications.
        </p>
      </div>

      <form onSubmit={(event) => void search(event)} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(10rem,0.55fr)_minmax(11rem,0.65fr)_auto]">
        <label className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl bg-white/5 px-3">
          <Search aria-hidden="true" size={17} className="shrink-0 text-cyan-300" />
          <input
            aria-label="Role, skills, or domain"
            required
            minLength={2}
            maxLength={120}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Role, skills, or domain"
            className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-cyan-400"
          />
        </label>
        <label>
          <span className="sr-only">City or location</span>
          <input
            maxLength={100}
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="City / location (optional)"
            className="min-h-11 w-full rounded-xl border border-white/10 bg-[#10172a] px-3 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-cyan-400"
          />
        </label>
        <label>
          <span className="sr-only">Opportunity type</span>
          <select
            value={openingType}
            onChange={(event) => setOpeningType(event.target.value)}
            className="min-h-11 w-full rounded-xl border border-white/10 bg-[#10172a] px-3 text-sm text-slate-200 outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            {openingTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
          </select>
        </label>
        <button
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-4 text-sm font-bold text-slate-950 disabled:cursor-wait disabled:opacity-60"
        >
          <Search aria-hidden="true" size={16} />
          {loading ? "Searching…" : "Search live listings"}
        </button>
      </form>

      {error && <p role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</p>}
      {result && (
        <div className="space-y-3">
          <p className="text-xs text-slate-400">
            {result.items.length} listings from {result.provider} · Markets: {result.markets_searched.map((market) => market.name).join(", ")}
          </p>
          {result.markets_with_errors.length > 0 && (
            <p role="status" className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-100">
              Results may be incomplete. Search failed in: {result.markets_with_errors.join(", ")}.
            </p>
          )}
          {result.items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/15 p-6 text-center text-sm text-slate-400">No matching external listings were returned. Try a different role or location.</p>
          ) : result.items.map((listing) => {
            const date = postedDate(listing.posted_at);
            return (
              <article key={listing.job_id} className="rounded-xl border border-white/10 bg-[#080d19] p-4">
                <div className="flex flex-col justify-between gap-3 sm:flex-row">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-white">{listing.title}</h3>
                      <span className="rounded-full bg-amber-300/10 px-2 py-1 text-[10px] font-semibold uppercase text-amber-200">External · not verified</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-300">{listing.employer_name} · {listing.employment_type}</p>
                    <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <MapPin aria-hidden="true" size={14} />
                      {listing.location}
                      {listing.is_remote && <span>· Remote</span>}
                      {date && <span>· Posted {date}</span>}
                    </p>
                    {listing.salary && <p className="mt-2 text-xs text-slate-300">Salary: {listing.salary}</p>}
                    <p className="mt-2 text-xs text-slate-500">Source: {listing.source_label}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <a
                        href={listing.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 items-center gap-1 text-xs font-semibold text-cyan-300 hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                      >
                        View original listing <ExternalLink aria-hidden="true" size={13} />
                      </a>
                      <a
                        href={listing.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 items-center gap-1 rounded-lg bg-cyan-400 px-3 text-xs font-bold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                      >
                        Apply externally <ExternalLink aria-hidden="true" size={13} />
                      </a>
                      <button
                        type="button"
                        disabled={summarizingId !== null}
                        onClick={() => void summarize(listing)}
                        className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-white/10 px-3 text-xs font-semibold text-slate-200 hover:border-cyan-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:opacity-60"
                      >
                        <Bot aria-hidden="true" size={14} />
                        {summarizingId === listing.job_id ? "Summarizing…" : summaries[listing.job_id] ? "Refresh AI summary" : "AI summary"}
                      </button>
                    </div>
                    {summaries[listing.job_id] && (
                      <div className="mt-3 rounded-lg border border-violet-400/20 bg-violet-400/5 p-3">
                        <p className="text-xs font-semibold text-violet-200">AI summary · verify details on the original listing</p>
                        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-300">{summaries[listing.job_id]}</p>
                      </div>
                    )}
                    {summaryErrors[listing.job_id] && <p role="alert" className="mt-3 text-xs text-rose-200">{summaryErrors[listing.job_id]}</p>}
                    <details className="mt-3 rounded-lg border border-white/10 p-3">
                      <summary className="cursor-pointer text-xs font-semibold text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400">Full description and listing details</summary>
                      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-300">
                        {listing.description || "The provider did not return a description. View the original listing for details."}
                      </p>
                      {Object.entries(listing.highlights).map(([heading, items]) => (
                        <div key={heading} className="mt-3">
                          <p className="text-xs font-semibold text-slate-200">{heading}</p>
                          <ul className="mt-1 list-inside list-disc space-y-1 text-xs text-slate-400">
                            {items.map((item, index) => <li key={`${heading}-${index}`}>{item}</li>)}
                          </ul>
                        </div>
                      ))}
                    </details>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
