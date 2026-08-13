import { api } from "@/lib/api";

export interface LevelStatus {
  level_id: number;
  title: string;
  description: string;
  stars: number;
  unlocked: boolean;
}

export interface TrackStatus {
  track: string;
  current_level: number;
  levels: LevelStatus[];
}

export interface CampaignStatusResponse {
  rank: string;
  points: number;
  tracks: TrackStatus[];
}

export interface QuestionOption {
  id: number;
  text: string;
  options: string[];
}

export interface CampaignLevelResponse {
  level_id: number;
  title: string;
  description: string;
  questions: QuestionOption[];
}

export interface LevelAnswer {
  question_id: number;
  selected_option: number;
}

export interface LevelSubmitRequest {
  track: string;
  level_id: number;
  answers: LevelAnswer[];
}

export interface LevelSubmitResponse {
  score: number;
  total: number;
  stars: number;
  points_earned: number;
  unlocked_next: boolean;
  rank_upgraded: boolean;
  new_rank: string;
  correct_count: number;
}

class CampaignService {
  async getCampaignStatus(): Promise<CampaignStatusResponse> {
    const response = await api.get<CampaignStatusResponse>("/campaign/status");
    return response.data;
  }

  async getCampaignLevel(track: string, levelId: number): Promise<CampaignLevelResponse> {
    const response = await api.get<CampaignLevelResponse>(`/campaign/level/${track}/${levelId}`);
    return response.data;
  }

  async submitLevel(payload: LevelSubmitRequest): Promise<LevelSubmitResponse> {
    const response = await api.post<LevelSubmitResponse>("/campaign/submit", payload);
    return response.data;
  }
}

export const campaignService = new CampaignService();
