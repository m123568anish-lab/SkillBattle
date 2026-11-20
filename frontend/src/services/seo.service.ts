import { api } from "@/lib/api";

export interface SeoOverview {
  overall_launch_score: number;
  seo_health_score: number;
  google_connected: boolean;
  bing_connected: boolean;
  sitemap_valid: boolean;
  llms_txt_ready: boolean;
  open_graph_valid: boolean;
  security_clean: boolean;
  performance_score: number;
  last_updated: string;
}

export interface SeoPageAudit {
  url: string;
  status: "passed" | "warning" | "failed";
  status_code: number;
  title?: string;
  meta_description?: string;
  canonical_url?: string;
  open_graph_title?: string;
  open_graph_image?: string;
  twitter_card?: string;
  headings_h1_count: number;
  has_viewport: boolean;
  is_indexable: boolean;
  issues: string[];
  recommendations: string[];
}

export interface SeoAuditSummary {
  total_pages_scanned: number;
  passed_pages: number;
  warning_pages: number;
  failed_pages: number;
  overall_health_score: number;
  last_scan_time: string;
  pages: SeoPageAudit[];
}

export interface ProviderStatus {
  provider: "google" | "bing";
  connected: boolean;
  property_id?: string;
  verification_method: string;
  verification_status: "verified" | "pending" | "unconnected";
  verification_token: string;
  last_synced?: string;
  error_message?: string;
}

export interface SearchAnalyticsMetric {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleData {
  status: ProviderStatus;
  total_clicks: number;
  total_impressions: number;
  average_ctr: number;
  average_position: number;
  trends: SearchAnalyticsMetric[];
  top_queries: Array<{ query: string; clicks: string; impressions: string; position: string }>;
  top_pages: Array<{ page: string; clicks: string; impressions: string }>;
}

export interface BingWebmasterData {
  status: ProviderStatus;
  indexnow_supported: boolean;
  indexnow_key: string;
  indexnow_key_location: string;
  submitted_urls_count: number;
  last_submission_time?: string;
}

export interface SitemapStats {
  sitemap_url: string;
  status: string;
  total_included_urls: number;
  total_excluded_urls: number;
  last_generated_time: string;
  validation_status: string;
  public_urls: string[];
}

export interface LlmsTxtPreview {
  url: string;
  status: string;
  last_generated_time: string;
  content: string;
  word_count: number;
  character_count: number;
  included_sections: string[];
}

export interface SocialMetaPreview {
  canonical_url: string;
  title: string;
  description: string;
  image_url: string;
  site_name: string;
  card_type: string;
  image_dimensions: string;
  image_accessible: boolean;
  missing_tags: string[];
}

export interface LaunchCheckItem {
  id: string;
  category: "SEO" | "Security" | "Performance" | "Infrastructure";
  name: string;
  description: string;
  status: "passed" | "failed" | "warning" | "not_configured";
  severity: "critical" | "high" | "medium" | "low";
  technical_evidence: string;
  recommended_fix: string;
  last_checked_time: string;
}

export interface LaunchChecklistSummary {
  overall_readiness_score: number;
  passed_count: number;
  warning_count: number;
  failed_count: number;
  not_configured_count: number;
  checks: LaunchCheckItem[];
}

export interface SecurityAuditSummary {
  status: string;
  last_scan_time: string;
  secrets_found_count: number;
  findings: Array<{
    file_path: string;
    line_number: number;
    rule_id: string;
    description: string;
    severity: string;
    remediation_guide: string;
  }>;
  headers_status: Record<string, boolean>;
  https_enforced: boolean;
}

export interface PerformanceLabSummary {
  tested_url: string;
  test_time: string;
  performance_score: number;
  accessibility_score: number;
  best_practices_score: number;
  seo_score: number;
  metrics: Array<{
    metric_name: string;
    value: string;
    score: number;
    status: "good" | "needs_improvement" | "poor";
    benchmark: string;
  }>;
  recommendations: string[];
}

export const seoService = {
  getOverview: async (): Promise<SeoOverview> => {
    const { data } = await api.get<SeoOverview>("/admin/seo/overview");
    return data;
  },
  getAudit: async (): Promise<SeoAuditSummary> => {
    const { data } = await api.get<SeoAuditSummary>("/admin/seo/audit");
    return data;
  },
  getGoogleSearchConsole: async (): Promise<SearchConsoleData> => {
    const { data } = await api.get<SearchConsoleData>("/admin/seo/google");
    return data;
  },
  connectGoogle: async (): Promise<ProviderStatus> => {
    const { data } = await api.post<ProviderStatus>("/admin/seo/google/connect");
    return data;
  },
  disconnectGoogle: async (): Promise<ProviderStatus> => {
    const { data } = await api.post<ProviderStatus>("/admin/seo/google/disconnect");
    return data;
  },
  getBingWebmaster: async (): Promise<BingWebmasterData> => {
    const { data } = await api.get<BingWebmasterData>("/admin/seo/bing");
    return data;
  },
  connectBing: async (): Promise<ProviderStatus> => {
    const { data } = await api.post<ProviderStatus>("/admin/seo/bing/connect");
    return data;
  },
  submitIndexNow: async (urls: string[]): Promise<any> => {
    const { data } = await api.post("/admin/seo/bing/indexnow", { urls });
    return data;
  },
  getSitemapStats: async (): Promise<SitemapStats> => {
    const { data } = await api.get<SitemapStats>("/admin/seo/sitemap");
    return data;
  },
  getLlmsTxt: async (): Promise<LlmsTxtPreview> => {
    const { data } = await api.get<LlmsTxtPreview>("/admin/seo/llms");
    return data;
  },
  getOpenGraph: async (): Promise<SocialMetaPreview> => {
    const { data } = await api.get<SocialMetaPreview>("/admin/seo/open-graph");
    return data;
  },
  getLaunchChecklist: async (): Promise<LaunchChecklistSummary> => {
    const { data } = await api.get<LaunchChecklistSummary>("/admin/seo/launch-checklist");
    return data;
  },
  getSecurityAudit: async (): Promise<SecurityAuditSummary> => {
    const { data } = await api.get<SecurityAuditSummary>("/admin/seo/security");
    return data;
  },
  getPerformanceLab: async (): Promise<PerformanceLabSummary> => {
    const { data } = await api.get<PerformanceLabSummary>("/admin/seo/performance");
    return data;
  },
};
