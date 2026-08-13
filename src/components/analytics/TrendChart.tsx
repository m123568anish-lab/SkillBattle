"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";

interface Props {
    data: {
        week: string;
        score: number;
    }[];
}

export default function TrendChart({
    data,
}: Props) {
    return (
        <div className="rounded-2xl bg-white p-6 shadow-lg">

            <h2 className="mb-6 text-xl font-bold">

                Resume Improvement

            </h2>

            <div className="h-80">

                <ResponsiveContainer>

                    <LineChart data={data}>

                        <CartesianGrid />

                        <XAxis dataKey="week" />

                        <YAxis />

                        <Tooltip />

                        <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#2563EB"
                            strokeWidth={3}
                        />

                    </LineChart>

                </ResponsiveContainer>

            </div>

        </div>
    );
}