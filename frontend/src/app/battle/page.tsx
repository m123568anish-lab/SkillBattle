"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import BattleArenaCommandCenter from "@/components/battle/BattleArenaCommandCenter";
import { battleService } from "@/services/battle.service";
import { dashboardService } from "@/services/dashboard.service";

export default function BattlePage() {
  const [loading, setLoading] = useState(true);
  const [profileLoadFailed, setProfileLoadFailed] = useState(false);
  const [waitingLoadFailed, setWaitingLoadFailed] = useState(false);
  const [skillList, setSkillList] = useState<Array<{ skill: string; score: number; attempts: number; verified: boolean; sources: string[] }>>([]);
  const [weakSkills, setWeakSkills] = useState<Array<{ skill: string; score: number; attempts: number; verified: boolean; sources: string[] }>>([]);
  const [averageSkill, setAverageSkill] = useState(0);
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
        const [dashboardResponse, waitingBattles] = await Promise.all([
          dashboardService.getDashboard(),
          battleService.getWaitingBattles().catch(() => []),
        ]);

        if (!active) return;

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
          : [{ skill: "Career readiness", score: 72, attempts: 1, verified: true, sources: ["profile"] }];

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

  const arenaModes = [
    {
      title: "Solo Battle",
      description: "Practice with adaptive, placement-grade challenges and instant feedback.",
      accent: "from-cyan-500/15 via-sky-500/10 to-violet-500/15",
      href: "/battle/solo",
    },
    {
      title: "Multiplayer Queue",
      description: "Match into a live ranked duel and push your rating under pressure.",
      accent: "from-violet-500/15 via-indigo-500/10 to-cyan-500/15",
      href: "/battle/queue",
    },
    {
      title: "Quest Map",
      description: "Progress through the training loop: learn, battle, review, improve, and prove.",
      accent: "from-emerald-500/15 via-cyan-500/10 to-sky-500/15",
      href: "#quest-map",
    },
  ];

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
        arenaModes={arenaModes}
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