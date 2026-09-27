"use client";

import { FormEvent, useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/auth/RoleGuard";
import { Briefcase, Plus, MapPin, DollarSign, Clock, CheckCircle2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { companyService, type Company, type JobPosting } from "@/services/company.service";

export default function CompanyJobsPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    location: "",
    employment_type: "full_time",
    remote_allowed: false,
    description: "",
    required_skills: "",
    compensation: "",
    status: "open",
  });

  useEffect(() => {
    async function load() {
      try {
        const currentCompany = await companyService.getMyCompany();
        setCompany(currentCompany);
        if (currentCompany) setJobs(await companyService.listJobs());
      } catch (loadError) {
        console.error("Company jobs load error:", loadError);
        setError("Unable to load company jobs.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  const handleCreateJob = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const job = await companyService.createJob(form);
      setJobs((current) => [job, ...current]);
      setForm({
        title: "",
        location: "",
        employment_type: "full_time",
        remote_allowed: false,
        description: "",
        required_skills: "",
        compensation: "",
        status: "open",
      });
      setShowForm(false);
      setMessage("Job posted.");
    } catch (saveError: any) {
      setError(saveError?.response?.data?.detail || "Unable to create this job.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["company", "company_admin", "recruiter"]}>
      <DashboardLayout>
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              💼 Job Postings & Campaigns
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Manage enterprise job listings, applicant screening, and skill criteria.
            </p>
          </div>

          <button onClick={() => setShowForm((value) => !value)} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-500/20 hover:opacity-90 transition">
            <Plus className="h-4 w-4" /> Post New Job
          </button>
        </div>

        {message && <p role="status" className="mb-5 flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 size={16} />{message}</p>}
        {error && <p role="alert" className="mb-5 flex items-center gap-2 text-sm text-rose-300"><ShieldAlert size={16} />{error}</p>}

        {showForm && company?.status === "verified" && (
          <form onSubmit={handleCreateJob} className="mb-8 grid gap-4 border-y border-white/10 py-6 md:grid-cols-2">
            <label className="space-y-1 text-xs text-slate-400">Job title
              <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white" />
            </label>
            <label className="space-y-1 text-xs text-slate-400">Location
              <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white" />
            </label>
            <label className="space-y-1 text-xs text-slate-400">Required skills (comma separated)
              <input required value={form.required_skills} onChange={(event) => setForm({ ...form, required_skills: event.target.value })} placeholder="Algorithms, Python" className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white" />
            </label>
            <label className="space-y-1 text-xs text-slate-400">Compensation
              <input value={form.compensation} onChange={(event) => setForm({ ...form, compensation: event.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white" />
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={form.remote_allowed} onChange={(event) => setForm({ ...form, remote_allowed: event.target.checked })} />Remote-friendly</label>
            <label className="space-y-1 text-xs text-slate-400 md:col-span-2">Role description
              <textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white" />
            </label>
            <button type="submit" disabled={saving} className="rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 md:col-span-2">{saving ? "Posting…" : "Post job"}</button>
          </form>
        )}

        {!loading && !company && <p className="mb-6 border-y border-white/10 py-5 text-sm text-slate-400">Register a company to manage job postings. <Link href="/company/register" className="text-cyan-300 underline">Register company</Link></p>}
        {!loading && company && company.status !== "verified" && <p className="mb-6 flex items-center gap-2 border-y border-amber-500/20 bg-amber-500/5 py-5 text-sm text-amber-200"><ShieldAlert size={16} />Company verification is {company.status}. Posting jobs will be available after approval.</p>}

        <div className="space-y-4">
          {loading ? <p className="py-8 text-sm text-slate-400">Loading jobs…</p> : jobs.length === 0 ? <p className="py-8 text-sm text-slate-400">No jobs posted yet.</p> : jobs.map((job) => (
            <div key={job.id} className="flex flex-col justify-between gap-4 border-b border-white/10 py-5 md:flex-row md:items-center">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">{job.title}</h3>
                <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><MapPin size={14} className="text-cyan-400" /> {job.location || "Location not specified"}</span>
                  <span className="flex items-center gap-1"><Clock size={14} className="text-violet-400" /> {job.employment_type || "Full-time"}</span>
                  {job.compensation && <span className="flex items-center gap-1"><DollarSign size={14} className="text-emerald-400" /> {job.compensation}</span>}
                </div>
                <p className="text-xs text-slate-400">Required skills: {job.required_skills || "Not specified"}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-semibold text-cyan-300">{job.assessment_config_id ? "Assessment ready" : "Assessment not set"}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">{job.status}</div>
                </div>
                <Link href={`/company/candidates?job_id=${job.id}`} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10">View candidates</Link>
              </div>
            </div>
          ))}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
