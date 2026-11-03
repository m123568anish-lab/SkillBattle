import { api } from "@/lib/api";

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  full_name: string;
  avatar?: string | null;
  xp: number;
  level: number;
  streak: number;
  solved: number;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  battles_count: number;
  win_rate: number;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

export interface MyRankResponse {
  rank: number | null;
  total_users: number;
  xp: number;
  level: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isLeaderboardEntry(value: unknown): value is LeaderboardEntry {
  if (!isRecord(value)) return false;
  return (
    typeof value.user_id === "string" &&
    typeof value.username === "string" &&
    typeof value.full_name === "string" &&
    (value.avatar === undefined || value.avatar === null || typeof value.avatar === "string") &&
    [
      value.rank,
      value.xp,
      value.level,
      value.streak,
      value.solved,
      value.rating,
      value.wins,
      value.losses,
      value.draws,
      value.battles_count,
      value.win_rate,
    ].every(isFiniteNumber)
  );
}

class LeaderboardService {
  async getLeaderboard() {
    const response = await api.get<unknown>("/leaderboard");
    if (
      !isRecord(response.data) ||
      !Array.isArray(response.data.leaderboard) ||
      !response.data.leaderboard.every(isLeaderboardEntry)
    ) {
      throw new Error("Leaderboard API returned an invalid response.");
    }
    return { leaderboard: response.data.leaderboard };
  }

  async getMyRank() {
    const response = await api.get<unknown>("/leaderboard/me");
    const data = response.data;
    if (
      !isRecord(data) ||
      !(data.rank === null || isFiniteNumber(data.rank)) ||
      !isFiniteNumber(data.total_users) ||
      !isFiniteNumber(data.xp) ||
      !isFiniteNumber(data.level)
    ) {
      throw new Error("Leaderboard rank API returned an invalid response.");
    }
    return {
      rank: data.rank,
      total_users: data.total_users,
      xp: data.xp,
      level: data.level,
    };
  }
}

export const leaderboardService = new LeaderboardService();
