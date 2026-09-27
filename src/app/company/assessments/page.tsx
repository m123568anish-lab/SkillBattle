"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/auth/RoleGuard";
import { Award, Plus, Clock, CheckCircle2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { companyService, type Company, type JobPosting } from "@/services/company.service";

export default function CompanyAssessmentsPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingJob, setSavingJob] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const currentCompany = await companyService.getMyCompany();
        setCompany(currentCompany);
        if (currentCompany) setJobs(await companyService.listJobs());
      } catch (loadError) {
        console.error("Company assessment load error:", loadError);
        setError("Unable to load company assessments.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function createAssessment(job: JobPosting) {
    const skills = [...new Set((job.required_skills || "Algorithms").split(/[;,]/).map((item) => item.trim()).filter(Boolean))];
    if (skills.length === 0) skills.push("Algorithms");
    setSavingJob(job.id);
    setError("");
    setMessage("");
    try {
      const config = await companyService.createJobAssessment(job.id, {
        title: title.trim() || `${job.title} assessment`,
        description: `Skill assessment for ${job.title}`,
        difficulty: "medium",
        duration_minutes: Math.max(10, skills.length * 10),
        question_count: skills.length,
        sections: skills.map((skill, index) => ({
          title: skill,
          question_type: "mcq",
          skill_category: skill,
          question_count: 1,
          weight: 1 / skills.length,
          duration_minutes: Math.max(5, Math.floor(30 / skills.length)),
          negative_marking: false,
        })),
      });
      setJobs((current) => current.map((item) => item.id === job.id ? { ...item, assessment_config_id: config.id } : item));
      setMessage(`Assessment created for ${job.title}.`);
      setTitle("");
    } catch (saveError: any) {
      setError(saveError?.response?.data?.detail || "Unable to create this assessment.");
    } finally {
      setSavingJob(null);
    }
  }

  return (
    <RoleGuard allowedRoles={["company", "company_admin", "recruiter"]}>
      <DashboardLayout>
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              🏆 Enterprise Hiring Assessments
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Create, configure, and issue automated coding and technical assessments to candidates.
            </p>
          </div>

          <Link href="/company/jobs" className="text-sm font-semibold text-cyan-300 hover:text-cyan-200">Manage job requirements</Link>
        </div>

        {message && <p role="status" className="mb-5 flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 size={16} />{message}</p>}
        {error && <p role="alert" className="mb-5 flex items-center gap-2 text-sm text-rose-300"><ShieldAlert size={16} />{error}</p>}
        {title && <div className="mb-6 max-w-xl"><label className="block text-xs font-bold text-slate-400">Assessment title<input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2.5 text-sm text-white" placeholder="Defaults to the job title" /></label></div>}

        <div className="space-y-4">
          {loading ? <p className="py-8 text-sm text-slate-400">Loading jobs…</p> : jobs.length === 0 ? (
            <p className="border-y border-white/10 py-8 text-sm text-slate-400">Post a verified company job before creating its assessment. <Link href="/company/jobs" className="text-cyan-300 underline">Manage jobs</Link></p>
          ) : company?.status !== "verified" ? (
            <p className="flex items-center gap-2 border-y border-amber-500/20 bg-amber-500/5 py-8 text-sm text-amber-200"><ShieldAlert size={18} />Assessment creation is available after company verification.</p>
          ) : jobs.map((job) => (
            <div key={job.id} className="flex flex-col justify-between gap-4 border-b border-white/10 py-5 md:flex-row md:items-center">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">{job.assessment_config_id ? `${job.title} assessment` : job.title}</h3>
                <p className="text-xs text-slate-400">Required skills: {job.required_skills || "Algorithms"}</p>
                <div className="flex gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Clock size={14} className="text-cyan-400" /> {job.assessment_config_id ? "Assessment attached" : "No assessment yet"}</span>
                  <span className="flex items-center gap-1"><Award size={14} className="text-violet-400" /> {job.status}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                {job.assessment_config_id ? <CheckCircle2 className="text-emerald-400" /> : <button type="button" disabled={savingJob === job.id} onClick={() => void createAssessment(job)} className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"><Plus size={15} />{savingJob === job.id ? "Creating…" : "Create assessment"}</button>}
              </div>
            </div>
          ))}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
