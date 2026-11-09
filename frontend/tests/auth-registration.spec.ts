import { expect, test } from "@playwright/test";

test("signup skips email verification, redirects to login, and allows sign-in", async ({ page }) => {
  const email = "new-student@example.com";
  const password = "StrongPass123!";
  await page.route("**/api/v1/**", (route) => {
    if (new URL(route.request().url()).pathname.endsWith("/auth/me")) {
      return route.fulfill({
        json: {
          id: "e2e-app-user",
          email,
          username: "new_student",
          full_name: "New Student",
          role: "student",
          is_verified: false,
          onboarding_completed: true,
        },
      });
    }
    return route.fulfill({ json: {} });
  });

  await page.goto("/register");
  await page.getByLabel("Full name").fill("New Student");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create Qubira account" }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  await expect(page.getByText(/verification email/i)).toHaveCount(0);

  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
});

test("links an imported account with its previous password after Neon sign-in", async ({ page }) => {
  let linked = false;
  await page.route("**/api/v1/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/me")) {
      if (!linked) return route.fulfill({ status: 401, json: { detail: "Invalid authentication token." } });
      return route.fulfill({
        json: {
          id: "legacy-app-user",
          email: "legacy-student@example.com",
          username: "legacy_student",
          full_name: "Legacy Student",
          role: "student",
          is_verified: true,
          onboarding_completed: true,
        },
      });
    }
    if (path.endsWith("/auth/neon/link")) {
      if (route.request().postDataJSON().password === "OldQubira#123") {
        linked = true;
        return route.fulfill({ json: { message: "Neon identity linked successfully." } });
      }
      return route.fulfill({
        status: 401,
        json: { detail: "Unable to link this Neon account with the supplied Qubira credentials." },
      });
    }
    return route.fulfill({ json: {} });
  });

  await page.goto("/login");
  await page.getByLabel("Email address").fill("legacy-student@example.com");
  await page.getByLabel("Password", { exact: true }).fill("NeonPass123!");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByLabel("Previous Qubira password")).toBeVisible();
  await page.getByLabel("Previous Qubira password").fill("OldQubira#123");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
});
