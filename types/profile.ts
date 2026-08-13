export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  country?: string;
  city?: string;
  website?: string;
  github_url?: string;
  linkedin_url?: string;
  coding_rating: number;
  placement_score: number;
  resume_score: number;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdate {
  full_name?: string;
  bio?: string;
  country?: string;
  city?: string;
  website?: string;
  github_url?: string;
  linkedin_url?: string;
}

export interface ProfileStats {
  total_battles: number;
  total_wins: number;
  win_rate: number;
  total_tournaments: number;
  total_challenges_solved: number;
  average_rating: number;
  total_xp: number;
  current_streak: number;
}
