import { NextResponse, type NextRequest } from "next/server";

/**
 * Keep the existing lightweight Next proxy during the dual-session rollout.
 * ClerkProvider/useAuth owns browser sessions, while AuthGuard and FastAPI
 * enforce access until legacy localStorage sessions are retired. Server-side
 * Clerk helpers can be added when the rollout switches to Clerk-only routes.
 */
export function proxy(_request: NextRequest) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
}

export const config = {
  matcher: [
    // Run Clerk on application and API requests so server components and
    // route handlers can access the Clerk session during the migration.
    // Authorization remains enforced by AuthGuard and the FastAPI API until
    // all legacy sessions have been migrated.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
