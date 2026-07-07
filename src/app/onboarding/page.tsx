"use client";
import AchievementWidget from "@/components/dashboard/AchievementWidget";
import CalendarHeatmap from "@/components/dashboard/CalendarHeatmap";
import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import ProgressStepper from "@/components/onboarding/ProgressStepper";
import BattleArenaCard from "@/components/dashboard/BattleArenaCard";
import LeaderboardWidget from "@/components/dashboard/LeaderboardWidget";
import WelcomeStep from "@/components/onboarding/WelcomeStep";
import LanguageStep from "@/components/onboarding/LanguageStep";
import CompanyStep from "@/components/onboarding/CompanyStep";
import SkillStep from "@/components/onboarding/SkillStep";
import GoalStep from "@/components/onboarding/GoalStep";
import RoadmapStep from "@/components/onboarding/RoadmapStep";
import RoadmapPreview from "@/components/onboarding/RoadmapPreview";

import { useOnboarding } from "@/hooks/use-onboarding";

import { saveOnboarding } from "@/services/onboarding.service";

export default function OnboardingPage() {
  const {
    step,
    data,
    nextStep,
    previousStep,
    updateData,
  } = useOnboarding();

  async function handleFinish() {
    try {
      await saveOnboarding(data);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <OnboardingLayout>
      <ProgressStepper
        step={step}
        total={7}
      />

      {/* STEP 1 */}

      {step === 0 && (
        <WelcomeStep
          onNext={nextStep}
        />
      )}

      {/* STEP 2 */}

      {step === 1 && (
        <LanguageStep
          selected={data.languages}
          onChange={(languages) =>
            updateData({
              languages,
            })
          }
          onNext={nextStep}
        />
      )}

      {/* STEP 3 */}

      {step === 2 && (
        <>
          <button
            onClick={previousStep}
            className="
              mb-8
              rounded-xl
              border
              border-white/10
              px-5
              py-2
              text-white
              transition
              hover:border-cyan-400
            "
          >
            ← Back
          </button>

          <CompanyStep
            selected={data.companies}
            onChange={(companies) =>
              updateData({
                companies,
              })
            }
            onNext={nextStep}
          />
        </>
      )}

      {/* STEP 4 */}

      {step === 3 && (
        <SkillStep
          level={data.level}
          confidence={data.confidence}
          target={data.target}
          graduationYear={data.graduationYear}
          onChange={(values) =>
            updateData(values)
          }
          onBack={previousStep}
          onNext={nextStep}
        />
      )}

      {/* STEP 5 */}

      {step === 4 && (
        <GoalStep
          selected={data.goals}
          dailyHours={data.dailyHours}
          onChange={(goals, dailyHours) =>
            updateData({
              goals,
              dailyHours,
            })
          }
          onBack={previousStep}
          onNext={nextStep}
        />
      )}

      {/* STEP 6 */}

      {step === 5 && (
        <RoadmapStep
          onComplete={nextStep}
        />
      )}

      {/* STEP 7 */}

      {step === 6 && (
        <RoadmapPreview
          onContinue={handleFinish}
        />
      )}
    </OnboardingLayout>
  );
}