import { api } from "@/lib/api";

export interface LeaderboardEntry {
  rank: number;
  username: string;
  full_name?: string;
  avatar?: string | null;
  xp: number;
  level: number;
  streak: number;
  solved: number;
  rating: number;
  user_id: string;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

class LeaderboardService {
  async getLeaderboard() {
    const response = await api.get<LeaderboardResponse>("/leaderboard");
    return response.data;
  }

  async getMyRank() {
    const response = await api.get<{ rank: number | null; total_users: number; xp: number; level: number }>("/leaderboard/me");
    return response.data;
  }
}

export const leaderboardService = new LeaderboardService();
