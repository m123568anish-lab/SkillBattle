"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { collegeService, CollegeDashboard } from "@/services/college.service";
import { Building2, Users, UserCheck, Award, BarChart3, TrendingUp, AlertTriangle, CheckCircle2, ChevronRight, Layers, Plus, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function CollegeDashboardPage() {
  const [data, setData] = useState<CollegeDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await collegeService.getCollegeDashboard();
      setData(res);
    } catch (err: any) {
      console.error("Failed to load college dashboard:", err);
      setErrorMsg(err.response?.data?.detail || "Could not load college analytics. Ensure your account has Placement Officer / College Staff privileges or register your college.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-500 tracking-tight">
            🏫 Placement Cell Command Center
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {data?.college_name ? `${data.college_name} · Institutional Placement Analytics & Assessment Oversight` : "Institutional Placement Analytics & Assessment Oversight"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/college/register"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
          >
            <Building2 className="h-4 w-4" /> Register New College
          </Link>
          <Link
            href="/college/assessments"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" /> Create Assessment
          </Link>
        </div>
      </div>

      {errorMsg ? (
        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-8 text-center space-y-4">
          <ShieldAlert className="mx-auto h-12 w-12 text-rose-400" />
          <h2 className="text-xl font-bold text-white">Access Notification</h2>
          <p className="text-sm text-rose-200 max-w-md mx-auto">{errorMsg}</p>
          <div className="flex justify-center gap-4 pt-2">
            <Link
              href="/college/register"
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-6 py-2.5 text-xs font-bold text-white hover:opacity-90 transition"
            >
              Register Your Institution
            </Link>
            <Link
              href="/college/my-assessments"
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition"
            >
              Go to Student Portal
            </Link>
          </div>
        </div>
      ) : loading || !data ? (
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-3xl border border-white/10 bg-slate-900/40 animate-pulse p-6" />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Metric Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Total Enrolled Students</span>
                <Users className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{data.total_students}</div>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5" /> {data.active_students} Active Candidates
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Assessment Participation</span>
                <Award className="h-5 w-5 text-violet-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{data.assessment_participation_rate}%</div>
              <p className="text-xs text-slate-400">Target participation: 80%+</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Avg Performance Score</span>
                <BarChart3 className="h-5 w-5 text-teal-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{data.average_performance_score}%</div>
              <p className="text-xs text-emerald-400">Pass Rate: {data.pass_rate}%</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-400">Placement Prep Readiness</span>
                <TrendingUp className="h-5 w-5 text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-white">{data.placement_prep_progress}%</div>
              <p className="text-xs text-slate-400">Curriculum Completion</p>
            </div>
          </div>

          {/* Quick Management Shortcuts */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/college/departments"
              className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl flex items-center justify-between hover:bg-slate-800/60 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cyan-500/20 p-2.5 text-cyan-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Departments & Batches</h4>
                  <p className="text-xs text-slate-400">Manage academic units</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition" />
            </Link>

            <Link
              href="/college/students"
              className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl flex items-center justify-between hover:bg-slate-800/60 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-violet-500/20 p-2.5 text-violet-400">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Student Roster</h4>
                  <p className="text-xs text-slate-400">Enroll & track candidates</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition" />
            </Link>

            <Link
              href="/college/assessments"
              className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-xl flex items-center justify-between hover:bg-slate-800/60 transition group"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-teal-500/20 p-2.5 text-teal-400">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Assessments & Results</h4>
                  <p className="text-xs text-slate-400">Create, schedule, and grade</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-white transition" />
            </Link>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Skill Distribution Breakdown */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-400" /> Skill Distribution & Performance
              </h3>
              <div className="space-y-4">
                {data.skill_distribution?.map((item) => (
                  <div key={item.skill} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold text-slate-300">
                      <span>{item.skill}</span>
                      <span>{item.average_score}% Avg</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.average_score >= 80
                            ? "bg-emerald-500"
                            : item.average_score >= 60
                            ? "bg-cyan-500"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${item.average_score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Department Performance & Weak Area Alerts */}
            <div className="space-y-6">
              {/* Department Analytics */}
              <div className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-violet-400" /> Department Performance Breakdown
                </h3>
                <div className="space-y-3">
                  {data.department_analytics?.map((d) => (
                    <div key={d.department_name} className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-800/40 p-3 text-xs">
                      <div>
                        <div className="font-bold text-white">{d.department_name}</div>
                        <div className="text-[10px] text-slate-400">{d.total_students} Enrolled Candidates</div>
                      </div>
                      <div className="text-right">
                        <div className="font-extrabold text-cyan-400">{d.avg_performance}% Avg</div>
                        <div className="text-[10px] text-emerald-400">{d.pass_rate}% Pass Rate</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weak Areas Alert Card */}
              <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-3">
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2 uppercase tracking-wider">
                  <AlertTriangle className="h-4 w-4 text-amber-400" /> College Weak Areas (Intervention Needed)
                </h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  {data.weak_areas?.map((w, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
