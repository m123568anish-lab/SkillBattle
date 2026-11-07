import { expect, test } from "@playwright/test";

test("light, dark, and system preferences apply and persist", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");

  await page.getByRole("button", { name: /theme:/i }).click();
  await page.getByRole("menuitemradio", { name: "Light" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "light");
  await expect(page.locator("html")).toHaveAttribute("style", /color-scheme:\s*light/);

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await page.getByRole("button", { name: /theme:/i }).click();
  await page.getByRole("menuitemradio", { name: "System" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "system");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.getByRole("button", { name: /theme:/i }).click();
  await page.getByRole("menuitemradio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("theme picker supports keyboard navigation and selection", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");

  const trigger = page.getByRole("button", { name: /theme:/i });
  await expect(trigger).toHaveCSS("width", "36px");
  await trigger.click();
  const menu = page.getByRole("menu", { name: "Theme preference" });
  expect(await menu.evaluate((element) => element.getBoundingClientRect().width)).toBeLessThanOrEqual(256);

  const lightOption = page.getByRole("menuitemradio", { name: "Light" });
  const darkOption = page.getByRole("menuitemradio", { name: "Dark" });
  const systemOption = page.getByRole("menuitemradio", { name: "System" });
  await expect(systemOption).toBeFocused();

  await page.keyboard.press("ArrowDown");
  await expect(lightOption).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(darkOption).toBeFocused();
  await page.keyboard.press("Home");
  await expect(lightOption).toBeFocused();
  await page.keyboard.press("End");
  await expect(systemOption).toBeFocused();
  await expect(systemOption).toHaveAttribute("aria-checked", "true");

  await page.keyboard.press("ArrowUp");
  await expect(darkOption).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "dark");
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("menu", { name: "Theme preference" })).toHaveCount(0);

  await trigger.click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu", { name: "Theme preference" })).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("Qubira logo is identifiable and visible on the homepage", async ({ page }) => {
  await page.goto("/");

  const logo = page.getByRole("link", { name: "Qubira — Learn. Build. Compete." }).first();
  await expect(logo).toBeVisible();
  await expect(logo.locator("svg")).toHaveAttribute("aria-hidden", "true");
  await expect(logo.locator("svg")).toHaveAttribute("viewBox", "0 0 64 64");
});

test("public navigation is keyboard-operable and fits a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  const menuButton = page.getByRole("button", { name: "Open menu" });
  await menuButton.click();
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("navigation", { name: "Mobile navigation" })).toHaveCount(0);
  await expect(menuButton).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
