"use client";

import React, { ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return <div className="p-8">Checking authentication…</div>;
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
