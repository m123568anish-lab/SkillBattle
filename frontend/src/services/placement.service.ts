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
export type ExternalOpportunity = {
  job_id: string;
  title: string;
  employer_name: string;
  location: string;
  country: string;
  employment_type: string;
  is_remote: boolean;
  posted_at: string | null;
  salary: string | null;
  description: string;
  highlights: Record<string, string[]>;
  source_label: string;
  source_url: string;
  application_url: string;
};
export type ExternalOpportunitySearch = {
  items: ExternalOpportunity[];
  provider: string;
  markets_searched: Array<{ code: string; name: string }>;
  markets_with_errors: string[];
};
export const opportunityService = {
  list: async (params: { q?: string; category?: string; work_mode?: string; employment_type?: string; page?: number }) => (await api.get<OpportunityPage>("/company/openings", { params })).data,
  searchExternal: async (params: { q: string; opening_type: string; location?: string }) => (await api.get<ExternalOpportunitySearch>("/company/external-opportunities", { params })).data,
  summarizeExternal: async (listing: ExternalOpportunity) => (await api.post<{ summary: string }>("/company/external-opportunities/summary", {
    title: listing.title,
    employer_name: listing.employer_name,
    location: listing.location,
    employment_type: listing.employment_type,
    description: listing.description || "Description not provided.",
    listing_url: listing.source_url,
    highlights: Object.values(listing.highlights).flat(),
  })).data,
  save: async (jobId: number) => (await api.put(`/company/openings/${jobId}/save`)).data,
  unsave: async (jobId: number) => (await api.delete(`/company/openings/${jobId}/save`)).data,
  saved: async () => (await api.get<Array<{ job_id: number; company_name: string; title: string; status: string; deadline_at: string | null }>>("/company/saved-opportunities")).data,
  apply: async (jobId: number, consent_to_recruiters = false) => (await api.post("/company/applications", { job_id: jobId, consent_to_recruiters })).data,
  confirmExternal: async (jobId: number) => (await api.post("/company/applications/external", { job_id: jobId, confirm_applied: true })).data,
};
