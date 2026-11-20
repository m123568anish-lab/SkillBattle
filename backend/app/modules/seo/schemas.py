from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class SeoPageAudit(BaseModel):
    url: str
    status: str  # passed, warning, failed
    status_code: int = 200
    title: Optional[str] = None
    meta_description: Optional[str] = None
    canonical_url: Optional[str] = None
    open_graph_title: Optional[str] = None
    open_graph_image: Optional[str] = None
    twitter_card: Optional[str] = None
    headings_h1_count: int = 1
    has_viewport: bool = True
    is_indexable: bool = True
    issues: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)


class SeoAuditSummary(BaseModel):
    total_pages_scanned: int
    passed_pages: int
    warning_pages: int
    failed_pages: int
    overall_health_score: int
    last_scan_time: str
    pages: List[SeoPageAudit]


class ProviderStatus(BaseModel):
    provider: str  # "google", "bing"
    connected: bool
    property_id: Optional[str] = None
    verification_method: str = "DNS TXT / HTML Meta Tag"
    verification_status: str  # "verified", "pending", "unconnected"
    verification_token: str
    last_synced: Optional[str] = None
    error_message: Optional[str] = None


class SearchAnalyticsMetric(BaseModel):
    date: str
    clicks: int
    impressions: int
    ctr: float
    position: float


class SearchConsoleData(BaseModel):
    status: ProviderStatus
    total_clicks: int
    total_impressions: int
    average_ctr: float
    average_position: float
    trends: List[SearchAnalyticsMetric]
    top_queries: List[Dict[str, str]]
    top_pages: List[Dict[str, str]]


class BingWebmasterData(BaseModel):
    status: ProviderStatus
    indexnow_supported: bool = True
    indexnow_key: str
    indexnow_key_location: str
    submitted_urls_count: int
    last_submission_time: Optional[str] = None


class SitemapStats(BaseModel):
    sitemap_url: str
    status: str  # "valid", "needs_regeneration", "error"
    total_included_urls: int
    total_excluded_urls: int
    last_generated_time: str
    validation_status: str
    public_urls: List[str]


class LlmsTxtPreview(BaseModel):
    url: str
    status: str
    last_generated_time: str
    content: str
    word_count: int
    character_count: int
    included_sections: List[str]


class SocialMetaPreview(BaseModel):
    canonical_url: str
    title: str
    description: str
    image_url: str
    site_name: str
    card_type: str
    image_dimensions: str
    image_accessible: bool
    missing_tags: List[str]


class LaunchCheckItem(BaseModel):
    id: str
    category: str  # "SEO", "Security", "Performance", "Infrastructure"
    name: str
    description: str
    status: str  # "passed", "failed", "warning", "not_configured"
    severity: str  # "critical", "high", "medium", "low"
    technical_evidence: str
    recommended_fix: str
    last_checked_time: str


class LaunchChecklistSummary(BaseModel):
    overall_readiness_score: int
    passed_count: int
    warning_count: int
    failed_count: int
    not_configured_count: int
    checks: List[LaunchCheckItem]


class GitleaksFinding(BaseModel):
    file_path: str
    line_number: int
    rule_id: str
    description: str
    severity: str
    remediation_guide: str


class SecurityAuditSummary(BaseModel):
    status: str
    last_scan_time: str
    secrets_found_count: int
    findings: List[GitleaksFinding]
    headers_status: Dict[str, bool]
    https_enforced: bool


class PerformanceMetric(BaseModel):
    metric_name: str
    value: str
    score: int
    status: str  # "good", "needs_improvement", "poor"
    benchmark: str


class PerformanceLabSummary(BaseModel):
    tested_url: str
    test_time: str
    performance_score: int
    accessibility_score: int
    best_practices_score: int
    seo_score: int
    metrics: List[PerformanceMetric]
    recommendations: List[str]


class SeoOverviewResponse(BaseModel):
    overall_launch_score: int
    seo_health_score: int
    google_connected: bool
    bing_connected: bool
    sitemap_valid: bool
    llms_txt_ready: bool
    open_graph_valid: bool
    security_clean: bool
    performance_score: int
    last_updated: str
