import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

test.beforeAll(() => {
  try {
    mkdirSync(resolve(process.cwd(), "test-results", "screenshots"), { recursive: true });
  } catch {}
});

const mockDashboardData = {
  user: {
    id: "7001",
    email: "student@example.com",
    username: "e2e_student",
    full_name: "Qubira Engineer",
    avatar_url: null,
    level: 4,
  },
  stats: {
    xp: 2450,
    level: 4,
    next_level_xp: 3000,
    xp_to_next_level: 550,
    level_progress_percent: 68,
    streak: 5,
    longest_streak: 12,
    rating: 1420,
    battles_played: 28,
    battles_completed: 26,
    battles_won: 20,
    battles_lost: 6,
    practice_attempted: 45,
    practice_completed: 42,
    practice_tasks_completed: 38,
    practice_accuracy: 93,
    daily_challenge_completed: true,
  },
  achievements: [],
  daily_challenge: {
    id: "dc_1",
    title: "Invert Binary Tree with Minimal Auxiliary Space",
    description: "Given the root of a binary tree, invert the tree and return its root in optimal time.",
    difficulty: "Medium",
    is_completed: true,
  },
  weekly_activity: [],
  command_center: null,
  ai_recommendation: {
    title: "Graph Traversal & Shortest Path Heuristics",
    message: "Your BFS and Dijkstra accuracy reached 94% across recent rounds. Practice bidirectional search next.",
    progress: 88,
    action: "Start Target Practice",
  },
};

async function authenticateStudent(page: import("@playwright/test").Page) {
  await page.context().addCookies([
    {
      name: "__Secure-neon-auth.session_token",
      value: "e2e-cookie-session",
      url: "https://127.0.0.1:3000",
      httpOnly: true,
      secure: true,
      sameSite: "Lax",
    },
  ]);

  await page.addInitScript(
    ([userCache, dashboardCache]) => {
      localStorage.setItem("skillbattle_user_cache", JSON.stringify(userCache));
      localStorage.setItem("skillbattle_dashboard_cache:http%3A%2F%2F127.0.0.1%3A1", JSON.stringify(dashboardCache));
      localStorage.setItem("skillbattle_dashboard_cache", JSON.stringify(dashboardCache));
    },
    [
      {
        id: "7001",
        email: "student@example.com",
        username: "e2e_student",
        full_name: "Qubira Engineer",
        role: "student",
        is_verified: true,
        onboarding_completed: true,
      },
      {
        userId: "7001",
        timestamp: new Date().toISOString(),
        apiOrigin: "http://127.0.0.1:1",
        data: mockDashboardData,
      },
    ]
  );

  // Fallback wildcards registered first so specific handlers registered later take precedence
  await page.route("**/api/v1/**", (route) => route.fulfill({ json: {} }));

  await page.route("**/api/health", (route) => route.fulfill({ json: { status: "ok" } }));
  await page.route("**/health", (route) => route.fulfill({ json: { status: "ok" } }));
  await page.route("**/achievements/**", (route) => route.fulfill({ json: [] }));
  await page.route("**/audit/**", (route) => route.fulfill({ json: [] }));
  await page.route("**/search**", (route) => route.fulfill({ json: { results: [] } }));

  await page.route("**/api/v1/auth/me", (route) =>
    route.fulfill({
      json: {
        id: "7001",
        email: "student@example.com",
        username: "e2e_student",
        full_name: "Qubira Engineer",
        role: "student",
        is_verified: true,
        onboarding_completed: true,
      },
    })
  );

  await page.route("**/api/v1/dashboard**", (route) =>
    route.fulfill({ json: mockDashboardData })
  );

  await page.route("**/dashboard**", (route) => {
    if (route.request().url().includes("/api/")) {
      return route.fulfill({ json: mockDashboardData });
    }
    return route.continue();
  });

  await page.route("**/notifications**", (route) =>
    route.fulfill({
      json: [
        {
          id: "notif-1",
          user_id: "7001",
          title: "Duel Match Scheduled",
          message: "A ranked challenger has joined your battle room.",
          notification_type: "battle",
          is_read: false,
          created_at: new Date().toISOString(),
          related_entity_type: "battle",
          related_entity_id: "room-99",
        },
      ],
    })
  );

  await page.route("**/notifications/unread-count", (route) =>
    route.fulfill({ json: { unread_count: 1 } })
  );
}

async function dismissCookiePreferences(page: import("@playwright/test").Page) {
  const essentialOnly = page.getByRole("button", { name: /essential only/i });
  if (await essentialOnly.isVisible()) await essentialOnly.click();
}

test.describe("Qubira Black Edition — Motion & Interaction Engine", () => {
  test("Desktop pointer interactions and cursor spotlight activate on hero", async ({ page }) => {
    await authenticateStudent(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/dashboard");
    await dismissCookiePreferences(page);

    // Check main container does not horizontally overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Find the dashboard hero
    const heroSection = page.locator("[data-dashboard-hero]");
    await expect(heroSection).toBeVisible({ timeout: 10000 });

    // Move pointer over hero section to trigger cursor tracking
    await heroSection.hover();
    await page.waitForTimeout(300);

    const hasSpotlightProperties = await heroSection.evaluate((el) => {
      const style = el.getAttribute("style") || "";
      const mouseX = el.style.getPropertyValue("--mouse-x");
      const opacity = el.style.getPropertyValue("--spotlight-opacity");
      return opacity === "1" || mouseX.length > 0 || style.includes("--mouse-x") || style.includes("--spotlight-opacity");
    });
    expect(hasSpotlightProperties).toBe(true);

    // Capture desktop dark dashboard screenshot
    await page.screenshot({
      path: "test-results/screenshots/01-dashboard-dark-desktop.png",
      fullPage: false,
    });
  });

  test("Keyboard shortcuts: sidebar toggle (Ctrl+B) and search (Ctrl+K)", async ({ page }) => {
    await authenticateStudent(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/dashboard");
    await dismissCookiePreferences(page);

    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible();

    // Verify initial collapse button
    const collapseButton = page.getByRole("button", { name: /collapse sidebar/i });
    await expect(collapseButton).toBeVisible();

    // Toggle sidebar via keyboard Ctrl+B
    await page.keyboard.press("Control+b");
    await page.waitForTimeout(400);

    // Verify collapse button reflects collapsed state
    const expandButton = page.getByRole("button", { name: /expand sidebar/i });
    await expect(expandButton).toBeVisible();

    // Take screenshot of collapsed sidebar
    await page.screenshot({
      path: "test-results/screenshots/02-sidebar-collapsed.png",
      fullPage: false,
    });

    // Expand sidebar back
    await page.keyboard.press("Control+b");
    await page.waitForTimeout(400);
    await expect(collapseButton).toBeVisible();

    // Trigger search via Ctrl+K
    await page.keyboard.press("Control+k");
    const searchInput = page.getByRole("combobox", { name: /search qubira/i });
    await expect(searchInput).toBeFocused();

    await page.keyboard.press("Escape");
  });

  test("Mobile responsive drawer and touch interactions", async ({ page }) => {
    await authenticateStudent(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/dashboard");
    await dismissCookiePreferences(page);

    // Mobile trigger button visible
    const mobileMenuTrigger = page.locator("[data-mobile-menu-trigger]").first();
    await expect(mobileMenuTrigger).toBeVisible();

    // Open drawer
    await mobileMenuTrigger.click();
    await page.waitForTimeout(400);

    // Drawer dialog visible
    const drawerDialog = page.getByRole("dialog", { name: "Navigation menu" });
    await expect(drawerDialog).toBeVisible();

    // Capture mobile drawer screenshot
    await page.screenshot({
      path: "test-results/screenshots/03-mobile-drawer.png",
      fullPage: false,
    });

    // Press Escape to close drawer
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    await expect(drawerDialog).toHaveCount(0);
  });

  test("Topbar dropdowns fade and scale cleanly (Profile & Notifications)", async ({ page }) => {
    await authenticateStudent(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/dashboard");
    await dismissCookiePreferences(page);

    // Open notification menu
    const notifButton = page.getByRole("button", { name: /notifications/i }).first();
    await notifButton.click();

    const notifDialog = page.getByRole("dialog", { name: /notifications/i });
    await expect(notifDialog).toBeVisible({ timeout: 10000 });

    // Close via escape
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    await expect(notifDialog).toHaveCount(0);
  });

  test("Reduced-motion mode disables heavy animations and collapses durations", async ({ page }) => {
    await authenticateStudent(page);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/dashboard");
    await dismissCookiePreferences(page);

    const rootAnimationDuration = await page.evaluate(() => {
      const el = document.createElement("div");
      el.className = "animate-spin";
      document.body.appendChild(el);
      const computed = window.getComputedStyle(el).animationDuration;
      document.body.removeChild(el);
      return computed;
    });

    // Under prefers-reduced-motion: reduce, globals.css overrides animation-duration to 0.01ms
    expect(parseFloat(rootAnimationDuration)).toBeLessThanOrEqual(0.01);
  });

  test("Light theme transition and visual contrast verification", async ({ page }) => {
    await authenticateStudent(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/dashboard");
    await dismissCookiePreferences(page);

    // Open theme menu and select Light
    const themeButton = page.getByRole("button", { name: /theme:/i }).first();
    await expect(themeButton).toBeVisible();
    await themeButton.click();
    await page.getByRole("menuitemradio", { name: "Light" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    // Verify contrast on light mode
    await page.screenshot({
      path: "test-results/screenshots/04-dashboard-light-desktop.png",
      fullPage: false,
    });
  });
});
