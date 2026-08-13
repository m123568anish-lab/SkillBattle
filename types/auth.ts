export interface RegisterRequest {
  username: string;
  full_name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface User {
  id: string;

  username: string;

  full_name: string;

  email: string;

  role: string;

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
}

export interface LoginResponse {
  user: User;

  tokens: {
    access_token: string;

    refresh_token: string;

    expires_in: number;
  };
}