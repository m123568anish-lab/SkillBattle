"use client";

import { useRouter } from "next/navigation";
import { Target, ArrowRight, CheckCircle2 } from "lucide-react";
import GradientButton from "@/components/ui/gradient-button";
import BattleArenaCard from "./BattleArenaCard";
import LeaderboardWidget from "./LeaderboardWidget";
import AchievementWidget from "./AchievementWidget";
import CalendarHeatmap from "./CalendarHeatmap";
import { SpotlightCard } from "@/components/ui/spotlight";
import type { DailyChallenge as DailyChallengeType } from "@/types/dashboard";

interface DailyChallengeProps {
  challenge: DailyChallengeType;
  activity?: Array<{ day: string; xp: number }>;
}

export default function DailyChallenge({ challenge, activity = [] }: DailyChallengeProps) {
  const router = useRouter();

  const handleStartChallenge = () => {
    router.push("/practice/tasks");
  };

  const isCompleted = challenge.id !== "0" && Boolean(challenge.is_completed);

  return (
    <SpotlightCard className="p-6 sm:p-8 rounded-3xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-[var(--surface-elevated)] p-3.5 border border-[var(--border-subtle)] text-[var(--accent-strong)] shadow-md">
            <Target size={26} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Daily Coding Assignment
            </h2>
            <p className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
              Refreshes Daily · Verified Rewards
            </p>
          </div>
        </div>

        {isCompleted && (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs text-emerald-300 font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]">
            <CheckCircle2 size={14} className="text-emerald-400" />
            Completed Today
          </span>
        )}
      </div>

      {/* Challenge Card */}
      <div className="mt-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5 sm:p-6 relative z-10 transition-colors duration-150 hover:border-[var(--accent)]/30">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
            {challenge.id === "0" ? "No daily challenge available" : challenge.title}
          </h3>

          {challenge.id !== "0" && (
            <span className="rounded-full bg-[var(--surface-card)] border border-[var(--border-default)] px-3 py-0.5 text-xs font-semibold text-[var(--accent-strong)] capitalize">
              {challenge.difficulty}
            </span>
          )}
        </div>

        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)] font-medium">
          {challenge.description}
        </p>
      </div>

      {/* Action Button */}
      <div className="mt-6 relative z-10">
        <GradientButton
          variant={isCompleted ? "secondary" : "primary"}
          onClick={handleStartChallenge}
          disabled={challenge.id === "0"}
        >
          <span className="font-bold flex items-center gap-2">
            {challenge.id === "0"
              ? "Unavailable"
              : isCompleted
                ? "Review Completed Assignment"
                : "Open Daily Assignment"}
            <ArrowRight size={16} />
          </span>
        </GradientButton>
      </div>

      {/* Battle + Leaderboard Grid */}
      <div className="mt-10 grid gap-6 xl:grid-cols-2 relative z-10">
        <BattleArenaCard />
        <LeaderboardWidget />
      </div>

      {/* Calendar + Achievements Grid */}
      <div className="mt-6 grid gap-6 xl:grid-cols-2 relative z-10">
        <CalendarHeatmap activity={activity} />
        <AchievementWidget />
      </div>
    </SpotlightCard>
  );
}
