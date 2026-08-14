"use client";

import ScoreGauge from "./ScoreGauge";

interface Props {
    score: number;
}

export default function ATSGauge({
    score,
}: Props) {
    return (
        <ScoreGauge
            title="ATS Score"
            value={score}
            color="#2563EB"
        />
    );
}