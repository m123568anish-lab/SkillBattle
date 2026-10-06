import { api } from "@/lib/api";
import { OnboardingData } from "@/types/onboarding";

export async function saveOnboarding(
  data: OnboardingData
) {
  const payload = {
    languages: data.languages && data.languages.length > 0 ? data.languages : ["Python"],
    companies: data.companies && data.companies.length > 0 ? data.companies : ["Google"],
    level: data.level || "Intermediate",
    confidence: typeof data.confidence === "number" ? Math.max(0, Math.min(100, data.confidence)) : 50,
    placement_goal: data.target || "20+ LPA",
    graduation_year: parseInt(String(data.graduationYear), 10) || 2027,
    goals: data.goals && data.goals.length > 0 ? data.goals : ["Data Structures & Algorithms"],
    daily_hours: typeof data.dailyHours === "number" ? Math.max(1, Math.min(10, data.dailyHours)) : 2,
  };

  const response = await api.post(
    "/career/roadmap/onboarding",
    payload
  );

  return response.data;
}