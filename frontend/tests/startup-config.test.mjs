import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, root), "utf8");
}

test("frontend starts on one deterministic local port", async () => {
  const packageJson = JSON.parse(await read("package.json"));
  assert.equal(packageJson.scripts.dev, "next dev -H 127.0.0.1 -p 3000");
  assert.equal(packageJson.scripts.start, "next start -H 127.0.0.1 -p 3000");
});

test("both launchers cleanup stale BattleAI frontend processes", async () => {
  for (const relativePath of ["start-dev.ps1", "../start-dev.ps1"]) {
    const script = await read(relativePath);
    assert.match(script, /Get-WmiObject Win32_Process/);
    assert.match(script, /Stop-Process -Id \$_\.ProcessId -Force/);
    assert.match(script, /http:\/\/127\.0\.0\.1:3000\//);
  }
});
