# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frontend\tests\motion-interactions.spec.ts >> Qubira Black Edition — Motion & Interaction Engine >> Light theme transition and visual contrast verification
- Location: frontend\tests\motion-interactions.spec.ts:147:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/dashboard", waiting until "load"

```

# Test source

```ts
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
  116 | 
  117 |     // Open notification menu
  118 |     const notifButton = page.getByRole("button", { name: /notifications/i }).first();
  119 |     await notifButton.click();
  120 | 
  121 |     const notifDialog = page.getByRole("dialog", { name: /notifications/i });
  122 |     await expect(notifDialog).toBeVisible();
  123 | 
  124 |     // Close via escape
  125 |     await page.keyboard.press("Escape");
  126 |     await page.waitForTimeout(150);
  127 |     await expect(notifDialog).toHaveCount(0);
  128 |   });
  129 | 
  130 |   test("Reduced-motion mode disables heavy animations and collapses durations", async ({ page }) => {
  131 |     await page.emulateMedia({ reducedMotion: "reduce" });
  132 |     await page.goto("/dashboard");
  133 | 
  134 |     const rootAnimationDuration = await page.evaluate(() => {
  135 |       const el = document.createElement("div");
  136 |       el.className = "animate-spin";
  137 |       document.body.appendChild(el);
  138 |       const computed = window.getComputedStyle(el).animationDuration;
  139 |       document.body.removeChild(el);
  140 |       return computed;
  141 |     });
  142 | 
  143 |     // Under prefers-reduced-motion: reduce, globals.css overrides animation-duration to 0.01ms
  144 |     expect(parseFloat(rootAnimationDuration)).toBeLessThanOrEqual(0.01);
  145 |   });
  146 | 
  147 |   test("Light theme transition and visual contrast verification", async ({ page }) => {
  148 |     await page.setViewportSize({ width: 1440, height: 900 });
> 149 |     await page.goto("/dashboard");
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  150 | 
  151 |     // Open theme menu and select Light
  152 |     await page.getByRole("button", { name: /theme:/i }).click();
  153 |     await page.getByRole("menuitemradio", { name: "Light" }).click();
  154 |     await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  155 | 
  156 |     // Verify contrast on light mode
  157 |     await page.screenshot({
  158 |       path: "test-results/screenshots/04-dashboard-light-desktop.png",
  159 |       fullPage: false,
  160 |     });
  161 | 
  162 |     // Switch back to Dark for subsequent tests
  163 |     await page.getByRole("button", { name: /theme:/i }).click();
  164 |     await page.getByRole("menuitemradio", { name: "Dark" }).click();
  165 |     await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  166 |   });
  167 | });
  168 | 
```