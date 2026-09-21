"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "react-hot-toast";
import { Trophy, Award, CheckCircle, ShieldCheck, Sparkles, Download, Share2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ScorecardData {
  user_id: string;
  overall_readiness_score: number;
  grade: string;
  dsa_proficiency: number;
  system_design_grade: string;
  core_cs_score: number;
  total_battles_won: number;
  top_company_eligibility: string[];
  recommendations: string[];
}

export default function PlacementScorecardPage() {
  const [data, setData] = useState<ScorecardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScorecard();
  }, []);

  async function fetchScorecard() {
    try {
      const res = await api.get("/placement/scorecard");
      setData(res.data);
    } catch (err) {
      toast.error("Failed to load placement scorecard");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-semibold text-emerald-300">
            <Award className="h-4 w-4 text-emerald-400" />
            Verified Placement Index Report
          </div>
          <h1 className="mt-3 text-4xl font-extrabold text-white">
            Student Placement Readiness Scorecard
          </h1>
          <p className="mt-2 text-slate-400">
            Comprehensive evaluation of DSA proficiency, System Design, Core CS, and battle contest ratings.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Top Stats Banner */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 via-slate-900/80 to-slate-950 p-8 shadow-2xl backdrop-blur-xl">
              <div className="grid gap-6 md:grid-cols-3 text-center">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-sm font-medium text-slate-400">Overall Readiness Index</span>
                  <div className="mt-2 text-5xl font-black text-emerald-400">
                    {data.overall_readiness_score}<span className="text-2xl text-slate-400">/100</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-sm font-medium text-slate-400">Placement Grade</span>
                  <div className="mt-2 text-5xl font-black text-cyan-400">
                    {data.grade}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-sm font-medium text-slate-400">Battles Won</span>
                  <div className="mt-2 text-5xl font-black text-violet-400">
                    {data.total_battles_won}
                  </div>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="mt-8 space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1 font-medium">
                    <span className="text-slate-300">DSA & Algorithms Mastery</span>
                    <span className="text-emerald-400">{data.dsa_proficiency}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      style={{ width: `${data.dsa_proficiency}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1 font-medium">
                    <span className="text-slate-300">Core CS Fundamentals (DBMS, OS, CN)</span>
                    <span className="text-cyan-400">{data.core_cs_score}%</span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                      style={{ width: `${data.core_cs_score}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Target Recruiters Eligibility */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-cyan-400" />
                Target Recruiters & Eligibility Pool
              </h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {data.top_company_eligibility.map((comp) => (
                  <span
                    key={comp}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 font-semibold text-emerald-300"
                  >
                    <CheckCircle className="h-4 w-4 text-emerald-400" />
                    {comp}
                  </span>
                ))}
              </div>
            </div>

            {/* AI Action Plan Recommendations */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-400" />
                AI Placement Improvement Plan
              </h3>
              <ul className="mt-4 space-y-3">
                {data.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-300 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-500/20 font-bold text-violet-400 text-xs">
                      {idx + 1}
                    </span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/battle/company-speedrun"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 font-bold text-white shadow-lg hover:bg-violet-500 transition"
              >
                Practice Company Speedrun
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
