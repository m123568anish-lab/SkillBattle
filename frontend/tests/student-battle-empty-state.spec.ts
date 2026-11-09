import { expect, test } from "@playwright/test";
import { authenticateStudent } from "./fixtures/authenticated-student";

test("student battle page shows an empty state instead of crashing", async ({ page }) => {
  await authenticateStudent(page);
  await page.goto("/battle");

  await expect(page.getByText("Battle Arena Command Center", { exact: true })).toBeVisible();
  await expect(page.getByText("No battle history recorded yet", { exact: true })).toBeVisible();
  await expect(page.getByText("Something went wrong")).not.toBeVisible();
});
