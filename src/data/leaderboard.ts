export interface LeaderboardUser {
  id: number;
  name: string;
  level: number;
  xp: number;
  streak?: number;
}

export const leaderboard: LeaderboardUser[] = [];