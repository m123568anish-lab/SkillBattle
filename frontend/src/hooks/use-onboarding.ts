"use client";

import { useCallback, useState } from "react";
import { OnboardingData } from "@/types/onboarding";

const initialData: OnboardingData = {
  languages: [],
  companies: [],

  level: "",
  confidence: 50,
  target: "",
  graduationYear: "",

  goals: [],
  dailyHours: 2,
};

export function useOnboarding() {
  const [step, setStep] = useState(0);

  const [data, setData] =
    useState<OnboardingData>(initialData);

  const nextStep = useCallback(() => {
    setStep((prev) => prev + 1);
  }, []);

  const previousStep = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const updateData = useCallback((
    values: Partial<OnboardingData>
  ) => {
    setData((prev) => ({
      ...prev,
      ...values,
    }));
  }, []);

  return {
    step,
    data,

    nextStep,
    previousStep,

    updateData,
  };
}