"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { ArrowRight, Briefcase, CheckCircle2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { companyService, type CandidateApplication, type JobOpening } from "@/services/company.service";

export default function JobOpeningsPage() {
  const router = useRouter();
  const [openings, setOpenings] = useState<JobOpening[]>([]);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [consent, setConsent] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    try {
      const [jobs, myApplications] = await Promise.all([
        companyService.listOpenings(),
        companyService.listMyApplications(),
      ]);
      setOpenings(jobs);
      setApplications(myApplications);
    } catch (loadError: any) {
      setError(loadError?.response?.data?.detail || "Unable to load job openings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const apply = async (jobId: number) => {
    setBusyId(jobId);
    setError("");
    setMessage("");
    try {
      await companyService.apply(jobId, Boolean(consent[jobId]));
      setApplications(await companyService.listMyApplications());
      setMessage("Application submitted.");
    } catch (applyError: any) {
      setError(applyError?.response?.data?.detail || "Unable to submit this application.");
    } finally {
      setBusyId(null);
    }
  };

  const updateConsent = async (applicationId: number, value: boolean) => {
    setBusyId(applicationId);
    setError("");
    try {
      await companyService.updateApplicationConsent(applicationId, value);
      setApplications(await companyService.listMyApplications());
    } catch (consentError: any) {
      setError(consentError?.response?.data?.detail || "Unable to update recruiter consent.");
    } finally {
      setBusyId(null);
    }
  };

  const startAssessment = async (applicationId: number) => {
    setBusyId(applicationId);
    setError("");
    try {
      const battle = await companyService.startApplicationAssessment(applicationId);
      router.push(`/battle/${battle.id}`);
    } catch (assessmentError: any) {
      setError(assessmentError?.response?.data?.detail || "Unable to start this assessment.");
      setBusyId(null);
    }
  };

  return (
    <DashboardLayout>
      <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-cyan-300"><Briefcase size={18} /><span className="text-xs font-semibold uppercase">Career opportunities</span></div>
          <h1 className="text-2xl font-bold text-white">Jobs matched to verified skills</h1>
          <p className="mt-2 text-sm text-slate-400">Apply to a role, choose what to share, and complete its company assessment.</p>
        </div>
        <Link href="/skill-profile" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">View verified skill profile</Link>
      </header>

      {message && <p role="status" className="mb-4 flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 size={16} />{message}</p>}
      {error && <p role="alert" className="mb-4 flex items-center gap-2 text-sm text-rose-300"><ShieldAlert size={16} />{error}</p>}

      {loading ? <p className="py-8 text-sm text-slate-400">Loading openings…</p> : openings.length === 0 ? (
        <p className="border-y border-white/10 py-8 text-sm text-slate-400">No verified job openings are available right now.</p>
      ) : (
        <div className="divide-y divide-white/10 border-y border-white/10">
          {openings.map((job) => {
            const application = applications.find((item) => item.job_id === job.job_id);
            return (
              <article key={job.job_id} className="grid gap-4 py-6 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-white">{job.title}</h2>
                    <span className="rounded-md border border-emerald-500/20 px-2 py-0.5 text-[11px] text-emerald-300">{job.company_name}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{job.location || "Location flexible"} · {job.employment_type}{job.remote_allowed ? " · Remote" : ""}</p>
                  {job.description && <p className="mt-3 max-w-3xl text-sm text-slate-300">{job.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(job.required_skills || "").split(/[;,]/).map((skill) => skill.trim()).filter(Boolean).map((skill) => (
                      <span key={skill} className="rounded-md bg-white/5 px-2 py-1 text-xs text-slate-300">{skill}</span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 lg:items-end">
                  {application ? (
                    <>
                      <span className="text-xs text-slate-300">Application: {application.status}</span>
                      {application.assessment_config_id && application.assessment_status !== "completed" && (
                        <button type="button" disabled={busyId === application.application_id} onClick={() => void startAssessment(application.application_id)} className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                          {busyId === application.application_id ? "Starting…" : "Start company assessment"}<ArrowRight size={16} />
                        </button>
                      )}
                      {application.assessment_status === "completed" && <span className="text-sm font-semibold text-emerald-300">Assessment completed</span>}
                      <label className="flex max-w-xs items-start gap-2 text-xs text-slate-400">
                        <input type="checkbox" checked={application.consent_to_recruiters} disabled={busyId === application.application_id} onChange={(event) => void updateConsent(application.application_id, event.target.checked)} />
                        Allow this company to see my recruitment profile
                      </label>
                    </>
                  ) : (
                    <>
                      <label className="flex max-w-xs items-start gap-2 text-xs text-slate-400">
                        <input type="checkbox" checked={Boolean(consent[job.job_id])} onChange={(event) => setConsent((current) => ({ ...current, [job.job_id]: event.target.checked }))} />
                        I consent to share my profile with this company
                      </label>
                      <button type="button" disabled={busyId === job.job_id} onClick={() => void apply(job.job_id)} className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50">
                        {busyId === job.job_id ? "Applying…" : "Apply"}
                      </button>
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
