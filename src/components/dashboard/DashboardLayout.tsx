"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import QuickAccessModal from "./QuickAccessModal";
import {
  X,
  Home,
  Sword,
  Trophy,
  Users,
  MoreHorizontal,
  ChevronRight,
  Search,
  Sparkles,
  Bot,
  Flame,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  companySidebarCategories,
  collegeSidebarCategories,
  studentSidebarCategories,
  SidebarItem,
} from "@/data/dashboard";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

interface Props {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);

  useEffect(() => {
    if (!authLoading && user && user.onboarding_completed === false) {
      router.replace("/onboarding");
    }
  }, [authLoading, user, router]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickAccessOpen, setQuickAccessOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const pathname = usePathname();

  // Close mobile drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const navigationCategories = useMemo(() => {
    if (pathname.startsWith("/company")) return companySidebarCategories;
    if (pathname.startsWith("/college")) return collegeSidebarCategories;
    return studentSidebarCategories;
  }, [pathname]);

  // Filtered categories for mobile drawer
  const filteredCategories = useMemo(() => {
    const query = menuSearch.trim().toLowerCase();
    if (!query) return navigationCategories;

    return navigationCategories
      .map((cat) => ({
        ...cat,
        items: cat.items.filter(
          (item) =>
            item.title.toLowerCase().includes(query) ||
            (item.category?.toLowerCase().includes(query) ?? false)
        ),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [menuSearch, navigationCategories]);

  const isItemActive = useCallback(
    (href: string) => {
      const route = href.split("?", 1)[0].split("#", 1)[0];
      if (pathname === route) return true;
      if (route === "/dashboard") return false;
      if (route === "/battle" && pathname.startsWith("/battle")) return true;
      if (route === "/college/dashboard" && pathname.startsWith("/college")) return true;
      if (
        route === "/tournament" &&
        (pathname.startsWith("/tournament") || pathname.startsWith("/tournaments"))
      )
        return true;
      return pathname.startsWith(route + "/");
    },
    [pathname]
  );

  return (
    <div
      suppressHydrationWarning
      className="
        flex
        h-screen
        h-[100dvh]
        w-full
        overflow-hidden
        skillbattle-shell
        bg-[#050816]
        text-white
      "
    >
      {/* Desktop Fixed Sidebar */}
      <Sidebar />

      {/* Global Quick Access Search Modal (Ctrl+K) */}
      <QuickAccessModal
        isOpen={quickAccessOpen}
        onClose={() => setQuickAccessOpen(false)}
      />

      {/* Mobile Drawer Backdrop & Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation drawer"
              className="fixed inset-y-0 left-0 z-[90] flex w-full max-w-xs sm:max-w-sm flex-col border-r border-white/10 bg-[#0F172A] p-5 shadow-[0_0_80px_rgba(0,0,0,.8)] md:hidden overflow-hidden"
            >
              {/* Drawer Header: SkillBattle Logo linking to "/" */}
              <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2"
                  title="Go to Home"
                >
                  <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-xl font-black tracking-tight text-transparent">
                    SkillBattle
                  </span>
                  <span className="rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-300">
                    {pathname.startsWith("/college")
                      ? "Institution"
                      : pathname.startsWith("/company")
                      ? "Enterprise"
                      : "Arena"}
                  </span>
                </Link>

                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation drawer"
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Role-Specific Quick Action Shortcuts */}
              <div className="mb-4 grid grid-cols-2 gap-2 shrink-0">
                {pathname.startsWith("/college") ? (
                  <>
                    <Link
                      href="/college/assessments"
                      onClick={() => setMobileMenuOpen(false)}
                      className="group rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 transition hover:border-cyan-400/40"
                    >
                      <Sparkles className="mb-2 text-cyan-300" size={18} />
                      <span className="block text-xs font-bold text-white">Assessments</span>
                      <span className="block text-[10px] text-slate-400">Manage Tests</span>
                    </Link>
                    <Link
                      href="/college/students"
                      onClick={() => setMobileMenuOpen(false)}
                      className="group rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 transition hover:border-violet-400/40"
                    >
                      <Users className="mb-2 text-violet-300" size={18} />
                      <span className="block text-xs font-bold text-white">Students</span>
                      <span className="block text-[10px] text-slate-400">Roster & Batches</span>
                    </Link>
                  </>
                ) : pathname.startsWith("/company") ? (
                  <>
                    <Link
                      href="/company/jobs"
                      onClick={() => setMobileMenuOpen(false)}
                      className="group rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 transition hover:border-violet-400/40"
                    >
                      <Sparkles className="mb-2 text-violet-300" size={18} />
                      <span className="block text-xs font-bold text-white">Jobs</span>
                      <span className="block text-[10px] text-slate-400">Postings</span>
                    </Link>
                    <Link
                      href="/company/candidates"
                      onClick={() => setMobileMenuOpen(false)}
                      className="group rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-3 transition hover:border-cyan-400/40"
                    >
                      <Users className="mb-2 text-cyan-300" size={18} />
                      <span className="block text-xs font-bold text-white">Talent Pool</span>
                      <span className="block text-[10px] text-slate-400">Discover</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/battle"
                      onClick={() => setMobileMenuOpen(false)}
                      className="group rounded-xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-3 transition hover:border-fuchsia-400/40"
                    >
                      <Flame className="mb-2 text-fuchsia-300" size={18} />
                      <span className="block text-xs font-bold text-white">Start Battle</span>
                      <span className="block text-[10px] text-slate-400">Enter Arena</span>
                    </Link>
                    <Link
                      href="/coach"
                      onClick={() => setMobileMenuOpen(false)}
                      className="group rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 transition hover:border-violet-400/40"
                    >
                      <Bot className="mb-2 text-violet-300" size={18} />
                      <span className="block text-xs font-bold text-white">AI Coach</span>
                      <span className="block text-[10px] text-slate-400">Get Advice</span>
                    </Link>
                  </>
                )}
              </div>

              {/* Search Filter */}
              <label className="mb-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-slate-400 focus-within:border-cyan-400/50 shrink-0">
                <Search size={16} />
                <input
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Search features..."
                  aria-label="Filter navigation features"
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </label>

              {/* Navigation Items Categorized */}
              <nav aria-label="Mobile Navigation" className="flex-1 min-h-0 overflow-y-auto space-y-5 pr-1 scrollbar-hide">
                {filteredCategories.map((category) => (
                  <div key={category.id}>
                    <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/80">
                      {category.label}
                    </p>
                    <div className="space-y-1">
                      {category.items.map((item) => {
                        const Icon = item.icon;
                        const active = isItemActive(item.href);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 transition text-xs font-semibold ${
                              active
                                ? "border border-cyan-500/30 bg-cyan-500/15 text-cyan-300 shadow-md shadow-cyan-500/10"
                                : "border border-transparent text-slate-300 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon
                                size={17}
                                className={active ? "text-cyan-400" : "text-slate-400"}
                              />
                              <span>{item.title}</span>
                            </div>
                            <ChevronRight
                              size={14}
                              className={`opacity-40 transition ${
                                active ? "opacity-100 text-cyan-400" : ""
                              }`}
                            />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {filteredCategories.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-xs text-slate-500">
                    No matching feature found.
                  </div>
                )}
              </nav>

              {/* Drawer Footer */}
              <div className="border-t border-white/5 pt-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 shrink-0">
                SkillBattle Platform
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main
        className="
          flex-1
          min-w-0
          h-full
          overflow-y-auto
          overflow-x-hidden
          p-3
          sm:p-8
          px-4
          pb-[calc(6rem+env(safe-area-inset-bottom))]
          md:p-8
          md:pb-8
        "
      >
        <TopNavbar
          onMenuClick={() => setMobileMenuOpen(true)}
          onOpenSearch={() => setQuickAccessOpen(true)}
        />

        <div className="w-full min-w-0">{children}</div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center md:hidden pointer-events-auto">
        <nav
          aria-label="Mobile Bottom Navigation"
          className="skillbattle-mobile-nav flex w-full max-w-lg items-center justify-between rounded-t-2xl border border-white/10 bg-slate-950/95 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_20px_60px_rgba(8,145,178,0.25)] backdrop-blur-xl"
        >
          {[
            {
              title: "Home",
              href: pathname.startsWith("/college")
                ? "/college/dashboard"
                : pathname.startsWith("/company")
                ? "/company/dashboard"
                : "/student/dashboard",
              icon: Home,
            },
            {
              title: pathname.startsWith("/college") ? "Tests" : pathname.startsWith("/company") ? "Jobs" : "Battle",
              href: pathname.startsWith("/college")
                ? "/college/assessments"
                : pathname.startsWith("/company")
                ? "/company/jobs"
                : "/battle",
              icon: Sword,
            },
            {
              title: pathname.startsWith("/college") ? "Students" : pathname.startsWith("/company") ? "Talent" : "Rank",
              href: pathname.startsWith("/college")
                ? "/college/students"
                : pathname.startsWith("/company")
                ? "/company/candidates"
                : "/leaderboard",
              icon: Trophy,
            },
            {
              title: "Social",
              href: "/social",
              icon: Users,
            },
            {
              title: "More",
              href: "#more",
              icon: MoreHorizontal,
            },
          ].map((tab) => {
            const active = tab.title === "More" ? mobileMenuOpen : isItemActive(tab.href);
            const Icon = tab.icon;
            const className = `relative flex flex-1 flex-col items-center justify-center gap-1 rounded-full px-2 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition ${
              active
                ? "bg-gradient-to-b from-cyan-500/25 to-violet-500/20 text-cyan-300 shadow-lg shadow-cyan-500/20"
                : "text-slate-400 hover:text-slate-200"
            }`;

            if (tab.title === "More") {
              return (
                <button
                  key={tab.title}
                  type="button"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Open more menu"
                  className={className}
                >
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