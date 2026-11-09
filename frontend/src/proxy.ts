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
    ],
  })(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
