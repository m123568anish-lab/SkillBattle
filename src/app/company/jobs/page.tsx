"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/auth/RoleGuard";
import { Briefcase, Plus, Search, Building2, MapPin, DollarSign, Clock } from "lucide-react";
import Link from "next/link";

export default function CompanyJobsPage() {
  const mockJobs = [
    { id: "1", title: "Senior Backend Engineer (Python/FastAPI)", location: "Remote / San Francisco", type: "Full-time", salary: "$140k - $180k", applicants: 84 },
    { id: "2", title: "Full Stack Developer (Next.js & React)", location: "Hybrid / New York", type: "Full-time", salary: "$120k - $150k", applicants: 112 },
    { id: "3", title: "AI/ML Systems Specialist", location: "Remote", type: "Full-time", salary: "$160k - $210k", applicants: 45 },
  ];

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

          <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-500/20 hover:opacity-90 transition">
            <Plus className="h-4 w-4" /> Post New Job
          </button>
        </div>

        <div className="space-y-4">
          {mockJobs.map((job) => (
            <div key={job.id} className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-violet-500/40 transition">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">{job.title}</h3>
                <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><MapPin size={14} className="text-cyan-400" /> {job.location}</span>
                  <span className="flex items-center gap-1"><Clock size={14} className="text-violet-400" /> {job.type}</span>
                  <span className="flex items-center gap-1"><DollarSign size={14} className="text-emerald-400" /> {job.salary}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-lg font-extrabold text-cyan-300">{job.applicants}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Applicants</div>
                </div>
                <button className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 transition">
                  View Candidates
                </button>
              </div>
            </div>
          ))}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
