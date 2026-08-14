import React from "react";

interface ScoreCardProps {
  title: string;
  score: number;
}

export default function ScoreCard({ title, score }: ScoreCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <h2 className="text-sm font-medium text-slate-300">{title}</h2>
      <p className="mt-2 text-3xl font-semibold text-white">{score}</p>
    </div>
  );
}
