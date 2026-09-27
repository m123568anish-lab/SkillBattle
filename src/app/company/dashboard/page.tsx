"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/auth/RoleGuard";
import { Briefcase, Users, UserCheck, Award, BarChart3, Plus, ChevronRight, ShieldAlert, Mic } from "lucide-react";
import Link from "next/link";
import { companyService, type Company, type CompanyDashboard } from "@/services/company.service";

export default function CompanyDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [data, setData] = useState<CompanyDashboard | null>(null);

  useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      const companyData = await companyService.getMyCompany();
      setCompany(companyData);
      setData(companyData ? await companyService.getCompanyDashboard() : null);
    } catch (err) {
      console.error("Company dashboard load error:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={["company", "company_admin", "recruiter"]}>
      <DashboardLayout>
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-cyan-300 to-emerald-400 tracking-tight">
              🏢 Recruiter & Enterprise Command Center
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {company?.name ? `${company.name} · Candidate Discovery & Skill Assessment Oversight` : "Candidate Discovery & Skill Assessment Oversight"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/company/jobs"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
            >
              <Briefcase className="h-4 w-4" /> Manage Jobs
            </Link>
            <Link
              href="/company/assessments"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-500/20 hover:opacity-90 transition"
            >
              <Plus className="h-4 w-4" /> Create Hiring Assessment
            </Link>
          </div>
        </div>

        {!loading && !company ? (
          <div className="border-y border-white/10 py-10 text-center">
            <Briefcase className="mx-auto mb-4 h-10 w-10 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Register your company</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">A platform administrator verifies company accounts before they can publish jobs or assess applicants.</p>
            <Link href="/company/register" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500">
              Register Company <ChevronRight size={16} />
            </Link>
          </div>
        ) : loading ? (
          <div className="grid gap-6 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-3xl border border-white/10 bg-slate-900/40 animate-pulse p-6" />
            ))}
          </div>
        ) : !data ? (
          <div className="border-y border-amber-500/20 bg-amber-500/5 py-8 text-center">
            <ShieldAlert className="mx-auto mb-3 h-9 w-9 text-amber-400" />
            <h2 className="font-bold text-white">Company workspace unavailable</h2>
            <p className="mt-2 text-sm text-slate-400">Your company status is {company?.status ?? "unknown"}. Job posting is enabled after platform verification.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top Stat Cards */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400">Active Job Postings</span>
                  <Briefcase className="h-5 w-5 text-violet-400" />
                </div>
                <div className="text-3xl font-extrabold text-white">{data.active_jobs}</div>
                <p className="text-xs text-cyan-400 flex items-center gap-1">
                  Active Recruitment Campaigns
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400">Total Candidates</span>
                  <Users className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="text-3xl font-extrabold text-white">{data.candidates_total}</div>
                <p className="text-xs text-slate-400">Applications Received</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400">Shortlisted Candidates</span>
                  <UserCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="text-3xl font-extrabold text-white">{data.shortlisted_total}</div>
                <p className="text-xs text-emerald-400">Ready for Interview</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400">Job Postings</span>
                  <Award className="h-5 w-5 text-amber-400" />
                </div>
                <div className="text-3xl font-extrabold text-white">{data.jobs_total}</div>
                <p className="text-xs text-slate-400">All company listings</p>
              </div>
            </div>

            {/* Quick Action Navigation */}
            <div className="grid gap-4 sm:grid-cols-4">
              <Link
                href="/company/jobs"
                className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl flex items-center justify-between hover:bg-slate-800/60 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-violet-500/20 p-2.5 text-violet-400">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Post New Job</h4>
                    <p className="text-xs text-slate-400">Define requirements</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition" />
              </Link>

              <Link
                href="/company/candidates"
                className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl flex items-center justify-between hover:bg-slate-800/60 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-cyan-500/20 p-2.5 text-cyan-400">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Discover Talent</h4>
                    <p className="text-xs text-slate-400">Search skill profiles</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition" />
              </Link>

              <Link
                href="/company/assessments"
                className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl flex items-center justify-between hover:bg-slate-800/60 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-teal-500/20 p-2.5 text-teal-400">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Create Test</h4>
                    <p className="text-xs text-slate-400">Company assessment</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition" />
              </Link>

              <Link
                href="/company/candidates"
                className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl flex items-center justify-between hover:bg-slate-800/60 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-amber-500/20 p-2.5 text-amber-400">
                    <Mic className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Shortlisted</h4>
                    <p className="text-xs text-slate-400">Review eligible candidates</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition" />
              </Link>
            </div>

            {/* Pipeline & Candidates Grid */}
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Hiring Pipeline Funnel */}
              <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-violet-400" /> Candidate Hiring Funnel
                </h3>
                <div className="space-y-4">
                  {data.recent_applications.length === 0 ? (
                    <p className="text-sm text-slate-500">Applications will appear here when candidates apply.</p>
                  ) : data.recent_applications.map((application, index) => (
                    <div key={`${application.job}-${index}`} className="flex items-center justify-between gap-4 border-b border-white/5 py-3 last:border-0">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white">{application.candidate}</div>
                        <div className="truncate text-xs text-slate-400">{application.job}</div>
                      </div>
                      <span className="shrink-0 text-xs text-cyan-300">{application.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Candidates */}
              <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-emerald-400" /> Top Assessed Candidates
                </h3>
                <div className="space-y-3">
                  {data.recent_applications.map((c, idx) => (
                    <div key={`${c.job}-${idx}`} className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-800/40 p-4 text-xs">
                      <div>
                        <div className="font-bold text-white text-sm">{c.candidate}</div>
                        <div className="text-xs text-slate-400">{c.job}</div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div className="rounded-xl bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300 border border-cyan-500/20">
                          {c.score}%
                        </div>
                        <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                          {c.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </RoleGuard>
  );
}
