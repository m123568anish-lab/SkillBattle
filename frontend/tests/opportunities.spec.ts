import { expect, test } from "@playwright/test";

const opportunity = { job_id: 7, company_name: "Verified Labs", title: "Data Engineering Intern", location: "Remote", employment_type: "internship", work_mode: "remote", required_skills: "Python, SQL", description: "Build data products", eligibility: "Final-year students", compensation: null, deadline_at: "2030-06-30T00:00:00+00:00", source_label: "Verified Labs careers", source_url: "https://example.com/careers", application_method: "internal", application_url: null, verification_status: "verified" };

test.describe("opportunities student flow", () => {
  for (const width of [360, 390, 430]) {
    test(`discovers, filters, saves and applies at ${width}px`, async ({ page }) => {
      const requests: string[] = [];
      await page.route("**/company/openings**", async (route) => {
        requests.push(route.request().url());
        if (route.request().method() === "PUT") return route.fulfill({ json: { job_id: 7, saved: true } });
        return route.fulfill({ json: { items: [opportunity], page: 1, page_size: 20, total: 1 } });
      });
      await page.route("**/company/applications", (route) => route.fulfill({ json: { application_id: 9, status: "applied", job_id: 7 } }));
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/opportunities");
      await expect(page.getByRole("heading", { name: "Internships & placements" })).toBeVisible();
      await page.goto("/opportunities/7");
      await expect(page.getByRole("heading", { name: "Data Engineering Intern" })).toBeVisible();
      await page.goto("/opportunities");
      await page.getByLabel("Search opportunities").fill("Python");
      await page.getByRole("button", { name: "Search" }).click();
      await expect(page.getByText("Data Engineering Intern")).toBeVisible();
      await page.getByRole("button", { name: "Save opportunity" }).click();
      await expect(page.getByRole("status")).toContainText("saved");
      await page.getByRole("button", { name: "Apply now" }).click();
      await expect(page.getByRole("status")).toContainText("Application submitted");
      expect(requests.some((url) => url.includes("q=Python"))).toBeTruthy();
      expect(await page.locator("body").evaluate((body) => body.scrollWidth <= window.innerWidth)).toBeTruthy();
    });
  }

  test("keeps desktop opportunities layout usable", async ({ page }) => {
    await page.route("**/company/openings**", (route) => route.fulfill({ json: { items: [opportunity], page: 1, page_size: 20, total: 1 } }));
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/opportunities");
    await expect(page.locator("aside").first()).toBeVisible();
    await expect(page.getByText("Data Engineering Intern")).toBeVisible();
  });
});
