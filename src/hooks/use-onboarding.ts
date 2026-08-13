"use client";

import { useState } from "react";
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

  function nextStep() {
    setStep((prev) => prev + 1);
  }

  function previousStep() {
    setStep((prev) => Math.max(prev - 1, 0));
  }

  function updateData(
    values: Partial<OnboardingData>
  ) {
    setData((prev) => ({
      ...prev,
      ...values,
    }));
  }

  return {
    step,
    data,

    nextStep,
    previousStep,

    updateData,
  };
}