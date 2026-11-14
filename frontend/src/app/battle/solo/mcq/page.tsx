"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, XCircle } from "lucide-react";
import {
  clearBattleCreationKey,
  createBattleWithRetry,
  getBattleCreationKey,
} from "@/services/battle.service";

function normalizeDifficulty(input: string | null) {
  const value = (input || "medium").toLowerCase();
  return value === "easy" || value === "medium" || value === "hard" ? value : "medium";
}

function normalizeBattleSkillCategory(value: string | null) {
  const mapping: Record<string, string> = {
    "Algorithms & Data Structures": "Algorithms",
    "System Design & Caching": "System Design",
    "SQL & Database Internals": "SQL",
    "Web & JavaScript Core": "JavaScript",
  };

  const normalized = (value || "Algorithms").trim();
  return mapping[normalized] ?? normalized;
}

export default function SoloBattleMCQPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedCount = Number(searchParams.get("count") || "10");
  const difficulty = normalizeDifficulty(searchParams.get("difficulty"));
  const skillCategory = normalizeBattleSkillCategory(searchParams.get("topic"));
  const creationPromise = useRef<{
    fingerprint: string;
    promise: Promise<{ id: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function createBattle() {
      try {
        const request = {
          title: `Solo MCQ Challenge - ${skillCategory}`,
          difficulty,
          battle_type: "general",
          battle_mode: "solo",
          max_players: 1,
          question_type: "mcq",
          skill_category: skillCategory,
          question_count: [5, 10, 15, 20].includes(requestedCount) ? requestedCount : 10,
        };
        const fingerprint = JSON.stringify(request);
        const idempotencyKey = getBattleCreationKey("solo-mcq", request);
        let currentCreation = creationPromise.current;
        if (!currentCreation || currentCreation.fingerprint !== fingerprint) {
          currentCreation = {
            fingerprint,
            promise: createBattleWithRetry<{ id: string }>(request, idempotencyKey)
              .then((data) => {
                clearBattleCreationKey("solo-mcq", idempotencyKey);
                return data;
              }),
          };
          creationPromise.current = currentCreation;
        }
        const data = await currentCreation.promise;

        if (!data.id) throw new Error("The server did not return a battle ID.");
        if (active) router.replace(`/battle/${encodeURIComponent(data.id)}`);
      } catch (createError: unknown) {
        if (!active) return;
        const responseError = createError as {
          response?: { data?: { detail?: unknown } };
        };
        const detail = responseError.response?.data?.detail;
        setError(typeof detail === "string" ? detail : "The battle cannot be created right now.");
      }
    }

    void createBattle();
    return () => {
      active = false;
    };
  }, [difficulty, requestedCount, router, skillCategory]);

  if (error) {
    return (
      <main className="mx-auto flex min-h-[100svh] max-w-3xl items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg rounded-[24px] border border-[#F08A7A]/25 bg-[#101010] p-6 text-center text-[#F5F5F5]">
          <XCircle className="mx-auto h-8 w-8 text-[#F08A7A]" />
          <h1 className="mt-4 text-2xl font-black">Battle unavailable</h1>
          <p role="alert" className="mt-2 text-sm text-[#A1A1AA]">{error}</p>
          <Link href="/battle/solo" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-[#D8FF3E] px-4 py-2 text-sm font-bold text-[#101010]">
            Return to solo battles
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[100svh] max-w-4xl items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-[24px] border border-[#252525] bg-[#101010] p-6 text-center text-[#F5F5F5]">
        <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#D8FF3E]" />
        <p className="mt-4 text-sm font-semibold">Creating your MCQ battle room…</p>
      </div>
    </main>
  );
}
