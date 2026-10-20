"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import {
  Trophy,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Shield,
  Building2,
  BriefcaseBusiness,
  User,
  Settings,
  HelpCircle,
  LogOut,
  X,
  Flame,
  Users,
} from "lucide-react";
import { getPortalCategories, getPortalKind } from "@/data/dashboard";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";

interface SidebarProps {
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ isMobile = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const portal = getPortalKind(pathname);
  const portalCategories = getPortalCategories(portal);
  const categories = isMobile && portal === "student"
    ? [
        ...portalCategories.filter((category) => category.id !== "career"),
        {
          id: "career",
          label: "Grow Your Career",
          items: portalCategories.find((category) => category.id === "career")?.items.filter((item) => item.href !== "/opportunities") ?? [],
        },
        {
          id: "opportunities",
          label: "Opportunities",
          items: [
            { title: "Discover Opportunities", href: "/opportunities", icon: BriefcaseBusiness, category: "Opportunities", available: true },
            { title: "Saved Opportunities", href: "/opportunities/saved", icon: BriefcaseBusiness, category: "Opportunities", available: true },
            { title: "My Applications", href: "/opportunities/applications", icon: BriefcaseBusiness, category: "Opportunities", available: true },
          ],
        },
      ]
    : portalCategories;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [dismissQuickAction, setDismissQuickAction] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<{ title: string; badge?: string; top: number } | null>(null);

  // Category collapsed state: allow users to fold/unfold category sections
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  const profileRef = useRef<HTMLDivElement>(null);

  // LocalStorage persistence for sidebar collapsed preference
  useEffect(() => {
    if (!isMobile && typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("skillbattle_sidebar_collapsed");
        if (saved !== null) {
          setIsCollapsed(saved === "true");
        }
      } catch {}
    }
  }, [isMobile]);

  const toggleCollapsed = () => {
    if (isMobile) return;
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("skillbattle_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
    setProfileOpen(false);
    setActiveTooltip(null);
  };

  // Keyboard shortcut: Ctrl+B / Cmd+B toggles sidebar
  useEffect(() => {
    if (isMobile) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobile]);

  // Close profile dropdown on outside click or Escape
  useEffect(() => {
    if (!profileOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen]);

  // Intelligent active route detection
  const isActive = (href?: string) => {
    if (!href) return false;
    const [targetPath, query = ""] = href.split("?");
    const normalizedPath = pathname || "/";

    if (
      targetPath === "/dashboard" ||
      targetPath === "/college/dashboard" ||
      targetPath === "/company/dashboard" ||
      targetPath === "/admin"
    ) {
      if (query) {
        if (normalizedPath !== targetPath) return false;
        const targetParams = new URLSearchParams(query);
        return Array.from(targetParams.entries()).every(
          ([key, val]) => searchParams.get(key) === val
        );
      }
      if (searchParams.get("view") || searchParams.get("tab")) return false;
      return normalizedPath === targetPath;
    }

    if (query) {
      if (normalizedPath !== targetPath) return false;
      const targetParams = new URLSearchParams(query);
      return Array.from(targetParams.entries()).every(
        ([key, val]) => searchParams.get(key) === val
      );
    }

    return normalizedPath === targetPath || normalizedPath.startsWith(`${targetPath}/`);
  };

  const BrandIcon = (() => {
    if (portal === "admin") return Shield;
    if (portal === "college") return Building2;
    if (portal === "company") return BriefcaseBusiness;
    return Trophy;
  })();

  const portalLabel = (() => {
    if (portal === "admin") return "Admin Suite";
    if (portal === "college") return "College Portal";
    if (portal === "company") return "Hiring Suite";
    return "Arena";
  })();

  const portalBadge = (() => {
    if (portal === "admin") return "SYSTEM";
    if (portal === "college") return "CAMPUS";
    if (portal === "company") return "ENTERPRISE";
    return "STUDENT";
  })();

  // Handle Logout safely
  const handleLogout = async () => {
    setProfileOpen(false);
    onCloseMobile?.();
    try {
      await logout();
    } finally {
      router.push("/login");
    }
  };

  const displayName = user?.full_name || user?.username || "SkillBattle Player";
  const userInitials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "SB";

  const roleDisplay = portal === "admin"
    ? "Platform Admin"
    : portal === "college"
      ? "College Admin"
      : portal === "company"
        ? "Recruiter"
        : "Student";

  // Contextual Quick Action data
  const quickAction = (() => {
    if (portal === "student") {
      return {
        icon: Flame,
        title: "Daily Quest Ready",
        subtitle: "Climb the Skill Quest map & earn XP",
        cta: "Play Quest",
        href: "/campaign",
      };
    }
    if (portal === "college") {
      return {
        icon: Users,
        title: "Student Assessments",
        subtitle: "Monitor active test batches",
        cta: "Open Tests",
        href: "/college/dashboard?view=assessments",
      };
    }
    if (portal === "company") {
      return {
        icon: BriefcaseBusiness,
        title: "Talent Discovery",
        subtitle: "Review AI-screened candidate ranks",
        cta: "Discover Candidates",
        href: "/company/dashboard?view=discover",
      };
    }
    return {
      icon: Shield,
      title: "System Operations",
      subtitle: "Inspect server health metrics",
      cta: "Server Health",
      href: "/admin?tab=server",
    };
  })();

  const effectiveCollapsed = isMobile ? false : isCollapsed;

  return (
    <>
      <motion.aside
        suppressHydrationWarning
        initial={false}
        animate={{ width: isMobile ? "100%" : effectiveCollapsed ? 76 : 248 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className={`flex flex-col select-none relative ${
          isMobile
            ? "h-full w-full rounded-r-[1.5rem] border-r border-white/10 bg-[#101216] text-white"
            : "hidden lg:flex m-0 rounded-none border-0 border-r border-white/[0.07] bg-[#0d0f13] shadow-none overflow-hidden"
        }`}
      >
        {/* Subtle Ambient Lighting */}
        <div className="pointer-events-none absolute -top-20 -left-20 h-44 w-44 rounded-full bg-cyan-500/[0.07] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-44 w-44 rounded-full bg-violet-500/[0.07] blur-3xl" />

        {/* Top Header / Branding */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/[0.06] px-4 py-5 sm:px-5">
          <Link
            href={portal === "admin" ? "/admin" : portal === "college" ? "/college/dashboard" : portal === "company" ? "/company/dashboard" : "/dashboard"}
            onClick={onCloseMobile}
            className={`flex items-center gap-3 transition-opacity hover:opacity-90 ${effectiveCollapsed ? "mx-auto" : ""}`}
            title="SkillBattle AI"
          >
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-400/[0.08] text-cyan-300">
              <BrandIcon size={20} className="text-cyan-400" />
            </div>

            {!effectiveCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-black tracking-tight text-white">
                    Skill<span className="text-cyan-400">Battle</span>
                  </span>
                  <span className="rounded-md bg-cyan-400/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-cyan-300 border border-cyan-400/20">
                    {portalBadge}
                  </span>
                </div>
                <p className="truncate text-[11px] font-medium text-slate-400">
                  {portalLabel}
                </p>
              </div>
            )}
          </Link>

          {/* Desktop Collapse / Expand Button */}
          {!isMobile && (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={effectiveCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
              title={effectiveCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-slate-400 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              {effectiveCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          )}

          {/* Mobile Close Button */}
          {isMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation"
              data-drawer-close
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Body */}
        <nav
          aria-label="Main Navigation"
          className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 scrollbar-thin scrollbar-thumb-white/10"
        >
          <div className="space-y-4">
            {categories.map((category) => {
              const isGroupCollapsed = Boolean(collapsedCategories[category.id]);
              const hasActiveChild = category.items.some((i) => isActive(i.href));

              return (
                <div key={category.id} className="space-y-1">
                  {/* Category Header (Expanded mode only) */}
                  {!effectiveCollapsed && (
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedCategories((prev) => ({
                          ...prev,
                          [category.id]: !prev[category.id],
                        }))
                      }
                      className="flex w-full items-center justify-between px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400 transition hover:text-slate-200"
                      aria-expanded={!isGroupCollapsed}
                    >
                      <span>{category.label}</span>
                      <ChevronDown
                        size={12}
                        className={`transition-transform duration-200 ${
                          isGroupCollapsed && !hasActiveChild ? "-rotate-90 text-slate-600" : "text-slate-500"
                        }`}
                      />
                    </button>
                  )}

                  {/* Category Items */}
                  {(!isGroupCollapsed || hasActiveChild || effectiveCollapsed) && (
                    <div className="space-y-0.5">
                      {category.items.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);

                        if (!item.available || !item.href) {
                          return (
                            <div
                              key={item.title}
                              aria-disabled="true"
                              className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 cursor-not-allowed"
                            >
                              <Icon size={18} className="shrink-0 text-slate-600" />
                              {!effectiveCollapsed && (
                                <span className="flex-1 truncate">{item.title}</span>
                              )}
                              {!effectiveCollapsed && (
                                <span className="rounded bg-white/[0.04] px-1 py-0.5 text-[8px] uppercase tracking-wider text-slate-600">
                                  Soon
                                </span>
                              )}
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={item.title}
                            href={item.href}
                            onClick={() => {
                              setActiveTooltip(null);
                              onCloseMobile?.();
                            }}
                            onMouseEnter={(e) => {
                              if (effectiveCollapsed) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setActiveTooltip({
                                  title: item.title,
                                  badge: item.badge,
                                  top: rect.top + rect.height / 2,
                                });
                              }
                            }}
                            onMouseLeave={() => setActiveTooltip(null)}
                            onFocus={(e) => {
                              if (effectiveCollapsed) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setActiveTooltip({
                                  title: item.title,
                                  badge: item.badge,
                                  top: rect.top + rect.height / 2,
                                });
                              }
                            }}
                            onBlur={() => setActiveTooltip(null)}
                            aria-label={item.title}
                            aria-current={active ? "page" : undefined}
                            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                              effectiveCollapsed ? "justify-center" : ""
                            } ${
                              active
                                ? "bg-gradient-to-r from-cyan-500/15 to-violet-500/10 text-cyan-200 border border-cyan-400/25 shadow-sm shadow-cyan-500/10 font-bold"
                                : "text-slate-400 hover:bg-white/[0.05] hover:text-slate-100 border border-transparent"
                            }`}
                          >
                            <Icon
                              size={18}
                              className={`shrink-0 transition-transform group-hover:scale-105 ${
                                active ? "text-cyan-400" : "text-slate-400 group-hover:text-slate-200"
                              }`}
                            />

                            {!effectiveCollapsed && (
                              <span className="flex-1 truncate text-xs">
                                {item.title}
                              </span>
                            )}

                            {!effectiveCollapsed && item.badge && (
                              <span
                                className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                  item.badge === "Live"
                                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse"
                                    : item.badge === "Quest"
                                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                      : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}

                            {active && !effectiveCollapsed && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Contextual Quick Action Panel (Expanded mode only) */}
          {portal !== "student" && !effectiveCollapsed && !dismissQuickAction && (
            <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/10 to-violet-500/5 p-3.5 relative">
              <button
                type="button"
                onClick={() => setDismissQuickAction(true)}
                aria-label="Dismiss quick action"
                className="absolute top-2 right-2 rounded p-1 text-slate-500 hover:text-slate-300"
              >
                <X size={12} />
              </button>
              <div className="flex items-start gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300">
                  <quickAction.icon size={15} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-white">{quickAction.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">{quickAction.subtitle}</p>
                  <Link
                    href={quickAction.href}
                    onClick={onCloseMobile}
                    className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-400 to-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 transition hover:brightness-110"
                  >
                    <span>{quickAction.cta}</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Footer: User Profile Block with Account Menu */}
        <div ref={profileRef} className="relative border-t border-white/[0.06] p-2.5 sm:p-3 bg-black/20">
          {/* User Profile Card Button */}
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            aria-label="User account menu"
            className={`flex w-full items-center gap-3 rounded-xl p-2 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
              effectiveCollapsed ? "justify-center" : "text-left"
            }`}
          >
            {/* Avatar */}
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-fuchsia-500/20 border border-cyan-400/30 text-xs font-bold text-cyan-300 shadow-sm shadow-cyan-500/20">
              {userInitials}
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-[#080d19]" />
            </div>

            {!effectiveCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white leading-tight">
                  {displayName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="rounded bg-cyan-500/15 px-1.5 py-0.2 text-[9px] font-bold text-cyan-300">
                    Lvl {user?.level ?? 1}
                  </span>
                  <span className="truncate text-[10px] text-slate-400">
                    {roleDisplay}
                  </span>
                </div>
              </div>
            )}

            {!effectiveCollapsed && (
              <ChevronDown
                size={14}
                className={`text-slate-400 transition-transform duration-200 ${
                  profileOpen ? "rotate-180 text-cyan-400" : ""
                }`}
              />
            )}
          </button>

          {/* Interactive Account Dropdown Popover */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.95 }}
                transition={{ duration: 0.16 }}
                role="menu"
                aria-label="User options"
                className={`absolute z-50 rounded-2xl border border-white/10 bg-[#0c1222] p-2 shadow-2xl shadow-black/80 backdrop-blur-xl ${
                  effectiveCollapsed
                    ? "left-[calc(100%+10px)] bottom-2 w-56"
                    : "left-2 right-2 bottom-[calc(100%+8px)]"
                }`}
              >
                <div className="border-b border-white/[0.08] px-3 py-2">
                  <p className="truncate text-xs font-bold text-white">{displayName}</p>
                  <p className="truncate text-[10px] text-slate-400">{user?.email || "Signed in"}</p>
                </div>

                <div className="py-1 space-y-0.5 text-xs">
                  <Link
                    href="/profile"
                    onClick={() => {
                      setProfileOpen(false);
                      onCloseMobile?.();
                    }}
                    role="menuitem"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-white transition"
                  >
                    <User size={14} className="text-cyan-400" />
                    <span>View Profile</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => {
                      setProfileOpen(false);
                      onCloseMobile?.();
                    }}
                    role="menuitem"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-white transition"
                  >
                    <Settings size={14} className="text-violet-400" />
                    <span>Settings</span>
                  </Link>
                  <Link
                    href="/faq"
                    onClick={() => {
                      setProfileOpen(false);
                      onCloseMobile?.();
                    }}
                    role="menuitem"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5 hover:text-white transition"
                  >
                    <HelpCircle size={14} className="text-amber-400" />
                    <span>Help & FAQ</span>
                  </Link>
                </div>

                <div className="border-t border-white/[0.08] pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition"
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Floating Unclipped Tooltip for Collapsed Sidebar */}
      {effectiveCollapsed && activeTooltip && (
        <div
          role="tooltip"
          className="fixed left-[92px] z-[9999] pointer-events-none -translate-y-1/2 flex items-center gap-2 whitespace-nowrap rounded-lg border border-white/15 bg-slate-900/95 px-3 py-1.5 text-xs font-semibold text-white shadow-2xl shadow-black backdrop-blur-md"
          style={{ top: `${activeTooltip.top}px` }}
        >
          <span>{activeTooltip.title}</span>
          {activeTooltip.badge && (
            <span className="rounded bg-cyan-400/20 px-1.5 py-0.5 text-[9px] font-bold text-cyan-300 border border-cyan-400/30">
              {activeTooltip.badge}
            </span>
          )}
        </div>
      )}
    </>
  );
}
