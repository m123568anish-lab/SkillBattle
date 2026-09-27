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
  Building2,
  Users,
  LucideIcon,
  GraduationCap,
  Briefcase,
  UserCheck,
  Building,
  PlusCircle,
  TrendingUp,
  FileSpreadsheet,
  Award,
  Layers,
  Sparkles,
  Search,
} from "lucide-react";

export interface SidebarItem {
  title: string;
  href: string;
  icon: LucideIcon;
  category?: string;
}

export interface SidebarCategory {
  id: string;
  label: string;
  items: SidebarItem[];
}

// ==========================================
// 1. STUDENT SIDEBAR NAVIGATION
// ==========================================
export const studentSidebarCategories: SidebarCategory[] = [
  {
    id: "main",
    label: "Main",
    items: [
      { title: "Dashboard", href: "/student/dashboard", icon: Home },
      { title: "Practice", href: "/practice", icon: Sparkles },
      { title: "Battle Arena", href: "/battle", icon: Sword },
    ],
  },
  {
    id: "compete",
    label: "Compete",
    items: [
      { title: "Tournaments", href: "/tournament", icon: Trophy },
      { title: "Leaderboard", href: "/leaderboard", icon: Medal },
      { title: "Social & Friends", href: "/social", icon: Users },
    ],
  },
  {
    id: "learn",
    label: "Learn & Grow",
    items: [
      { title: "Career Roadmap", href: "/career/roadmap", icon: Map },
      { title: "AI Mock Interview", href: "/interview", icon: Mic },
      { title: "AI Coach", href: "/coach", icon: Bot },
    ],
  },
  {
    id: "progress",
    label: "Progress",
    items: [
      { title: "Achievements", href: "/achievements", icon: Medal },
      { title: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    id: "account",
    label: "Account",
    items: [
      { title: "Calendar", href: "/calendar", icon: Calendar },
      { title: "Profile", href: "/profile", icon: User },
      { title: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

// ==========================================
// 2. COLLEGE SIDEBAR NAVIGATION
// ==========================================
export const collegeSidebarCategories: SidebarCategory[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/college/dashboard", icon: Home },
    ],
  },
  {
    id: "student_management",
    label: "Student Management",
    items: [
      { title: "Students", href: "/college/students", icon: GraduationCap },
      { title: "Departments", href: "/college/departments", icon: Building2 },
      { title: "Batches", href: "/college/batches", icon: Layers },
      { title: "Import Students", href: "/college/import", icon: FileSpreadsheet },
    ],
  },
  {
    id: "assessments",
    label: "Assessments",
    items: [
      { title: "Assessments", href: "/college/assessments", icon: Award },
      { title: "Create Assessment", href: "/college/assessments/new", icon: PlusCircle },
      { title: "Results", href: "/college/results", icon: BarChart3 },
    ],
  },
  {
    id: "training",
    label: "Training",
    items: [
      { title: "Training Programs", href: "/college/training", icon: Map },
      { title: "Challenges", href: "/college/challenges", icon: Sword },
    ],
  },
  {
    id: "placement",
    label: "Placement",
    items: [
      { title: "Placement Drives", href: "/college/placements", icon: Briefcase },
      { title: "Eligible Students", href: "/college/eligible", icon: UserCheck },
      { title: "Shortlisted Students", href: "/college/shortlisted", icon: Medal },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    items: [
      { title: "Placement Analytics", href: "/college/analytics", icon: TrendingUp },
      { title: "Skill Analytics", href: "/college/skill-analytics", icon: BarChart3 },
    ],
  },
  {
    id: "institution",
    label: "Institution",
    items: [
      { title: "College Profile", href: "/college/profile", icon: Building },
      { title: "Staff", href: "/college/staff", icon: Users },
      { title: "Settings", href: "/college/settings", icon: Settings },
    ],
  },
];

// ==========================================
// 3. COMPANY SIDEBAR NAVIGATION
// ==========================================
export const companySidebarCategories: SidebarCategory[] = [
  {
    id: "overview",
    label: "Overview",
    items: [
      { title: "Dashboard", href: "/company/dashboard", icon: Home },
    ],
  },
  {
    id: "hiring",
    label: "Hiring",
    items: [
      { title: "Jobs", href: "/company/jobs", icon: Briefcase },
      { title: "Candidates", href: "/company/candidates", icon: Users },
      { title: "Shortlisted", href: "/company/shortlisted", icon: UserCheck },
      { title: "Interviews", href: "/company/interviews", icon: Mic },
    ],
  },
  {
    id: "assessments",
    label: "Assessments",
    items: [
      { title: "Assessments", href: "/company/assessments", icon: Award },
      { title: "Create Assessment", href: "/company/assessments/new", icon: PlusCircle },
      { title: "Results", href: "/company/results", icon: BarChart3 },
    ],
  },
  {
    id: "talent",
    label: "Talent",
    items: [
      { title: "Discover Candidates", href: "/company/discover", icon: Search },
      { title: "Skill Profiles", href: "/company/talent", icon: GraduationCap },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    items: [
      { title: "Hiring Analytics", href: "/company/analytics", icon: TrendingUp },
      { title: "Assessment Analytics", href: "/company/assessment-analytics", icon: BarChart3 },
    ],
  },
  {
    id: "company",
    label: "Company",
    items: [
      { title: "Company Profile", href: "/company/profile", icon: Building },
      { title: "Team", href: "/company/team", icon: Users },
      { title: "Settings", href: "/company/settings", icon: Settings },
    ],
  },
];

// Legacy export for fallback compatibility
export const sidebarCategories = studentSidebarCategories;
export const sidebarItems = studentSidebarCategories.flatMap((category) =>
  category.items.map((item) => ({ ...item, category: category.label }))
);