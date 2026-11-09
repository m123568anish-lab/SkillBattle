# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend\tests\motion-interactions.spec.ts >> Qubira Black Edition — Motion & Interaction Engine >> Desktop pointer interactions and cursor spotlight activate on hero
- Location: frontend\tests\motion-interactions.spec.ts:12:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/dashboard", waiting until "load"

```

# Test source

```ts
  1   | import { expect, test } from "@playwright/test";
  2   | import { mkdirSync } from "node:fs";
  3   | import { resolve } from "node:path";
  4   | 
  5   | test.beforeAll(() => {
  6   |   try {
  7   |     mkdirSync(resolve(process.cwd(), "test-results", "screenshots"), { recursive: true });
  8   |   } catch {}
  9   | });
  10  | 
  11  | test.describe("Qubira Black Edition — Motion & Interaction Engine", () => {
  12  |   test("Desktop pointer interactions and cursor spotlight activate on hero", async ({ page }) => {
  13  |     await page.setViewportSize({ width: 1440, height: 900 });
  14  |     await page.emulateMedia({ colorScheme: "dark" });
> 15  |     await page.goto("/dashboard");
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  16  | 
  17  |     // Check main container does not horizontally overflow
  18  |     const hasHorizontalOverflow = await page.evaluate(() => {
  19  |       return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  20  |     });
  21  |     expect(hasHorizontalOverflow).toBe(false);
  22  | 
  23  |     // Find the dashboard hero or a spotlight card
  24  |     const heroSection = page.locator("section:has-text('Welcome back')").first();
  25  |     await expect(heroSection).toBeVisible();
  26  | 
  27  |     // Move pointer over hero section to trigger cursor tracking
  28  |     const heroBox = await heroSection.boundingBox();
  29  |     if (heroBox) {
  30  |       await page.mouse.move(heroBox.x + heroBox.width / 2, heroBox.y + heroBox.height / 2);
  31  |       await page.waitForTimeout(100);
  32  | 
  33  |       const hasSpotlightProperties = await heroSection.evaluate((el) => {
  34  |         const style = el.getAttribute("style") || "";
  35  |         const computed = window.getComputedStyle(el);
  36  |         const opacity = el.style.getPropertyValue("--spotlight-opacity") || computed.getPropertyValue("--spotlight-opacity");
  37  |         return opacity === "1" || style.includes("--mouse-x");
  38  |       });
  39  |       expect(hasSpotlightProperties).toBe(true);
  40  |     }
  41  | 
  42  |     // Capture desktop dark dashboard screenshot
  43  |     await page.screenshot({
  44  |       path: "test-results/screenshots/01-dashboard-dark-desktop.png",
  45  |       fullPage: false,
  46  |     });
  47  |   });
  48  | 
  49  |   test("Keyboard shortcuts: sidebar toggle (Ctrl+B) and search (Ctrl+K)", async ({ page }) => {
  50  |     await page.setViewportSize({ width: 1440, height: 900 });
  51  |     await page.goto("/dashboard");
  52  | 
  53  |     const sidebar = page.locator("aside").first();
  54  |     await expect(sidebar).toBeVisible();
  55  | 
  56  |     // Toggle sidebar via keyboard Ctrl+B
  57  |     await page.keyboard.press("Control+b");
  58  |     await page.waitForTimeout(300);
  59  | 
  60  |     // Verify collapse button reflects collapsed state
  61  |     const expandButton = page.getByRole("button", { name: /expand sidebar/i });
  62  |     await expect(expandButton).toBeVisible();
  63  | 
  64  |     // Take screenshot of collapsed sidebar
  65  |     await page.screenshot({
  66  |       path: "test-results/screenshots/02-sidebar-collapsed.png",
  67  |       fullPage: false,
  68  |     });
  69  | 
  70  |     // Expand sidebar back
  71  |     await page.keyboard.press("Control+b");
  72  |     await page.waitForTimeout(300);
  73  |     const collapseButton = page.getByRole("button", { name: /collapse sidebar/i });
  74  |     await expect(collapseButton).toBeVisible();
  75  | 
  76  |     // Trigger search via Ctrl+K
  77  |     await page.keyboard.press("Control+k");
  78  |     const searchInput = page.getByRole("combobox", { name: /search qubira/i });
  79  |     await expect(searchInput).toBeFocused();
  80  | 
  81  |     await page.keyboard.press("Escape");
  82  |   });
  83  | 
  84  |   test("Mobile responsive drawer and touch interactions", async ({ page }) => {
  85  |     // Mobile viewport
  86  |     await page.setViewportSize({ width: 390, height: 844 });
  87  |     await page.goto("/dashboard");
  88  | 
  89  |     // Mobile trigger button visible
  90  |     const mobileMenuTrigger = page.locator("[data-mobile-menu-trigger]").first();
  91  |     await expect(mobileMenuTrigger).toBeVisible();
  92  | 
  93  |     // Open drawer
  94  |     await mobileMenuTrigger.click();
  95  |     await page.waitForTimeout(300);
  96  | 
  97  |     // Drawer dialog visible
  98  |     const drawerDialog = page.getByRole("dialog", { name: "Navigation menu" });
  99  |     await expect(drawerDialog).toBeVisible();
  100 | 
  101 |     // Capture mobile drawer screenshot
  102 |     await page.screenshot({
  103 |       path: "test-results/screenshots/03-mobile-drawer.png",
  104 |       fullPage: false,
  105 |     });
  106 | 
  107 |     // Press Escape to close drawer
  108 |     await page.keyboard.press("Escape");
  109 |     await page.waitForTimeout(300);
  110 |     await expect(drawerDialog).toHaveCount(0);
  111 |   });
  112 | 
  113 |   test("Topbar dropdowns fade and scale cleanly (Profile & Notifications)", async ({ page }) => {
  114 |     await page.setViewportSize({ width: 1440, height: 900 });
  115 |     await page.goto("/dashboard");
```