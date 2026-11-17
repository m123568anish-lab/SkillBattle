"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, BriefcaseBusiness, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Code2, Home, LogOut, Map, Medal, MoreHorizontal, Settings, ShieldCheck, Sparkles, Sword, Target, Trophy, User, Users, type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { collegeSidebarCategories, companySidebarCategories, SidebarCategory } from "@/data/dashboard";

type NavEntry = { title: string; href: string; icon: LucideIcon };
type NavGroup = NavEntry & { children: NavEntry[] };

const studentPrimary: NavEntry[] = [
  { title: "Overview", href: "/dashboard", icon: Home },
  { title: "Learn", href: "/practice/topics", icon: Sparkles },
  { title: "Battle Arena", href: "/battle", icon: Sword },
  { title: "Practice", href: "/practice", icon: Code2 },
  { title: "AI Coach", href: "/coach", icon: ShieldCheck },
];

const studentGroups: NavGroup[] = [
  { title: "Career Hub", href: "/career/roadmap", icon: BriefcaseBusiness, children: [
    { title: "AI Roadmap", href: "/career/roadmap", icon: Map },
    { title: "Company Prep", href: "/career/resume", icon: Target },
    { title: "Mock Interview", href: "/interview", icon: Users },
  ] },
  { title: "My Progress", href: "/analytics", icon: BarChart3, children: [
    { title: "Analytics", href: "/analytics", icon: BarChart3 },
    { title: "Achievements", href: "/achievements", icon: Medal },
    { title: "Rankings", href: "/leaderboard", icon: Trophy },
    { title: "Battle History", href: "/battle/history", icon: Sword },
  ] },
  { title: "More", href: "/friends", icon: MoreHorizontal, children: [
    { title: "Friends", href: "/friends", icon: Users },
    { title: "Tournaments", href: "/tournament", icon: Trophy },
    { title: "Daily Challenge", href: "/daily-challenges", icon: Target },
    { title: "Saved Items", href: "/practice?status=saved", icon: Medal },
  ] },
];

function routeMatches(pathname: string, href: string) {
  const route = href.split("?", 1)[0];
  if (route === "/dashboard") return pathname === "/dashboard" || pathname === "/student/dashboard";
  if (route === "/battle") return pathname === "/battle" || pathname.startsWith("/battle/");
  return pathname === route || pathname.startsWith(`${route}/`);
}

function CategoryNavigation({ categories, collapsed, pathname }: { categories: SidebarCategory[]; collapsed: boolean; pathname: string }) {
  return <div className="space-y-5">{categories.map((category) => <section key={category.id}>
    {!collapsed && <h2 className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--qb-muted)]">{category.label}</h2>}
    <div className="mt-2 space-y-1">{category.items.map((item) => { const Icon = item.icon; const active = routeMatches(pathname, item.href); return <Link key={`${category.id}-${item.href}`} href={item.href} title={collapsed ? item.title : undefined} className={`qb-nav-item ${active ? "qb-nav-item-active" : ""} ${collapsed ? "justify-center px-0" : ""}`}><Icon size={18} aria-hidden="true" />{!collapsed && <span className="truncate">{item.title}</span>}</Link>; })}</div>
  </section>)}</div>;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const role = (user?.role || "student").toLowerCase();
  const isCollege = pathname.startsWith("/college") || ["college", "college_admin", "placement_officer", "faculty"].includes(role);
  const isCompany = pathname.startsWith("/company") || ["company", "company_admin", "recruiter"].includes(role);
  const roleCategories = isCollege ? collegeSidebarCategories : isCompany ? companySidebarCategories : null;
  const displayName = user?.full_name || user?.username || "Your profile";
  const roleLabel = isCollege ? "Institution" : isCompany ? "Enterprise" : role === "admin" ? "Administrator" : "Student";
  const avatar = user?.avatar_url || user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=101010&color=D8FF3E&bold=true`;
  const activeGroups = useMemo(() => Object.fromEntries(studentGroups.map((group) => [group.title, group.children.some((child) => routeMatches(pathname, child.href))])), [pathname]);

  async function handleLogout() { await logout(); router.replace("/login"); }

  return <motion.aside initial={false} animate={{ width: collapsed ? 76 : 248 }} transition={{ duration: 0.2, ease: "easeOut" }} className="hidden md:flex h-[calc(100dvh-2rem)] m-4 mr-0 shrink-0 flex-col overflow-hidden rounded-2xl border border-[var(--qb-border)] bg-[var(--qb-sidebar)] shadow-2xl shadow-black/30">
    <div className={`flex h-20 shrink-0 items-center border-b border-[var(--qb-border)] ${collapsed ? "justify-center" : "justify-between px-4"}`}>
      <Link href="/" className="flex min-w-0 items-center gap-3" title="Qubira home"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--qb-accent)] text-[var(--qb-accent-foreground)]"><Trophy size={20} /></div>{!collapsed && <div className="min-w-0"><p className="truncate text-base font-black tracking-tight text-[var(--qb-text)]">Qubira</p><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--qb-muted)]">{roleLabel}</p></div>}</Link>
      {!collapsed && <button type="button" onClick={() => setCollapsed(true)} aria-label="Collapse sidebar" className="qb-icon-button"><ChevronLeft size={16} /></button>}
    </div>
    {collapsed && <button type="button" onClick={() => setCollapsed(false)} aria-label="Expand sidebar" className="qb-icon-button mx-auto mt-3"><ChevronRight size={16} /></button>}
    <nav aria-label="Main navigation" className="min-h-0 flex-1 overflow-y-auto px-3 py-4 scrollbar-hide">
      {roleCategories ? <CategoryNavigation categories={roleCategories} collapsed={collapsed} pathname={pathname} /> : <>
        <div className="space-y-1">{studentPrimary.map((item) => { const Icon = item.icon; const active = routeMatches(pathname, item.href); return <Link key={item.href} href={item.href} title={collapsed ? item.title : undefined} className={`qb-nav-item ${active ? "qb-nav-item-active" : ""} ${collapsed ? "justify-center px-0" : ""}`}><Icon size={18} /><span className={collapsed ? "sr-only" : "truncate"}>{item.title}</span></Link>; })}</div>
        <div className="mt-6 space-y-1">{!collapsed && <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--qb-muted)]">Growth</p>}{studentGroups.map((group) => { const Icon = group.icon; const active = activeGroups[group.title] || routeMatches(pathname, group.href); const expanded = openGroups[group.title] ?? active; return <div key={group.title}>
          <button type="button" onClick={() => setOpenGroups((current) => ({ ...current, [group.title]: !expanded }))} title={collapsed ? group.title : undefined} aria-expanded={expanded} className={`qb-nav-item w-full ${active ? "qb-nav-item-active" : ""} ${collapsed ? "justify-center px-0" : ""}`}><Icon size={18} /><span className={collapsed ? "sr-only" : "flex-1 truncate text-left"}>{group.title}</span>{!collapsed && <ChevronDown size={15} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />}</button>
          {!collapsed && expanded && <div className="ml-4 mt-1 space-y-1 border-l border-[var(--qb-border)] pl-3">{group.children.map((child) => { const ChildIcon = child.icon; const childActive = routeMatches(pathname, child.href); return <Link key={child.href} href={child.href} className={`qb-nav-subitem ${childActive ? "qb-nav-subitem-active" : ""}`}><ChildIcon size={15} /><span className="truncate">{child.title}</span></Link>; })}</div>}
        </div>; })}</div>
      </>}
    </nav>
    <div className="shrink-0 border-t border-[var(--qb-border)] p-3">{!collapsed && <Link href="/profile" className="mb-2 flex items-center gap-3 rounded-xl p-2 hover:bg-white/5"><img src={avatar} alt="" className="h-9 w-9 rounded-full border border-[var(--qb-border)] object-cover" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[var(--qb-text)]">{displayName}</span><span className="block text-xs text-[var(--qb-muted)]">{roleLabel}</span></span><User size={16} className="text-[var(--qb-muted)]" /></Link>}
      <div className={`flex ${collapsed ? "flex-col" : "items-center justify-between"} gap-1`}><Link href="/settings" title={collapsed ? "Settings" : undefined} className="qb-footer-link"><Settings size={16} />{!collapsed && "Settings"}</Link><Link href="/ai-coach" title={collapsed ? "Help & Support" : undefined} className="qb-footer-link"><CircleHelp size={16} />{!collapsed && "Help"}</Link><button type="button" onClick={handleLogout} title={collapsed ? "Sign out" : undefined} className="qb-footer-link text-rose-300 hover:bg-rose-400/10"><LogOut size={16} />{!collapsed && "Sign out"}</button></div>
    </div>
  </motion.aside>;
}
