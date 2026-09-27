"use client";

import RoleGuard from "@/components/auth/RoleGuard";
import DashboardPage from "@/app/dashboard/page";

export default function StudentDashboardPage() {
  return (
    <RoleGuard allowedRoles={["user", "student"]}>
      <DashboardPage />
    </RoleGuard>
  );
}
