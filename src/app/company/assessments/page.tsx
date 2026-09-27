"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/auth/RoleGuard";
import { Award, Plus, Clock, Users, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function CompanyAssessmentsPage() {
  const mockAssessments = [
    { id: "1", title: "Enterprise Senior Python Coding Challenge", duration: "60 mins", testCases: 15, candidates: 142, avgScore: 82 },
    { id: "2", title: "Full Stack React & System Design Test", duration: "90 mins", testCases: 20, candidates: 98, avgScore: 78 },
  ];

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

          <Link
            href="/battle/create"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-500/20 hover:opacity-90 transition"
          >
            <Plus className="h-4 w-4" /> Create Assessment Config
          </Link>
        </div>

        <div className="space-y-4">
          {mockAssessments.map((a) => (
            <div key={a.id} className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-cyan-500/40 transition">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">{a.title}</h3>
                <div className="flex gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Clock size={14} className="text-cyan-400" /> {a.duration}</span>
                  <span className="flex items-center gap-1"><Award size={14} className="text-violet-400" /> {a.testCases} Test Cases</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-lg font-extrabold text-emerald-400">{a.avgScore}%</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Avg Score</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-cyan-300">{a.candidates}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Assessed</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
