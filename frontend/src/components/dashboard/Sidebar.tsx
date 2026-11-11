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
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { QubiraLogo } from "@/components/brand/QubiraLogo";
import { MOTION_DURATIONS, MOTION_EASINGS } from "@/lib/motion";

interface SidebarProps {
  isMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({ isMobile = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();

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

  const portalBadge = (() => {
    if (portal === "admin") return "SYSTEM";
    if (portal === "college") return "CAMPUS";
    if (portal === "company") return "ENTERPRISE";
    return "STUDENT";
  })();

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

  const avatarUrl = user?.avatar_url || (user as any)?.avatar || null;
  const [avatarError, setAvatarError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

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
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { duration: 0.22, ease: MOTION_EASINGS.command }
        }
        className={`flex flex-col select-none relative ${
          isMobile
            ? "h-full w-full rounded-r-2xl border-r border-[#252525] bg-[#090909] pt-[env(safe-area-inset-top)] text-[#F5F5F5]"
            : "hidden lg:flex m-0 rounded-none border-0 border-r border-[#252525] bg-[#090909] text-[#F5F5F5] shadow-none overflow-hidden"
        }`}
      >
        {/* Top Header / Branding */}
        <div className="relative z-10 flex h-14 shrink-0 items-center justify-between border-b border-[var(--border-subtle)] px-3.5">
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
              className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] p-1 text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--accent-strong)] hover:text-[var(--text-primary)] active:scale-95"
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
              data-drawer-close
              className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] p-1.5 text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
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
                  <div className="px-2.5 pt-1.5 pb-1 text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
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
                            ? "text-[var(--text-primary)] font-bold"
                            : "text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {/* Animated Active Route Indicator Pill */}
                        {active && (
                          <motion.span
                            layoutId="sidebar-active-indicator"
                            className="absolute inset-0 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/40 pointer-events-none"
                            transition={
                              shouldReduceMotion
                                ? { duration: 0 }
                                : { type: "spring", damping: 28, stiffness: 320 }
                            }
                          />
                        )}

                        <Icon
                          size={18}
                          className={`relative z-10 shrink-0 transition-transform duration-150 group-hover:scale-105 ${
                            active
                              ? "text-[var(--accent-strong)]"
                              : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                          }`}
                        />

                        {!effectiveCollapsed && (
                          <span className="relative z-10 flex-1 truncate text-xs">
                            {item.title}
                          </span>
                        )}

                        {active && !effectiveCollapsed && (
                          <span className="relative z-10 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
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
        <div ref={profileRef} className="relative border-t border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            aria-label="User account menu"
            className={`group flex w-full items-center gap-2.5 rounded-xl p-1.5 transition hover:bg-[var(--surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] ${
              effectiveCollapsed ? "justify-center" : "text-left"
            }`}
          >
            {/* Avatar with subtle lime hover ring */}
            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-xs font-bold text-[var(--accent-strong)] transition-all duration-200 group-hover:ring-2 group-hover:ring-[var(--accent)]/40 group-hover:shadow-[0_0_12px_rgba(200,239,114,0.3)]">
              {avatarUrl && !avatarError ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  onError={() => setAvatarError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                userInitials
              )}
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--status-success)] ring-2 ring-[var(--surface-card)]" />
            </div>

            {!effectiveCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-[var(--text-primary)] leading-tight">
                  {displayName}
                </p>
                <p className="truncate text-[10px] text-[var(--text-muted)]">
                  {roleDisplay}
                </p>
              </div>
            )}

            {!effectiveCollapsed && (
              <ChevronDown
                size={13}
                className={`text-[var(--text-muted)] transition-transform duration-200 ${
                  profileOpen ? "rotate-180 text-[var(--accent-strong)]" : ""
                }`}
              />
            )}
          </button>

          {/* Profile Popover / Dropdown Menu */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 4 }}
                transition={{ duration: MOTION_DURATIONS.fast, ease: MOTION_EASINGS.command }}
                role="menu"
                aria-label="User navigation"
                className={`absolute z-50 rounded-2xl border border-[var(--border-default)] bg-[var(--surface-elevated)] p-1.5 shadow-2xl shadow-black/70 backdrop-blur-md ${
                  effectiveCollapsed
                    ? "bottom-2 left-[76px] w-52"
                    : "bottom-full left-2 right-2 mb-2"
                }`}
              >
                <div className="flex items-center gap-2.5 border-b border-[var(--border-subtle)] px-2.5 py-2">
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-xs font-bold text-[var(--accent-strong)]">
                    {avatarUrl && !avatarError ? (
                      <img
                        src={avatarUrl}
                        alt=""
                        onError={() => setAvatarError(true)}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      userInitials
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[var(--text-primary)]">{displayName}</p>
                    <p className="truncate text-[10px] text-[var(--text-muted)]">{user?.email || "Signed In"}</p>
                  </div>
                </div>

                <div className="py-1 text-xs font-medium space-y-0.5">
                  <Link
                    href="/profile"
                    onClick={() => {
                      setProfileOpen(false);
                      onCloseMobile?.();
                    }}
                    role="menuitem"
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition"
                  >
                    <User size={13} className="text-[var(--accent-strong)]" />
                    <span>View Profile</span>
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => {
                      setProfileOpen(false);
                      onCloseMobile?.();
                    }}
                    role="menuitem"
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition"
                  >
                    <Settings size={13} className="text-[var(--accent-secondary)]" />
                    <span>Settings</span>
                  </Link>
                  <Link
                    href="/faq"
                    onClick={() => {
                      setProfileOpen(false);
                      onCloseMobile?.();
                    }}
                    role="menuitem"
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)] hover:text-[var(--text-primary)] transition"
                  >
                    <HelpCircle size={13} className="text-[var(--status-warning)]" />
                    <span>Help & FAQ</span>
                  </Link>
                </div>

                <div className="border-t border-[var(--border-subtle)] pt-1">
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
      <AnimatePresence>
        {effectiveCollapsed && activeTooltip && (
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -6 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -4 }}
            transition={{ duration: 0.12 }}
            role="tooltip"
            className="fixed left-[76px] z-[9999] pointer-events-none -translate-y-1/2 flex items-center gap-2 whitespace-nowrap rounded-xl border border-[var(--border-default)] bg-[var(--surface-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] shadow-2xl shadow-black/80 backdrop-blur-md"
            style={{ top: `${activeTooltip.top}px` }}
          >
            <span>{activeTooltip.title}</span>
            {activeTooltip.badge && (
              <span className="rounded-md bg-[var(--accent)]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[var(--accent-strong)]">
                {activeTooltip.badge}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
