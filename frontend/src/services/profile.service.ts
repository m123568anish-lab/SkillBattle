import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-constants";

export interface Profile {
  username?: string;
  full_name?: string;
  email?: string;
  total_xp: number;
  level: number;
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

  async uploadAvatar(file: File): Promise<Profile> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<Profile>("/profile/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  }

  async deleteAvatar(): Promise<Profile> {
    const response = await api.delete<Profile>("/profile/avatar");
    return response.data;
  }
}

export const profileService = new ProfileService();

