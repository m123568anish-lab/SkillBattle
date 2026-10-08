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
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  FileBarChart,
  Layers3,
  ListChecks,
  SearchCheck,
  ShieldCheck,
  UserPlus,
  Users,
  Zap,
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

export type PortalKind = "student" | "college" | "company" | "admin";

export interface PortalNavItem {
  title: string;
  href?: string;
  icon: LucideIcon;
  category: string;
  available: boolean;
}

export function getPortalKind(pathname: string): PortalKind {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/college")) return "college";
  if (pathname.startsWith("/company")) return "company";
  return "student";
}

const collegeItems: PortalNavItem[] = [
  { title: "Dashboard", href: "/college/dashboard", icon: Home, category: "Overview", available: true },
  { title: "Students", href: "/college/dashboard?view=students", icon: Users, category: "Organization", available: true },
  { title: "Departments", href: "/college/dashboard?view=departments", icon: Building2, category: "Organization", available: true },
  { title: "Batches", href: "/college/dashboard?view=batches", icon: Layers3, category: "Organization", available: true },
  { title: "Import Students", icon: UserPlus, category: "Organization", available: false },
  { title: "Assessments", href: "/college/dashboard?view=assessments", icon: ClipboardCheck, category: "Assessment", available: true },
  { title: "Results", href: "/college/dashboard?view=results", icon: FileBarChart, category: "Assessment", available: true },
  { title: "Question Bank", icon: ListChecks, category: "Assessment", available: false },
  { title: "Training Programs", icon: Zap, category: "Development", available: false },
  { title: "Challenges", icon: Sword, category: "Development", available: false },
  { title: "Placement Drives", icon: BriefcaseBusiness, category: "Placement", available: false },
  { title: "Eligible Students", icon: SearchCheck, category: "Placement", available: false },
  { title: "Shortlisted Students", icon: Trophy, category: "Placement", available: false },
  { title: "Placement Analytics", icon: BarChart3, category: "Insights", available: false },
  { title: "Skill Analytics", href: "/college/dashboard?view=analytics", icon: BarChart3, category: "Insights", available: true },
  { title: "College Profile", href: "/organization-setup", icon: Building2, category: "Organization", available: true },
  { title: "Staff", icon: Users, category: "Organization", available: false },
  { title: "Settings", href: "/settings", icon: Settings, category: "Account", available: true },
];

const companyItems: PortalNavItem[] = [
  { title: "Dashboard", href: "/company/dashboard", icon: Home, category: "Overview", available: true },
  { title: "Jobs", href: "/company/dashboard?view=jobs", icon: BriefcaseBusiness, category: "Hiring", available: true },
  { title: "Create Job", href: "/company/dashboard?view=jobs&action=create", icon: UserPlus, category: "Hiring", available: true },
  { title: "Candidates", href: "/company/dashboard?view=candidates", icon: Users, category: "Hiring", available: true },
  { title: "Shortlisted", href: "/company/dashboard?view=candidates&status=shortlisted", icon: ListChecks, category: "Hiring", available: true },
  { title: "Interviews", icon: ClipboardCheck, category: "Hiring", available: false },
  { title: "Assessments", href: "/company/dashboard?view=assessments", icon: ClipboardCheck, category: "Assessment", available: true },
  { title: "Question Bank", icon: ListChecks, category: "Assessment", available: false },
  { title: "Results", href: "/company/dashboard?view=candidates", icon: FileBarChart, category: "Assessment", available: true },
  { title: "Discover Candidates", href: "/company/dashboard?view=discover", icon: SearchCheck, category: "Talent", available: true },
  { title: "Skill Profiles", href: "/company/dashboard?view=discover", icon: FileBarChart, category: "Talent", available: true },
  { title: "Hiring Analytics", href: "/company/dashboard?view=analytics", icon: BarChart3, category: "Insights", available: true },
  { title: "Assessment Analytics", href: "/company/dashboard?view=analytics", icon: BarChart3, category: "Insights", available: true },
  { title: "Company Profile", href: "/organization-setup", icon: Building2, category: "Organization", available: true },
  { title: "Team", icon: Users, category: "Organization", available: false },
  { title: "Settings", href: "/settings", icon: Settings, category: "Account", available: true },
];

export function getPortalCategories(portal: PortalKind): Array<{ id: string; label: string; items: PortalNavItem[] }> {
  if (portal === "student") return sidebarCategories.map((category) => ({
    ...category,
    items: category.items.map((item) => ({ ...item, available: true })),
  }));

  const items = portal === "college" ? collegeItems : companyItems;
  const categoryNames = [...new Set(items.map((item) => item.category))];
  return categoryNames.map((label) => ({
    id: label.toLowerCase().replace(/\s+/g, "-"),
    label,
    items: items.filter((item) => item.category === label),
  }));
}

export function getMobileNavigation(portal: PortalKind): PortalNavItem[] {
  if (portal === "college") {
    return [
      collegeItems[0],
      collegeItems[1],
      collegeItems[5],
      collegeItems[13],
      { title: "More", icon: Layers3, category: "mobile", available: true },
    ];
  }

  if (portal === "company") {
    return [
      companyItems[0],
      companyItems[1],
      companyItems[3],
      companyItems[5] || { title: "Interviews", icon: ClipboardCheck, category: "mobile", available: true },
      { title: "More", icon: Layers3, category: "mobile", available: true },
    ];
  }

  if (portal === "admin") {
    return [
      { title: "Home", href: "/admin", icon: Home, category: "mobile", available: true },
      { title: "Users", href: "/admin?tab=users", icon: Users, category: "mobile", available: true },
      { title: "Organizations", href: "/admin?tab=organizations", icon: Building2, category: "mobile", available: true },
      { title: "Security", href: "/admin?tab=security", icon: ShieldCheck, category: "mobile", available: true },
      { title: "More", icon: Layers3, category: "mobile", available: true },
    ];
  }

  return [
    { title: "Home", href: "/dashboard", icon: Home, category: "mobile", available: true },
    { title: "Battle", href: "/battle", icon: Sword, category: "mobile", available: true },
    { title: "Career", href: "/career/roadmap", icon: Map, category: "mobile", available: true },
    { title: "Coach", href: "/coach", icon: Bot, category: "mobile", available: true },
    { title: "More", icon: Layers3, category: "mobile", available: true },
  ];
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
  { title: "College Assessments", href: "/assessments", icon: ClipboardCheck, category: "learn" },
  { title: "Company Opportunities", href: "/opportunities", icon: BriefcaseBusiness, category: "learn" },
  { title: "Resume Screening", href: "/career/resume", icon: FileText, category: "learn" },
  { title: "Career Mentor", href: "/career/mentor", icon: Bot, category: "learn" },
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