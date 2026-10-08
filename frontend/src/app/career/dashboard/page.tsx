"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ScoreCard from "@/components/dashboard/ScoreCard";
import AnalysisSummary from "@/components/dashboard/AnalysisSummary";
import StrengthsCard from "@/components/dashboard/StrengthsCard";
import WeaknessesCard from "@/components/dashboard/WeaknessesCard";
import RecentResumes from "@/components/dashboard/RecentResumes";
import { api } from "@/lib/api";

interface ResumeData {
  id?: string;
  title?: string;
  ats_score?: number;
  placement_score?: number;
  ai_summary?: string;
  skills?: string[];
  projects?: any[];
}

export default function DashboardPage() {
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const response = await api.get<ResumeData | null>("/resume");
        if (active) {
          setResume(response.data);
        }
      } catch (err: any) {
        if (active) {
          setError("Unable to load resume scores.");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  const atsScore = resume?.ats_score ?? 0;
  const placementScore = resume?.placement_score ?? 0;
  const resumeScore = Math.round((atsScore + placementScore) / 2);
  const projectCount = resume?.projects?.length ?? 0;
  const portfolioScore = Math.min(100, projectCount * 35);

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-8 text-white">
      <DashboardHeader />

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreCard title="Resume Score" score={loading ? 0 : resumeScore} />
        <ScoreCard title="ATS Score" score={loading ? 0 : atsScore} />
        <ScoreCard title="Placement Readiness" score={loading ? 0 : placementScore} />
        <ScoreCard title="Portfolio Impact" score={loading ? 0 : portfolioScore} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AnalysisSummary summary={resume?.ai_summary} />
        </div>
        <RecentResumes resumeTitle={resume?.title} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <StrengthsCard skills={resume?.skills} />
        <WeaknessesCard projectCount={projectCount} />
      </div>
    </main>
  );
}