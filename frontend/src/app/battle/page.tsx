"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import DashboardLayout from "@/components/dashboard/DashboardLayout";
import BattleArenaCommandCenter from "@/components/battle/BattleArenaCommandCenter";
import { api } from "@/lib/api";
import { battleService } from "@/services/battle.service";

type Skill = {
  skill: string;
  score: number;
  attempts: number;
  verified?: boolean;
  sources?: string[];
};

type SkillProfile = {
  skills: Skill[];
};

type WaitingBattle = {
  id: string;
  title?: string;
  difficulty?: string;
  status?: string;
  max_players?: number;
  created_at?: string;
};

export default function BattlePage() {
  const [profile, setProfile] = useState<SkillProfile | null>(null);
  const [waitingBattles, setWaitingBattles] = useState<WaitingBattle[]>([]);
  const [profileLoadFailed, setProfileLoadFailed] = useState(false);
  const [waitingLoadFailed, setWaitingLoadFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadArenaData() {
      const [profileResult, waitingResult] = await Promise.allSettled([
        api.get<SkillProfile>("/profile/skill-profile"),
        battleService.getWaitingBattles(),
      ]);

      if (!active) return;

      if (profileResult.status === "fulfilled") {
        setProfile(profileResult.value.data ?? { skills: [] });
      } else {
        setProfileLoadFailed(true);
      }

      if (waitingResult.status === "fulfilled") {
        setWaitingBattles(Array.isArray(waitingResult.value) ? waitingResult.value : []);
      } else {
        setWaitingLoadFailed(true);
      }

      setLoading(false);
    }

    void loadArenaData();
    return () => {
      active = false;
    };
  }, []);

  const skillList = useMemo(() => [...(profile?.skills ?? [])].sort((a, b) => b.score - a.score), [profile]);
  const averageSkill = useMemo(() => {
    if (!skillList.length) return 0;
    return Math.round(skillList.reduce((total, skill) => total + skill.score, 0) / skillList.length);
  }, [skillList]);

  const weakSkills = [...skillList].sort((a, b) => a.score - b.score).slice(0, 3);
  const recommendedBattle = waitingBattles[0] ?? null;
  const recommendedBattleTitle = recommendedBattle?.title ?? "No open battle";

  const [arenaModes, setArenaModes] = useState<Array<{ title: string; description: string; accent: string; href: string }>>([]);

  useEffect(() => {
    let active = true;

    async function loadBattleModes() {
      try {
        const types = await battleService.getBattleTypes();
        if (!active || !Array.isArray(types) || !types.length) return;

        const mapped = types.slice(0, 3).map((type, index) => ({
          title: type.name ?? ["Solo Battle", "Multiplayer Queue", "Quest Map"][index],
          description: type.desc ?? "Live battle mode backed by the SkillBattle engine.",
          accent: ["from-cyan-500/20 to-sky-500/10", "from-violet-500/20 to-fuchsia-500/10", "from-emerald-500/20 to-teal-500/10"][index],
          href: index === 0 ? "/battle/solo" : index === 1 ? "/battle/queue" : "#quest-map",
        }));

        setArenaModes(mapped);
      } catch {
        // no fake mode generation; leave empty when backend data is unavailable
      }
    }

    void loadBattleModes();
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
        arenaModes={arenaModes}
      />
    </DashboardLayout>
  );
}