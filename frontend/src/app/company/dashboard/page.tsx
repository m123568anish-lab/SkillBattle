"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isAxiosError } from "axios";
import { ArrowRight, BriefcaseBusiness, Users, ClipboardCheck, Trophy, SearchCheck } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  CompanyCandidate,
  CompanyDashboardData,
  CompanyInterview,
  CompanyJob,
  DiscoverableCandidate,
  organizationDashboardService,
} from "@/services/organization-dashboard.service";

const inputClass = "h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20";
const buttonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

function errorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (error.response?.status === 403) return "Company verification is required to access this hiring workflow.";
  }
  return error instanceof Error ? error.message : "The company workspace could not be loaded.";
}

function Metric({ label, value, note, icon: Icon }: { label: string; value: string | number; note?: string; icon: typeof Users }) {
  return (
    <section className="min-w-0 rounded-2xl border border-white/10 bg-[#0b1020] p-5">
      <div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-slate-400">{label}</p><Icon className="h-4 w-4 shrink-0 text-cyan-300" aria-hidden="true" /></div>
      <p className="mt-4 text-3xl font-semibold tabular-nums text-white">{value}</p>
      {note && <p className="mt-1 text-xs text-slate-500">{note}</p>}
    </section>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return <section className="min-w-0 rounded-2xl border border-white/10 bg-[#0b1020] p-5 sm:p-6"><div className="mb-5"><h2 className="text-base font-semibold text-white">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}</div>{children}</section>;
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">{children}</p>;
}

export default function CompanyDashboardPage() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "overview";
  const filterStatus = searchParams.get("status");
  const candidateJobId = searchParams.get("job");
  const createJobOnOpen = searchParams.get("action") === "create";
  const [dashboard, setDashboard] = useState<CompanyDashboardData | null>(null);
  const [jobs, setJobs] = useState<CompanyJob[]>([]);
  const [candidates, setCandidates] = useState<CompanyCandidate[]>([]);
  const [discoverable, setDiscoverable] = useState<DiscoverableCandidate[]>([]);
  const [interviews, setInterviews] = useState<CompanyInterview[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const summary = await organizationDashboardService.getCompanyDashboard();
        if (!active) return;
        setDashboard(summary);

        if (view === "overview" || view === "analytics") {
          const interviewRows = await organizationDashboardService.getCompanyInterviews();
          if (active) setInterviews(interviewRows);
        }

        if (["jobs", "candidates", "discover", "assessments"].includes(view)) {
          const jobRows = await organizationDashboardService.getCompanyJobs();
          if (!active) return;
          setJobs(jobRows);
          if (!selectedJobId && jobRows[0]) setSelectedJobId(String(jobRows[0].id));
        }
        if (view === "candidates") {
          const candidateRows = await organizationDashboardService.getCompanyCandidates(candidateJobId ? Number(candidateJobId) : undefined);
          if (active) setCandidates(candidateRows);
        }
        if (view === "discover" && selectedJobId) {
          const candidateRows = await organizationDashboardService.discoverCandidates(Number(selectedJobId));
          if (active) setDiscoverable(candidateRows);
        }
      } catch (loadError) {
        if (active) setError(errorMessage(loadError));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [view, selectedJobId, candidateJobId, refreshVersion]);

  async function submitAction(event: FormEvent<HTMLFormElement>, action: (form: FormData) => Promise<unknown>, successText: string) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      await action(new FormData(formElement));
      formElement.reset();
      setNotice(successText);
      setRefreshVersion((version) => version + 1);
    } catch (actionError) {
      setError(errorMessage(actionError));
    } finally {
      setSubmitting(false);
    }
  }

  async function updateApplication(applicationId: number, status: "shortlisted" | "offer" | "hired" | "rejected") {
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      await organizationDashboardService.updateApplicationStatus(applicationId, status);
      const messages = {
        shortlisted: "Candidate shortlisted.",
        offer: "Offer recorded.",
        hired: "Candidate marked as hired.",
        rejected: "Application rejected.",
      };
      setNotice(messages[status]);
      setRefreshVersion((version) => version + 1);
    } catch (actionError) {
      setError(errorMessage(actionError));
    } finally {
      setSubmitting(false);
    }
  }

  async function completeInterview(interviewId: number) {
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      await organizationDashboardService.completeInterview(interviewId);
      setNotice("Interview marked complete.");
      setRefreshVersion((version) => version + 1);
    } catch (actionError) {
      setError(errorMessage(actionError));
    } finally {
      setSubmitting(false);
    }
  }

  async function scheduleInterview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      await organizationDashboardService.scheduleInterview(Number(form.get("application_id")), {
        scheduled_at: new Date(String(form.get("scheduled_at") || "")).toISOString(),
        duration_minutes: Number(form.get("duration_minutes") || 45),
        meeting_url: String(form.get("meeting_url") || ""),
        notes: String(form.get("notes") || ""),
      });
      setNotice("Interview scheduled and candidate notified.");
      setRefreshVersion((version) => version + 1);
    } catch (actionError) {
      setError(errorMessage(actionError));
    } finally {
      setSubmitting(false);
    }
  }

  const headings: Record<string, { title: string; subtitle: string }> = {
    overview: { title: dashboard?.company?.name || "Hiring overview", subtitle: "Track open roles, consented candidates, assessments, and hiring progress." },
    analytics: { title: "Hiring analytics", subtitle: "Pipeline and job activity calculated from persisted company applications." },
    jobs: { title: "Jobs", subtitle: "Create openings and define the skills candidates need." },
    candidates: { title: filterStatus === "shortlisted" ? "Shortlisted candidates" : "Candidates", subtitle: "Review applicants while respecting candidate privacy and consent." },
    discover: { title: "Discover candidates", subtitle: "Find eligible candidates using the existing consent and skill-matching rules." },
    assessments: { title: "Job assessments", subtitle: "Create a hiring assessment for a verified company's job." },
  };
  const heading = headings[view] || headings.overview;
  const visibleCandidates = filterStatus ? candidates.filter((candidate) => candidate.status === filterStatus) : candidates;

  return (
    <DashboardLayout>
      <main className="space-y-6 pb-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-violet-300">Company hiring</p>
            <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{heading.title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{heading.subtitle}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a className={buttonClass} href="/company/dashboard?view=jobs&action=create">Create job <ArrowRight size={15} /></a>
            <a className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-cyan-400/40" href="/company/dashboard?view=discover">Discover talent</a>
          </div>
        </header>

        {error && <div role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm text-rose-200">{error}</div>}
        {notice && <div role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-200">{notice}</div>}
        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#0b1020] px-5 py-12 text-center text-sm text-slate-400">Loading company data…</div>
        ) : !dashboard ? (
          error ? null : <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 px-5 py-8 text-sm text-amber-100">Company hiring data is unavailable.</div>
        ) : (
          <>
            {(view === "overview" || view === "analytics") && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0b1020] px-5 py-4">
                  <div><p className="text-sm font-semibold text-white">{dashboard.company.name}</p><p className="mt-1 text-xs text-slate-400">{dashboard.company.industry || "Industry not provided"} · {dashboard.company.headquarters || "Location not provided"}</p></div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${dashboard.company.status === "verified" ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-200" : "border-amber-300/20 bg-amber-300/5 text-amber-100"}`}>{dashboard.company.status}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Metric label="Active jobs" value={dashboard.active_jobs} note="Open or active postings" icon={BriefcaseBusiness} />
                  <Metric label="Applications" value={dashboard.candidates_total} note="Persisted applications across your jobs" icon={Users} />
                  <Metric label="Shortlisted" value={dashboard.shortlisted_total} note="Applications in shortlisted status" icon={Trophy} />
                  <Metric label="Assessments completed" value={dashboard.assessment_completed} note="Completed candidate assessments" icon={ClipboardCheck} />
                </div>
                <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                  <Panel title="Hiring pipeline" subtitle="Application counts from your company's job postings.">
                    {dashboard.application_pipeline.length === 0 ? <EmptyState>No applications have been received.</EmptyState> : <div className="space-y-4">{dashboard.application_pipeline.map((item) => {
                      const maxCount = Math.max(...dashboard.application_pipeline.map((row) => row.count), 1);
                      return <div key={item.status}><div className="mb-1 flex justify-between text-sm"><span className="capitalize text-slate-200">{item.status.replaceAll("_", " ")}</span><span className="tabular-nums text-slate-400">{item.count}</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${(item.count / maxCount) * 100}%` }} /></div></div>;
                    })}</div>}
                  </Panel>
                  <Panel title="Candidate skill signals" subtitle="Aggregated only from candidate profiles shared with your company.">
                    {dashboard.candidate_skill_distribution.length === 0 ? <EmptyState>No consented candidate skill data is available yet.</EmptyState> : <div className="space-y-3">{dashboard.candidate_skill_distribution.slice(0, 8).map((skill) => <div key={skill.skill} className="flex items-center justify-between gap-3 border-b border-white/5 pb-2 text-sm"><span className="text-slate-200">{skill.skill}</span><span className="tabular-nums text-slate-400">{skill.count} signals</span></div>)}</div>}
                  </Panel>
                </div>
                <div className="grid gap-5 xl:grid-cols-2">
                  <Panel title="Job performance" subtitle="Applications and shortlists by job.">
                    {dashboard.job_performance.length === 0 ? <EmptyState>Create a job to start measuring applicant activity.</EmptyState> : <div className="overflow-x-auto"><table className="w-full min-w-[440px] text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="pb-3 pr-4">Job</th><th className="pb-3 pr-4">Applications</th><th className="pb-3">Shortlisted</th></tr></thead><tbody className="divide-y divide-white/5">{dashboard.job_performance.map((job) => <tr key={job.job_id}><td className="py-3 pr-4 font-medium text-white">{job.title}</td><td className="py-3 pr-4 tabular-nums text-slate-300">{job.applications}</td><td className="py-3 tabular-nums text-slate-300">{job.shortlisted}</td></tr>)}</tbody></table></div>}
                  </Panel>
                  <Panel title="Recent applications">
                    {dashboard.recent_applications.length === 0 ? <EmptyState>No recent applications.</EmptyState> : <div className="divide-y divide-white/5">{dashboard.recent_applications.map((application, index) => <div key={`${application.job}-${index}`} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium text-white">{application.candidate}</p><p className="truncate text-xs text-slate-400">{application.job}</p></div><span className="shrink-0 text-xs capitalize text-slate-300">{application.status.replaceAll("_", " ")}</span></div>)}</div>}
                  </Panel>
                </div>
                <Panel title="Interviews" subtitle="Scheduled interviews and completed interview records.">
                  {interviews.length === 0 ? <EmptyState>No interviews are scheduled.</EmptyState> : <div className="divide-y divide-white/5">{interviews.map((interview) => <article key={interview.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-white">{interview.candidate_name} · {interview.job_title}</p><p className="mt-1 text-xs text-slate-400">{new Date(interview.scheduled_at).toLocaleString()} · {interview.duration_minutes} min · {interview.status}</p></div><div className="flex flex-wrap items-center gap-3">{interview.meeting_url && <a className="text-sm text-cyan-200 underline underline-offset-4" href={interview.meeting_url} target="_blank" rel="noreferrer">Join meeting</a>}{interview.status === "scheduled" && <button type="button" className="min-h-9 rounded-lg border border-white/10 px-3 text-xs font-semibold text-slate-200 hover:border-cyan-400/40 disabled:opacity-50" disabled={submitting} onClick={() => void completeInterview(interview.id)}>Mark complete</button>}</div></article>)}</div>}
                </Panel>
              </>
            )}

            {view === "jobs" && (
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <Panel title={`Job postings · ${jobs.length}`}>
                  {jobs.length === 0 ? <EmptyState>No job postings yet.</EmptyState> : <div className="divide-y divide-white/5">{jobs.map((job) => <article key={job.id} className="py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-medium text-white">{job.title}</h2><p className="mt-1 text-xs text-slate-400">{job.location || "Location flexible"} · {job.employment_type.replaceAll("_", " ")}{job.remote_allowed ? " · Remote" : ""}</p></div><span className="rounded-full border border-white/10 px-3 py-1 text-xs capitalize text-slate-300">{job.status}</span></div><p className="mt-3 text-sm leading-6 text-slate-400">{job.description || "No description provided."}</p><p className="mt-3 text-xs text-cyan-200">Required skills: {job.required_skills || "Not specified"}</p><div className="mt-4 flex flex-wrap gap-2"><a className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400/40" href={`/company/dashboard?view=candidates&job=${job.id}`}>View applicants</a><a className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-400/40" href="/company/dashboard?view=assessments">Assessment</a></div></article>)}</div>}
                </Panel>
                <Panel title={createJobOnOpen ? "Create a job" : "Post a new job"} subtitle="The posting is stored under your verified company.">
                  <form className="space-y-3" onSubmit={(event) => void submitAction(event, (form) => organizationDashboardService.createCompanyJob({
                    title: String(form.get("title") || ""),
                    location: String(form.get("location") || ""),
                    employment_type: String(form.get("employment_type") || "full_time"),
                    remote_allowed: form.get("remote_allowed") === "on",
                    description: String(form.get("description") || ""),
                    required_skills: String(form.get("required_skills") || ""),
                    compensation: String(form.get("compensation") || ""),
                    status: "open",
                  }), "Job posted.")}>
                    <label className="block text-xs font-medium text-slate-400" htmlFor="job-title">Job title</label><input id="job-title" name="title" required minLength={2} className={inputClass} placeholder="Software Engineer" />
                    <label className="block text-xs font-medium text-slate-400" htmlFor="job-skills">Required skills</label><input id="job-skills" name="required_skills" className={inputClass} placeholder="Python, SQL, React" />
                    <label className="block text-xs font-medium text-slate-400" htmlFor="job-location">Location</label><input id="job-location" name="location" className={inputClass} placeholder="Remote or city" />
                    <label className="block text-xs font-medium text-slate-400" htmlFor="job-type">Employment type</label><select id="job-type" name="employment_type" className={inputClass}><option value="full_time">Full time</option><option value="internship">Internship</option><option value="contract">Contract</option></select>
                    <label className="block text-xs font-medium text-slate-400" htmlFor="job-description">Description</label><textarea id="job-description" name="description" rows={4} className={`${inputClass} h-auto py-3`} placeholder="Role responsibilities and expectations" />
                    <label className="block text-xs font-medium text-slate-400" htmlFor="job-compensation">Compensation</label><input id="job-compensation" name="compensation" className={inputClass} placeholder="Optional" />
                    <label className="flex items-center gap-2 text-sm text-slate-300"><input name="remote_allowed" type="checkbox" className="accent-cyan-400" />Remote allowed</label>
                    <button className={buttonClass} disabled={submitting}>{submitting ? "Posting…" : "Publish job"}</button>
                  </form>
                </Panel>
              </div>
            )}

            {view === "candidates" && (
              <>
              <Panel title={`${filterStatus === "shortlisted" ? "Shortlisted" : "Applicants"} · ${visibleCandidates.length}`} subtitle="Contact and skill details follow each candidate's consent settings.">
                {visibleCandidates.length === 0 ? <EmptyState>No candidates match this view.</EmptyState> : <div className="space-y-3">{visibleCandidates.map((candidate) => <article key={candidate.application_id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5"><div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-white">{candidate.candidate_name || "Private candidate"}</h2><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] capitalize text-slate-300">{candidate.status.replaceAll("_", " ")}</span></div><p className="mt-1 text-sm text-slate-400">{candidate.job_title} · {candidate.candidate_email || "Contact hidden by privacy settings"}</p><p className="mt-2 text-xs text-slate-500">Assessment: {candidate.assessment_status.replaceAll("_", " ")}{candidate.assessment_score !== null ? ` · ${candidate.assessment_score}%` : ""}</p>{candidate.skill_profile?.skills?.length ? <div className="mt-3 flex flex-wrap gap-2">{candidate.skill_profile.skills.slice(0, 8).map((skill) => <span key={skill.skill} className="rounded-full border border-cyan-400/15 bg-cyan-400/5 px-2.5 py-1 text-xs text-cyan-100">{skill.skill} · {skill.score}</span>)}</div> : <p className="mt-3 text-xs text-slate-500">Skill profile not shared.</p>}</div><div className="flex shrink-0 flex-wrap gap-2"><button type="button" className={buttonClass} disabled={submitting || !candidate.consent || !candidate.eligible || candidate.assessment_status !== "completed"} onClick={() => void updateApplication(candidate.application_id, "shortlisted")}>Shortlist</button><button type="button" className="min-h-10 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-300 hover:border-rose-300/30 hover:text-rose-200 disabled:opacity-50" disabled={submitting} onClick={() => void updateApplication(candidate.application_id, "rejected")}>Reject</button></div></div>{(!candidate.consent || !candidate.eligible || candidate.assessment_status !== "completed") && <p className="mt-3 text-xs text-amber-200/80">Shortlisting requires candidate consent, eligible shared skills, and a completed assessment.</p>}</article>)}</div>}
              </Panel>
              <Panel title="Schedule an interview" subtitle="Only shortlisted applicants with current contact-sharing consent can be scheduled.">
                {candidates.filter((candidate) => candidate.status === "shortlisted" && candidate.consent && candidate.candidate_email).length === 0 ? <EmptyState>No shortlisted candidates with shared contact details are available.</EmptyState> : <form className="grid gap-3 md:grid-cols-2" onSubmit={(event) => void scheduleInterview(event)}>
                  <label className="text-xs text-slate-400">Candidate and role<select name="application_id" required className={`${inputClass} mt-2`}>{candidates.filter((candidate) => candidate.status === "shortlisted" && candidate.consent && candidate.candidate_email).map((candidate) => <option key={candidate.application_id} value={candidate.application_id}>{candidate.candidate_name} · {candidate.job_title}</option>)}</select></label>
                  <label className="text-xs text-slate-400">Date and time<input name="scheduled_at" type="datetime-local" required className={`${inputClass} mt-2`} /></label>
                  <label className="text-xs text-slate-400">Duration<select name="duration_minutes" className={`${inputClass} mt-2`} defaultValue="45"><option value="30">30 minutes</option><option value="45">45 minutes</option><option value="60">60 minutes</option><option value="90">90 minutes</option></select></label>
                  <label className="text-xs text-slate-400">Meeting link<input name="meeting_url" type="url" className={`${inputClass} mt-2`} placeholder="https://" /></label>
                  <label className="text-xs text-slate-400 md:col-span-2">Interview notes<input name="notes" className={`${inputClass} mt-2`} placeholder="Interview focus or preparation notes" /></label>
                  <button className={`${buttonClass} md:col-span-2`} disabled={submitting}>{submitting ? "Scheduling…" : "Schedule interview"}</button>
                </form>}
              </Panel>
              <Panel title="Offers and hiring decisions" subtitle="Offers require a completed interview; hire is recorded only after an offer.">
                {candidates.filter((candidate) => candidate.status === "interview" || candidate.status === "offer").length === 0 ? <EmptyState>No interview-stage decisions are pending.</EmptyState> : <div className="divide-y divide-white/5">{candidates.filter((candidate) => candidate.status === "interview" || candidate.status === "offer").map((candidate) => <div key={candidate.application_id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-white">{candidate.candidate_name} · {candidate.job_title}</p><p className="text-xs capitalize text-slate-400">Application: {candidate.status} · Interview: {candidate.interview_status || "not scheduled"}</p></div>{candidate.status === "interview" && candidate.interview_status === "completed" ? <button type="button" className={buttonClass} disabled={submitting} onClick={() => void updateApplication(candidate.application_id, "offer")}>Record offer</button> : candidate.status === "offer" ? <button type="button" className={buttonClass} disabled={submitting} onClick={() => void updateApplication(candidate.application_id, "hired")}>Mark hired</button> : <span className="text-xs text-slate-500">Complete the scheduled interview to continue.</span>}</div>)}</div>}
              </Panel>
              </>
            )}

            {view === "discover" && (
              <Panel title="Skill-matched candidates" subtitle="Candidates are returned only when recruiter search and skill sharing are enabled.">
                <div className="mb-5 max-w-lg"><label htmlFor="discover-job" className="mb-2 block text-sm font-medium text-slate-300">Choose a job</label><select id="discover-job" value={selectedJobId} onChange={(event) => setSelectedJobId(event.target.value)} className={inputClass}><option value="">Select a job</option>{jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}</select></div>
                {!selectedJobId ? <EmptyState>Create a job before discovering candidates.</EmptyState> : discoverable.length === 0 ? <EmptyState>No consented, eligible candidate profiles match this job yet.</EmptyState> : <div className="grid gap-3 md:grid-cols-2">{discoverable.map((candidate, index) => <article key={`${candidate.candidate_id || candidate.job_id}-${index}`} className="rounded-xl border border-white/10 p-4"><div className="flex items-center gap-2"><SearchCheck size={17} className="text-cyan-300" /><h2 className="font-medium text-white">{candidate.candidate_name || "Private candidate"}</h2></div><p className="mt-1 text-sm text-slate-400">{candidate.candidate_email || "Contact hidden by privacy settings"}</p>{candidate.skill_profile?.skills?.length ? <ul className="mt-3 space-y-1 text-xs text-slate-300">{candidate.skill_profile.skills.slice(0, 5).map((skill) => <li key={skill.skill} className="flex justify-between gap-3"><span>{skill.skill}</span><span>{skill.score}% · {skill.attempts} attempts</span></li>)}</ul> : <p className="mt-3 text-xs text-slate-500">No profile details shared.</p>}</article>)}</div>}
              </Panel>
            )}

            {view === "assessments" && (
              <Panel title="Assessments linked to jobs" subtitle="Assessments use the existing Battle assessment engine.">
                {jobs.length === 0 ? <EmptyState>Create a job before configuring a hiring assessment.</EmptyState> : <div className="space-y-4">{jobs.map((job) => <details key={job.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4"><summary className="cursor-pointer list-none font-medium text-white">{job.title}<span className="ml-2 text-xs text-slate-400">{job.assessment_config_id ? "Assessment configured" : "Configure assessment"}</span></summary>{job.assessment_config_id ? <p className="mt-3 text-sm text-emerald-200">Assessment is connected to this job.</p> : <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={(event) => void submitAction(event, (form) => organizationDashboardService.createJobAssessment(job.id, {
                  title: String(form.get("title") || ""),
                  difficulty: String(form.get("difficulty") || "medium"),
                  duration_minutes: Number(form.get("duration") || 30),
                  question_count: Number(form.get("question_count") || 5),
                  sections: [{ title: String(form.get("skill") || "Core skills"), question_type: "mcq", skill_category: String(form.get("skill") || "Core skills"), question_count: Number(form.get("question_count") || 5), weight: 1, duration_minutes: Number(form.get("duration") || 30) }],
                }), "Assessment created for job.")}>
                  <div><label className="mb-2 block text-xs text-slate-400">Assessment title</label><input name="title" required className={inputClass} defaultValue={`${job.title} assessment`} /></div>
                  <div><label className="mb-2 block text-xs text-slate-400">Skill category</label><input name="skill" className={inputClass} defaultValue={job.required_skills.split(/[,;]/)[0]?.trim() || "Core skills"} /></div>
                  <div><label className="mb-2 block text-xs text-slate-400">Difficulty</label><select name="difficulty" className={inputClass}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></div>
                  <div className="grid grid-cols-2 gap-3"><div><label className="mb-2 block text-xs text-slate-400">Duration (min)</label><input name="duration" type="number" min="1" max="180" defaultValue="30" className={inputClass} /></div><div><label className="mb-2 block text-xs text-slate-400">Question count</label><input name="question_count" type="number" min="1" max="50" defaultValue="5" className={inputClass} /></div></div>
                  <button className={`${buttonClass} md:col-span-2`} disabled={submitting}>{submitting ? "Creating…" : "Create assessment"}</button>
                </form>}</details>)}</div>}
              </Panel>
            )}
          </>
        )}
      </main>
    </DashboardLayout>
  );
}
