import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-constants";

export interface BattleRecord {
  id: string;
  title?: string;
  difficulty?: string;
  problem_id?: number;
  status?: string;
  max_players?: number;
  created_at?: string;
}

export interface BattleParticipant {
  id: string;
  battle_id: string;
  user_id: string;
  score: number;
  rank: number;
  joined_at: string;
}

export interface BattleTimerData {
  remaining_seconds: number;
  running: boolean;
}

export interface CreateBattlePayload {
  title: string;
  difficulty: string;
  problem_id: number;
  max_players: number;
}

export interface MatchmakingRequest {
  difficulty?: string;
  language?: string;
  ranked?: boolean;
  mode?: "global" | "friend";
  friend_id?: string;
}

export interface MatchmakingStatus {
  matched: boolean;
  queue_size: number;
  status?: string;
  battle_id?: string;
}

class BattleService {
  async createBattle(payload: CreateBattlePayload) {
    const response = await api.post<BattleRecord>(API_ENDPOINTS.BATTLE.CREATE, payload);
    return response.data;
  }

  async joinBattle(battleId: string) {
    const response = await api.post<BattleRecord>(API_ENDPOINTS.BATTLE.JOIN, { battle_id: battleId });
    return response.data;
  }

  async getWaitingBattles() {
    const response = await api.get<BattleRecord[]>(API_ENDPOINTS.BATTLE.WAITING);
    return response.data;
  }

  async joinQueue(data?: MatchmakingRequest) {
    const response = await api.post<MatchmakingStatus>(API_ENDPOINTS.BATTLE.QUEUE_JOIN, data ?? {});
    return response.data;
  }

  async leaveQueue() {
    const response = await api.post(API_ENDPOINTS.BATTLE.QUEUE_LEAVE);
    return response.data;
  }

  async queueStatus() {
    const response = await api.get<MatchmakingStatus>(API_ENDPOINTS.BATTLE.QUEUE_STATUS);
    return response.data;
  }

  async getBattle(battleId: string) {
    const response = await api.get<BattleRecord>(API_ENDPOINTS.BATTLE.GET(battleId));
    return response.data;
  }

  async getParticipants(battleId: string) {
    const response = await api.get<BattleParticipant[]>(API_ENDPOINTS.BATTLE.GET(battleId) + "/participants");
    return response.data;
  }

  async getTimer(battleId: string) {
    const response = await api.get<BattleTimerData>(API_ENDPOINTS.BATTLE.GET(battleId) + "/timer");
    return response.data;
  }

  async leaveBattle(battleId: string) {
    const response = await api.post(API_ENDPOINTS.BATTLE.LEAVE, { battle_id: battleId });
    return response.data;
  }
}

export const battleService = new BattleService();
export default battleService;
