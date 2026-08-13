import {
  Home,
  Sword,
  Trophy,
  Bot,
  Calendar,
  BarChart3,
  User,
  Settings,
  Map,
  FileText,
  Mic,
  Medal,
  Gamepad,
  LucideIcon,
} from "lucide-react";

export interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
  category: "main" | "compete" | "learn" | "track" | "account";
}

export interface SidebarCategory {
  id: string;
  label: string;
  items: SidebarItem[];
}

export const sidebarItems: SidebarItem[] = [
  // Main
  { title: "Dashboard", href: "/dashboard", icon: Home, category: "main" },
  { title: "Battle Arena", href: "/battle", icon: Sword, category: "main" },

  // Compete
  { title: "Tournaments", href: "/tournament", icon: Trophy, category: "compete" },
  { title: "Leaderboard", href: "/leaderboard", icon: Trophy, category: "compete" },

  // Learn & Grow
  { title: "Career Roadmap", href: "/career/roadmap", icon: Map, category: "learn" },
  { title: "Resume Screening", href: "/career/resume", icon: FileText, category: "learn" },
  { title: "AI Mock Interview", href: "/interview", icon: Mic, category: "learn" },
  { title: "AI Coach", href: "/coach", icon: Bot, category: "learn" },

  // Track Progress
  { title: "Achievements", href: "/achievements", icon: Medal, category: "track" },
  { title: "Analytics", href: "/analytics", icon: BarChart3, category: "track" },

  // Account
  { title: "Calendar", href: "/calendar", icon: Calendar, category: "account" },
  { title: "Profile", href: "/profile", icon: User, category: "account" },
  { title: "Settings", href: "/settings", icon: Settings, category: "account" },
];

export const sidebarCategories: SidebarCategory[] = [
  {
    id: "main",
    label: "Main",
    items: sidebarItems.filter(i => i.category === "main"),
  },
  {
    id: "compete",
    label: "Compete",
    items: sidebarItems.filter(i => i.category === "compete"),
  },
  {
    id: "learn",
    label: "Learn & Grow",
    items: sidebarItems.filter(i => i.category === "learn"),
  },
  {
    id: "track",
    label: "Track Progress",
    items: sidebarItems.filter(i => i.category === "track"),
  },
  {
    id: "account",
    label: "Account",
    items: sidebarItems.filter(i => i.category === "account"),
  },
];