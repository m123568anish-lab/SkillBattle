import { expect, test } from "@playwright/test";
import { authenticateStudent, testStudent } from "./fixtures/authenticated-student";
import type { DashboardResponse } from "@/types/dashboard";

const viewports = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 430, height: 932 },
  { width: 390, height: 844 },
  { width: 360, height: 800 },
  { width: 320, height: 720 },
];

test("dashboard shell fits supported viewports and preserves mobile navigation targets", async ({ page }) => {
  test.setTimeout(120_000);
  await authenticateStudent(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/dashboard");

  const mobileNavigation = page.getByRole("navigation", { name: "Primary mobile navigation" });
  await expect(mobileNavigation).toBeVisible({ timeout: 15_000 });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.goto("/profile");
  const brandLink = page.getByRole("link", { name: "Go to your Qubira dashboard" });
  await expect(brandLink).toBeVisible();
  await brandLink.click();
  await page.waitForURL(/\/dashboard$/);
  await expect(page.getByRole("dialog", { name: "Navigation menu" })).toHaveCount(0);
  await page.goto("/dashboard");
  for (const label of ["Home", "Learn", "Arena", "Rankings", "Profile"]) {
    await expect(mobileNavigation.getByText(label)).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Open support options" })).toBeHidden();
  const menuButton = page.getByRole("button", { name: "Open navigation menu" });
  await menuButton.click();
  const navigationDrawer = page.getByRole("dialog", { name: "Navigation menu" });
  await expect(page.getByRole("button", { name: "Close navigation menu" }).first()).toHaveAttribute("aria-expanded", "true");
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await expect(navigationDrawer.getByRole("link", { name: "Support" })).toBeVisible();
  await page.locator('div.fixed.inset-0.z-50 > button[aria-label="Close navigation menu"]').click();
  await expect(navigationDrawer).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  await menuButton.click();
  await expect(navigationDrawer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(navigationDrawer).toHaveCount(0);
  await expect(menuButton).toBeFocused();

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    const layout = await page.evaluate(() => {
      const navigation = document.querySelector<HTMLElement>('nav[aria-label="Primary mobile navigation"]');
      const sidebar = document.querySelector<HTMLElement>("aside");
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        mobileNavigationVisible: Boolean(navigation && getComputedStyle(navigation).display !== "none"),
        desktopSidebarVisible: Boolean(sidebar && sidebar.getBoundingClientRect().width > 0),
      };
    });
    expect(layout.documentWidth).toBeLessThanOrEqual(layout.viewportWidth);
    expect(layout.mobileNavigationVisible).toBe(viewport.width < 1024);
    if (viewport.width >= 1024) expect(layout.desktopSidebarVisible).toBe(true);

    if (viewport.width >= 360 && viewport.width <= 430) {
      for (const control of [
        page.getByRole("button", { name: "Open navigation menu" }),
        page.getByRole("button", { name: /^Notifications/ }),
        page.getByRole("button", { name: "Open profile menu" }),
      ]) {
        const box = await control.boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(44);
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
      await expect(page.getByRole("button", { name: /^Theme:/ })).toBeHidden();

      for (const item of await mobileNavigation.getByRole("link").all()) {
        const box = await item.boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(44);
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
    }

    if (viewport.width === 1920) {
      await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
      await page.screenshot({ path: "test-results/qubira-dashboard-desktop.png" });
    } else if (viewport.width === 390) {
      await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
      await page.screenshot({ path: "test-results/qubira-dashboard-mobile.png" });
    }
  }
});

test("dashboard organizes live progress, learning actions, and weekly activity", async ({ page }) => {
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
        target_company: "",
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
      skill_gaps: [{
        skill_id: "graphs",
        skill_name: "Graph traversal",
        priority: "HIGH",
        reason: "Recent practice shows this topic can improve.",
      }],
      roadmap: {
        title: "Backend engineering",
        progress: 35,
        milestone: "Complete the data structures milestone.",
      },
      study_hours: { configured: true, minutes: 32 },
      summary: { strong_skills: 2, weak_skills: 1, gap_count: 1 },
    },
  };

  await authenticateStudent(page, { dashboard });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Welcome back, Mina" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("region", { name: "Performance overview" })).toContainText("Lifetime XP");
  await expect(page.getByRole("heading", { name: "Battle Arena" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Solo practice/ })).toHaveAttribute("href", "/battle/solo");
  await expect(page.getByRole("link", { name: /Multiplayer arena/ })).toHaveAttribute("href", "/battle/lobby");
  await expect(page.getByRole("heading", { name: "Trace a graph traversal" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Backend engineering" })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: "Roadmap progress" })).toHaveAttribute("aria-valuenow", "35");
  await expect(page.getByRole("progressbar", { name: "2025-03-10: 10 XP" })).toBeVisible();
  await expect(page.getByText("Mon", { exact: true })).toBeVisible();
  await expect(page.getByText("Sun", { exact: true })).toBeVisible();

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    const layout = await page.evaluate(() => ({
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    }));
    expect(layout.documentWidth, `dashboard at ${viewport.width}px`).toBeLessThanOrEqual(layout.viewportWidth);
    await expect(page.getByRole("heading", { name: "Battle Arena" })).toBeVisible();
  }
});

test("mobile brand navigation follows the authenticated account role", async ({ page }) => {
  await authenticateStudent(page, { role: "recruiter" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/profile");

  const brand = page.getByRole("link", { name: "Go to your Qubira dashboard" });
  await expect(brand).toHaveAttribute("href", "/company/dashboard");
  const mobileHome = page.getByRole("navigation", { name: "Primary mobile navigation" })
    .getByRole("link", { name: "Home" });
  await expect(mobileHome).toHaveAttribute("href", "/company/dashboard");

  await brand.click();
  await page.waitForURL(/\/company\/dashboard$/);
  await expect(page.getByRole("dialog", { name: "Navigation menu" })).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator("[data-current-page]")).toHaveText("Hiring overview");
});

test("profile keeps its live details readable across mobile and desktop", async ({ page }) => {
  await authenticateStudent(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/profile");

  await expect(page.getByRole("heading", { name: "Profile", exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "E2E Student" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Profile overview" }).getByText("Qubira Test University")).toBeVisible();
  await expect(page.getByRole("link", { name: "Account settings" })).toBeVisible();

  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await page.screenshot({ path: "test-results/qubira-profile-mobile.png" });

  await page.getByRole("button", { name: "Edit profile" }).click();
  await page.getByRole("button", { name: "Education" }).click();
  await expect(page.getByRole("textbox", { name: "College / University" })).toHaveValue("Qubira Test University");
  await expect(page.getByRole("spinbutton", { name: "Graduation Year" })).toHaveValue("2027");

  await page.setViewportSize({ width: 320, height: 720 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);

  await page.setViewportSize({ width: 1440, height: 900 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1440);
  await page.getByRole("button", { name: "Close editor" }).click();
  await page.screenshot({ path: "test-results/qubira-profile-desktop.png" });
});

test("solo challenges stay readable and usable on mobile and desktop in dark theme", async ({ page }) => {
  await authenticateStudent(page);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.setViewportSize({ width: 430, height: 932 });
  await page.goto("/battle/solo");

  const codingHeading = page.getByRole("heading", { name: "Algorithmic Coding Battle" });
  await expect(codingHeading).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "MCQ Practice" })).toBeVisible();
  const mobileNavigation = page.getByRole("navigation", { name: "Primary mobile navigation" });
  await expect(mobileNavigation).toBeVisible();

  for (const viewport of [
    { width: 430, height: 932 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport.width);
    if (viewport.width >= 1024) await expect(mobileNavigation).toBeHidden();

    const codingCard = await codingHeading.evaluate((heading) => {
      const card = heading.closest("div.rounded-3xl");
      if (!card) throw new Error("Coding challenge card was not found.");
      const style = getComputedStyle(card);
      const headingStyle = getComputedStyle(heading);
      return {
        backgroundColor: style.backgroundColor,
        backgroundImage: style.backgroundImage,
        headingColor: headingStyle.color,
      };
    });
    expect(codingCard.backgroundColor).toBe("rgb(10, 11, 13)");
    expect(codingCard.backgroundImage).toBe("none");
    expect(codingCard.headingColor).toBe("rgb(255, 255, 255)");

    for (const control of [
      page.getByRole("button", { name: "Python 3" }),
      page.getByRole("button", { name: "JavaScript" }),
      page.getByRole("button", { name: "Easy" }).last(),
    ]) {
      const box = await control.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  }
});

test("Learn and Arena pages remain overflow-free across supported viewports", async ({ page }) => {
  test.setTimeout(180_000);
  await authenticateStudent(page);
  const experienceRoutes = [
    "/practice",
    "/practice/topics",
    "/practice/mcq",
    "/practice/session?topic=Algorithms+%26+Data+Structures&difficulty=easy&count=5",
    "/practice/coding",
    "/practice/progress",
    "/practice/saved",
    "/coach",
    "/campaign",
    "/battle",
    "/battle/solo",
    "/battle/lobby",
    "/tournament",
    "/leaderboard",
  ];

  for (const route of experienceRoutes) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    await expect(page.locator("#main-content")).toBeVisible({ timeout: 15_000 });
    if (route === "/practice/saved") {
      await expect(page.getByRole("heading", { name: "No saved questions yet" })).toBeVisible();
      await expect(page.getByText("LRU Cache Implementation")).toHaveCount(0);
    }

    for (const viewport of viewports) {
      if (viewport.width < 360) continue;
      await page.setViewportSize(viewport);
      const layout = await page.evaluate(() => {
        const navigation = document.querySelector<HTMLElement>('nav[aria-label="Primary mobile navigation"]');
        return {
          viewportWidth: window.innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          mobileNavigationVisible: Boolean(navigation && getComputedStyle(navigation).display !== "none"),
        };
      });
      expect(layout.documentWidth, `${route} at ${viewport.width}px`).toBeLessThanOrEqual(layout.viewportWidth);
      expect(layout.mobileNavigationVisible, `${route} navigation at ${viewport.width}px`).toBe(viewport.width < 1024);
    }
  }
});
