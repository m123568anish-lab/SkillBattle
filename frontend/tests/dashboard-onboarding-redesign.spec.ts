import { expect, test } from "@playwright/test";
import {
  authenticateStudent,
  testStudent,
} from "./fixtures/authenticated-student";
import type { DashboardResponse } from "@/types/dashboard";

const dashboard: Partial<DashboardResponse> = {
  user: { ...testStudent, full_name: "Mina Student" },
  stats: {
    xp: 1240,
    level: 4,
    next_level_xp: 1600,
    xp_to_next_level: 360,
    level_progress_percent: 67,
    streak: 4,
    longest_streak: 9,
    rating: 1080,
    battles_played: 8,
    battles_completed: 7,
    battles_won: 5,
    battles_lost: 2,
    practice_attempted: 18,
    practice_completed: 12,
    practice_tasks_completed: 10,
    practice_accuracy: 76,
    daily_challenge_completed: false,
  },
  weekly_activity: [
    { day: "2025-03-10", xp: 10 },
    { day: "2025-03-11", xp: 20 },
    { day: "2025-03-12", xp: 0 },
    { day: "2025-03-13", xp: 15 },
    { day: "2025-03-14", xp: 5 },
    { day: "2025-03-15", xp: 0 },
    { day: "2025-03-16", xp: 30 },
  ],
  daily_challenge: {
    id: "challenge-live-1",
    title: "Trace a graph traversal",
    difficulty: "Medium",
    description: "Use breadth-first search to visit each reachable node.",
    xp_reward: 40,
    is_completed: false,
  },
  command_center: {
    student_state: {
      xp: 1240,
      streak: 4,
      target_company: "Engineering roles",
      study_hours: { configured: true, minutes: 32 },
    },
    next_best_action: {
      title: "Practice graph traversal",
      type: "practice",
      why: "Recent practice indicates this is a useful next step.",
    },
    daily_actions: [{
      type: "Practice",
      title: "Review graph basics",
      description: "Work through a graph traversal exercise.",
      time: "15 min",
    }],
    placement_readiness: { state: "BUILDING", confidence: "MEDIUM" },
    skill_gaps: [],
    roadmap: {
      title: "Backend engineering",
      progress: 35,
      milestone: "Complete the data structures milestone.",
    },
    study_hours: { configured: true, minutes: 32 },
    summary: { strong_skills: 2, weak_skills: 1, gap_count: 1 },
  },
};

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport);
}

test("redesigned dashboard and onboarding fit desktop and mobile", async ({ page }) => {
  await authenticateStudent(page, { dashboard });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Welcome back, Mina." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Backend engineering" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Today's focus" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Battle Arena" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Your weekly rhythm" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Multiplayer coding/ }))
    .toHaveAttribute("href", "/battle/lobby?question_type=coding");
  await expectNoHorizontalOverflow(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("navigation", { name: "Primary mobile navigation" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await page.goto("/battle/lobby?question_type=coding");
  await expect(page.getByRole("button", { name: "coding", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "mcq", exact: true })).toHaveAttribute("aria-pressed", "false");

  const onboardingPage = await page.context().newPage();
  await authenticateStudent(onboardingPage, { onboardingCompleted: false });
  await onboardingPage.setViewportSize({ width: 1440, height: 900 });
  await onboardingPage.goto("/onboarding");
  await expect(onboardingPage.getByText("Student setup")).toBeVisible();
  await expect(onboardingPage.getByRole("heading", { name: "Prepare with purpose." })).toBeVisible();
  await expect(onboardingPage.getByRole("progressbar", { name: "Onboarding progress" }))
    .toHaveAttribute("aria-valuenow", "1");
  await expectNoHorizontalOverflow(onboardingPage);

  await onboardingPage.setViewportSize({ width: 390, height: 844 });
  await expectNoHorizontalOverflow(onboardingPage);
  await onboardingPage.getByRole("button", { name: /Start Setup/ }).click();
  await expect(onboardingPage.getByRole("heading", { name: "Programming Languages" })).toBeVisible();
  await expect(onboardingPage.getByRole("progressbar", { name: "Onboarding progress" }))
    .toHaveAttribute("aria-valuenow", "2");
});
