"use client";

import StatCard from "./StatCard";

interface Props {

    analysis: any;

}

export default function StatsGrid({

    analysis,

}: Props) {

    return (

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">

            <StatCard

                title="Resume"

                value={

                    analysis.resume_analysis.resume_score

                }

                color="text-green-500"

            />

            <StatCard

                title="ATS"

                value={

                    analysis.ats.ats_score

                }

                color="text-blue-500"

            />

            <StatCard

                title="Placement"

                value={

                    analysis.placement.placement_score

                }

                color="text-purple-500"

            />

            <StatCard

                title="Portfolio"

                value={

                    analysis.portfolio.portfolio_score

                }

                color="text-orange-500"

            />

        </div>

    );

}