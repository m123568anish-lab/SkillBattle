"use client";

import ScoreGauge from "./ScoreGauge";

interface Props {
    score: number;
}

export default function PortfolioGauge({
    score,
}: Props) {
    return (
        <ScoreGauge
            title="Portfolio"
            value={score}
            color="#EA580C"
        />
    );
}