"use client";

import SkillsRadarChart from "./SkillsRadarChart";
import TechnologyPieChart from "./TechnologyPieChart";
import TrendChart from "./TrendChart";
import JobRecommendations from "./JobRecommendations";
import RoadmapTimeline from "./RoadmapTimeline";

interface Props {
    analysis: any;
}

export default function AnalyticsSection({
    analysis,
}: Props) {
    return (
        <div className="mt-10 space-y-8">

            <div className="grid gap-6 lg:grid-cols-2">

                <SkillsRadarChart
                    skills={analysis.skills_chart ?? []}
                />

                <TechnologyPieChart
                    technologies={
                        analysis.technology_chart ?? []
                    }
                />

            </div>

            <TrendChart
                data={analysis.trend ?? []}
            />

            <div className="grid gap-6 lg:grid-cols-2">

                <JobRecommendations
                    jobs={
                        analysis.job_match
                            ?.recommended_roles ?? []
                    }
                />

                <RoadmapTimeline
                    roadmap={
                        analysis.roadmap
                            ?.roadmap ?? []
                    }
                />

            </div>

        </div>
    );
}