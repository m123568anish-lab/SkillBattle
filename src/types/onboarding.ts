export interface OnboardingData {
  // Step 2
  languages: string[];

  // Step 3
  companies: string[];

  // Step 4
  level: string;
  confidence: number;
  target: string;
  graduationYear: string;

  // Step 5
  goals: string[];
  dailyHours: number;
}