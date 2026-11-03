/** @typedef {import("../types/dashboard").DashboardStats} DashboardStats */
/** @typedef {{ data: import("../types/dashboard").DashboardResponse; timestamp: string; userId: string }} DashboardCachePayload */

const REQUIRED_NUMERIC_STATS = [
  "xp",
  "level",
  "next_level_xp",
  "xp_to_next_level",
  "level_progress_percent",
  "streak",
  "longest_streak",
  "rating",
  "battles_played",
  "battles_completed",
  "battles_won",
  "battles_lost",
  "practice_attempted",
  "practice_completed",
  "practice_tasks_completed",
];

/**
 * @param {unknown} stats
 * @returns {stats is DashboardStats}
 */
export function isDashboardStats(stats) {
  if (typeof stats !== "object" || stats === null) return false;

  const values = /** @type {Record<string, unknown>} */ (stats);
  return (
    REQUIRED_NUMERIC_STATS.every(
      (field) => typeof values[field] === "number" && Number.isFinite(values[field]),
    ) &&
    (values.practice_accuracy === undefined ||
      values.practice_accuracy === null ||
      (typeof values.practice_accuracy === "number" && Number.isFinite(values.practice_accuracy))) &&
    typeof values.daily_challenge_completed === "boolean"
  );
}

/**
 * @param {unknown} payload
 * @param {string} userId
 * @returns {payload is DashboardCachePayload}
 */
export function isDashboardCachePayload(payload, userId) {
  if (typeof payload !== "object" || payload === null) return false;

  const cache = /** @type {Record<string, unknown>} */ (payload);
  if (cache.userId !== userId || typeof cache.timestamp !== "string") return false;
  if (typeof cache.data !== "object" || cache.data === null) return false;

  const data = /** @type {Record<string, unknown>} */ (cache.data);
  if (typeof data.user !== "object" || data.user === null) return false;

  const user = /** @type {Record<string, unknown>} */ (data.user);
  return user.id === userId && isDashboardStats(data.stats);
}

/**
 * Format a real metric when it is available; use a placeholder instead of
 * inventing a value for an incomplete API response or stale cache entry.
 *
 * @param {number | null | undefined} value
 */
export function formatDashboardNumber(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString()
    : "—";
}
