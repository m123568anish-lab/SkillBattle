import assert from "node:assert/strict";
import test from "node:test";

import {
  mergeActivityEntries,
  persistDashboardSyncActivity,
  readDashboardSyncActivity,
  upsertDashboardSyncActivity,
} from "../src/lib/dashboard-sync-activity.mjs";

function syncEvent(overrides = {}) {
  return {
    id: "dashboard-sync:user-1:1",
    user_id: "user-1",
    title: "Dashboard synchronization",
    description: "Dashboard metrics are being updated from the API.",
    status: "in_progress",
    created_at: "2026-04-04T10:00:00.000Z",
    updated_at: "2026-04-04T10:00:00.000Z",
    ...overrides,
  };
}

test("upserts a refresh lifecycle event instead of duplicating it", () => {
  const started = syncEvent();
  const completed = syncEvent({
    title: "Dashboard data refreshed",
    description: "Latest dashboard metrics were synchronized.",
    status: "completed",
    updated_at: "2026-04-04T10:00:04.000Z",
  });

  const events = upsertDashboardSyncActivity(
    upsertDashboardSyncActivity([], started),
    completed,
  );

  assert.equal(events.length, 1);
  assert.equal(events[0].status, "completed");
  assert.equal(events[0].title, "Dashboard data refreshed");
});

test("persists refresh events only in the current browser session", () => {
  const values = new Map();
  const originalWindow = globalThis.window;
  globalThis.window = {
    sessionStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  };
  try {
    const event = syncEvent();
    persistDashboardSyncActivity([event]);
    assert.deepEqual(readDashboardSyncActivity(), [event]);
  } finally {
    if (originalWindow === undefined) {
      delete globalThis.window;
    } else {
      globalThis.window = originalWindow;
    }
  }
});

test("merges persisted audit activity and current-user sync activity newest first", () => {
  const entries = mergeActivityEntries(
    [{
      id: "audit-1",
      action: "battle_completed",
      module: "battle",
      entity_type: "battle",
      organization_type: null,
      created_at: "2026-04-04T10:00:02.000Z",
    }],
    [
      syncEvent({ updated_at: "2026-04-04T10:00:04.000Z", status: "completed" }),
      syncEvent({
        id: "dashboard-sync:user-2:1",
        user_id: "user-2",
        title: "Other user's refresh",
      }),
    ],
    "user-1",
  );

  assert.deepEqual(entries.map((entry) => entry.id), [
    "dashboard-sync:user-1:1",
    "audit:audit-1",
  ]);
  assert.equal(entries[0].status, "completed");
  assert.equal(entries[1].title, "battle completed");
});

test("keeps failed refresh status and orders successive events chronologically", () => {
  const failed = syncEvent({
    id: "dashboard-sync:user-1:2",
    title: "Dashboard synchronization failed",
    description: "The latest dashboard metrics could not be synchronized.",
    status: "failed",
    created_at: "2026-04-04T10:01:00.000Z",
    updated_at: "2026-04-04T10:01:01.000Z",
  });

  const entries = mergeActivityEntries([], [syncEvent(), failed], "user-1");

  assert.deepEqual(entries.map((entry) => entry.status), ["failed", "in_progress"]);
});
