"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import BattleArenaCommandCenter from "@/components/battle/BattleArenaCommandCenter";
import { BattleNav } from "@/components/arena";
import { battleService, type BattleHistoryItem } from "@/services/battle.service";
import { dashboardService } from "@/services/dashboard.service";

export default function BattlePage() {
  const [loading, setLoading] = useState(true);
  const [profileLoadFailed, setProfileLoadFailed] = useState(false);
  const [historyLoadFailed, setHistoryLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [skillList, setSkillList] = useState<Array<{ skill: string; score: number; attempts: number; verified: boolean; sources: string[] }>>([]);
  const [weakSkills, setWeakSkills] = useState<Array<{ skill: string; score: number; attempts: number; verified: boolean; sources: string[] }>>([]);
  const [averageSkill, setAverageSkill] = useState(0);
  const [history, setHistory] = useState<BattleHistoryItem[]>([]);
  const [userStats, setUserStats] = useState({
    rating: null as number | null,
    total_xp: null as number | null,
    level: null as number | null,
    battles_count: null as number | null,
    xp_to_next_level: null as number | null,
    level_progress_percent: null as number | null,
  });
  useEffect(() => {
    let active = true;

    const loadBattleData = async () => {
      setLoading(true);
      const [dashboardResult, historyResult] = await Promise.allSettled([
        dashboardService.getDashboard(),
        battleService.getHistory(5, 0),
      ]);

      if (!active) return;

      if (dashboardResult.status === "fulfilled") {
        const dashboardResponse = dashboardResult.value;
        const stats = dashboardResponse.stats;
        setUserStats({
          rating: stats.rating,
          total_xp: stats.xp,
          level: stats.level,
          battles_count: stats.battles_completed,
          xp_to_next_level: stats.xp_to_next_level,
          level_progress_percent: stats.level_progress_percent,
        });

        const readinessMatrix = dashboardResponse.command_center?.placement_readiness?.matrix ?? {};
        const skills = Object.entries(readinessMatrix).map(([skill, value]) => ({
          skill,
          score: Number((value as { score?: number })?.score ?? 0),
          attempts: Number((value as { evidence_count?: number })?.evidence_count ?? 0),
          verified: Number((value as { evidence_count?: number })?.evidence_count ?? 0) > 0,
          sources: [skill],
        }));
        const nextWeakSkills = [...skills].sort((a, b) => a.score - b.score).slice(0, 3);
        const scoreAvg = skills.length
          ? Math.round(skills.reduce((sum, skill) => sum + skill.score, 0) / skills.length)
          : 0;
        setSkillList(skills);
        setWeakSkills(nextWeakSkills);
        setAverageSkill(scoreAvg);
        setProfileLoadFailed(false);
      } else {
        setUserStats({
          rating: null,
          total_xp: null,
          level: null,
          battles_count: null,
          xp_to_next_level: null,
          level_progress_percent: null,
        });
        setSkillList([]);
        setWeakSkills([]);
        setAverageSkill(0);
        setProfileLoadFailed(true);
      }

      if (historyResult.status === "fulfilled") {
        setHistory(historyResult.value.history);
        setHistoryLoadFailed(false);
      } else {
        setHistory([]);
        setHistoryLoadFailed(true);
      }

      setLoading(false);
    };

    void loadBattleData();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-7">
        <BattleNav />
        <BattleArenaCommandCenter
          skillList={skillList}
          averageSkill={averageSkill}
          weakSkills={weakSkills}
          loading={loading}
          profileLoadFailed={profileLoadFailed}
          historyLoadFailed={historyLoadFailed}
          userStats={userStats}
          history={history}
          onRetry={() => setReloadKey((key) => key + 1)}
        />
      </div>
    </DashboardLayout>
  );
}