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

test("dark theme keeps legacy gray text readable on dark and white surfaces", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");

  const contrast = await page.evaluate(() => {
    const probes = [
      { className: "bg-slate-950 text-gray-900", id: "dark-surface" },
      { className: "bg-slate-950 text-gray-500", id: "muted-dark-surface" },
      { className: "bg-white text-gray-900", id: "white-surface" },
    ];
    const elements = probes.map(({ className, id }) => {
      const element = document.createElement("span");
      element.id = id;
      element.className = className;
      element.textContent = "Theme contrast";
      element.style.position = "fixed";
      document.body.append(element);
      return element;
    });

    function luminance(color: string) {
      const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
      if (!channels || channels.length !== 3) throw new Error(`Unexpected computed color: ${color}`);
      const [red, green, blue] = channels.map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    }

    function ratio(foreground: string, background: string) {
      const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    }

    const results = elements.map((element) => {
      const style = getComputedStyle(element);
      return { id: element.id, ratio: ratio(style.color, style.backgroundColor) };
    });
    elements.forEach((element) => element.remove());
    return results;
  });

  expect(contrast.find(({ id }) => id === "dark-surface")?.ratio).toBeGreaterThanOrEqual(4.5);
  expect(contrast.find(({ id }) => id === "muted-dark-surface")?.ratio).toBeGreaterThanOrEqual(4.5);
  expect(contrast.find(({ id }) => id === "white-surface")?.ratio).toBeGreaterThanOrEqual(4.5);
});

test("dark theme uses near-black surfaces with a readable violet secondary accent", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");

  const palette = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const swatch = document.createElement("span");
    swatch.className = "text-violet-400";
    document.body.append(swatch);
    const secondaryUtilityColor = getComputedStyle(swatch).color;
    swatch.className = "bg-[#0b1020]";
    const arbitrarySurfaceColor = getComputedStyle(swatch).backgroundColor;
    swatch.remove();

    return {
      canvas: root.getPropertyValue("--surface-canvas").trim(),
      card: root.getPropertyValue("--surface-card").trim(),
      secondary: root.getPropertyValue("--accent-secondary").trim(),
      primary: root.getPropertyValue("--accent").trim(),
      secondaryUtilityColor,
      arbitrarySurfaceColor,
    };
  });

  expect(palette.canvas).toBe("#030405");
  expect(palette.card).toBe("#0a0b0d");
  expect(palette.secondary).not.toBe(palette.primary);
  expect(palette.secondaryUtilityColor).toBe("rgb(167, 139, 250)");
  expect(palette.arbitrarySurfaceColor).toBe("rgb(10, 11, 13)");
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
