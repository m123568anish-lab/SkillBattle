"use client";

import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, loading, loadUser } = useAuthStore();

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (!isAuthenticated && token) {
      // attempt to load user
      loadUser();
      return;
    }

    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, loadUser, router]);

  if (loading) {
    return <div className="p-8">Checking authentication…</div>;
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
