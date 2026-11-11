export type DashboardSyncStatus = "in_progress" | "completed" | "failed";

export interface DashboardSyncActivity {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: DashboardSyncStatus;
  created_at: string;
  updated_at: string;
}

export function readDashboardSyncActivity(): DashboardSyncActivity[];
export function upsertDashboardSyncActivity(
  events: DashboardSyncActivity[],
  event: DashboardSyncActivity,
): DashboardSyncActivity[];
export function persistDashboardSyncActivity(events: DashboardSyncActivity[]): void;
export function mergeActivityEntries(
  auditEntries: Array<{
    id: string;
    action: string;
    module: string;
    entity_type?: string | null;
    organization_type?: string | null;
    created_at: string;
  }>,
  syncEvents: DashboardSyncActivity[],
  userId: string | null,
): Array<{
  id: string;
  title: string;
  description: string;
  created_at: string;
  status: DashboardSyncStatus | null;
}>;
