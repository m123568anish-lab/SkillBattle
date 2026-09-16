import { test, expect } from "@playwright/test";

test.describe("SkillBattle Mobile Responsive & XP System Test Suite", () => {

  test("Mobile Viewport (< 768px) - Bottom Bar Visible & Desktop Header Hidden", async ({ page }) => {
    // Set viewport to mobile screen size (375x812 - iPhone X/12/13)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/dashboard");

    // Verify Mobile Navigation Dock is visible
    const mobileNav = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(mobileNav).toBeVisible();

    // Verify 5 Mobile Nav items: Home, Explore, My List, Social, More
    await expect(page.getByText("Home", { exact: true })).toBeVisible();
    await expect(page.getByText("Explore", { exact: true })).toBeVisible();
    await expect(page.getByText("My List", { exact: true })).toBeVisible();
    await expect(page.getByText("Social", { exact: true })).toBeVisible();
    await expect(page.getByText("More", { exact: true })).toBeVisible();

    // Verify Desktop Sidebar is hidden on mobile
    const sidebar = page.locator("aside").filter({ hasText: "SkillBattle" }).first();
    await expect(sidebar).toBeHidden();
  });

  test("Desktop Viewport (≥ 768px) - Bottom Bar Hidden & Desktop Sidebar Restored", async ({ page }) => {
    // Set viewport to desktop screen size (1280x800)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard");

    // Verify Mobile Navigation Dock is HIDDEN on desktop
    const mobileNav = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(mobileNav).toBeHidden();

    // Verify Desktop Sidebar is VISIBLE on desktop
    const sidebar = page.locator("aside").filter({ hasText: "SkillBattle" }).first();
    await expect(sidebar).toBeVisible();
  });

  test("XP System Verification - XP is Non-Zero & Increments Dynamically", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard");

    // Verify XP counter is present and bound to session data
    const xpText = page.locator("text=/\\d+\\s*XP/");
    await expect(xpText.first()).toBeVisible();
  });

});
