"use client";

import { useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import { X, Home, Sword, Trophy, Users, MoreHorizontal, ChevronRight, Search, Sparkles, Bot, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sidebarItems, type SidebarItem } from "@/data/dashboard";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

export default function DashboardLayout({
  children,
}: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const pathname = usePathname();
  const drawerTables = useMemo(() => {
    const query = menuSearch.trim().toLowerCase();
    const byTitle = (title: string, href: string): SidebarItem | undefined =>
      sidebarItems.find((item) => item.title === title) && {
        ...(sidebarItems.find((item) => item.title === title) as SidebarItem),
        href,
      };
    const core = [
      byTitle("Dashboard", "/dashboard"),
      byTitle("Battle Arena", "/battle"),
      byTitle("Tournaments", "/tournaments"),
      byTitle("Leaderboard", "/leaderboard"),
      byTitle("Career Roadmap", "/roadmap"),
      byTitle("Resume Screening", "/resume-screener"),
    ].filter((item): item is SidebarItem => Boolean(item));
    const ai = [
      byTitle("AI Mock Interview", "/ai-interview"),
      byTitle("AI Coach", "/ai-coach"),
      byTitle("Achievements", "/achievements"),
      byTitle("Analytics", "/analytics"),
      byTitle("Calendar", "/calendar"),
      byTitle("Profile", "/profile"),
      byTitle("Settings", "/settings"),
    ].filter((item): item is SidebarItem => Boolean(item));
    if (!query) return { core, ai };
    return {
      core: core.filter((item) => item.title.toLowerCase().includes(query)),
      ai: ai.filter((item) => item.title.toLowerCase().includes(query)),
    };
  }, [menuSearch]);

  return (
    <div
      suppressHydrationWarning
      className="
        flex
        min-h-screen
        skillbattle-shell
        bg-[#050816]
        text-white
      "
    >
      <Sidebar />

      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-[90] mx-auto flex max-h-[88dvh] w-full max-w-2xl flex-col rounded-t-3xl border border-slate-800 bg-[#161B22] p-5 shadow-[0_-24px_80px_rgba(0,0,0,.6)] md:hidden"
            >
              <div className="min-h-0 overflow-y-auto">
                <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-5">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-300">Quick access</span>
                    <span className="mt-1 block text-xl font-black text-white">More tools</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close more menu"
                    className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
                <div className="mb-4 rounded-2xl border border-cyan-400/15 bg-gradient-to-r from-cyan-400/10 to-violet-500/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-cyan-400/15 p-2 text-cyan-300"><Sparkles size={18} /></div>
                    <div>
                      <p className="text-sm font-bold text-white">Keep progressing</p>
                      <p className="mt-0.5 text-xs text-slate-400">Jump into your next challenge.</p>
                    </div>
                  </div>
                </div>
                <div className="mb-5 grid grid-cols-2 gap-2">
                  <Link
                    href="/battle"
                    onClick={() => setMobileMenuOpen(false)}
                    className="group rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 p-3 transition hover:border-fuchsia-300/50"
                  >
                    <Flame className="mb-3 text-fuchsia-300" size={19} />
                    <span className="block text-xs font-bold text-white">Start a battle</span>
                    <span className="mt-1 block text-[10px] text-slate-400">Enter the arena</span>
                  </Link>
                  <Link
                    href="/coach"
                    onClick={() => setMobileMenuOpen(false)}
                    className="group rounded-2xl border border-violet-400/20 bg-violet-400/10 p-3 transition hover:border-violet-300/50"
                  >
                    <Bot className="mb-3 text-violet-300" size={19} />
                    <span className="block text-xs font-bold text-white">Ask AI Coach</span>
                    <span className="mt-1 block text-[10px] text-slate-400">Improve your skills</span>
                  </Link>
                </div>
                <label className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-slate-400 focus-within:border-violet-400/50">
                  <Search size={17} />
                  <input
                    value={menuSearch}
                    onChange={(event) => setMenuSearch(event.target.value)}
                    placeholder="Jump to a feature..."
                    className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </label>
                <nav aria-label="More navigation" className="space-y-5">
                  {[
                    { label: "Core Tools", items: drawerTables.core },
                    { label: "AI & Account", items: drawerTables.ai },
                  ].map((category) => (
                    <section key={category.label}>
                      <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">{category.label}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {category.items.map((item) => {
                          const Icon = item.icon;
                          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className={`group flex min-h-[76px] flex-col justify-between rounded-2xl border p-3 transition ${
                                active
                                  ? "border-cyan-400/35 bg-cyan-400/10 text-cyan-300"
                                  : "border-slate-800 bg-[#0D1117] text-slate-300 hover:border-cyan-400/40 hover:bg-[#1d2632]"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <Icon size={18} />
                                <ChevronRight size={14} className="opacity-40 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                              </div>
                              <span className="text-xs font-semibold leading-tight">{item.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </nav>
                {drawerTables.core.length === 0 && drawerTables.ai.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
                    No matching feature found.
                  </div>
                )}
              </div>
              <div className="border-t border-white/5 pt-4 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">SkillBattle Arena</div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main
        className="
          flex-1
          overflow-auto
          p-3
          sm:p-8
          px-4
          pb-[calc(6rem+env(safe-area-inset-bottom))]
          md:p-8
          md:pb-8
        "
      >
        <TopNavbar onMenuClick={() => setMobileMenuOpen(true)} />

        {children}

      </main>

      {/* Mobile navigation stays fixed while the content reserves its height. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center md:hidden">
        <nav
          aria-label="Mobile navigation"
          className="skillbattle-mobile-nav flex w-full max-w-lg items-center justify-between rounded-t-2xl border border-white/10 bg-slate-950/90 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_20px_60px_rgba(8,145,178,0.25)] backdrop-blur-xl"
        >
          {[
            { title: "Home", href: "/dashboard", icon: Home },
            { title: "Battle", href: "/battle", icon: Sword },
            { title: "Rank", href: "/leaderboard", icon: Trophy },
            { title: "Friends", href: "/social", icon: Users },
            { title: "More", href: "#more", icon: MoreHorizontal },
          ].map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            const Icon = tab.icon;
            const className = `relative flex flex-1 flex-col items-center justify-center gap-1 rounded-full px-2 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
                  active
                    ? "bg-gradient-to-b from-cyan-500/25 to-violet-500/20 text-cyan-300 shadow-lg shadow-cyan-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`;
            if (tab.title === "More") {
              return (
                <button key={tab.title} type="button" onClick={() => setMobileMenuOpen(true)} className={className}>
                  <Icon size={18} />
                  <span>{tab.title}</span>
                </button>
              );
            }
            return (
              <Link key={tab.title} href={tab.href} className={className}>
                <Icon size={18} />
                <span>{tab.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}