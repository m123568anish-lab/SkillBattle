import type { User } from "@/types/auth";

export function getDashboardPath(user: User): string {
  const role = (user.role || "").toLowerCase();
  const accountType = (user.requested_role || user.account_type || role || "").toUpperCase();

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
  const status = (user.status || "").toUpperCase();
  const accountType = (user.requested_role || user.account_type || role || "").toUpperCase();

  if (["admin", "platform_admin", "platform_support", "platform_analyst"].includes(role) || user.is_superuser) {
    return "/admin";
  }

  if (["college_admin", "placement_officer", "faculty", "trainer"].includes(role) || accountType.includes("COLLEGE") || accountType.includes("PLACEMENT") || accountType.includes("FACULTY")) {
    return status === "PENDING_VERIFICATION" ? "/organization-setup" : getDashboardPath(user);
  }

  if (["company_admin", "recruiter", "hiring_manager"].includes(role) || accountType.includes("COMPANY") || accountType.includes("RECRUITER")) {
    return status === "PENDING_VERIFICATION" ? "/organization-setup" : getDashboardPath(user);
  }

  return user.onboarding_completed === false ? "/onboarding" : getDashboardPath(user);
}