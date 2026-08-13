"use client";

import { CheckCircle2 } from "lucide-react";

interface RecommendationCardProps {
  recommendation: string;
}

export default function RecommendationCard({
  recommendation,
}: RecommendationCardProps) {
  return (
    <div
      className="
        flex
        items-center
        gap-4
        rounded-2xl
        border
        border-white/10
        bg-white/5
        p-4
        transition-all
        duration-300
        hover:border-cyan-400/40
        hover:bg-white/10
      "
    >
      <div className="rounded-full bg-green-500/20 p-2">
        <CheckCircle2
          className="text-green-400"
          size={20}
        />
      </div>

      <p className="text-slate-200">
        {recommendation}
      </p>
    </div>
  );
}