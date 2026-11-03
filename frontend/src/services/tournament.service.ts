import { api } from "@/lib/api";

export interface TournamentRecord {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  tournament_type: string;
  status: string;
  max_players: number;
  registered_players: number;
  registration_end: string;
  starts_at: string;
  is_registered: boolean;
}

class TournamentService {
  async listTournaments(): Promise<TournamentRecord[]> {
    const response = await api.get<TournamentRecord[]>("/tournament");
    return response.data;
  }

  async joinTournament(tournamentId: string): Promise<void> {
    await api.post("/tournament/join", { tournament_id: tournamentId });
  }

  async leaveTournament(tournamentId: string): Promise<void> {
    await api.post("/tournament/leave", { tournament_id: tournamentId });
  }

}

export const tournamentService = new TournamentService();
export default tournamentService;
