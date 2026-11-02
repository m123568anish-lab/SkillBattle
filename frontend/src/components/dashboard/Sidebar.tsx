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
import { QubiraLogo } from "@/components/brand/QubiraLogo";

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

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<{ title: string; badge?: string; top: number } | null>(null);

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

  const displayName = user?.full_name || user?.username || "Qubira Engineer";
  const userInitials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "QB";

  const roleDisplay = portal === "admin"
    ? "Platform Admin"
    : portal === "college"
      ? "College Admin"
      : portal === "company"
        ? "Recruiter"
        : "Student";

  const effectiveCollapsed = isMobile ? false : isCollapsed;

  return (
    <>
      <motion.aside
        suppressHydrationWarning
        initial={false}
        animate={{ width: isMobile ? "100%" : effectiveCollapsed ? 68 : 232 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={`flex flex-col select-none relative ${
          isMobile
            ? "h-full w-full rounded-r-2xl border-r border-white/10 bg-[#0C1017] text-white"
            : "hidden lg:flex m-0 rounded-none border-0 border-r border-white/[0.08] bg-[#0A0D14] shadow-none overflow-hidden"
        }`}
      >
        {/* Top Header / Branding */}
        <div className="relative z-10 flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] px-3.5">
          <Link
            href={portal === "admin" ? "/admin" : portal === "college" ? "/college/dashboard" : portal === "company" ? "/company/dashboard" : "/dashboard"}
            onClick={onCloseMobile}
            className={`flex items-center gap-2.5 transition-opacity hover:opacity-90 ${effectiveCollapsed ? "mx-auto" : ""}`}
            title="Qubira — Learn. Build. Compete."
          >
            <QubiraLogo
              variant={effectiveCollapsed ? "icon" : "full"}
              size={effectiveCollapsed ? "md" : "sm"}
              portalBadge={portalBadge}
            />
          </Link>

          {/* Desktop Collapse / Expand Button */}
          {!isMobile && (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={effectiveCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
              title={effectiveCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)"}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-1 text-slate-400 transition hover:border-cyan-400/40 hover:bg-cyan-400/10 hover:text-cyan-300 focus-visible:outline-none"
            >
              {effectiveCollapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
            </button>
          )}

          {/* Mobile Close Button */}
          {isMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation"
              className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-slate-300 transition hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Scrollable Navigation Body */}
        <nav
          aria-label="Main Navigation"
          className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden p-2.5 space-y-4 scrollbar-thin scrollbar-thumb-white/10"
        >
          {portalCategories.map((category) => {
            return (
              <div key={category.id} className="space-y-1">
                {/* Minimal Section Label (Expanded mode only) */}
                {!effectiveCollapsed && portalCategories.length > 1 && (
                  <div className="px-2.5 pt-1.5 pb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    {category.label}
                  </div>
                )}

                <div className="space-y-0.5">
                  {category.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    if (!item.available || !item.href) return null;

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
                        aria-label={item.title}
                        aria-current={active ? "page" : undefined}
                        className={`group relative flex h-11 items-center gap-3 rounded-xl px-2.5 text-xs font-semibold transition-all duration-150 ${
                          effectiveCollapsed ? "justify-center" : ""
                        } ${
                          active
                            ? "bg-cyan-500/15 text-cyan-200 border border-cyan-400/30 font-bold shadow-sm shadow-cyan-500/10"
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

                        {active && !effectiveCollapsed && (
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer: User Profile Block with Account Menu */}
        <div ref={profileRef} className="relative border-t border-white/[0.06] p-2 bg-black/20">
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            aria-label="User account menu"
            className={`flex w-full items-center gap-2.5 rounded-xl p-1.5 transition hover:bg-white/[0.06] focus-visible:outline-none ${
              effectiveCollapsed ? "justify-center" : "text-left"
            }`}
          >
            {/* Avatar */}
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 text-xs font-bold text-cyan-300">
              {userInitials}
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-[#0A0D14]" />
            </div>

            {!effectiveCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white leading-tight">
                  {displayName}
                </p>
                <p className="truncate text-[10px] text-slate-400">
                  {roleDisplay}
                </p>
              </div>
            )}

            {!effectiveCollapsed && (
              <ChevronDown
                size={13}
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
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                role="menu"
                aria-label="User options"
                className={`absolute z-50 rounded-2xl border border-white/10 bg-[#0c1222] p-1.5 shadow-2xl shadow-black/80 backdrop-blur-xl ${
                  effectiveCollapsed
                    ? "left-[calc(100%+8px)] bottom-2 w-52"
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
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-300 hover:bg-white/5 hover:text-white transition"
                  >
                    <User size={13} className="text-cyan-400" />
                    <span>View Profile</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => {
                      setProfileOpen(false);
                      onCloseMobile?.();
                    }}
                    role="menuitem"
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-300 hover:bg-white/5 hover:text-white transition"
                  >
                    <Settings size={13} className="text-violet-400" />
                    <span>Settings</span>
                  </Link>
                  <Link
                    href="/faq"
                    onClick={() => {
                      setProfileOpen(false);
                      onCloseMobile?.();
                    }}
                    role="menuitem"
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-slate-300 hover:bg-white/5 hover:text-white transition"
                  >
                    <HelpCircle size={13} className="text-amber-400" />
                    <span>Help & FAQ</span>
                  </Link>
                </div>

                <div className="border-t border-white/[0.08] pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    role="menuitem"
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition"
                  >
                    <LogOut size={13} />
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
          className="fixed left-[80px] z-[9999] pointer-events-none -translate-y-1/2 flex items-center gap-2 whitespace-nowrap rounded-lg border border-white/15 bg-slate-900/95 px-2.5 py-1 text-xs font-semibold text-white shadow-2xl shadow-black backdrop-blur-md"
          style={{ top: `${activeTooltip.top}px` }}
        >
          <span>{activeTooltip.title}</span>
        </div>
      )}
    </>
  );
}
