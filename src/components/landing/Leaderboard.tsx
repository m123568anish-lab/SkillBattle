"use client";

import { useEffect, useState } from "react";
import Container from "@/components/common/Container";
import Section from "@/components/common/Section";
import SectionHeading from "@/components/common/SectionHeading";
import LeaderboardCard from "@/components/cards/LeaderboardCard";
import { leaderboardService, type LeaderboardEntry } from "@/services/leaderboard.service";
import { Loader2 } from "lucide-react";

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leaderboardService
      .getLeaderboard()
      .then((res) => setLeaderboard(res.leaderboard.slice(0, 5)))
      .catch(() => setLeaderboard([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Section>
      <Container>
        <SectionHeading
          title="Global Leaderboard"
          subtitle="See who's dominating the arena this week."
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-slate-400">
            No rankings recorded yet. Be the first to claim the top spot!
          </div>
        ) : (
          <div className="space-y-5">
            {leaderboard.map((player) => (
              <LeaderboardCard
                key={player.user_id}
                rank={player.rank}
                name={player.full_name || player.username}
                xp={`${player.xp.toLocaleString()} XP`}
                level={player.level}
              />
            ))}
          </div>
        )}
      </Container>
    </Section>
  );
}