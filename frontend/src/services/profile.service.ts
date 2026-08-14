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
}

export interface ProfileUpdatePayload {
  avatar?: string;
  bio?: string;
  college?: string;
  branch?: string;
  graduation_year?: number;
  target_company?: string;
  target_package?: string;
  github?: string;
  linkedin?: string;
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
