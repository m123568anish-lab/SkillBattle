"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/auth/RoleGuard";
import { CheckCircle2, Search, ShieldAlert, UserCheck } from "lucide-react";
import Link from "next/link";
import { companyService, type Company, type CompanyCandidate, type JobPosting } from "@/services/company.service";

export default function CompanyCandidatesPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [candidates, setCandidates] = useState<CompanyCandidate[]>([]);
  const [discovered, setDiscovered] = useState<Array<{
    candidate_id: string | null;
    candidate_name: string;
    candidate_email: string;
    job_id: number;
    job_title: string;
    eligible: boolean;
    skill_profile: NonNullable<CompanyCandidate["skill_profile"]>;
  }>>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [query, setQuery] = useState("");
  const [shortlistedOnly, setShortlistedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShortlistedOnly(new URLSearchParams(window.location.search).get("status") === "shortlisted");
    }
    async function load() {
      try {
        const currentCompany = await companyService.getMyCompany();
        setCompany(currentCompany);
        if (currentCompany) {
          const [jobRows, candidateRows] = await Promise.all([
            companyService.listJobs(),
            companyService.listCandidates(),
          ]);
          setJobs(jobRows);
          setCandidates(candidateRows);
          setSelectedJobId((current) => current || String(jobRows[0]?.id ?? ""));
        }
      } catch (loadError) {
        console.error("Company candidate load error:", loadError);
        setError("Unable to load candidate information.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const visibleCandidates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return candidates.filter((candidate) => {
      if (shortlistedOnly && candidate.status !== "shortlisted") return false;
      if (!normalizedQuery) return true;
      return `${candidate.candidate_name} ${candidate.candidate_email} ${candidate.job_title}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [candidates, query, shortlistedOnly]);

  const discoverEligible = async () => {
    if (!selectedJobId) return;
    setDiscovering(true);
    setError("");
    try {
      setDiscovered(await companyService.discoverCandidates(Number(selectedJobId)));
    } catch (discoverError: any) {
      setError(discoverError?.response?.data?.detail || "Unable to discover eligible candidates.");
    } finally {
      setDiscovering(false);
    }
  };

  const shortlist = async (candidate: CompanyCandidate) => {
    setError("");
    setMessage("");
    try {
      await companyService.updateApplicationStatus(candidate.application_id, "shortlisted");
      setCandidates((current) => current.map((item) => item.application_id === candidate.application_id
        ? { ...item, status: "shortlisted" }
        : item));
      setMessage("Candidate shortlisted.");
    } catch (shortlistError: any) {
      setError(shortlistError?.response?.data?.detail || "Unable to shortlist this candidate.");
    }
  };

  return (
    <RoleGuard allowedRoles={["company", "company_admin", "recruiter"]}>
      <DashboardLayout>
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Candidate Discovery & Talent Pool</h1>
            <p className="mt-1 text-sm text-slate-400">Candidates are ranked from verified platform activity and their sharing choices.</p>
          </div>
          <Link href="/company/jobs" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">Manage jobs</Link>
        </div>

        {message && <p role="status" className="mb-4 flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 size={16} />{message}</p>}
        {error && <p role="alert" className="mb-4 flex items-center gap-2 text-sm text-rose-300"><ShieldAlert size={16} />{error}</p>}

        {!loading && !company && (
          <p className="border-y border-white/10 py-6 text-sm text-slate-400">Register a company before viewing candidate information. <Link href="/company/register" className="text-cyan-300 underline">Register company</Link></p>
        )}
        {company && company.status !== "verified" && (
          <p className="border-y border-amber-500/20 bg-amber-500/5 py-6 text-sm text-amber-200">Company verification is {company.status}. Candidate discovery is available after approval.</p>
        )}

        {company?.status === "verified" && (
          <>
            <div className="mb-7 flex flex-col gap-3 border-y border-white/10 py-4 sm:flex-row sm:items-center">
              <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-slate-400">
                <Search size={16} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search visible applicants" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none" />
              </label>
              <select value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white">
                <option value="">Select job to discover</option>
                {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
              </select>
              <button type="button" disabled={!selectedJobId || discovering} onClick={() => void discoverEligible()} className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {discovering ? "Searching…" : "Discover eligible"}
              </button>
            </div>

            {discovered.length > 0 && (
              <section id="discover" className="mb-10">
                <h2 className="mb-3 text-lg font-bold text-white">Eligible candidates</h2>
                <div className="divide-y divide-white/10 border-y border-white/10">
                  {discovered.map((candidate, index) => (
                    <div key={`${candidate.job_id}-${candidate.candidate_id ?? index}`} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-semibold text-white">{candidate.candidate_name}</div>
                        <div className="text-xs text-slate-400">{candidate.candidate_email || "Contact details private"} · {candidate.job_title}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {candidate.skill_profile.skills.map((skill) => (
                          <span key={skill.skill} className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-200">{skill.skill} {skill.score}%</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section id="candidates">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-white">Applications</h2>
                <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={shortlistedOnly} onChange={(event) => setShortlistedOnly(event.target.checked)} />Shortlisted only</label>
              </div>
              {loading ? <p className="py-6 text-sm text-slate-400">Loading applicants…</p> : visibleCandidates.length === 0 ? (
                <p className="border-y border-white/10 py-8 text-sm text-slate-400">No matching applications yet.</p>
              ) : (
                <div className="divide-y divide-white/10 border-y border-white/10">
                  {visibleCandidates.map((candidate) => (
                    <div key={candidate.application_id} className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="font-semibold text-white">{candidate.candidate_name}</div>
                        <div className="truncate text-xs text-slate-400">{candidate.candidate_email || "Contact details private"} · {candidate.job_title}</div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          <span className="text-slate-300">Application: {candidate.status}</span>
                          <span className="text-slate-500">Assessment: {candidate.assessment_status}</span>
                          {candidate.assessment_score !== null && <span className="text-cyan-300">Verified result: {candidate.assessment_score}%</span>}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {candidate.skill_profile?.skills.map((skill) => <span key={skill.skill} className="rounded-md border border-white/10 px-2 py-1 text-xs text-slate-300">{skill.skill} {skill.score}%</span>)}
                        <button type="button" disabled={!candidate.consent || !candidate.eligible || candidate.assessment_status !== "completed" || candidate.status === "shortlisted"} onClick={() => void shortlist(candidate)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
                          <UserCheck size={15} />{candidate.status === "shortlisted" ? "Shortlisted" : "Shortlist"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </DashboardLayout>
    </RoleGuard>
  );
}
