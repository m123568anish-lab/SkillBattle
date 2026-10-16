"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, ChevronLeft, ChevronRight, Zap, PlusCircle, Briefcase } from "lucide-react";
import {
  studentSidebarCategories,
  collegeSidebarCategories,
  companySidebarCategories,
} from "@/data/dashboard";
import { useAuthStore } from "@/store/authStore";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const role = (user?.role || "user").toLowerCase();
  const isCollegePath = pathname.startsWith("/college");
  const isCompanyPath = pathname.startsWith("/company");

  let categories = studentSidebarCategories;
  let badgeTitle = "Arena";
  let quickActionIcon = Zap;
  let quickActionLabel = "Start Battle";
  let quickActionHref = "/battle";

  if (isCollegePath || ["college", "college_admin", "placement_officer", "faculty"].includes(role)) {
    categories = collegeSidebarCategories;
    badgeTitle = "Institution";
    quickActionIcon = PlusCircle;
    quickActionLabel = "Create Assessment";
    quickActionHref = "/college/assessments/new";
  } else if (isCompanyPath || ["company", "company_admin", "recruiter"].includes(role)) {
    categories = companySidebarCategories;
    badgeTitle = "Enterprise";
    quickActionIcon = Briefcase;
    quickActionLabel = "Create Job";
    quickActionHref = "/company/jobs";
  }

  const isItemActive = (href: string) => {
    if (pathname === href) return true;
    if (href === "/student/dashboard" && pathname === "/student/dashboard") return true;
    if (href === "/college/dashboard" && pathname === "/college/dashboard") return true;
    if (href === "/company/dashboard" && pathname === "/company/dashboard") return true;
    if (href === "/battle" && pathname.startsWith("/battle")) return true;
    if (href === "/tournament" && (pathname.startsWith("/tournament") || pathname.startsWith("/tournaments"))) return true;
    return pathname.startsWith(href + "/");
  };

  const QuickActionIcon = quickActionIcon;
  const visibleCategories = useMemo(() => categories.filter((category) => category.items.length > 0), [categories]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <motion.aside
      suppressHydrationWarning
      initial={false}
      animate={{ width: isCollapsed ? 88 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="hidden md:flex flex-col flex-shrink-0 m-4 mr-0 h-[calc(100vh-2rem)] h-[calc(100dvh-2rem)] rounded-2xl border border-white/10 bg-[#091120]/95 backdrop-blur-2xl shadow-2xl shadow-black/50 relative overflow-hidden z-30"
    >
      {/* Aurora Ambient Light */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-48 w-48 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />

      {/* Collapse Button */}
      <button
        suppressHydrationWarning
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="absolute right-3 top-5 z-20 rounded-lg border border-white/10 bg-[#101b31] p-1.5 text-slate-400 hover:text-cyan-300 hover:border-cyan-400/40 transition"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Header with Logo */}
      <Link
        href="/"
        className="flex items-center gap-3 border-b border-white/10 p-5 relative z-10 flex-shrink-0 group cursor-pointer transition hover:opacity-90"
        title="Go to Home"
      >
        <div className="rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 p-3 border border-cyan-500/30 shadow-lg shadow-cyan-500/5 flex-shrink-0 group-hover:border-cyan-400/50 transition">
          <Trophy className="text-cyan-300" size={22} />
        </div>

        {!isCollapsed && (
          <motion.div
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <h2 className="text-lg font-black bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">
              SkillBattle
            </h2>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-500/70">
              {badgeTitle}
            </p>
          </motion.div>
        )}
      </Link>

      {/* Navigation */}
      <nav aria-label="Main Navigation" className="flex-1 min-h-0 overflow-y-auto relative z-10 scrollbar-hide">
        <div className="p-3 space-y-4">
          {visibleCategories.map((category) => (
            <div key={category.id}>
              {!isCollapsed && category.items.length > 0 && (
                <motion.h3
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500"
                >
                  {category.label}
                </motion.h3>
              )}
              <div className="space-y-1.5 mt-2">
                {category.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.href);

                  const content = (
                    <motion.div
                      suppressHydrationWarning
                      whileHover={{ x: isCollapsed ? 0 : 3 }}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 relative overflow-hidden group ${
                        active
                          ? "bg-cyan-400/12 text-cyan-200 border border-cyan-400/25 shadow-lg shadow-cyan-500/5"
                          : "text-slate-400 border border-transparent hover:text-slate-100 hover:bg-white/5"
                      }`}
                    >
                      {active && <span className="absolute left-0 h-5 w-0.5 rounded-r bg-cyan-300" />}
                      <Icon size={18} className={`flex-shrink-0 ${active ? "text-cyan-300" : "group-hover:text-slate-200"}`} />
                      {!isCollapsed && <span className="font-semibold text-sm whitespace-nowrap flex-1">{item.title}</span>}
                      {active && !isCollapsed && <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />}
                    </motion.div>
                  );
                  return item.action === "logout" ? (
                    <button key={item.href} onClick={handleLogout} title={isCollapsed ? item.title : undefined} className="block w-full text-left">{content}</button>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block relative group"
                      title={isCollapsed ? item.title : undefined}
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer - Role Quick Action */}
      {!isCollapsed && (
        <div className="border-t border-white/5 p-4 relative z-10 flex-shrink-0">
          <Link href={quickActionHref}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500/80 to-violet-500/80 px-4 py-2.5 font-bold text-sm text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition duration-200"
            >
              <QuickActionIcon size={16} />
              {quickActionLabel}
            </motion.button>
          </Link>
        </div>
      )}
    </motion.aside>
  );
}
