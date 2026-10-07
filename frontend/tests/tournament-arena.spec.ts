import { expect, test } from "@playwright/test";

test("tournament page shows premium arena layout", async ({ page }) => {
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

  await page.goto("http://127.0.0.1:3000/tournament");

  await expect(page.getByRole("heading", { name: "Tournament Arena" })).toBeVisible();
  await expect(page.getByText("Championship circuit")).toBeVisible();
  await expect(page.getByText("Live bracket")).toBeVisible();
  await expect(page.getByRole("button", { name: /join featured tournament|registered/i })).toBeVisible();
});
