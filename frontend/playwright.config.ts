import { defineConfig } from "@playwright/test";
import { randomBytes } from "node:crypto";

if (!Reflect.set(process.env, "NODE_ENV", "test")) {
  throw new Error("Playwright requires NODE_ENV=test.");
}
process.env.NEON_AUTH_BASE_URL = "http://127.0.0.1:8765";
process.env.NEON_AUTH_COOKIE_SECRET = randomBytes(32).toString("base64");
process.env.QUBIRA_AUTH_TEST_MODE = "1";
process.env.NEXT_PUBLIC_API_URL = "http://127.0.0.1:8000";
process.env.NEXT_DIST_DIR = ".next-playwright";

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  timeout: 120_000,
  workers: 2,
  use: { baseURL: "https://127.0.0.1:3001", ignoreHTTPSErrors: true, trace: "retain-on-failure" },
  webServer: [
    { command: "node tests/fixtures/neon-auth-server.mjs", url: "http://127.0.0.1:8765/health", reuseExistingServer: false, timeout: 30_000 },
    { command: "python ..\\backend\\tests\\fixtures\\playwright_api_server.py", url: "http://127.0.0.1:8000/health", reuseExistingServer: false, timeout: 60_000 },
    { command: "npm run dev -- --experimental-https --port 3001", url: "https://127.0.0.1:3001", ignoreHTTPSErrors: true, reuseExistingServer: false, timeout: 120_000 },
  ],
});
