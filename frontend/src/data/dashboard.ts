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
  Gamepad2,
  Flame,
  Code2,
  HelpCircle,
  Activity,
  Target,
  LucideIcon,
} from "lucide-react";

export interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
  category: "home" | "compete" | "learn" | "career" | "community" | "account" | "main" | "track" | string;
  badge?: string;
  description?: string;
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
  badge?: string;
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
  { title: "College Profile", href: "/organization-setup", icon: Building2, category: "Organization", available: true },
  { title: "Assessments", href: "/college/dashboard?view=assessments", icon: ClipboardCheck, category: "Assessment", available: true },
  { title: "Results", href: "/college/dashboard?view=results", icon: FileBarChart, category: "Assessment", available: true },
  { title: "Placement Scorecard", href: "/placement/scorecard", icon: BriefcaseBusiness, category: "Placement", available: true },
  { title: "Skill Analytics", href: "/college/dashboard?view=analytics", icon: BarChart3, category: "Insights", available: true },
  { title: "Settings", href: "/settings", icon: Settings, category: "Account", available: true },
];

const companyItems: PortalNavItem[] = [
  { title: "Dashboard", href: "/company/dashboard", icon: Home, category: "Overview", available: true },
  { title: "Jobs", href: "/company/dashboard?view=jobs", icon: BriefcaseBusiness, category: "Hiring", available: true },
  { title: "Create Job", href: "/company/dashboard?view=jobs&action=create", icon: UserPlus, category: "Hiring", available: true },
  { title: "Candidates", href: "/company/dashboard?view=candidates", icon: Users, category: "Hiring", available: true },
  { title: "Shortlisted", href: "/company/dashboard?view=candidates&status=shortlisted", icon: ListChecks, category: "Hiring", available: true },
  { title: "Interviews", href: "/company/dashboard?view=interviews", icon: ClipboardCheck, category: "Hiring", available: true },
  { title: "Discover Candidates", href: "/company/dashboard?view=discover", icon: SearchCheck, category: "Talent", available: true },
  { title: "Assessments", href: "/company/dashboard?view=assessments", icon: ClipboardCheck, category: "Talent", available: true },
  { title: "Hiring Analytics", href: "/company/dashboard?view=analytics", icon: BarChart3, category: "Insights", available: true },
  { title: "Company Profile", href: "/organization-setup", icon: Building2, category: "Organization", available: true },
  { title: "Settings", href: "/settings", icon: Settings, category: "Account", available: true },
];

const adminItems: PortalNavItem[] = [
  { title: "Overview", href: "/admin", icon: Home, category: "Overview", available: true },
  { title: "Daily Challenge", href: "/admin?tab=challenge", icon: Flame, category: "Platform Controls", available: true },
  { title: "User Management", href: "/admin?tab=users", icon: Users, category: "Platform Controls", available: true },
  { title: "System Logs", href: "/admin?tab=logs", icon: FileBarChart, category: "Platform Controls", available: true },
  { title: "Server Health", href: "/admin?tab=server", icon: BarChart3, category: "Platform Controls", available: true },
  { title: "Verification", href: "/admin?tab=verification", icon: ShieldCheck, category: "Platform Controls", available: true },
  { title: "Settings", href: "/admin?tab=settings", icon: Settings, category: "System", available: true },
];

export function getPortalCategories(portal: PortalKind): Array<{ id: string; label: string; items: PortalNavItem[] }> {
  if (portal === "student") {
    return sidebarCategories.map((category) => ({
      ...category,
      items: category.items.map((item) => ({ ...item, available: true })),
    }));
  }

  const items = portal === "college" ? collegeItems : portal === "company" ? companyItems : adminItems;
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
      { title: "Home", href: "/college/dashboard", icon: Home, category: "mobile", available: true },
      { title: "Students", href: "/college/dashboard?view=students", icon: Users, category: "mobile", available: true },
      { title: "Assessments", href: "/college/dashboard?view=assessments", icon: ClipboardCheck, category: "mobile", available: true },
      { title: "Placement", href: "/placement/scorecard", icon: BriefcaseBusiness, category: "mobile", available: true },
      { title: "More", icon: Layers3, category: "mobile", available: true },
    ];
  }

  if (portal === "company") {
    return [
      { title: "Home", href: "/company/dashboard", icon: Home, category: "mobile", available: true },
      { title: "Jobs", href: "/company/dashboard?view=jobs", icon: BriefcaseBusiness, category: "mobile", available: true },
      { title: "Candidates", href: "/company/dashboard?view=candidates", icon: Users, category: "mobile", available: true },
      { title: "Interviews", href: "/company/dashboard?view=interviews", icon: ClipboardCheck, category: "mobile", available: true },
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
    { title: "Practice", href: "/tasks", icon: Code2, category: "mobile", available: true },
    { title: "Jobs", href: "/opportunities", icon: BriefcaseBusiness, category: "mobile", available: true },
    { title: "More", icon: Layers3, category: "mobile", available: true },
  ];
}

export const sidebarItems: SidebarItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: Home, category: "space" },

  { title: "Battle Arena", href: "/battle", icon: Sword, category: "train" },
  { title: "Daily Challenges", href: "/challenge", icon: Flame, category: "train" },
  { title: "Practice Tasks", href: "/tasks", icon: Code2, category: "train" },
  { title: "Skill Quest", href: "/campaign", icon: Gamepad2, category: "train" },
  { title: "Tournaments", href: "/tournament", icon: Trophy, category: "train" },
  { title: "Leaderboard", href: "/leaderboard", icon: BarChart3, category: "train" },

  { title: "AI Coach", href: "/coach", icon: Bot, category: "career" },
  { title: "Assessments", href: "/assessments", icon: ClipboardCheck, category: "career" },
  { title: "Career Roadmap", href: "/career/roadmap", icon: Map, category: "career" },
  { title: "AI Mock Interview", href: "/interview", icon: Mic, category: "career" },
  { title: "Resume Tools", href: "/career/resume", icon: FileText, category: "career" },
  { title: "Career Mentor", href: "/career/mentor", icon: Bot, category: "career" },
  { title: "Placement Prep", href: "/placement", icon: Target, category: "career" },
  { title: "Opportunities", href: "/opportunities", icon: BriefcaseBusiness, category: "career" },

  { title: "Friends", href: "/friends", icon: Users, category: "community" },

  { title: "Profile", href: "/profile", icon: User, category: "account" },
  { title: "Settings", href: "/settings", icon: Settings, category: "account" },
  { title: "Help & FAQ", href: "/faq", icon: HelpCircle, category: "account" },
];

export const sidebarCategories: SidebarCategory[] = [
  {
    id: "space",
    label: "Your Space",
    items: sidebarItems.filter(i => i.category === "space"),
  },
  {
    id: "train",
    label: "Train & Compete",
    items: sidebarItems.filter(i => i.category === "train"),
  },
  {
    id: "career",
    label: "Grow Your Career",
    items: sidebarItems.filter(i => i.category === "career"),
  },
  {
    id: "community",
    label: "Community",
    items: sidebarItems.filter(i => i.category === "community"),
  },
  {
    id: "account",
    label: "Account",
    items: sidebarItems.filter(i => i.category === "account"),
  },
];
