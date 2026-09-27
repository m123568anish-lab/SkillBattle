"use client";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import RoleGuard from "@/components/auth/RoleGuard";
import { Users, Search, Filter, Award, CheckCircle2, UserCheck, Star } from "lucide-react";

export default function CompanyCandidatesPage() {
  const mockCandidates = [
    { id: "1", name: "Alex Chen", rating: 1450, level: 12, skills: ["Python", "FastAPI", "PostgreSQL", "Docker"], score: 94, status: "Shortlisted" },
    { id: "2", name: "Priya Sharma", rating: 1380, level: 10, skills: ["React", "Next.js", "TypeScript", "Tailwind"], score: 89, status: "Assessed" },
    { id: "3", name: "Marcus Vance", rating: 1520, level: 15, skills: ["PyTorch", "System Design", "C++", "CUDA"], score: 92, status: "Interview Scheduled" },
  ];

  return (
    <RoleGuard allowedRoles={["company", "company_admin", "recruiter"]}>
      <DashboardLayout>
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              🔍 Candidate Discovery & Talent Pool
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Filter candidates by verified SkillBattle ratings, coding scores, and assessment performance.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search candidates by skill..."
                className="h-10 rounded-xl border border-white/10 bg-white/5 pl-9 pr-4 text-xs text-white outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {mockCandidates.map((c) => (
            <div key={c.id} className="rounded-3xl border border-white/10 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4 hover:border-cyan-500/40 transition">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">{c.name}</h3>
                  <div className="text-xs text-cyan-400 font-semibold">Level {c.level} · Rating {c.rating}</div>
                </div>
                <div className="rounded-xl bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300 border border-cyan-500/20">
                  {c.score}% Match
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {c.skills.map((s) => (
                  <span key={s} className="rounded-lg bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-slate-300 border border-white/10">
                    {s}
                  </span>
                ))}
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">{c.status}</span>
                <button className="rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-90 transition">
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      </DashboardLayout>
    </RoleGuard>
  );
}
