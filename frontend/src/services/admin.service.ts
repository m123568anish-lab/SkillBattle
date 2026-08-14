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
