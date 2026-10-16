import api from "@/lib/api";

export type CatalogueItem = { company_id: string; company_name: string; category: string; track_id: string; role: string; title: string; description: string; template_kind: string };
export type TrackRound = { id: string; position: number; title: string; assessment_type: string; topic: string; description: string; assessment_id: string | null };
export type PlacementTrack = { id: string; title: string; role: string; description: string; template_kind: string; company: { id: string; name: string; category: string }; rounds: TrackRound[] };
export const placementService = {
  catalogue: async (params: { q?: string; category?: string; role?: string }) => (await api.get<{ items: CatalogueItem[] }>("/placement/catalogue", { params })).data,
  track: async (id: string) => (await api.get<PlacementTrack>(`/placement/tracks/${id}`)).data,
};
