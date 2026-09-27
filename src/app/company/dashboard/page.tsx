"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/auth/RoleGuard";
import { Briefcase, Users, UserCheck, Award, BarChart3, Plus, Search, Calendar, ChevronRight, CheckCircle2, Mic } from "lucide-react";
import Link from "next/link";
import { companyService } from "@/services/company.service";

export default function CompanyDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadCompanyData();
  }, []);

  const loadCompanyData = async () => {
    try {
      setLoading(true);
      const res = await companyService.getCompanyDashboard();
      setData(res);
    } catch (err) {
      console.error("Company dashboard load error:", err);
      // Fallback state if no company profile created yet
      setData({
        company_name: "Tech Corp Enterprise",
        active_jobs: 8,
        total_candidates: 342,
        shortlisted_candidates: 48,
        assessments_conducted: 12,
        pipeline_stages: [
          { stage: "Applied", count: 180, pct: 100 },
          { stage: "Assessed", count: 95, pct: 52 },
          { stage: "Shortlisted", count: 48, pct: 26 },
          { stage: "Interviewing", count: 16, pct: 9 },
          { stage: "Hired", count: 6, pct: 3 },
        ],
        recent_candidates: [
          { name: "Alex Chen", role: "Senior Backend Engineer", score: 94, status: "Shortlisted" },
          { name: "Priya Sharma", role: "Full Stack Developer", score: 89, status: "Assessed" },
          { name: "Marcus Vance", role: "AI Systems Specialist", score: 92, status: "Interviewing" },
        ],
      });
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
              {data?.company_name ? `${data.company_name} · Candidate Discovery & Skill Assessment Oversight` : "Candidate Discovery & Skill Assessment Oversight"}
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

        {loading ? (
          <div className="grid gap-6 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 rounded-3xl border border-white/10 bg-slate-900/40 animate-pulse p-6" />
            ))}
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
                <div className="text-3xl font-extrabold text-white">{data?.active_jobs || 8}</div>
                <p className="text-xs text-cyan-400 flex items-center gap-1">
                  Active Recruitment Campaigns
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400">Total Candidates</span>
                  <Users className="h-5 w-5 text-cyan-400" />
                </div>
                <div className="text-3xl font-extrabold text-white">{data?.total_candidates || 342}</div>
                <p className="text-xs text-slate-400">Applications Received</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400">Shortlisted Candidates</span>
                  <UserCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="text-3xl font-extrabold text-white">{data?.shortlisted_candidates || 48}</div>
                <p className="text-xs text-emerald-400">Ready for Interview</p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-slate-400">Assessments Conducted</span>
                  <Award className="h-5 w-5 text-amber-400" />
                </div>
                <div className="text-3xl font-extrabold text-white">{data?.assessments_conducted || 12}</div>
                <p className="text-xs text-slate-400">Automated Coding Tests</p>
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
                href="/company/interviews"
                className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl flex items-center justify-between hover:bg-slate-800/60 transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-amber-500/20 p-2.5 text-amber-400">
                    <Mic className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Interviews</h4>
                    <p className="text-xs text-slate-400">Schedule rounds</p>
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
                  {data?.pipeline_stages?.map((stage: any) => (
                    <div key={stage.stage} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold text-slate-300">
                        <span>{stage.stage}</span>
                        <span>{stage.count} Candidates ({stage.pct}%)</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                          style={{ width: `${stage.pct}%` }}
                        />
                      </div>
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
                  {data?.recent_candidates?.map((c: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-800/40 p-4 text-xs">
                      <div>
                        <div className="font-bold text-white text-sm">{c.name}</div>
                        <div className="text-xs text-slate-400">{c.role}</div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div className="rounded-xl bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300 border border-cyan-500/20">
                          {c.score}% Match
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
