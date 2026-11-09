import { expect, test } from "@playwright/test";
import { authenticateStudent } from "./fixtures/authenticated-student";

test("tournament page shows an honest empty state when no tournaments exist", async ({ page }) => {
  await authenticateStudent(page);
  await page.goto("/tournament");

  await expect(page.getByRole("heading", { name: "Tournament Arena" })).toBeVisible();
  await expect(page.getByText("Championship circuit")).toBeVisible();
  await expect(page.getByRole("heading", { name: "No tournaments available right now." })).toBeVisible();
  await expect(page.getByRole("button", { name: /join featured tournament|registered/i })).toHaveCount(0);
});
