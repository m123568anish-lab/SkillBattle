import { expect, test } from "@playwright/test";
import { authenticateStudent } from "./fixtures/authenticated-student";

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
  for (const label of ["Home", "Learn", "Arena", "Rankings", "Profile"]) {
    await expect(mobileNavigation.getByText(label)).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Open support options" })).toBeHidden();
  const menuButton = page.getByRole("button", { name: "Open navigation menu" });
  await menuButton.click();
  const navigationDrawer = page.getByRole("dialog", { name: "Navigation menu" });
  await expect(navigationDrawer.getByRole("link", { name: "Support" })).toBeVisible();
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
        page.getByRole("button", { name: /^Theme:/ }),
        page.getByRole("button", { name: /^Notifications/ }),
        page.getByRole("button", { name: "Open profile menu" }),
      ]) {
        const box = await control.boundingBox();
        expect(box?.width).toBeGreaterThanOrEqual(44);
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }

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
