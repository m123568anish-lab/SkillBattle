"use client";

import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

const COLORS = [
    "#2563EB",
    "#10B981",
    "#F59E0B",
    "#9333EA",
    "#EF4444",
];

interface Props {
    technologies: {
        name: string;
        value: number;
    }[];
}

export default function TechnologyPieChart({
    technologies,
}: Props) {
    return (
        <div className="rounded-2xl bg-white p-6 shadow-lg">

            <h2 className="mb-6 text-xl font-bold">

                Technology Distribution

            </h2>

            <div className="h-80">

                <ResponsiveContainer>

                    <PieChart>

                        <Pie
                            data={technologies}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={110}
                            label
                        >
                            {technologies.map((_, index) => (
                                <Cell
                                    key={index}
                                    fill={
                                        COLORS[
                                            index %
                                                COLORS.length
                                        ]
                                    }
                                />
                            ))}
                        </Pie>

                        <Tooltip />

                    </PieChart>

                </ResponsiveContainer>

            </div>

        </div>
    );
}