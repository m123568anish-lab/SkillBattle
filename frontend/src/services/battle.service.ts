import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-constants";

function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("response" in error)) return undefined;
  const response = error.response;
  if (typeof response !== "object" || response === null || !("status" in response)) {
    return undefined;
  }
  return typeof response.status === "number" ? response.status : undefined;
}

export function getBattleCreationKey(scope: string, request: object): string {
  const storagePrefix = `qubira:battle-create:${scope}`;
  const fingerprint = JSON.stringify(request);
  const storedFingerprint = sessionStorage.getItem(`${storagePrefix}:request`);
  const storedKey = sessionStorage.getItem(`${storagePrefix}:key`);
  if (storedFingerprint === fingerprint && storedKey) return storedKey;

  const key = crypto.randomUUID();
  sessionStorage.setItem(`${storagePrefix}:request`, fingerprint);
  sessionStorage.setItem(`${storagePrefix}:key`, key);
  return key;
}

export function clearBattleCreationKey(scope: string, key: string): void {
  const storagePrefix = `qubira:battle-create:${scope}`;
  if (sessionStorage.getItem(`${storagePrefix}:key`) !== key) return;
  sessionStorage.removeItem(`${storagePrefix}:request`);
  sessionStorage.removeItem(`${storagePrefix}:key`);
}

export async function createBattleWithRetry<T>(
  payload: object,
  idempotencyKey: string,
): Promise<T> {
  const request = { ...payload, idempotency_key: idempotencyKey };
  const send = () => api.post<T>(API_ENDPOINTS.BATTLE.CREATE, request);
  try {
    return (await send()).data;
  } catch (error: unknown) {
    const status = getErrorStatus(error);
    if (status !== undefined && ![502, 503, 504].includes(status)) throw error;
    await new Promise((resolve) => setTimeout(resolve, 250));
    return (await send()).data;
  }
}

export interface BattleRecord {
  id: string;
  title?: string;
  creator_id?: string | null;
  mode?: string;
  type?: string;
  battle_type?: string;
  difficulty?: string;
  problem_id?: number;
  status?: string;
  max_players?: number;
  current_section_index?: number;
  sections_config?: Array<Record<string, unknown>>;
  questions_data?: Array<{
    section_index: number;
    question_type: string;
    title?: string;
    questions: Array<{
      id: number;
      title: string;
      description: string;
      question_type: string;
      difficulty?: string;
      skill_category?: string;
      options?: Array<string | { key?: string; text?: string }>;
      examples?: Array<{ input?: string; output?: string; explanation?: string }>;
      constraints?: string;
      buggy_code?: string;
    }>;
  }>;
  submitted_question_ids?: number[];
  started_at?: string | null;
  expires_at?: string | null;
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
  battle_mode?: string;
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
  async createBattle(payload: CreateBattlePayload, idempotencyKey: string) {
    return createBattleWithRetry<BattleRecord>(payload, idempotencyKey);
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

  async startBattle(battleId: string) {
    const response = await api.post<BattleRecord>(`${API_ENDPOINTS.BATTLE.GET(battleId)}/start`);
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

  async getHistory(limit = 10, offset = 0) {
    const response = await api.get<{ history: BattleHistoryItem[]; total: number }>(`/battle/history?limit=${limit}&offset=${offset}`);
    return response.data;
  }
}

export interface BattleHistoryItem {
  battle_id: string;
  title: string;
  battle_type: string;
  difficulty: string;
  status: string;
  score: number;
  rank: number;
  is_winner: boolean;
  xp_earned: number;
  accuracy: number;
  created_at: string | null;
}

export const battleService = new BattleService();
export default battleService;

