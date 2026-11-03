import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("browser API requests use the same-origin Next.js proxy", async () => {
  const apiSource = await readFile(new URL("src/lib/api.ts", root), "utf8");
  const nextConfig = await readFile(new URL("next.config.ts", root), "utf8");
  const serverStatus = await readFile(
    new URL("src/components/dashboard/ServerStatus.tsx", root),
    "utf8",
  );
  const battleArea = await readFile(
    new URL("src/components/BattleArea.tsx", root),
    "utf8",
  );

  assert.match(
    apiSource,
    /typeof window === "undefined"\s*\?\s*normalizeBaseUrl\(process\.env\.NEXT_PUBLIC_API_URL\)\s*:\s*""/,
  );
  assert.match(apiSource, /baseURL:\s*`\$\{API_BASE_URL\}\/api\/v1`/);
  assert.match(nextConfig, /source:\s*"\/api\/v1\/:path\*"/);
  assert.match(nextConfig, /destination:\s*`\$\{apiOrigin\}\/api\/v1\/:path\*`/);
  assert.match(nextConfig, /source:\s*"\/api\/battle\/:path\*"/);
  assert.match(nextConfig, /destination:\s*`\$\{apiOrigin\}\/api\/battle\/:path\*`/);
  assert.match(nextConfig, /source:\s*"\/api\/health"/);
  assert.match(nextConfig, /destination:\s*`\$\{apiOrigin\}\/health`/);
  assert.match(serverStatus, /fetch\("\/api\/health"/);
  assert.match(
    nextConfig,
    /process\.env\.NEXT_PUBLIC_API_URL \|\| "https:\/\/skillbattle-backend\.onrender\.com"/,
  );
  assert.match(battleArea, /api\.get<Question>\("\/api\/battle\/next-question"/);
  assert.match(battleArea, /api\.post<\{/);
  assert.doesNotMatch(battleArea, /NEXT_PUBLIC_API_URL|localStorage\.getItem/);
});
