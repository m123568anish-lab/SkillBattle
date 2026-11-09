import { expect, test } from "@playwright/test";

const opportunity = { job_id: 7, company_name: "Verified Labs", title: "Data Engineering Intern", location: "Remote", employment_type: "internship", work_mode: "remote", required_skills: "Python, SQL", description: "Build data products", eligibility: "Final-year students", compensation: null, deadline_at: "2030-06-30T00:00:00+00:00", source_label: "Verified Labs careers", source_url: "https://example.com/careers", application_method: "internal", application_url: null, verification_status: "verified", is_open: true };

async function authenticateStudent(page: import("@playwright/test").Page) {
  await page.context().addCookies([{
    name: "__Secure-neon-auth.session_token",
    value: "e2e-cookie-session",
    url: "https://127.0.0.1:3000",
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  }]);

  await page.route("**/api/v1/**", (route) => route.fulfill({ json: {} }));
  await page.route("**/api/v1/auth/me", (route) => route.fulfill({
    json: {
      id: 7001,
      email: "student@example.com",
      username: "e2e_student",
      full_name: "E2E Student",
      role: "student",
      is_verified: true,
      onboarding_completed: true,
    },
  }));
}

async function dismissCookiePreferences(page: import("@playwright/test").Page) {
  const essentialOnly = page.getByRole("button", { name: "Essential only" });
  if (await essentialOnly.isVisible()) await essentialOnly.click();
}

test.describe("opportunities student flow", () => {
  test("redirects an unauthenticated visitor to sign in", async ({ page }) => {
    await page.goto("/opportunities");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  });

  for (const width of [360, 390, 430]) {
    test(`discovers, filters, saves and applies at ${width}px`, async ({ page }) => {
      await authenticateStudent(page);
      await page.route("**/company/openings**", async (route) => {
        const path = new URL(route.request().url()).pathname;
        if (route.request().method() === "GET" && /\/company\/openings\/\d+$/.test(path)) {
          return route.fulfill({ json: opportunity });
        }
        if (route.request().method() === "PUT") return route.fulfill({ json: { job_id: 7, saved: true } });
        return route.fulfill({ json: { items: [opportunity], page: 1, page_size: 20, total: 1 } });
      });
      await page.route("**/company/applications", (route) => route.fulfill({ json: { application_id: 9, status: "applied", job_id: 7 } }));
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/opportunities");
      await dismissCookiePreferences(page);
      await expect(page.getByRole("heading", { name: "Internships & placements", exact: true })).toBeVisible();
      await expect(page.getByRole("heading", { name: opportunity.title })).toBeVisible();
      await page.goto("/opportunities/7");
      await expect(page.getByRole("heading", { name: "Data Engineering Intern" })).toBeVisible();
      await page.goto("/opportunities");
      const search = page.getByLabel("Search verified opportunities");
      await search.fill("Python");
      const filteredListRequest = page.waitForRequest((request) => {
        const url = new URL(request.url());
        return url.pathname.endsWith("/company/openings") && url.searchParams.get("q") === "Python";
      });
      await search.press("Enter");
      await filteredListRequest;
      await expect(page.getByText("Data Engineering Intern")).toBeVisible();
      await page.getByRole("button", { name: `Save ${opportunity.title}` }).click();
      await expect(page.getByRole("status")).toContainText("Opportunity saved");
      await page.getByRole("button", { name: "Apply now" }).click();
      await expect(page.getByRole("status")).toContainText("Application submitted");
      expect(await page.locator("body").evaluate((body) => body.scrollWidth <= window.innerWidth)).toBeTruthy();
    });
  }

  test("keeps desktop opportunities layout usable", async ({ page }) => {
    await authenticateStudent(page);
    await page.route("**/company/openings**", (route) => route.fulfill({ json: { items: [opportunity], page: 1, page_size: 20, total: 1 } }));
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/opportunities");
    await dismissCookiePreferences(page);
    await expect(page.locator("aside").first()).toBeVisible();
    await expect(page.getByText("Data Engineering Intern")).toBeVisible();
  });
});
