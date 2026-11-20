"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  ChevronRight,
  Code2,
  Compass,
  Flame,
  LockKeyhole,
  LogOut,
  Settings,
  ShieldCheck,
  Swords,
  Trophy,
  User,
  Zap,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useDashboardStore } from "@/store/dashboardStore";
import { getPortalKind } from "@/data/dashboard";
import { formatDashboardNumber } from "@/lib/dashboard-data.mjs";

export default function ProfileMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const portal = getPortalKind(pathname);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const dashboard = useDashboardStore((s) => s.dashboard);
  const dashboardLoading = useDashboardStore((s) => s.loading);
  const loadDashboard = useDashboardStore((s) => s.loadDashboard);

  // Reconcile dashboard telemetry if not yet loaded in store
  useEffect(() => {
    if (user?.id && !dashboard && !dashboardLoading) {
      void loadDashboard(user.id);
    }
  }, [user?.id, dashboard, dashboardLoading, loadDashboard]);

  const dashboardStats = dashboard?.stats;
  const statsAvailable = Boolean(dashboardStats);

  const displayName = user?.full_name || user?.username || "Learner";
  const username = user?.username ? `@${user.username}` : user?.email || "Account";
  const email = user?.email || "";
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "QB";
  const avatarUrl = user?.avatar_url || user?.avatar || null;

  // Real backend metrics (no fake fallbacks)
  const level = dashboardStats?.level ?? user?.level ?? 1;
  const xp = dashboardStats?.xp;
  const xpToNext = dashboardStats?.xp_to_next_level;
  const progressPercent = dashboardStats?.level_progress_percent;
  const streak = dashboardStats?.streak;
  const rating = dashboardStats?.rating;

  useEffect(() => {
    setAvatarError(false);
  }, [avatarUrl]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  const menuSections = useMemo(() => {
    const role = (user?.role || user?.account_type || "student").toLowerCase();
    const isAdmin = Boolean(user?.is_superuser || role.includes("admin"));
    const isCollege = role.includes("college");
    const isCompany = role.includes("company");

    const primaryLinks = [
      {
        label: "Profile & Identity",
        description: "Public portfolio, bio & education",
        href: "/profile",
        icon: User,
        highlight: false,
      },
      {
        label: "Learning Roadmap",
        description: "Placement readiness curriculum",
        href: "/career/roadmap",
        icon: Compass,
        highlight: true,
      },
      {
        label: "Achievements",
        description: "Earned badges, ranks & XP honors",
        href: "/achievements",
        icon: Trophy,
        highlight: false,
      },
    ];

    const practiceLinks = [
      {
        label: "Battle Arena",
        description: "Solo duels & multiplayer coding",
        href: "/battle",
        icon: Swords,
      },
      {
        label: "Practice Problems",
        description: "Curated DSA & placement questions",
        href: "/tasks",
        icon: Code2,
      },
    ];

    const preferencesLinks = [
      {
        label: "Account Settings",
        description: "Preferences, email & password",
        href: "/settings",
        icon: Settings,
      },
      {
        label: "Notifications",
        description: "Recent alerts & activity updates",
        href: "/activity",
        icon: Bell,
      },
    ];

    const adminLinks = [];
    if (isCollege) {
      adminLinks.push({
        label: "College Portal",
        description: "Campus cohort analytics & students",
        href: "/college/dashboard",
        icon: Building2,
      });
    }
    if (isCompany) {
      adminLinks.push({
        label: "Company Portal",
        description: "Hiring campaigns & job talent",
        href: "/company/dashboard",
        icon: BriefcaseBusiness,
      });
    }
    if (isAdmin) {
      adminLinks.push({
        label: "Admin Command Center",
        description: "Platform controls, SEO & metrics",
        href: "/admin",
        icon: ShieldCheck,
      });
      adminLinks.push({
        label: "Security & Audits",
        description: "Access logs and permission matrix",
        href: "/admin?tab=security",
        icon: LockKeyhole,
      });
    }

    return {
      primaryLinks,
      practiceLinks,
      preferencesLinks,
      adminLinks,
    };
  }, [user]);

  async function handleLogout() {
    setIsMenuOpen(false);
    try {
      await logout();
    } finally {
      router.push("/login");
    }
  }

  const handleNavigate = (href: string) => {
    setIsMenuOpen(false);
    router.push(href);
  };

  if (!isAuthenticated) return null;

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        suppressHydrationWarning
        aria-label="Open user profile menu"
        aria-expanded={isMenuOpen}
        aria-haspopup="dialog"
        onClick={() => setIsMenuOpen((open) => !open)}
        className={`group relative flex h-11 shrink-0 items-center gap-2.5 rounded-xl border px-2 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] max-[359px]:h-9 max-[359px]:w-9 max-[359px]:px-1 sm:h-10 sm:px-2.5 md:px-3.5 ${
          isMenuOpen
            ? "border-[var(--accent)] bg-[var(--surface-elevated)] shadow-[0_0_16px_rgba(216,255,62,0.2)]"
            : "border-[var(--border-default)] bg-[var(--surface-card)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-elevated)]"
        }`}
      >
        {/* Avatar with Status Dot */}
        <div className="relative shrink-0">
          {avatarUrl && !avatarError ? (
            <Image
              src={avatarUrl}
              alt={`${displayName} avatar`}
              width={34}
              height={34}
              unoptimized
              onError={() => setAvatarError(true)}
              className="relative h-7 w-7 rounded-lg border border-[var(--accent)]/30 object-cover sm:h-8 sm:w-8"
            />
          ) : (
            <div className="relative grid h-7 w-7 place-items-center rounded-lg border border-[var(--accent)]/20 bg-[var(--surface-elevated)] font-mono text-[11px] font-black text-[var(--accent-strong)] sm:h-8 sm:w-8 sm:text-xs">
              {initials}
            </div>
          )}
          {/* Active Status Pill */}
          <span
            aria-hidden="true"
            className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface-card)] bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
          />
        </div>

        {/* User Info (hidden on compact mobile) */}
        <div className="hidden text-left md:block">
          <div className="flex items-center gap-1.5">
            <p className="max-w-[120px] truncate text-xs font-bold leading-tight text-[var(--text-primary)]">
              {displayName}
            </p>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-[var(--accent-strong)] bg-[var(--accent)]/10 border border-[var(--accent)]/20">
              Lvl {level}
            </span>
            <span className="truncate text-[10px] text-[var(--text-muted)] font-medium">
              {portal === "student" ? "Student" : portal === "college" ? "College" : portal === "company" ? "Company" : "Admin"}
            </span>
          </div>
        </div>

        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`hidden text-[var(--text-muted)] transition-transform duration-200 md:block ${
            isMenuOpen ? "rotate-180 text-[var(--accent-strong)]" : "group-hover:text-[var(--text-primary)]"
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            role="dialog"
            aria-label="User account menu"
            aria-modal="false"
            initial={{ opacity: 0, scale: 0.96, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(22.5rem,calc(100vw-1.5rem))] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] shadow-[0_20px_50px_rgba(0,0,0,0.65)] backdrop-blur-xl"
          >
            {/* Identity Hero Header */}
            <div className="relative overflow-hidden border-b border-[var(--border-subtle)] bg-[linear-gradient(135deg,rgba(216,255,62,0.08)_0%,transparent_60%)] p-4 sm:p-5">
              <div className="flex items-start gap-3.5">
                <div className="relative shrink-0">
                  {avatarUrl && !avatarError ? (
                    <Image
                      src={avatarUrl}
                      alt={`${displayName} profile photo`}
                      width={48}
                      height={48}
                      unoptimized
                      onError={() => setAvatarError(true)}
                      className="h-12 w-12 rounded-xl border border-[var(--accent)]/40 object-cover shadow-md"
                    />
                  ) : (
                    <div className="grid h-12 w-12 place-items-center rounded-xl border border-[var(--accent)]/30 bg-[var(--surface-elevated)] font-mono text-base font-black text-[var(--accent-strong)] shadow-md">
                      {initials}
                    </div>
                  )}
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--accent)] text-black font-black text-[9px] shadow-sm"
                  >
                    ★
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-bold text-[var(--text-primary)]">
                      {displayName}
                    </p>
                    <span className="rounded-md border border-[var(--accent)]/30 bg-[var(--accent)]/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[var(--accent-strong)]">
                      Level {level}
                    </span>
                  </div>
                  <p className="truncate text-xs font-mono text-[var(--text-muted)] mt-0.5">
                    {username}
                  </p>
                  {email && (
                    <p className="truncate text-[11px] text-[var(--text-secondary)] mt-0.5">
                      {email}
                    </p>
                  )}
                </div>
              </div>

              {/* Level XP Progress Bar */}
              <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-2.5">
                <div className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase text-[var(--text-muted)]">
                  <span className="flex items-center gap-1 text-[var(--accent-strong)]">
                    <Zap size={11} className="text-[var(--accent)]" /> Level Progress
                  </span>
                  <span className="font-mono tabular-nums text-[var(--text-secondary)]">
                    {progressPercent !== undefined ? `${progressPercent}%` : "—"}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-subtle)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] shadow-[0_0_8px_rgba(216,255,62,0.4)] transition-all duration-300"
                    style={{
                      width: `${
                        progressPercent !== undefined
                          ? Math.min(100, Math.max(0, progressPercent))
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[9px] font-medium text-[var(--text-muted)]">
                  <span>
                    {xp !== undefined
                      ? `${formatDashboardNumber(xp)} XP total`
                      : "XP loading..."}
                  </span>
                  <span>
                    {xpToNext !== undefined
                      ? `${formatDashboardNumber(xpToNext)} XP to Lvl ${level + 1}`
                      : `Tier ${level}`}
                  </span>
                </div>
              </div>

              {/* Quick Telemetry Chips */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2.5 py-1.5">
                  <Flame size={14} className="text-amber-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold tabular-nums text-[var(--text-primary)]">
                      {streak !== undefined ? `${streak} ${streak === 1 ? "day" : "days"}` : "—"}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Daily Streak</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-elevated)] px-2.5 py-1.5">
                  <Trophy size={14} className="text-[var(--accent-strong)] shrink-0" />
                  <div className="min-w-0">
                    <p className="font-mono text-xs font-bold tabular-nums text-[var(--text-primary)]">
                      {rating !== undefined ? rating : "—"}
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-[var(--text-muted)]">Arena Rating</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Links */}
            <div className="max-h-[min(24rem,calc(100dvh-16rem))] overflow-y-auto p-2 divide-y divide-[var(--border-subtle)]">
              {/* Primary Section */}
              <div className="space-y-0.5 pb-2">
                <p className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  My Growth
                </p>
                {menuSections.primaryLinks.map(({ label, description, href, icon: Icon, highlight }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleNavigate(href)}
                    className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-[var(--surface-elevated)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                  >
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition ${
                      highlight
                        ? "border-[var(--accent)]/30 bg-[var(--accent)]/15 text-[var(--accent-strong)]"
                        : "border-[var(--border-default)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] group-hover:border-[var(--accent)]/30 group-hover:text-[var(--accent-strong)]"
                    }`}>
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-[var(--text-primary)]">{label}</span>
                      <span className="block text-[10px] text-[var(--text-muted)] truncate">{description}</span>
                    </span>
                    <ChevronRight size={13} className="text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--accent-strong)]" />
                  </button>
                ))}
              </div>

              {/* Competitive & Practice */}
              <div className="space-y-0.5 py-2">
                <p className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  Arena & Practice
                </p>
                {menuSections.practiceLinks.map(({ label, description, href, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleNavigate(href)}
                    className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-[var(--surface-elevated)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition group-hover:border-[var(--accent)]/30 group-hover:text-[var(--accent-strong)]">
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-[var(--text-primary)]">{label}</span>
                      <span className="block text-[10px] text-[var(--text-muted)] truncate">{description}</span>
                    </span>
                    <ChevronRight size={13} className="text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--accent-strong)]" />
                  </button>
                ))}
              </div>

              {/* Admin / Portal Links if available */}
              {menuSections.adminLinks.length > 0 && (
                <div className="space-y-0.5 py-2">
                  <p className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                    Organization & Admin
                  </p>
                  {menuSections.adminLinks.map(({ label, description, href, icon: Icon }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleNavigate(href)}
                      className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-[var(--surface-elevated)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400">
                        <Icon size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-bold text-[var(--text-primary)]">{label}</span>
                        <span className="block text-[10px] text-[var(--text-muted)] truncate">{description}</span>
                      </span>
                      <ChevronRight size={13} className="text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-400" />
                    </button>
                  ))}
                </div>
              )}

              {/* Preferences */}
              <div className="space-y-0.5 pt-2">
                <p className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                  Preferences
                </p>
                {menuSections.preferencesLinks.map(({ label, description, href, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleNavigate(href)}
                    className="group flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition hover:bg-[var(--surface-elevated)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] transition group-hover:border-[var(--accent)]/30 group-hover:text-[var(--accent-strong)]">
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-[var(--text-primary)]">{label}</span>
                      <span className="block text-[10px] text-[var(--text-muted)] truncate">{description}</span>
                    </span>
                    <ChevronRight size={13} className="text-[var(--text-muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--accent-strong)]" />
                  </button>
                ))}
              </div>
            </div>

            {/* Sign Out Footer */}
            <div className="border-t border-[var(--border-subtle)] bg-[var(--surface-elevated)]/60 p-2.5">
              <button
                type="button"
                onClick={handleLogout}
                className="group/logout flex w-full items-center justify-between gap-3 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-300 transition-all hover:border-rose-500/40 hover:bg-rose-500/20 hover:text-white hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
              >
                <span className="flex items-center gap-2">
                  <LogOut size={14} className="transition-transform group-hover/logout:-translate-x-0.5 text-rose-400 group-hover/logout:text-white" />
                  Sign Out
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-rose-400/80">
                  End session
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
