"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getPostLoginPath } from "@/lib/auth-routing";

interface AuthGuardProps {
  children: React.ReactNode;
}

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/reset-password",
  "/faq",
  "/privacy",
  "/terms",
];

const PROTECTED_ROUTE_PREFIXES = [
  "/achievements", "/activity", "/admin", "/analytics", "/assessments", "/battle",
  "/calendar", "/campaign", "/career", "/challenge", "/college", "/company",
  "/coach", "/dashboard", "/interview", "/leaderboard", "/onboarding",
  "/opportunities", "/organization-setup", "/placement", "/profile", "/settings",
  "/tasks", "/tournament",
];

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();

  const loading = useAuthStore((s) => s.loading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (loading) return; // wait until auth resolved

    if (!isAuthenticated && isProtectedRoute(pathname)) {
      router.replace("/login");
      return;
    }

    if (isAuthenticated && user?.is_verified === false && pathname !== "/verify-email") {
      router.replace("/verify-email");
      return;
    }

    if (isAuthenticated && user && getPostLoginPath(user) === "/organization-setup" && pathname !== "/organization-setup") {
      router.replace("/organization-setup");
      return;
    }

    if (isAuthenticated && user && getPostLoginPath(user) === "/onboarding" && pathname !== "/onboarding") {
      router.replace("/onboarding");
      return;
    }

    if (isAuthenticated && pathname === "/login") {
      if (user) router.replace(getPostLoginPath(user));
      return;
    }
  }, [loading, isAuthenticated, pathname, router, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070B14]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
          <p className="text-gray-400 text-sm">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  const isProtected = isProtectedRoute(pathname);
  const organizationSetupRequired = Boolean(user && getPostLoginPath(user) === "/organization-setup");
  if (isProtected && (!isAuthenticated || !user || user.is_verified === false || (organizationSetupRequired && pathname !== "/organization-setup"))) return null;

  return <>{children}</>;
}