"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/": "AI Coding Battles",
  "/login": "Log in",
  "/register": "Create your account",
  "/dashboard": "Dashboard",
  "/battle": "Battle Arena",
  "/leaderboard": "Leaderboard",
  "/profile": "Your Profile",
  "/settings": "Account Settings",
  "/tournament": "Tournaments",
  "/coach": "AI Coach",
  "/career/dashboard": "Career Dashboard",
  "/career/resume": "Resume Coach",
  "/career/roadmap": "Career Roadmap",
  "/faq": "Help and FAQ",
  "/privacy": "Privacy Policy",
  "/terms": "Terms of Service",
};

export default function PageMetadata() {
  const pathname = usePathname();

  useEffect(() => {
    const title = pageTitles[pathname] || "SkillBattle";
    document.title = `${title} | SkillBattle`;
  }, [pathname]);

  return null;
}