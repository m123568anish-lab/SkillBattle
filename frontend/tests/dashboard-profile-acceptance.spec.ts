import { expect, test } from "@playwright/test";
import { authenticateStudent, testStudent } from "./fixtures/authenticated-student";
import type { DashboardResponse } from "@/types/dashboard";
import path from "node:path";
import fs from "node:fs";

const mockLiveDashboard: DashboardResponse = {
  user: {
    id: "e2e-app-user",
    username: "alex_coder",
    full_name: "Alex Johnson",
    email: "alex@example.com",
    avatar_url: null,
    role: "student",
    is_superuser: false,
  },
  stats: {
    xp: 3450,
    level: 7,
    next_level_xp: 3500,
    xp_to_next_level: 50,
    level_progress_percent: 90,
    streak: 14,
    longest_streak: 21,
    rating: 1420,
    battles_played: 28,
    battles_completed: 28,
    battles_won: 22,
    battles_lost: 6,
    practice_attempted: 95,
    practice_completed: 82,
    practice_tasks_completed: 40,
    practice_accuracy: 86.3,
    daily_challenge_completed: false,
  },
  weekly_activity: [
    { day: "2026-11-14", xp: 120 },
    { day: "2026-11-15", xp: 240 },
    { day: "2026-11-16", xp: 300 },
    { day: "2026-11-17", xp: 180 },
    { day: "2026-11-18", xp: 450 },
    { day: "2026-11-19", xp: 520 },
    { day: "2026-11-20", xp: 380 },
  ],
  achievements: [
    {
      id: "first_blood",
      title: "First Blood",
      description: "Won your first competitive live coding duel",
      icon: "trophy",
    },
    {
      id: "streak_master",
      title: "Streak Champion",
      description: "Maintained a 14-day continuous practice rhythm",
      icon: "flame",
    },
  ],
  ai_recommendation: {
    title: "Graph Algorithms & BFS/DFS",
    message: "Focus on shortest path algorithms to boost placement readiness for top tier engineering roles.",
    progress: 78,
    action: "Launch Targeted Practice",
  },
  daily_challenge: {
    id: "challenge_dsa_1",
    title: "Binary Tree Maximum Path Sum",
    difficulty: "Hard",
    description: "Find the maximum path sum between any two nodes in a non-empty binary tree.",
    xp_reward: 150,
    is_completed: false,
  },
  skill_progress: [
    {
      subject: "Data Structures & Algorithms",
      correct_attempts: 45,
      total_attempts: 50,
      accuracy_percent: 90,
    },
    {
      subject: "System Design & Architecture",
      correct_attempts: 20,
      total_attempts: 25,
      accuracy_percent: 80,
    },
  ],
  recent_activity: [
    {
      activity_type: "Multiplayer Coding Duel",
      activity_date: "2026-11-20",
      xp_earned: 80,
    },
    {
      activity_type: "Daily Challenge Completed",
      activity_date: "2026-11-19",
      xp_earned: 150,
    },
  ],
  command_center: {
    roadmap: {
      title: "FAANG Placement Readiness Track",
      progress: 68,
      milestone: "Advanced Dynamic Programming",
    },
    next_best_action: {
      title: "Graph Traversal Mastery",
      why: "Key prerequisite for technical interviews at Google and Razorpay.",
    },
    placement_readiness: {
      state: "ON_TRACK",
    },
    study_hours: {
      configured: true,
      minutes: 45,
    },
    daily_actions: [
      {
        type: "practice",
        title: "Dijkstra Shortest Path",
        description: "Solve the weighted shortest path challenge.",
        time: "20 mins",
      },
    ],
  },
};

const screenshotDir = path.resolve(process.cwd(), "docs", "ui", "screenshots");

test.beforeAll(() => {
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }
});

const baseURL = process.env.QUBIRA_PLAYWRIGHT_BASE_URL ?? "https://127.0.0.1:3001";

function resolveUrl(relativeOrAbsolute: string) {
  if (relativeOrAbsolute.startsWith("http://") || relativeOrAbsolute.startsWith("https://")) {
    return relativeOrAbsolute;
  }
  return new URL(relativeOrAbsolute, baseURL).toString();
}

test.describe("QUBIRA Redesigned User Dashboard & Profile Acceptance", () => {
  test("1. Dashboard displays real user metrics, hero, telemetry HUD, and interactive docks", async ({ page }) => {
    test.setTimeout(90_000);
    await authenticateStudent(page, { dashboard: mockLiveDashboard });
    await page.goto(resolveUrl("/dashboard"));

    // Check Hero and personalized greeting
    const hero = page.locator("[data-dashboard-hero]");
    await expect(hero).toBeVisible({ timeout: 15_000 });
    await expect(hero).toContainText("Alex");
    await expect(hero).toContainText("Placement Command Center");
    await expect(hero).toContainText("14 day streak");
    await expect(hero).toContainText("Level 7");
    await expect(hero).toContainText("90% Complete");
    await expect(hero).toContainText("50 XP to Level 8");
    await expect(hero).toContainText("3,450 total");

    // Verify Primary & Secondary Buttons
    const resumeBtn = hero.getByRole("link", { name: "Resume Learning" });
    await expect(resumeBtn).toBeVisible();
    expect(await resumeBtn.getAttribute("href")).toBe("/practice");

    const battleBtn = hero.getByRole("link", { name: "Enter Battle Arena" });
    await expect(battleBtn).toBeVisible();
    expect(await battleBtn.getAttribute("href")).toBe("/battle");

    // Verify 5 Performance Instruments in StatsGrid
    const statsGrid = page.getByLabel("Performance overview");
    await expect(statsGrid).toBeVisible();
    await expect(statsGrid).toContainText("Lifetime XP");
    await expect(statsGrid).toContainText("3,450");
    await expect(statsGrid).toContainText("Daily Streak");
    await expect(statsGrid).toContainText("14");
    await expect(statsGrid).toContainText("Arena Rating");
    await expect(statsGrid).toContainText("1,420");
    await expect(statsGrid).toContainText("Practice Problems");
    await expect(statsGrid).toContainText("82");
    await expect(statsGrid).toContainText("86% submission accuracy");
    await expect(statsGrid).toContainText("Engineering Level");
    await expect(statsGrid).toContainText("7");

    // Verify Battle Arena Dock & 4 Modes
    const battleDock = page.getByRole("region", { name: /Battle Arena/i });
    await expect(battleDock).toBeVisible();
    await expect(battleDock).toContainText("1,420");
    await expect(battleDock).toContainText("79% Win Ratio"); // 22/28 = 78.5% -> 79%

    const soloMcqLink = battleDock.getByRole("link", { name: /Solo MCQ/i });
    await expect(soloMcqLink).toBeVisible();
    expect(await soloMcqLink.getAttribute("href")).toBe("/battle/solo?mode=mcq");

    const soloCodingLink = battleDock.getByRole("link", { name: /Solo Coding/i });
    await expect(soloCodingLink).toBeVisible();
    expect(await soloCodingLink.getAttribute("href")).toBe("/battle/solo?mode=coding");

    const multiMcqLink = battleDock.getByRole("link", { name: /Multiplayer MCQ/i });
    await expect(multiMcqLink).toBeVisible();
    expect(await multiMcqLink.getAttribute("href")).toBe("/battle/lobby?question_type=mcq");

    const multiCodingLink = battleDock.getByRole("link", { name: /Multiplayer Coding/i });
    await expect(multiCodingLink).toBeVisible();
    expect(await multiCodingLink.getAttribute("href")).toBe("/battle/lobby?question_type=coding");

    // Verify Daily Focus & Roadmap
    const dailyFocus = page.getByRole("region", { name: /Today's focus/i });
    await expect(dailyFocus).toBeVisible();
    await expect(dailyFocus).toContainText("Binary Tree Maximum Path Sum");
    await expect(dailyFocus).toContainText("+150 XP Bounty");

    const roadmap = page.locator("#learning-roadmap-title").locator("..");
    await expect(roadmap).toBeVisible();
    await expect(page.locator("#learning-roadmap-title")).toContainText("FAANG Placement Readiness Track");
    await expect(page.locator("section[aria-labelledby='learning-roadmap-title']")).toContainText("68% Done");

    // Capture desktop screenshot
    await page.screenshot({
      path: path.join(screenshotDir, "dashboard-1440-desktop.png"),
      fullPage: false,
    });
  });

  test("2. Profile Menu popover displays user identity, XP progress, telemetry chips and sign-out", async ({ page }) => {
    test.setTimeout(90_000);
    await authenticateStudent(page, { dashboard: mockLiveDashboard });
    await page.goto(resolveUrl("/dashboard"));

    const menuTrigger = page.getByRole("button", { name: "Open user profile menu" });
    await expect(menuTrigger).toBeVisible({ timeout: 15_000 });
    await expect(menuTrigger).toHaveAttribute("aria-expanded", "false");

    // Open Profile Menu
    await menuTrigger.click();
    await expect(menuTrigger).toHaveAttribute("aria-expanded", "true");

    const popover = page.getByRole("dialog", { name: "User account menu" });
    await expect(popover).toBeVisible();

    // Verify Identity Header
    await expect(popover).toContainText("E2E Student");
    await expect(popover).toContainText("Level 7");
    await expect(popover).toContainText("3,450 XP total");
    await expect(popover).toContainText("50 XP to Lvl 8");
    await expect(popover).toContainText("14 days");
    await expect(popover).toContainText("1420");

    // Verify Categorized Sections
    await expect(popover).toContainText("Profile & Identity");
    await expect(popover).toContainText("Learning Roadmap");
    await expect(popover).toContainText("Achievements");
    await expect(popover).toContainText("Battle Arena");
    await expect(popover).toContainText("Practice Problems");
    await expect(popover).toContainText("Account Settings");
    await expect(popover).toContainText("Notifications");
    await expect(popover).toContainText("Sign Out");

    // Capture Profile Menu open screenshot
    await page.screenshot({
      path: path.join(screenshotDir, "profile-menu-open.png"),
    });

    // Test Escape key closes menu
    await page.keyboard.press("Escape");
    await expect(popover).toHaveCount(0);
    await expect(menuTrigger).toHaveAttribute("aria-expanded", "false");
  });

  test("3. Profile page displays verified developer portfolio, tabs, and editing interface", async ({ page }) => {
    test.setTimeout(90_000);
    await authenticateStudent(page, { dashboard: mockLiveDashboard });
    await page.goto(resolveUrl("/profile"));

    // Check Profile Header
    await expect(page.getByRole("heading", { name: "Profile & Portfolio" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "E2E Student" })).toBeVisible();
    await expect(page.locator("h2").getByText("E2E Student")).toBeVisible();

    // Verify 4 Performance Stat Cards
    await expect(page.getByText("Total XP")).toBeVisible();
    await expect(page.getByText("3,450")).toBeVisible();
    await expect(page.getByText("Coding Solved")).toBeVisible();
    await expect(page.getByText("Battles Won")).toBeVisible();
    await expect(page.getByText("Daily Streak")).toBeVisible();

    // Verify Tab Switching
    const skillsTab = page.getByRole("button", { name: /Verified Skills/i });
    await skillsTab.click();
    await expect(page.getByText("Verified Technical Competencies")).toBeVisible();
    await expect(page.getByText("Data Structures & Algorithms")).toBeVisible();
    await expect(page.getByText("90% Mastery")).toBeVisible();

    const honorsTab = page.getByRole("button", { name: /Honors & Activity/i });
    await honorsTab.click();
    await expect(page.getByText("Unlocked Achievements & Badges")).toBeVisible();
    await expect(page.getByText("First Blood")).toBeVisible();
    await expect(page.getByText("Recent Activity Stream")).toBeVisible();

    // Switch back to overview
    const overviewTab = page.getByRole("button", { name: /Overview & Experience/i });
    await overviewTab.click();
    await expect(page.getByText("Professional Bio")).toBeVisible();

    // Test Edit Profile toggle
    const editBtn = page.getByRole("button", { name: "Edit Profile" });
    await editBtn.click();

    const editor = page.locator("#profile-editor");
    await expect(editor).toBeVisible();
    await expect(editor.getByText("Edit Profile Information")).toBeVisible();
    await expect(editor.getByRole("button", { name: "Personal Info" })).toBeVisible();
    await expect(editor.getByRole("button", { name: "Education" })).toBeVisible();
    await expect(editor.getByRole("button", { name: "Career Goals" })).toBeVisible();
    await expect(editor.getByRole("button", { name: "Social Links" })).toBeVisible();

    // Capture Profile Page screenshot
    await page.screenshot({
      path: path.join(screenshotDir, "profile-page-1440.png"),
    });

    // Cancel editing
    await editor.getByRole("button", { name: "Cancel" }).click();
    await expect(editor).toHaveCount(0);
  });

  test("4. Responsive audit across 1280px, 1024px, 768px, 430px, 390px, 360px viewports without horizontal overflow", async ({ page }) => {
    test.setTimeout(120_000);
    await authenticateStudent(page, { dashboard: mockLiveDashboard });

    const viewports = [
      { name: "1280-laptop", width: 1280, height: 800 },
      { name: "1024-tablet", width: 1024, height: 768 },
      { name: "768-tablet", width: 768, height: 1024 },
      { name: "430-mobile-large", width: 430, height: 932 },
      { name: "390-mobile-standard", width: 390, height: 844 },
      { name: "360-mobile-compact", width: 360, height: 800 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(resolveUrl("/dashboard"));
      await page.waitForLoadState("domcontentloaded");

      // Verify no horizontal overflow
      const overflow = await page.evaluate(() => {
        return {
          windowWidth: window.innerWidth,
          scrollWidth: document.documentElement.scrollWidth,
          bodyScrollWidth: document.body.scrollWidth,
        };
      });

      expect(
        overflow.scrollWidth,
        `Horizontal overflow detected at viewport ${vp.name} (${vp.width}px): scrollWidth=${overflow.scrollWidth}`
      ).toBeLessThanOrEqual(overflow.windowWidth + 1);

      // Capture screenshot
      await page.screenshot({
        path: path.join(screenshotDir, `dashboard-${vp.name}.png`),
      });
    }
  });
});
