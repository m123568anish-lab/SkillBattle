import { expect, test } from "@playwright/test";
import { authenticateStudent } from "./fixtures/authenticated-student";

test("normalizes the requested practice difficulty from the URL", async ({ page }) => {
  await authenticateStudent(page);
  await page.goto(
    "/practice/session?topic=Algorithms+%26+Data+Structures&difficulty=easy&count=5",
  );

  await expect(page.getByRole("heading", { name: "Configure Practice Session" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Easy" })).toHaveClass(/bg-indigo-600/);
  await expect(page.getByRole("button", { name: "Any" })).not.toHaveClass(/bg-indigo-600/);
});
