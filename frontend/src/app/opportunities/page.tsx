"use client";

import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { ArrowUpRight, BriefcaseBusiness, MapPin, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import api from "@/lib/api";

type CompanyOpening = {
  job_id: number;
  company_id: number;
  company_name: string;
  title: string;
  location: string;
  employment_type: string;
  remote_allowed: boolean;
  description: string;
  required_skills: string;
  assessment_available: boolean;
};

type StudentApplication = {
  application_id: number;
  job_id: number;
  company_name: string;
  job_title: string;
  status: string;
  consent_to_recruiters: boolean;
  assessment_config_id: string | null;
  assessment_status: string;
};

function errorMessage(error: unknown): string {
  if (isAxiosError(error) && typeof error.response?.data?.detail === "string") return error.response.data.detail;
  return error instanceof Error ? error.message : "Opportunities could not be loaded.";
}

export default function OpportunitiesPage() {
  const [openings, setOpenings] = useState<CompanyOpening[]>([]);
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [consentByJob, setConsentByJob] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [submittingJobId, setSubmittingJobId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let active = true;
    void Promise.all([
      api.get<CompanyOpening[]>("/company/openings"),
      api.get<StudentApplication[]>("/company/my-applications"),
    ]).then(([openingResponse, applicationResponse]) => {
      if (!active) return;
      setOpenings(openingResponse.data);
      setApplications(applicationResponse.data);
    }).catch((loadError: unknown) => {
      if (active) setError(errorMessage(loadError));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [refreshVersion]);

  async function apply(jobId: number) {
    setSubmittingJobId(jobId);
    setError(null);
    setNotice(null);
    try {
      await api.post("/company/applications", {
        job_id: jobId,
        consent_to_recruiters: consentByJob[jobId] ?? false,
      });
      setNotice("Application submitted. Candidate details remain governed by your privacy settings and this consent choice.");
      setRefreshVersion((version) => version + 1);
    } catch (applyError) {
      setError(errorMessage(applyError));
    } finally {
      setSubmittingJobId(null);
    }
  }

  const appliedJobIds = new Set(applications.map((application) => application.job_id));

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-6xl space-y-6 pb-8">
        <header className="border-b border-white/10 pb-5">
          <p className="text-xs font-semibold uppercase text-cyan-300">Career opportunities</p>
          <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Company openings</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Open roles from verified companies. Apply with control over recruiter-sharing consent.</p>
        </header>
        {error && <div role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm text-rose-200">{error}</div>}
        {notice && <div role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 text-sm text-emerald-200">{notice}</div>}

        <section className="rounded-2xl border border-white/10 bg-[#0b1020] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-2"><BriefcaseBusiness size={18} className="text-cyan-300" /><h2 className="font-semibold text-white">Open roles · {openings.length}</h2></div>
          {loading ? <p className="text-sm text-slate-400">Loading verified openings…</p>
            : openings.length === 0 ? <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-sm text-slate-400">There are no open roles from verified companies right now.</p>
              : <div className="grid gap-4 xl:grid-cols-2">{openings.map((job) => {
                const applied = appliedJobIds.has(job.job_id);
                return (
                  <article key={job.job_id} className="flex min-w-0 flex-col rounded-xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="text-lg font-semibold text-white">{job.title}</h3><p className="mt-1 text-sm text-slate-300">{job.company_name}</p></div><span className="shrink-0 rounded-full border border-cyan-400/15 bg-cyan-400/5 px-2.5 py-1 text-[10px] capitalize text-cyan-100">{job.employment_type.replaceAll("_", " ")}</span></div>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400"><MapPin size={13} />{job.location || (job.remote_allowed ? "Remote" : "Location not specified")}{job.remote_allowed ? " · Remote allowed" : ""}</p>
                    <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-400">{job.description || "No role description provided."}</p>
                    <p className="mt-4 text-xs text-cyan-100">Required skills: {job.required_skills || "Not specified"}</p>
                    {job.assessment_available && <p className="mt-2 flex items-center gap-1.5 text-xs text-violet-200"><ShieldCheck size={13} />Company assessment available after application</p>}
                    {!applied && <label className="mt-5 flex items-start gap-2.5 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs leading-5 text-slate-400"><input type="checkbox" checked={consentByJob[job.job_id] ?? false} onChange={(event) => setConsentByJob((current) => ({ ...current, [job.job_id]: event.target.checked }))} className="mt-1 accent-cyan-400" /><span>I consent to recruiter review for this application. Contact and skill details are shared only when enabled in my privacy settings.</span></label>}
                    <div className="mt-auto flex items-center justify-between gap-3 pt-5"><span className="text-xs text-slate-500">{applied ? `Application: ${applications.find((item) => item.job_id === job.job_id)?.status || "submitted"}` : "Application status is stored in your account."}</span>{applied ? <span className="rounded-lg border border-emerald-400/20 px-3 py-2 text-xs font-semibold text-emerald-200">Applied</span> : <button type="button" className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={submittingJobId === job.job_id} onClick={() => void apply(job.job_id)}>{submittingJobId === job.job_id ? "Applying…" : "Apply"}<ArrowUpRight size={14} /></button>}</div>
                  </article>
                );
              })}</div>}
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0b1020] p-5 sm:p-6">
          <h2 className="mb-4 font-semibold text-white">My applications</h2>
          {loading ? <p className="text-sm text-slate-400">Loading applications…</p> : applications.length === 0 ? <p className="text-sm text-slate-400">You have not applied to any openings yet.</p> : <div className="divide-y divide-white/5">{applications.map((application) => <div key={application.application_id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium text-white">{application.job_title}</p><p className="mt-1 text-xs text-slate-400">{application.company_name}</p></div><div className="text-right"><p className="text-xs capitalize text-slate-300">{application.status.replaceAll("_", " ")}</p><p className="mt-1 text-[10px] text-slate-500">Assessment: {application.assessment_status.replaceAll("_", " ")}</p></div></div>)}</div>}
        </section>
      </main>
    </DashboardLayout>
  );
}
