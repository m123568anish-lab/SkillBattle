import type { NextRequest } from "next/server";
import { getAuth } from "@/lib/auth/server";

export default function proxy(request: NextRequest) {
  return getAuth().middleware({
    loginUrl: "/login",
    publicRoutes: [
      "/",
      "/login",
      "/register",
      "/sign-in",
      "/sign-up",
      "/forgot-password",
      "/verify-email",
      "/reset-password",
      "/faq",
      "/privacy",
      "/terms",
      // These routes are authorized by the FastAPI API using Neon bearer tokens.
      "/api/v1",
      "/api/battle",
      "/api/health",
    ],
  })(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
