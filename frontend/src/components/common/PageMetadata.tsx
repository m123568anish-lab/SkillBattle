"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const pageTitles: Record<string, string> = {
  "/": "Learn. Build. Compete.",
  "/login": "Log in",
  "/register": "Create your account",
  "/dashboard": "Dashboard",
  "/practice": "Qubira Learn",
  "/practice/coding": "Qubira Code",
  "/practice/mcq": "Qubira Quiz",
  "/practice/tasks": "Qubira Missions",
  "/practice/topics": "Explore Curriculum",
  "/practice/progress": "My Learning Progress",
  "/battle": "Qubira Arena",
  "/battle/solo": "Solo Challenges",
  "/battle/lobby": "Arena Duels",
  "/battle/championship": "Daily Clash",
  "/battle/history": "Battle History",
  "/leaderboard": "Qubira Rankings",
  "/profile": "Your Profile",
  "/settings": "Account Settings",
  "/tournament": "Tournaments",
  "/coach": "Qubira Mentor",
  "/career/dashboard": "Career Dashboard",
  "/career/resume": "Resume Tools",
  "/career/roadmap": "Qubira Paths",
  "/interview": "Interview Prep",
  "/faq": "Help and FAQ",
  "/privacy": "Privacy Policy",
  "/terms": "Terms of Service",
};

export default function PageMetadata() {
  const pathname = usePathname();

  useEffect(() => {
    const title = pageTitles[pathname] || "Qubira";
    document.title = `${title} | Qubira`;
  }, [pathname]);

  return null;
}
