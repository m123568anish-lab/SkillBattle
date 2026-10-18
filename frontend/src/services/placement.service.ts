import api from "@/lib/api";

export type CatalogueItem = { company_id: string; company_name: string; category: string; track_id: string; role: string; title: string; description: string; template_kind: string };
export type TrackRound = { id: string; position: number; title: string; assessment_type: string; topic: string; description: string; assessment_id: string | null };
export type PlacementTrack = { id: string; title: string; role: string; description: string; template_kind: string; company: { id: string; name: string; category: string }; rounds: TrackRound[] };
export const placementService = {
  catalogue: async (params: { q?: string; category?: string; role?: string }) => (await api.get<{ items: CatalogueItem[] }>("/placement/catalogue", { params })).data,
  track: async (id: string) => (await api.get<PlacementTrack>(`/placement/tracks/${id}`)).data,
};

export type Opportunity = { job_id: number; company_name: string; title: string; location: string; employment_type: string; work_mode: "remote" | "hybrid" | "on_site"; required_skills: string; description: string; eligibility: string; compensation: string | null; deadline_at: string | null; source_label: string; source_url: string; application_method: "internal" | "external"; application_url: string | null; verification_status: string };
export type OpportunityPage = { items: Opportunity[]; page: number; page_size: number; total: number };
export const opportunityService = {
  list: async (params: { q?: string; category?: string; work_mode?: string; employment_type?: string; page?: number }) => (await api.get<OpportunityPage>("/company/openings", { params })).data,
  save: async (jobId: number) => (await api.put(`/company/openings/${jobId}/save`)).data,
  unsave: async (jobId: number) => (await api.delete(`/company/openings/${jobId}/save`)).data,
  saved: async () => (await api.get<Array<{ job_id: number; company_name: string; title: string; status: string; deadline_at: string | null }>>("/company/saved-opportunities")).data,
  apply: async (jobId: number, consent_to_recruiters = false) => (await api.post("/company/applications", { job_id: jobId, consent_to_recruiters })).data,
  confirmExternal: async (jobId: number) => (await api.post("/company/applications/external", { job_id: jobId, confirm_applied: true })).data,
};
