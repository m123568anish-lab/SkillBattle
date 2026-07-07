"use client";

import ResumeGauge from "./ResumeGauge";
import ATSGauge from "./ATSGauge";
import PlacementGauge from "./PlacementGauge";
import PortfolioGauge from "./PortfolioGauge";

interface GaugeGridProps {
    analysis: any;
}

export default function GaugeGrid({
    analysis,
}: GaugeGridProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

            <ResumeGauge
                score={
                    analysis.resume_analysis
                        ?.resume_score ?? 0
                }
            />

            <ATSGauge
                score={
                    analysis.ats?.ats_score ?? 0
                }
            />

            <PlacementGauge
                score={
                    analysis.placement
                        ?.placement_score ?? 0
                }
            />

            <PortfolioGauge
                score={
                    analysis.portfolio
                        ?.portfolio_score ?? 0
                }
            />

        </div>
    );
}