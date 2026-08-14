"use client";

import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
} from "recharts";

interface Props {
    skills: {
        name: string;
        value: number;
    }[];
}

export default function SkillsRadarChart({
    skills,
}: Props) {
    return (
        <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="mb-6 text-xl font-bold">
                Skills Analysis
            </h2>

            <div className="h-80">

                <ResponsiveContainer>

                    <RadarChart data={skills}>

                        <PolarGrid />

                        <PolarAngleAxis dataKey="name" />

                        <PolarRadiusAxis />

                        <Radar
                            dataKey="value"
                            stroke="#2563EB"
                            fill="#2563EB"
                            fillOpacity={0.5}
                        />

                    </RadarChart>

                </ResponsiveContainer>

            </div>

        </div>
    );
}