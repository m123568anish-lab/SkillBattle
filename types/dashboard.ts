export interface DashboardData {
  user: any;
  stats: DashboardStats;
  recent_battles: any[];
  upcoming_tournaments: any[];
  recent_achievements: any[];
  current_streak: number;
  leaderboard_position: number;
}

export interface DashboardStats {
  total_battles: number;
  wins: number;
  losses: number;
  win_rate: number;
  total_xp: number;
  current_level: number;
  rating: number;
  ranking: number;
  this_month_battles: number;
  this_month_wins: number;
  total_hours_played: number;
  average_solve_time: number;
}
