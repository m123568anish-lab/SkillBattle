"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getDashboardPath, getPostLoginPath } from "@/lib/auth-routing";

interface AuthGuardProps {
  children: React.ReactNode;
}

const PROTECTED_ROUTE_PREFIXES = [
  "/achievements", "/activity", "/admin", "/analytics", "/assessments", "/battle",
  "/calendar", "/campaign", "/career", "/challenge", "/college", "/company",
  "/coach", "/dashboard", "/friends", "/interview", "/leaderboard", "/onboarding",
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
  const status = useAuthStore((s) => s.status);
  const authError = useAuthStore((s) => s.authError);
  const retryAuthentication = () => {
    window.dispatchEvent(new Event("skillbattle:retry-auth"));
  };

  useEffect(() => {
    if (loading || status === "unavailable" || status === "forbidden") return;

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

    if (isAuthenticated && user && user.onboarding_completed === true && pathname === "/onboarding") {
      router.replace(getDashboardPath(user));
      return;
    }

    if (isAuthenticated && pathname === "/login") {
      if (user) router.replace(getPostLoginPath(user));
      return;
    }
  }, [loading, status, isAuthenticated, pathname, router, user]);

  const isProtected = isProtectedRoute(pathname);

  // Public routes (landing page, login, register, docs, etc.) must render immediately
  // without blocking the user on background authentication checks or cold starts.
  if (!isProtected) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-canvas)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--accent-strong)] border-t-transparent" />
          <p className="text-[var(--text-secondary)] text-sm">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  if (status === "unavailable") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-canvas)] text-center text-[var(--text-secondary)]">
        <div className="space-y-4">
          <p>{authError ?? "Authentication service is temporarily unavailable."}</p>
          <button type="button" onClick={retryAuthentication} className="rounded-md bg-[var(--accent)] px-4 py-2 font-semibold text-[var(--text-on-accent)]">Try again</button>
        </div>
      </div>
    );
  }

  if (status === "forbidden") {
    return <div className="flex min-h-screen items-center justify-center bg-[var(--surface-canvas)] text-[var(--text-secondary)]">Your account is not permitted to access Qubira.</div>;
  }

  const organizationSetupRequired = Boolean(user && getPostLoginPath(user) === "/organization-setup");
  if (!isAuthenticated || !user || user.is_verified === false || (organizationSetupRequired && pathname !== "/organization-setup")) {
    return null;
  }

  return <>{children}</>;
}
