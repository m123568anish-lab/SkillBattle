"use client";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ScoreCard from "@/components/dashboard/ScoreCard";
import AnalysisSummary from "@/components/dashboard/AnalysisSummary";
import StrengthsCard from "@/components/dashboard/StrengthsCard";
import WeaknessesCard from "@/components/dashboard/WeaknessesCard";
import RecentResumes from "@/components/dashboard/RecentResumes";

export default function DashboardPage() {
    return (
        <main className="min-h-screen bg-slate-50 p-8">

            <DashboardHeader />

            <div className="mt-8 grid gap-6 lg:grid-cols-4">

                <ScoreCard
                    title="Resume Score"
                    score={88}
                />

                <ScoreCard
                    title="ATS Score"
                    score={91}
                />

                <ScoreCard
                    title="Placement"
                    score={86}
                />

                <ScoreCard
                    title="Portfolio"
                    score={82}
                />

            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">

                <div className="lg:col-span-2">

                    <AnalysisSummary />

                </div>

                <RecentResumes />

            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">

                <StrengthsCard />

                <WeaknessesCard />

            </div>

        </main>
    );
}