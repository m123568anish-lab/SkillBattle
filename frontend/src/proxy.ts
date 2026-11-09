import { auth } from "@/lib/auth/server";

export default auth.middleware({
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
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
