"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Breadcrumbs, DifficultyBadge, PracticeNav } from "@/components/arena";
import { practiceService, type PracticeRecommendation } from "@/services/practice.service";
import { ArrowRight, Compass, Sparkles } from "lucide-react";

function RecommendationsInner() {
  const [recommendations, setRecommendations] = useState<PracticeRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emptyMessage, setEmptyMessage] = useState("");

  useEffect(() => {
    let active = true;
    practiceService
      .recommendations()
      .then((data) => {
        if (!active) return;
        setRecommendations(data.recommendations);
        setEmptyMessage(data.message || "No practice recommendation is currently available.");
      })
      .catch(() => {
        if (active) setError("Recommendations are unavailable. Please try again later.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <main className="mx-auto max-w-6xl space-y-7 p-4 sm:p-7">
        <Breadcrumbs
          items={[
            { label: "Practice Hub", href: "/practice" },
            { label: "Recommendations", href: "/practice/recommendations", active: true },
          ]}
        />
        <PracticeNav />

        <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0E1524] via-[#0B0F17] to-[#141C2E] p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
              <Compass className="h-3.5 w-3.5 text-cyan-400" />
              <span>Practice recommendations</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Personalized Next Steps
            </h1>
            <p className="max-w-2xl text-sm sm:text-base text-slate-300">
              Recommendations are derived from your saved practice submissions. XP and completion are recorded only after a submission is evaluated.
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-white">Recommended Focus Areas</h2>
            <p className="text-xs text-slate-400">Based on recorded submission results.</p>
          </div>

          {error ? (
            <div role="alert" className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-300">
              {error}
            </div>
          ) : loading ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#0E1524] p-6 text-sm text-slate-400">
              Loading recommendations…
            </div>
          ) : recommendations.length === 0 ? (
            <div className="rounded-2xl border border-white/[0.08] bg-[#0E1524] p-6 text-sm text-slate-400">
              {emptyMessage}
            </div>
          ) : (
            recommendations.map((recommendation) => (
              <div
                key={recommendation.id}
                className="rounded-2xl border border-white/[0.08] bg-[#0E1524] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                      Recorded activity
                    </span>
                    <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] font-mono text-slate-300">
                      {recommendation.category}
                    </span>
                    <DifficultyBadge difficulty={recommendation.difficulty} />
                  </div>
                  <h3 className="text-lg font-bold text-white">{recommendation.title}</h3>
                  <div className="rounded-xl bg-[#070A0F] p-3 border border-white/5 text-xs text-slate-300 flex items-start gap-2.5">
                    <Sparkles className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                    <p>{recommendation.reason}</p>
                  </div>
                </div>
                <Link
                  href={recommendation.href}
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-blue-500"
                >
                  <span>Start Practice</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))
          )}
        </section>
      </main>
    </DashboardLayout>
  );
}

export default function RecommendationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070A0F]" />}>
      <RecommendationsInner />
    </Suspense>
  );
}
