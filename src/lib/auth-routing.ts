import type { User } from "@/types/auth";

export function hasCompletedOnboarding(user: User | null | undefined): boolean {
  return Boolean(user && user.onboarding_completed === true);
}

export function getDashboardPath(user: User): string {
  const role = (user.role || "").toLowerCase();
  const accountType = (user.account_type || user.requested_role || role || "").toUpperCase();

  if (["admin", "platform_admin", "platform_support", "platform_analyst"].includes(role) || user.is_superuser) {
    return "/admin";
  }

  if (["college_admin", "placement_officer", "faculty", "trainer"].includes(role) || accountType.includes("COLLEGE") || accountType.includes("PLACEMENT") || accountType.includes("FACULTY")) {
    return "/college/dashboard";
  }

  if (["company_admin", "recruiter", "hiring_manager"].includes(role) || accountType.includes("COMPANY") || accountType.includes("RECRUITER")) {
    return "/company/dashboard";
  }

  return "/dashboard";
}

export function getPostLoginPath(user: User): string {
  const role = (user.role || "").toLowerCase();
  const accountType = (user.account_type || user.requested_role || role || "").toUpperCase();

  if (["admin", "platform_admin", "platform_support", "platform_analyst"].includes(role) || user.is_superuser) {
    return "/admin";
  }

  if (["college_admin", "placement_officer", "faculty", "trainer"].includes(role) || accountType.includes("COLLEGE") || accountType.includes("PLACEMENT") || accountType.includes("FACULTY")) {
    return "/college/dashboard";
  }

  if (["company_admin", "recruiter", "hiring_manager"].includes(role) || accountType.includes("COMPANY") || accountType.includes("RECRUITER")) {
    return "/company/dashboard";
  }

  return hasCompletedOnboarding(user) ? getDashboardPath(user) : "/onboarding";
}