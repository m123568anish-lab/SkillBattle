import { defineConfig } from "@playwright/test";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";

if (!Reflect.set(process.env, "NODE_ENV", "test")) {
  throw new Error("Playwright requires NODE_ENV=test.");
}
const authPort = Number(process.env.QUBIRA_PLAYWRIGHT_AUTH_PORT ?? "8765");
const apiPort = Number(process.env.QUBIRA_PLAYWRIGHT_API_PORT ?? "8000");
const frontendPort = Number(process.env.QUBIRA_PLAYWRIGHT_FRONTEND_PORT ?? "3001");
const authOrigin = `http://127.0.0.1:${authPort}`;
const apiOrigin = `http://127.0.0.1:${apiPort}`;
const frontendOrigin = `https://127.0.0.1:${frontendPort}`;
process.env.QUBIRA_PLAYWRIGHT_AUTH_PORT = String(authPort);
process.env.QUBIRA_PLAYWRIGHT_API_PORT = String(apiPort);
process.env.QUBIRA_PLAYWRIGHT_BASE_URL = frontendOrigin;
process.env.NEON_AUTH_BASE_URL = authOrigin;
process.env.NEON_AUTH_COOKIE_SECRET = randomBytes(32).toString("base64");
process.env.QUBIRA_AUTH_TEST_MODE = "1";
process.env.NEXT_PUBLIC_API_URL = apiOrigin;
process.env.NEXT_DIST_DIR = process.env.NEXT_DIST_DIR ?? (
  frontendPort === 3001 ? ".next-playwright" : `.next-playwright-${frontendPort}`
);
process.env.QUBIRA_BATTLE_ARTIFACT_DIR = resolve(
  process.cwd(),
  "test-results",
  `battle-run-${frontendPort}`,
  "artifacts",
);

export default defineConfig({
  testDir: "./tests",
  testMatch: "**/*.spec.ts",
  timeout: 120_000,
  workers: 2,
  use: { baseURL: frontendOrigin, ignoreHTTPSErrors: true, trace: "retain-on-failure" },
  webServer: [
    { command: "node tests/fixtures/neon-auth-server.mjs", url: `${authOrigin}/health`, reuseExistingServer: false, timeout: 30_000 },
    { command: "python ..\\backend\\tests\\fixtures\\playwright_api_server.py", url: `${apiOrigin}/health`, reuseExistingServer: false, timeout: 60_000 },
    { command: `npm run dev -- --experimental-https --port ${frontendPort}`, url: frontendOrigin, ignoreHTTPSErrors: true, reuseExistingServer: false, timeout: 120_000 },
  ],
});
