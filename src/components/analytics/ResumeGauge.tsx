"use client";

import ScoreGauge from "./ScoreGauge";

interface Props {
    score: number;
}

export default function ResumeGauge({
    score,
}: Props) {
    return (
        <ScoreGauge
            title="Resume Score"
            value={score}
            color="#10B981"
        />
    );
}