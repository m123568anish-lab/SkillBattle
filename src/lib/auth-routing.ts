import type { User } from "@/types/auth";

export function getPostLoginPath(user: User): string {
  const accountType = (user.account_type || user.requested_role || user.role || "").toUpperCase();

  if (accountType.includes("COLLEGE") || accountType.includes("PLACEMENT") || accountType.includes("FACULTY")) {
    return "/college/dashboard";
  }

  if (accountType.includes("COMPANY") || accountType.includes("RECRUITER")) {
    return "/company/dashboard";
  }

  return user.onboarding_completed === false ? "/onboarding" : "/student/dashboard";
}