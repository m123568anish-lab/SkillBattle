import { api } from "@/lib/api";
import { OnboardingData } from "@/types/onboarding";
import { Roadmap } from "@/services/career.service";

export interface OnboardingRoadmapResult {
  preferences_saved: boolean;
  generation_status: "ready" | "pending";
  roadmap: Roadmap | null;
  message?: string | null;
}

export async function saveOnboarding(
  data: OnboardingData
): Promise<OnboardingRoadmapResult> {
  const response = await api.post<OnboardingRoadmapResult>(
    "/career/roadmap/onboarding",
    {
      languages: data.languages,
      companies: data.companies,
      level: data.level,
      confidence: data.confidence,
      placement_goal: data.target,
      graduation_year: Number(data.graduationYear),
      goals: data.goals,
      daily_hours: data.dailyHours,
    },
  );

  return response.data;
}