const STORAGE_KEY = "qubira_dashboard_sync_activity";
const MAX_EVENTS = 30;

/**
 * @typedef {"in_progress" | "completed" | "failed"} DashboardSyncStatus
 * @typedef {{
 *   id: string;
 *   user_id: string;
 *   title: string;
 *   description: string;
 *   status: DashboardSyncStatus;
 *   created_at: string;
 *   updated_at: string;
 * }} DashboardSyncActivity
 */

function isDashboardSyncActivity(value) {
  return value !== null
    && typeof value === "object"
    && typeof value.id === "string"
    && typeof value.user_id === "string"
    && typeof value.title === "string"
    && typeof value.description === "string"
    && ["in_progress", "completed", "failed"].includes(value.status)
    && typeof value.created_at === "string"
    && typeof value.updated_at === "string";
}

function newestFirst(left, right) {
  return Date.parse(right.updated_at) - Date.parse(left.updated_at);
}

/** @returns {DashboardSyncActivity[]} */
export function readDashboardSyncActivity() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter(isDashboardSyncActivity).sort(newestFirst).slice(0, MAX_EVENTS)
      : [];
  } catch {
    return [];
  }
}

/**
 * @param {DashboardSyncActivity[]} events
 * @param {DashboardSyncActivity} event
 * @returns {DashboardSyncActivity[]}
 */
export function upsertDashboardSyncActivity(events, event) {
  return [
    event,
    ...events.filter((previous) => previous.id !== event.id),
  ].sort(newestFirst).slice(0, MAX_EVENTS);
}

/**
 * @param {DashboardSyncActivity[]} events
 */
export function persistDashboardSyncActivity(events) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(events.slice(0, MAX_EVENTS)));
  } catch {
    // Keep the in-memory activity feed usable when session storage is unavailable.
  }
}

/**
 * @param {Array<{
 *   id: string;
 *   action: string;
 *   module: string;
 *   entity_type?: string | null;
 *   organization_type?: string | null;
 *   created_at: string;
 * }>} auditEntries
 * @param {DashboardSyncActivity[]} syncEvents
 * @param {string | null} userId
 */
export function mergeActivityEntries(auditEntries, syncEvents, userId) {
  const persistedEntries = auditEntries.map((entry) => ({
    id: `audit:${entry.id}`,
    title: entry.action.replaceAll("_", " "),
    description: [
      entry.module,
      entry.entity_type,
      entry.organization_type,
    ].filter(Boolean).join(" · "),
    created_at: entry.created_at,
    status: null,
  }));
  const sessionEntries = syncEvents
    .filter((entry) => entry.user_id === userId)
    .map((entry) => ({
      id: entry.id,
      title: entry.title,
      description: entry.description,
      created_at: entry.updated_at,
      status: entry.status,
    }));

  return [...persistedEntries, ...sessionEntries]
    .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at));
}
