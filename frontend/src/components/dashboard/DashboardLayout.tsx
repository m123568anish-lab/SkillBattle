"use client";

import { useMemo, useState } from "react";
import Sidebar from "./Sidebar";
import TopNavbar from "./TopNavbar";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getMobileNavigation, getPortalCategories, getPortalKind } from "@/data/dashboard";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface Props {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const portal = getPortalKind(pathname);
  const categories = getPortalCategories(portal);
  const mobileNavigation = getMobileNavigation(portal);

  const quickAccessGroups = useMemo(() => {
    if (portal === "student") {
      return [
        {
          title: "Learn",
          items: [
            { label: "Practice", href: "/battle" },
            { label: "Career Roadmap", href: "/career/roadmap" },
            { label: "AI Coach", href: "/coach" },
            { label: "Mock Interview", href: "/interview" },
          ],
        },
        {
          title: "Compete",
          items: [
            { label: "Tournaments", href: "/tournament" },
            { label: "Leaderboard", href: "/leaderboard" },
            { label: "Achievements", href: "/achievements" },
          ],
        },
        {
          title: "Career",
          items: [
            { label: "Opportunities", href: "/opportunities" },
            { label: "Placement", href: "/placement" },
            { label: "Resume", href: "/career/resume" },
            { label: "Skill Profile", href: "/profile" },
          ],
        },
        {
          title: "Personal",
          items: [
            { label: "Calendar", href: "/calendar" },
            { label: "Profile", href: "/profile" },
            { label: "Settings", href: "/settings" },
          ],
        },
      ];
    }

    if (portal === "college") {
      return [
        {
          title: "Workspaces",
          items: [
            { label: "Students", href: "/college/dashboard?view=students" },
            { label: "Assessments", href: "/college/dashboard?view=assessments" },
            { label: "Placement", href: "/placement" },
            { label: "Analytics", href: "/college/dashboard?view=analytics" },
          ],
        },
        {
          title: "Organization",
          items: [
            { label: "College Profile", href: "/organization-setup" },
            { label: "Settings", href: "/settings" },
          ],
        },
      ];
    }

    if (portal === "company") {
      return [
        {
          title: "Talent",
          items: [
            { label: "Jobs", href: "/company/dashboard?view=jobs" },
            { label: "Candidates", href: "/company/dashboard?view=candidates" },
            { label: "Interviews", href: "/company/dashboard?view=interviews" },
            { label: "Analytics", href: "/company/dashboard?view=analytics" },
          ],
        },
        {
          title: "Company",
          items: [
            { label: "Company Profile", href: "/organization-setup" },
            { label: "Settings", href: "/settings" },
          ],
        },
      ];
    }

    return [
      {
        title: "Administration",
        items: [
          { label: "Users", href: "/admin?tab=users" },
          { label: "Organizations", href: "/admin?tab=organizations" },
          { label: "Security", href: "/admin?tab=security" },
        ],
      },
      {
        title: "Account",
        items: [
          { label: "Profile", href: "/profile" },
          { label: "Settings", href: "/settings" },
        ],
      },
    ];
  }, [portal]);

  const isActive = (href?: string) => {
    if (!href) return false;
    const [targetPath, query = ""] = href.split("?");
    if (pathname !== targetPath) return false;
    const targetParams = new URLSearchParams(query);
    if (targetParams.get("view") !== searchParams.get("view")) return false;
    return Array.from(targetParams.entries()).every(([key, value]) => searchParams.get(key) === value);
  };

  return (
    <main suppressHydrationWarning className="flex min-h-screen bg-[#050816] text-white">
      <Sidebar />

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 top-0 z-50 w-72 bg-[#070B14] p-6 border-r border-white/10 lg:hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-white/5 pb-6">
                  <span className="text-xl font-black bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
                    SkillBattle
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg border border-white/10 p-1 text-slate-400 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
                <nav className="mt-6 max-h-[calc(100dvh-9rem)] space-y-1.5 overflow-y-auto">
                  {categories.flatMap((category) => category.items).map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    if (!item.available || !item.href) {
                      return (
                        <div key={item.title} aria-disabled="true" className="flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm text-slate-600">
                          <Icon size={18} />
                          <span className="flex-1">{item.title}</span>
                          <span className="text-[9px] uppercase">Unavailable</span>
                        </div>
                      );
                    }
                    return (
                      <Link
                        key={item.title}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                          active
                            ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <Icon size={18} />
                        {item.title}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close quick access"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
              className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 24, stiffness: 220 }}
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-xl rounded-t-[28px] border border-white/10 bg-[#070B14] p-5 shadow-2xl shadow-black/60 lg:hidden"
            >
              <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/15" />
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-black text-white">Quick access</h2>
                <button
                  type="button"
                  aria-label="Close quick access"
                  onClick={() => setMoreOpen(false)}
                  className="rounded-full border border-white/10 p-2 text-slate-300"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="space-y-5">
                {quickAccessGroups.map((group) => (
                  <div key={group.title}>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">{group.title}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {group.items.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setMoreOpen(false)}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-200 transition hover:border-cyan-500/30 hover:bg-cyan-500/5"
                        >
                          <span>{item.label}</span>
                          <span className="text-cyan-300">→</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <section className="flex-1 overflow-auto p-4 pb-24 sm:p-8 lg:pb-8">
        <TopNavbar onMenuClick={() => setMobileMenuOpen(true)} />
        {children}
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-[#070B14]/90 p-3 backdrop-blur-lg lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-around gap-2">
          {mobileNavigation.map((tab) => {
            const active = isActive(tab.href);
            if (!tab.available || !tab.href) {
              return (
                <button
                  key={tab.title}
                  type="button"
                  aria-label={tab.title}
                  onClick={() => setMoreOpen(true)}
                  className="flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400"
                >
                  <tab.icon size={20} />
                  <span>{tab.title}</span>
                </button>
              );
            }
            return (
              <Link
                key={tab.title}
                href={tab.href}
                className={`flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold tracking-[0.12em] uppercase transition ${
                  active ? "scale-105 text-cyan-400" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <tab.icon size={20} />
                <span>{tab.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
