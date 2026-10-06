import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/faq", "/privacy", "/terms"],
      disallow: [
        "/admin/", "/analytics/", "/assessments/", "/battle/", "/calendar/",
        "/campaign/", "/career/", "/challenge/", "/college/", "/company/",
        "/coach/", "/dashboard/", "/interview/", "/onboarding/", "/opportunities/",
        "/organization-setup/", "/placement/", "/profile/", "/settings/", "/tasks/",
        "/tournament/", "/activity/", "/achievements/",
      ],
    },
    sitemap: "https://skillbattle.app/sitemap.xml",
  };
}