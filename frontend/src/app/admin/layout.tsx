"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Activity, BarChart3, ChevronDown, Code2, Database, FileCheck2, Globe2, LayoutDashboard, LogOut, Menu, Search, ServerCog, Settings2, ShieldCheck, Users, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { ThemeToggle } from "@/components/common/ExperienceEnhancements";

type NavItem = { label: string; tab: string; icon: typeof LayoutDashboard };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  { label: "Command center", items: [{ label: "Overview", tab: "overview", icon: LayoutDashboard }] },
  { label: "Platform management", items: [
    { label: "User management", tab: "users", icon: Users },
    { label: "Daily challenges", tab: "challenge", icon: Code2 },
    { label: "Placement intelligence", tab: "placement", icon: BarChart3 },
    { label: "SEO & growth", tab: "seo", icon: Globe2 },
  ] },
  { label: "Monitoring & operations", items: [
    { label: "Server health", tab: "server", icon: ServerCog },
    { label: "System logs", tab: "logs", icon: Activity },
  ] },
  { label: "Security & administration", items: [
    { label: "Security trust center", tab: "security", icon: ShieldCheck },
    { label: "Verification", tab: "verification", icon: FileCheck2 },
    { label: "Global settings", tab: "settings", icon: Settings2 },
  ] },
];

function hrefFor(tab: string) { return tab === "overview" ? "/admin" : `/admin?tab=${tab}`; }

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [navSearch, setNavSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const logout = useAuthStore((state) => state.logout);
  const profileRef = useRef<HTMLDivElement>(null);
  const activeTab = params.get("tab") || "overview";
  const activeItem = navGroups.flatMap((group) => group.items).find((item) => item.tab === activeTab);
  const role = (user?.role || "").toLowerCase();
  const accountType = (user?.account_type || user?.requested_role || "").toLowerCase();
  const isAdmin = Boolean(user?.is_superuser || role.includes("admin") || role.includes("platform") || accountType.includes("admin") || accountType.includes("platform"));
  const filteredGroups = useMemo(() => {
    const query = navSearch.trim().toLowerCase();
    if (!query) return navGroups;
    return navGroups.map((group) => ({ ...group, items: group.items.filter((item) => item.label.toLowerCase().includes(query)) })).filter((group) => group.items.length > 0);
  }, [navSearch]);

  useEffect(() => { setMobileNavOpen(false); setProfileOpen(false); }, [pathname, params]);
  useEffect(() => {
    if (!profileOpen) return;
    const close = (event: MouseEvent) => { if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [profileOpen]);

  async function handleLogout() { try { await logout(); } finally { router.replace("/login"); } }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#070a0f] text-sm text-slate-400">Verifying administrator session…</div>;
  if (!isAdmin) return <div className="flex min-h-screen items-center justify-center bg-[#070a0f] p-6 text-center"><div className="max-w-md rounded-2xl border border-rose-400/20 bg-[#10151d] p-8"><ShieldCheck className="mx-auto mb-4 h-10 w-10 text-rose-300" /><h1 className="text-2xl font-semibold text-white">Administrator access required</h1><p className="mt-3 text-sm leading-6 text-slate-400">This workspace is protected by the platform administrator policy.</p><button type="button" onClick={() => router.replace("/dashboard")} className="mt-6 rounded-lg bg-lime-300 px-4 py-2 text-sm font-semibold text-slate-950">Return to workspace</button></div></div>;

  const navigation = <nav aria-label="Admin navigation" className="space-y-5">{filteredGroups.map((group) => <div key={group.label}><p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{group.label}</p><div className="space-y-1">{group.items.map((item) => { const Icon = item.icon; const active = activeTab === item.tab; return <Link key={item.tab} href={hrefFor(item.tab)} aria-current={active ? "page" : undefined} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active ? "bg-lime-300 text-slate-950 shadow-[0_8px_24px_rgba(190,242,100,0.12)]" : "text-slate-400 hover:bg-white/[0.05] hover:text-white"}`}><Icon className="h-4 w-4 shrink-0" /><span>{item.label}</span></Link>; })}</div></div>)}{navSearch && filteredGroups.length === 0 && <p className="px-3 text-xs text-slate-500">No sections match “{navSearch}”.</p>}</nav>;

  return <div className="min-h-screen bg-[#070a0f] text-slate-100">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/[0.07] bg-[#0b1017] lg:block"><div className="flex h-full flex-col px-4 py-5"><div className="mb-8 flex items-center gap-3 px-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-300 font-black text-slate-950">Q</div><div><p className="text-sm font-bold tracking-[0.2em] text-white">QUBIRA</p><p className="text-[11px] text-slate-500">Admin command center</p></div></div><div className="mb-5 flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs text-slate-400"><Database className="h-3.5 w-3.5 text-lime-300" /><span>Runtime data</span><span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-300" /></div><div className="mb-5 flex items-center gap-2 rounded-lg border border-white/[0.07] bg-[#080c12] px-3 py-2"><Search className="h-3.5 w-3.5 text-slate-500" /><input aria-label="Search admin sections" value={navSearch} onChange={(event) => setNavSearch(event.target.value)} placeholder="Find a section" className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-600" /></div><div className="min-h-0 flex-1 overflow-y-auto">{navigation}</div><div className="mt-5 border-t border-white/[0.07] pt-4"><button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-white/[0.05] hover:text-white"><LogOut className="h-4 w-4" /> Exit admin portal</button></div></div></aside>
    {mobileNavOpen && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close navigation" className="absolute inset-0 bg-black/70" onClick={() => setMobileNavOpen(false)} /><aside className="relative h-full w-[min(86vw,20rem)] border-r border-white/[0.08] bg-[#0b1017] p-4"><div className="mb-7 flex items-center justify-between"><span className="text-sm font-bold tracking-[0.2em]">QUBIRA</span><button aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}><X className="h-5 w-5" /></button></div>{navigation}</aside></div>}
    <main className="lg:pl-72"><header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#070a0f]/90 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-10"><div className="flex items-center justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><button type="button" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)} className="rounded-lg border border-white/[0.08] p-2 lg:hidden"><Menu className="h-4 w-4" /></button><div className="min-w-0"><div className="flex items-center gap-2 text-[11px] text-slate-500"><span>Qubira</span><span>/</span><span>Administration</span></div><h1 className="truncate text-lg font-semibold text-white">{activeItem?.label || "Overview"}</h1></div></div><div className="flex items-center gap-2"><div className="hidden items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-xs text-slate-400 md:flex"><span className="h-1.5 w-1.5 rounded-full bg-lime-300" /> Protected workspace</div><ThemeToggle /><div ref={profileRef} className="relative"><button type="button" aria-expanded={profileOpen} onClick={() => setProfileOpen((value) => !value)} className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2"><span className="flex h-7 w-7 items-center justify-center rounded-md bg-lime-300 text-xs font-bold text-slate-950">{(user?.full_name || user?.username || "A").slice(0, 1).toUpperCase()}</span><span className="hidden max-w-32 truncate text-xs font-medium text-slate-200 sm:block">{user?.full_name || user?.username}</span><ChevronDown className="h-3.5 w-3.5 text-slate-500" /></button>{profileOpen && <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/[0.1] bg-[#111820] p-2 shadow-2xl"><div className="border-b border-white/[0.07] px-3 py-2"><p className="truncate text-sm font-medium text-white">{user?.email}</p><p className="mt-1 text-xs uppercase tracking-wider text-lime-300">{user?.role}</p></div><button type="button" onClick={handleLogout} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/[0.06]"><LogOut className="h-4 w-4" /> Sign out</button></div>}</div></div></div></header><div className="p-4 sm:p-6 lg:p-10">{children}</div></main>
  </div>;
}
