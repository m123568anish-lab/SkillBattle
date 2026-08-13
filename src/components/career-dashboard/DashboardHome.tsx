"use client";

import GaugeGrid from "@/components/analytics/GaugeGrid";
import AnalyticsSection from "@/components/analytics/AnalyticsSection";
import ResumeOverview from "./ResumeOverview";
import AnalysisSummary from "./AnalysisSummary";
import StrengthCard from "./StrengthCard";
import WeaknessCard from "./WeaknessCard";
import RecentResumeCard from "./RecentResumeCard";
import QuickActions from "./QuickActions";

interface DashboardHomeProps {
    resume: any;
    analysis: any;
}

export default function DashboardHome({
    resume,
    analysis,
}: DashboardHomeProps) {
    return (
        <>
            <GaugeGrid analysis={analysis} />

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
                <ResumeOverview resume={resume} />

                <div className="lg:col-span-2">
                    <AnalysisSummary
                        summary={analysis.resume_analysis?.summary ?? ""}
                    />
                </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <StrengthCard
                    strengths={
                        analysis.resume_analysis?.strengths ?? []
                    }
                />

                <WeaknessCard
                    weaknesses={
                        analysis.resume_analysis?.weaknesses ?? []
                    }
                />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
                <RecentResumeCard />

                <QuickActions />
            </div>
        </>
    );
}