import { expect, test } from "@playwright/test";

test("student battle page shows empty state instead of crashing", async ({ page }) => {
  await page.addInitScript(
    ([accessToken, refreshToken]) => {
      localStorage.setItem("access_token", accessToken);
      localStorage.setItem("refresh_token", refreshToken);
    },
    [
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDYzMTdiMS05Yjk4LTQ3YmQtOGJjYS0zNjE5ZGQwNjc4YjciLCJ0eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzkxMzg5MDUzfQ.BzKz7VbZTdCUNV5K6AmLK69Ir8vWwi7dIeJ02YtKvAw",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwZDYzMTdiMS05Yjk4LTQ3YmQtOGJjYS0zNjE5ZGQwNjc4YjciLCJ0eXBlIjoicmVmcmVzaCIsImV4cCI6MTc5Mzk3NzQ1M30.KaXRavMm-JHNs1uTxYdLNzsMGLApwWAaL1blJCwO5nw",
    ],
  );

  await page.goto("http://127.0.0.1:3000/battle");

  await expect(page.getByRole("heading", { name: "Battle Arena Command Center" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No open battle" })).toBeVisible();
  await expect(page.getByText("Something went wrong")).not.toBeVisible();
});
