import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://qubira.io";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/faq", "/privacy", "/terms", "/support"],
      disallow: [
        "/admin/", "/analytics/", "/assessments/", "/battle/", "/calendar/",
        "/campaign/", "/career/", "/challenge/", "/college/", "/company/",
        "/coach/", "/dashboard/", "/interview/", "/onboarding/", "/opportunities/",
        "/organization-setup/", "/placement/", "/profile/", "/settings/", "/tasks/",
        "/tournament/", "/activity/", "/achievements/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
