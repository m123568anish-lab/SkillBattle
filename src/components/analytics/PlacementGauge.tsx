"use client";

import ScoreGauge from "./ScoreGauge";

interface Props {
    score: number;
}

export default function PlacementGauge({
    score,
}: Props) {
    return (
        <ScoreGauge
            title="Placement"
            value={score}
            color="#9333EA"
        />
    );
}