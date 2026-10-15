"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import BattleArenaCommandCenter from "@/components/battle/BattleArenaCommandCenter";
import { battleService, type BattleHistoryItem } from "@/services/battle.service";
import { dashboardService } from "@/services/dashboard.service";

export default function BattlePage() {
  const [loading, setLoading] = useState(true);
  const [profileLoadFailed, setProfileLoadFailed] = useState(false);
  const [waitingLoadFailed, setWaitingLoadFailed] = useState(false);
  const [skillList, setSkillList] = useState<Array<{ skill: string; score: number; attempts: number; verified: boolean; sources: string[] }>>([]);
  const [weakSkills, setWeakSkills] = useState<Array<{ skill: string; score: number; attempts: number; verified: boolean; sources: string[] }>>([]);
  const [averageSkill, setAverageSkill] = useState(0);
  const [history, setHistory] = useState<BattleHistoryItem[]>([]);
  const [userStats, setUserStats] = useState({
    rating: 1000,
    total_xp: 0,
    level: 1,
    battles_count: 0,
  });
  const [recommendedBattle, setRecommendedBattle] = useState<{
    id: string;
    title?: string;
    difficulty?: string;
    status?: string;
    max_players?: number;
    created_at?: string;
  } | null>(null);
  const [recommendedBattleTitle, setRecommendedBattleTitle] = useState("Recommended battle");

  useEffect(() => {
    let active = true;

    const loadBattleData = async () => {
      try {
        const [dashboardResponse, waitingBattles, historyResponse] = await Promise.all([
          dashboardService.getDashboard(),
          battleService.getWaitingBattles().catch(() => []),
          battleService.getHistory(5, 0).catch(() => ({ history: [], total: 0 })),
        ]);

        if (!active) return;

        // User stats
        const extractedRating = Number(dashboardResponse?.stats?.rating ?? 1000);
        const extractedXp = Number(dashboardResponse?.stats?.xp ?? 0);
        const extractedLevel = Number(dashboardResponse?.stats?.level ?? 1);
        const extractedBattles = Number(
          dashboardResponse?.stats?.battles_played ?? historyResponse?.total ?? 0
        );

        setUserStats({
          rating: extractedRating,
          total_xp: extractedXp,
          level: extractedLevel,
          battles_count: Math.max(extractedBattles, (historyResponse?.history || []).length),
        });

        setHistory(historyResponse?.history || []);

        const readinessMatrix = dashboardResponse?.command_center?.placement_readiness?.matrix ?? {};
        const derivedSkills = Object.entries(readinessMatrix).map(([skill, value]) => ({
          skill: String(skill),
          score: Number((value as any)?.score ?? 0),
          attempts: Number((value as any)?.evidence_count ?? 0),
          verified: Number((value as any)?.evidence_count ?? 0) > 0,
          sources: [String(skill)],
        }));

        const normalizedSkills = derivedSkills.length > 0
          ? derivedSkills
          : [{ skill: "CS Fundamentals", score: 75, attempts: 1, verified: true, sources: ["profile"] }];

        const nextWeakSkills = [...normalizedSkills].sort((a, b) => a.score - b.score).slice(0, 3);
        const scoreAvg = Math.round(
          normalizedSkills.reduce((sum, skill) => sum + skill.score, 0) / normalizedSkills.length,
        );

        setSkillList(normalizedSkills);
        setWeakSkills(nextWeakSkills);
        setAverageSkill(scoreAvg);
        setProfileLoadFailed(false);

        const defaultBattle = awaitingBattleChoice(waitingBattles);
        setRecommendedBattle(defaultBattle);
        setRecommendedBattleTitle(defaultBattle?.title || "Recommended battle");
        setWaitingLoadFailed(false);
      } catch {
        if (!active) return;
        setSkillList([]);
        setWeakSkills([]);
        setAverageSkill(0);
        setRecommendedBattle(null);
        setRecommendedBattleTitle("Recommended battle");
        setProfileLoadFailed(true);
        setWaitingLoadFailed(true);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadBattleData();
    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardLayout>
      <BattleArenaCommandCenter
        skillList={skillList}
        averageSkill={averageSkill}
        weakSkills={weakSkills}
        loading={loading}
        profileLoadFailed={profileLoadFailed}
        waitingLoadFailed={waitingLoadFailed}
        recommendedBattle={recommendedBattle}
        recommendedBattleTitle={recommendedBattleTitle}
        userStats={userStats}
        history={history}
      />
    </DashboardLayout>
  );
}

function awaitingBattleChoice(waitingBattles: any[]) {
  const firstBattle = waitingBattles?.[0];
  if (!firstBattle) {
    return null;
  }

  return {
    id: String(firstBattle.id ?? "solo"),
    title: firstBattle.title || "Open battle",
    difficulty: firstBattle.difficulty || "Medium",
    status: firstBattle.status || "Ready",
    max_players: firstBattle.max_players ?? 1,
    created_at: firstBattle.created_at,
  };
}