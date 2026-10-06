"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { getPostLoginPath, hasCompletedOnboarding } from "@/lib/auth-routing";

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
];

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();

  const loading = useAuthStore((s) => s.loading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (loading) return; // wait until auth resolved

    const isPublic = PUBLIC_ROUTES.includes(pathname);

    if (!isAuthenticated && !isPublic) {
      router.replace("/login");
      return;
    }

    if (isAuthenticated && user) {
      const isOnboardingComplete = hasCompletedOnboarding(user);
      const destination = getPostLoginPath(user);

      if (["/login", "/register"].includes(pathname)) {
        router.replace(destination);
        return;
      }

      if (pathname === "/onboarding" && isOnboardingComplete) {
        router.replace(destination);
        return;
      }

      if (!isPublic && !isOnboardingComplete && pathname !== "/onboarding") {
        router.replace("/onboarding");
        return;
      }
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

  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const userRequiresOnboarding = Boolean(user && !hasCompletedOnboarding(user) && !isPublic && pathname !== "/onboarding");
  if (!isPublic && (!isAuthenticated || !user || userRequiresOnboarding)) {
    return null;
  }

  return <>{children}</>;
}