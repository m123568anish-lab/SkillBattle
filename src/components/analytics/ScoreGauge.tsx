"use client";

import { motion } from "framer-motion";

interface ScoreGaugeProps {
    title: string;
    value: number;
    color: string;
}

export default function ScoreGauge({
    title,
    value,
    color,
}: ScoreGaugeProps) {
    const radius = 65;
    const circumference = 2 * Math.PI * radius;
    const offset =
        circumference -
        (value / 100) * circumference;

    return (
        <motion.div
            initial={{
                opacity: 0,
                scale: 0.8,
            }}
            animate={{
                opacity: 1,
                scale: 1,
            }}
            transition={{
                duration: 0.5,
            }}
            className="rounded-2xl bg-white p-6 shadow-lg"
        >
            <h3 className="mb-6 text-center text-lg font-semibold">
                {title}
            </h3>

            <div className="flex justify-center">

                <svg
                    width="170"
                    height="170"
                >
                    <circle
                        cx="85"
                        cy="85"
                        r={radius}
                        stroke="#E5E7EB"
                        strokeWidth="12"
                        fill="none"
                    />

                    <motion.circle
                        cx="85"
                        cy="85"
                        r={radius}
                        stroke={color}
                        strokeWidth="12"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{
                            strokeDashoffset:
                                circumference,
                        }}
                        animate={{
                            strokeDashoffset:
                                offset,
                        }}
                        transition={{
                            duration: 1.2,
                        }}
                        transform="rotate(-90 85 85)"
                    />

                    <text
                        x="50%"
                        y="50%"
                        dominantBaseline="middle"
                        textAnchor="middle"
                        className="fill-slate-800 text-3xl font-bold"
                    >
                        {value}
                    </text>
                </svg>

            </div>
        </motion.div>
    );
}