import api from "./api";

export interface DailyChallengePayload {
  title: string;
  difficulty: string;
  category: string;
}

export interface AdminUser {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at?: string;
}

export interface BattleLog {
  id: string;
  room_code?: string;
  mode: string;
  status: string;
  created_at?: string;
}

export interface BattleSettings {
  battle_duration_minutes: number;
  xp_multiplier: number;
  allow_custom_battles: boolean;
}

export interface PlacementIntelligenceSummary {
  total_approved_questions: number;
  pending_review_count: number;
  duplicate_candidates: number;
  retry_history: number;
  job_queue_status: { queued: number; running: number; failed: number };
  source_records_processed: number;
  inventory_shortages: Array<{
    company: string;
    role: string;
    topic: string;
    difficulty: string;
    question_type: string;
    target: number;
    current: number;
    missing: number;
  }>;
  recent_failed_jobs: Array<{
    id: number;
    type: string;
    retry_count: number;
    max_retries: number;
    error_details: string;
    updated_at: string;
  }>;
  recent_sources: Array<{
    id: number;
    source_url: string;
    company: string;
    role: string;
    title: string;
    discovered_at: string;
    processed: boolean;
  }>;
}

export interface PlacementProviderHealth {
  available: boolean;
  provider: string;
  detail: string;
}

class AdminService {
  async setDailyChallenge(payload: DailyChallengePayload) {
    const res = await api.post("/admin/daily-challenge", payload);
    return res.data;
  }

  async listUsers(limit = 50, offset = 0) {
    const res = await api.get<AdminUser[]>(`/admin/users?limit=${limit}&offset=${offset}`);
    return res.data;
  }

  async updateUser(userId: string, payload: Partial<AdminUser>) {
    const res = await api.put<AdminUser>(`/admin/users/${userId}`, payload);
    return res.data;
  }

  async deactivateUser(userId: string) {
    const res = await api.delete(`/admin/users/${userId}`);
    return res.data;
  }

  async getBattleLogs(limit = 20) {
    const res = await api.get<BattleLog[]>(`/admin/battle-logs?limit=${limit}`);
    return res.data;
  }

  async getPlacementIntelligence() {
    const res = await api.get<PlacementIntelligenceSummary>("/admin/placement-intelligence");
    return res.data;
  }

  async getPlacementProviderHealth() {
    const res = await api.get<PlacementProviderHealth>("/admin/placement-provider-health");
    return res.data;
  }

  async retryPlacementJob(jobId: number) {
    const res = await api.post(`/admin/placement-jobs/${jobId}/retry`);
    return res.data;
  }

  async getSettings() {
    const res = await api.get<BattleSettings>("/admin/settings");
    return res.data;
  }

  async updateSettings(payload: BattleSettings) {
    const res = await api.put<BattleSettings>("/admin/settings", payload);
    return res.data;
  }
}

export const adminService = new AdminService();
