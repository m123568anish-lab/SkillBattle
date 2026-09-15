import { expect, test } from "@playwright/test";

const viewports = [
  { width: 320, height: 720 },
  { width: 375, height: 812 },
  { width: 428, height: 926 },
];

test.describe("dashboard responsive shell", () => {
  test.use({ storageState: "playwright/.auth/user.json" });

  for (const viewport of viewports) {
    test(`shows mobile navigation at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto("/dashboard");

      const mobileNavigation = page.getByRole("navigation", {
        name: "Mobile navigation",
      });
      await expect(mobileNavigation).toBeVisible();
      await expect(mobileNavigation.getByText("Home")).toBeVisible();
      await expect(mobileNavigation.getByText("Explore")).toBeVisible();
      await expect(mobileNavigation.getByText("My List")).toBeVisible();
      await expect(mobileNavigation.getByText("Social")).toBeVisible();
      await expect(mobileNavigation.getByText("More")).toBeVisible();

      const lastCard = page.locator("main section").locator("[class*='rounded']").last();
      await lastCard.scrollIntoViewIfNeeded();
      await expect(lastCard).toBeVisible();
    });
  }

  test("hides mobile navigation at desktop width", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/dashboard");

    await expect(
      page.getByRole("navigation", { name: "Mobile navigation" }),
    ).toBeHidden();
    await expect(page.locator("aside").first()).toBeVisible();
  });
});
