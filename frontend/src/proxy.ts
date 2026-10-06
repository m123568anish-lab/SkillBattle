import { NextResponse, type NextRequest } from "next/server";

export function proxy(_request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
}

export const config = {
  matcher: [
    "/achievements/:path*", "/activity/:path*", "/admin/:path*", "/analytics/:path*",
    "/assessments/:path*", "/battle/:path*", "/calendar/:path*", "/campaign/:path*",
    "/career/:path*", "/challenge/:path*", "/college/:path*", "/company/:path*",
    "/coach/:path*", "/dashboard/:path*", "/interview/:path*", "/leaderboard/:path*",
    "/onboarding/:path*", "/opportunities/:path*", "/organization-setup/:path*",
    "/placement/:path*", "/profile/:path*", "/settings/:path*", "/tasks/:path*",
    "/tournament/:path*", "/verify-email/:path*",
  ],
};