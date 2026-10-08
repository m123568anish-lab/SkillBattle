import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-constants";

export interface Profile {
  username?: string;
  full_name?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  college?: string;
  branch?: string;
  graduation_year?: number;
  target_company?: string;
  target_package?: string;
  github?: string;
  linkedin?: string;
  total_xp?: number;
  level?: number;
  onboarding_preferences?: Record<string, unknown>;
  onboarding_completed?: boolean;
}

export interface ProfileUpdatePayload {
  full_name?: string;
  avatar?: string;
  bio?: string;
  college?: string;
  branch?: string;
  graduation_year?: number;
  target_company?: string;
  target_package?: string;
  github?: string;
  linkedin?: string;
  onboarding_preferences?: Record<string, unknown>;
}

class ProfileService {
  async getMyProfile(): Promise<Profile> {
    const response = await api.get<Profile>(API_ENDPOINTS.PROFILE.ME);
    return response.data;
  }

  async updateProfile(payload: ProfileUpdatePayload) {
    const response = await api.put<Profile>(API_ENDPOINTS.PROFILE.UPDATE, payload);
    return response.data;
  }
}

export const profileService = new ProfileService();
