import { expect, test } from "@playwright/test";
import { authenticateStudent } from "./fixtures/authenticated-student";

function captureConsoleErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  return errors;
}

for (const { role, href } of [
  { role: "student", href: "/dashboard" },
  { role: "college_admin", href: "/college/dashboard" },
  { role: "recruiter", href: "/company/dashboard" },
  { role: "platform_admin", href: "/admin" },
]) {
  test(`mobile brand controls stay independent for ${role}`, async ({ page }) => {
    const consoleErrors = captureConsoleErrors(page);
    await authenticateStudent(page, { role });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/profile");

    const dashboardLink = page.getByRole("link", { name: "Go to your Qubira dashboard" }).first();
    const menuButton = page.locator("[data-mobile-menu-trigger]");
    await expect(dashboardLink).toHaveAttribute("href", href);
    await expect(menuButton).toHaveAttribute("aria-expanded", "false");

    await menuButton.click();
    const drawer = page.getByRole("dialog", { name: "Navigation menu" });
    await expect(drawer).toBeVisible();
    await expect(menuButton).toHaveAttribute("aria-expanded", "true");
    await expect(page).toHaveURL(/\/profile$/);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");

    const drawerLogoToggle = drawer.getByRole("button", { name: "Close navigation menu" });
    await expect(drawerLogoToggle).toHaveAttribute("aria-expanded", "true");
    await drawerLogoToggle.click();
    await expect(drawer).toHaveCount(0);
    await expect(page).toHaveURL(/\/profile$/);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");

    await dashboardLink.click();
    await page.waitForURL((url) => url.pathname === href);
    await expect(page.getByRole("dialog", { name: "Navigation menu" })).toHaveCount(0);
    expect(consoleErrors).toEqual([]);
  });
}

test("mobile drawer supports escape, outside click, route-close, and active state", async ({ page }) => {
  const consoleErrors = captureConsoleErrors(page);
  await authenticateStudent(page);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/dashboard");

  const menuButton = page.getByRole("button", { name: "Open navigation menu" });
  const drawer = page.getByRole("dialog", { name: "Navigation menu" });
  await menuButton.click();
  await expect(drawer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open navigation menu" })).toBeFocused();

  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await expect(drawer).toBeVisible();
  await page.getByRole("button", { name: "Close navigation menu" }).nth(1).click();
  await expect(drawer).toHaveCount(0);

  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await drawer.getByRole("link", { name: "Learn" }).click();
  await page.waitForURL(/\/practice$/);
  await expect(drawer).toHaveCount(0);

  await page.setViewportSize({ width: 1440, height: 900 });
  const sidebar = page.getByRole("navigation", { name: "Main Navigation" });
  await expect(sidebar.getByRole("link", { name: "Learn" })).toHaveAttribute("aria-current", "page");
  await page.getByRole("button", { name: /Collapse sidebar/ }).click();
  await expect(page.getByRole("button", { name: /Expand sidebar/ })).toBeVisible();
  await sidebar.getByRole("link", { name: "Learn" }).focus();
  await expect(page.getByRole("tooltip")).toContainText("Learn");
  await page.getByRole("button", { name: /Expand sidebar/ }).click();
  expect(consoleErrors).toEqual([]);
});

test("admin mobile drawer keeps its role route and closes on successful navigation", async ({ page }) => {
  const consoleErrors = captureConsoleErrors(page);
  await authenticateStudent(page, { role: "platform_admin" });
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/admin");

  const dashboardLink = page.getByRole("link", { name: "Go to your Qubira dashboard" }).first();
  await expect(dashboardLink).toHaveAttribute("href", "/admin");
  const menuButton = page.locator("[data-mobile-menu-trigger]");
  await menuButton.click();

  const drawer = page.getByRole("dialog", { name: "Admin navigation" });
  await expect(drawer).toBeVisible();
  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  await expect(drawer.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");

  await drawer.getByRole("link", { name: "User Management" }).click();
  await page.waitForURL(/\/admin\?tab=users$/);
  await expect(drawer).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(
    page.getByRole("navigation", { name: "Admin navigation" }).getByRole("link", { name: "User Management" })
  ).toHaveAttribute("aria-current", "page");
  expect(consoleErrors).toEqual([]);
});
