import { api } from "@/lib/api";

export interface TournamentRecord {
  id: string;
  title?: string;
  description?: string;
  difficulty?: string;
  prizePool?: string;
  participants?: number;
  max_players?: number;
  starts_at?: string;
  status?: string;
  tournament_type?: string;
}

class TournamentService {
  async listTournaments() {
    try {
      const response = await api.get<TournamentRecord[]>('/tournament');
      return response.data ?? [];
    } catch {
      return [];
    }
  }

  async getTournament(tournamentId: string) {
    const response = await api.get<TournamentRecord>(`/tournament/${encodeURIComponent(tournamentId)}`);
    return response.data;
  }

  async joinTournament(tournamentId: string) {
    const response = await api.post<{ message?: string }>("/tournament/join", { tournament_id: tournamentId });
    return response.data;
  }

  async leaveTournament(tournamentId: string) {
    const response = await api.post<{ message?: string }>("/tournament/leave", { tournament_id: tournamentId });
    return response.data;
  }
}

export const tournamentService = new TournamentService();
export default tournamentService;
