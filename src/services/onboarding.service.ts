import { api } from "@/lib/api";
import { OnboardingData } from "@/types/onboarding";

export async function saveOnboarding(
  data: OnboardingData
) {
  const response = await api.post(
    "/onboarding",
    data
  );

  return response.data;
}