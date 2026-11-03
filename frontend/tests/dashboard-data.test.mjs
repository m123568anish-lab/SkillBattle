import assert from "node:assert/strict";
import test from "node:test";

import {
  formatDashboardNumber,
  isDashboardCachePayload,
  isDashboardStats,
} from "../src/lib/dashboard-data.mjs";

const newAccountStats = {
  xp: 0,
  level: 1,
  next_level_xp: 500,
  xp_to_next_level: 500,
  level_progress_percent: 0,
  streak: 0,
  longest_streak: 0,
  rating: 1000,
  battles_played: 0,
  battles_completed: 0,
  battles_won: 0,
  battles_lost: 0,
  practice_attempted: 0,
  practice_completed: 0,
  practice_tasks_completed: 0,
  practice_accuracy: null,
  daily_challenge_completed: false,
};

test("validates the current dashboard API stats contract for a new account", () => {
  assert.equal(isDashboardStats(newAccountStats), true);
});

test("rejects stale dashboard cache entries missing the new XP field", () => {
  const staleStats = { ...newAccountStats };
  delete staleStats.xp_to_next_level;

  assert.equal(isDashboardStats(staleStats), false);
  assert.equal(
    isDashboardCachePayload(
      { userId: "user-1", timestamp: "2026-01-01T00:00:00Z", data: { user: { id: "user-1" }, stats: staleStats } },
      "user-1",
    ),
    false,
  );
});

test("accepts a current cache only for its owning account", () => {
  const payload = {
    userId: "user-1",
    timestamp: "2026-01-01T00:00:00Z",
    data: { user: { id: "user-1" }, stats: newAccountStats },
  };

  assert.equal(isDashboardCachePayload(payload, "user-1"), true);
  assert.equal(isDashboardCachePayload(payload, "user-2"), false);
});

test("rejects null required metrics while allowing optional nullable practice accuracy", () => {
  assert.equal(isDashboardStats(newAccountStats), true);
  assert.equal(isDashboardStats({ ...newAccountStats, rating: null }), false);
  const statsWithoutOptionalAccuracy = { ...newAccountStats };
  delete statsWithoutOptionalAccuracy.practice_accuracy;
  assert.equal(isDashboardStats(statsWithoutOptionalAccuracy), true);
});

test("formats finite values and uses a non-numeric placeholder for absent metrics", () => {
  assert.equal(formatDashboardNumber(0), "0");
  assert.equal(formatDashboardNumber(1234567), (1234567).toLocaleString());
  assert.equal(formatDashboardNumber(null), "—");
  assert.equal(formatDashboardNumber(undefined), "—");
  assert.equal(formatDashboardNumber(Number.NaN), "—");
});

test("the dashboard service rejects invalid live stats and the cache validates before hydration", async () => {
  const { readFile } = await import("node:fs/promises");
  const service = await readFile(
    new URL("../src/services/dashboard.service.ts", import.meta.url),
    "utf8",
  );
  const store = await readFile(
    new URL("../src/store/dashboardStore.ts", import.meta.url),
    "utf8",
  );

  assert.match(service, /isDashboardStats\(response\.data\?\.stats\)/);
  assert.match(store, /isDashboardCachePayload\(parsed, parsedUser\.id\)/);
});
