import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const screenshotDir = resolve(process.cwd(), "test-results", "screenshots", "auth");

test.beforeAll(() => {
  try {
    mkdirSync(screenshotDir, { recursive: true });
  } catch {}
});

test.setTimeout(45_000);

const mobileViewports = [
  { name: "360px-android", width: 360, height: 740 },
  { name: "375px-iphone-se", width: 375, height: 667 },
  { name: "390px-iphone-13", width: 390, height: 844 },
  { name: "412px-pixel-7", width: 412, height: 915 },
  { name: "430px-iphone-15pm", width: 430, height: 932 },
];

test.describe("Authentication 2.0 — Mobile-First Viewport & Responsive Ergonomics", () => {
  for (const vp of mobileViewports) {
    test(`renders /login cleanly with zero overflow at ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/login");

      await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();

      // Check no horizontal overflow
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalOverflow).toBe(false);

      // Verify comfortable input touch targets (>= 48px tall)
      const emailInput = page.getByLabel("Email address");
      const passwordInput = page.getByLabel("Password", { exact: true });
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();

      const emailBox = await emailInput.boundingBox();
      const passwordBox = await passwordInput.boundingBox();
      expect(emailBox?.height).toBeGreaterThanOrEqual(48);
      expect(passwordBox?.height).toBeGreaterThanOrEqual(48);

      // Verify submit button is comfortable and full-width
      const submitBtn = page.getByRole("button", { name: "Sign in" });
      await expect(submitBtn).toBeVisible();
      const btnBox = await submitBtn.boundingBox();
      expect(btnBox?.height).toBeGreaterThanOrEqual(44);
      expect(btnBox?.width).toBeGreaterThan(vp.width * 0.7);

      // Desktop editorial sidebar should NOT be rendered on mobile
      await expect(page.getByText("Student Space")).toBeHidden();
    });

    test(`renders /register cleanly with zero overflow at ${vp.name} (${vp.width}px)`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/register");

      await expect(page.getByRole("heading", { name: "Create your account." })).toBeVisible();

      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalOverflow).toBe(false);

      // Verify mobile header with QUBIRA logo exists
      await expect(page.getByText("QUBIRA", { exact: true }).first()).toBeVisible();
      await expect(page.getByText("Student Space")).toBeHidden();
    });
  }

  test("renders desktop split-screen composition at 1440px", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();

    // Desktop editorial showcase must be visible on large screen
    const editorialHeading = page.getByRole("heading", { name: "Login to your Qubira workspace." });
    await expect(editorialHeading).toBeVisible();

    // Technical ecosystem cards should be visible
    await expect(page.getByText("Student Space")).toBeVisible();
    await expect(page.getByText("College Space")).toBeVisible();
    await expect(page.getByText("Company Space")).toBeVisible();

    // Both sides render without horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });
});

test.describe("Authentication 2.0 — Interactive Controls & Field Mechanics", () => {
  test("toggles password visibility on login page", async ({ page }) => {
    await page.goto("/login");

    const passwordInput = page.getByLabel("Password", { exact: true });
    await passwordInput.fill("SecretPassword123!");
    await expect(passwordInput).toHaveAttribute("type", "password");

    const toggleBtn = page.getByLabel("Show password");
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click();

    await expect(passwordInput).toHaveAttribute("type", "text");
    await expect(page.getByLabel("Hide password")).toBeVisible();

    await page.getByLabel("Hide password").click();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("validates password strength in real time on register page", async ({ page }) => {
    await page.goto("/register");

    const passwordInput = page.getByLabel("Password", { exact: true });

    // Initially type partial password
    await passwordInput.fill("abc");
    await expect(page.getByText("Password Security")).toBeVisible();
    await expect(page.getByText("Too short", { exact: true })).toBeVisible();

    // Meet 8 chars requirement
    await passwordInput.fill("abcdefgh");
    await expect(page.getByText("Weak", { exact: true })).toBeVisible();

    // Add uppercase and number
    await passwordInput.fill("Abcdefgh1");
    await expect(page.getByText("Good", { exact: true })).toBeVisible();

    // Add special character -> all met -> Strong
    await passwordInput.fill("Abcdefgh1!");
    await expect(page.getByText("Strong", { exact: true })).toBeVisible();
    await expect(page.getByText("Special symbol")).toBeVisible();
  });

  test("handles forgot-password form submission and feedback", async ({ page }) => {
    // Intercept auth client password reset request
    await page.route("**/*password-reset*", (route) => {
      return route.fulfill({ status: 200, json: { data: {}, error: null } });
    });
    await page.route("**/*forget-password*", (route) => {
      return route.fulfill({ status: 200, json: { data: {}, error: null } });
    });

    await page.goto("/forgot-password");

    await expect(page.getByRole("heading", { name: "Forgot password?" })).toBeVisible();
    const emailInput = page.getByLabel("Email address");
    await expect(emailInput).toBeVisible();

    // Verify 56px height touch target
    const box = await emailInput.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(48);

    await emailInput.fill("engineer@qubira.io");
    await page.getByRole("button", { name: "Send reset link" }).click();

    // Verify success confirmation card
    await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
    await expect(page.getByText("engineer@qubira.io")).toBeVisible();
    await expect(page.getByRole("link", { name: "Return to sign in" })).toBeVisible();
  });

  test("handles reset-password with token inspection and validation", async ({ page }) => {
    await page.goto("/reset-password?token=mock-token-12345");

    await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible();

    const newPasswordInput = page.getByLabel("New password", { exact: true });
    const confirmPasswordInput = page.getByLabel("Confirm password");
    await expect(newPasswordInput).toBeVisible();
    await expect(confirmPasswordInput).toBeVisible();

    // Fill mismatching passwords and trigger validation
    await newPasswordInput.fill("ValidPassword123!");
    await confirmPasswordInput.fill("DifferentPassword456!");
    await page.getByRole("button", { name: "Reset password" }).click();

    await expect(page.getByText("Passwords do not match.")).toBeVisible();
  });

  test("handles OTP auto-advance, backspace navigation, and paste", async ({ page }) => {
    await page.goto("/verify-email");

    await expect(page.getByRole("heading", { name: "Check your inbox." })).toBeVisible();

    const d1 = page.getByLabel("Digit 1 of 6");
    const d2 = page.getByLabel("Digit 2 of 6");
    const d3 = page.getByLabel("Digit 3 of 6");
    const d4 = page.getByLabel("Digit 4 of 6");
    const d5 = page.getByLabel("Digit 5 of 6");
    const d6 = page.getByLabel("Digit 6 of 6");

    await expect(d1).toBeVisible();
    await expect(d6).toBeVisible();

    // Test typing and auto-advance
    await d1.focus();
    await page.keyboard.press("4");
    await expect(d1).toHaveValue("4");
    await expect(d2).toBeFocused();

    await page.keyboard.press("8");
    await expect(d2).toHaveValue("8");
    await expect(d3).toBeFocused();

    // Test backspace navigation
    await page.keyboard.press("Backspace");
    await expect(d2).toBeFocused();
    await expect(d2).toHaveValue("");

    // Clear d1
    await page.keyboard.press("Backspace");
    await expect(d1).toBeFocused();
    await expect(d1).toHaveValue("");

    // Test clipboard paste
    await d1.focus();
    await page.evaluate(() => {
      const pasteEvent = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: new DataTransfer(),
      });
      pasteEvent.clipboardData?.setData("text/plain", "928374");
      document.querySelector("input[aria-label='Digit 1 of 6']")?.dispatchEvent(pasteEvent);
    });

    await expect(d1).toHaveValue("9");
    await expect(d2).toHaveValue("2");
    await expect(d3).toHaveValue("8");
    await expect(d4).toHaveValue("3");
    await expect(d5).toHaveValue("7");
    await expect(d6).toHaveValue("4");

    // Resend countdown indicator
    await expect(page.getByText(/Resend available in/i)).toBeVisible();
  });
});

test.describe("Authentication 2.0 — Screenshot Generation & Visual Verification", () => {
  test("captures mobile (390px) and desktop (1440px) visual evidence", async ({ page }) => {
    // 1. Mobile Login (390px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/login-mobile-390.png`, fullPage: true });

    // 2. Desktop Login (1440px)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/login");
    await expect(page.getByText("Student Space")).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/login-desktop-1440.png`, fullPage: true });

    // 3. Mobile Register (390px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Create your account." })).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/register-mobile-390.png`, fullPage: true });

    // 4. Desktop Register (1440px)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/register");
    await expect(page.getByText("Student Space")).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/register-desktop-1440.png`, fullPage: true });

    // 5. Mobile Forgot Password (390px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: "Forgot password?" })).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/forgot-password-mobile-390.png`, fullPage: true });

    // 6. Mobile Verify Email OTP (390px)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/verify-email");
    await expect(page.getByRole("heading", { name: "Check your inbox." })).toBeVisible();
    await page.screenshot({ path: `${screenshotDir}/verify-email-otp-mobile-390.png`, fullPage: true });
  });
});
