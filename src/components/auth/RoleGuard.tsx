"use client";

import { useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { toast } from "react-hot-toast";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated || !user) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    const role = (user.role || "user").toLowerCase();
    const isAllowed = allowedRoles.some(r => r.toLowerCase() === role);

    if (!isAllowed) {
      toast.error("You don't have permission to access this portal.");
      if (["college", "college_admin", "placement_officer", "faculty"].includes(role)) {
        router.replace("/college/dashboard");
      } else if (["company", "company_admin", "recruiter"].includes(role)) {
        router.replace("/company/dashboard");
      } else {
        router.replace("/student/dashboard");
      }
    }
  }, [user, loading, isAuthenticated, allowedRoles, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#070B14] text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 mb-4 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
          <p className="text-sm font-semibold text-slate-400">Verifying portal authorization...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const userRole = (user.role || "user").toLowerCase();
  const isAllowed = allowedRoles.some(r => r.toLowerCase() === userRole);

  if (!isAllowed) return null;

  return <>{children}</>;
}
