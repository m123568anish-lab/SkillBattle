"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Shield, ShieldCheck, Users, Activity, Settings, LayoutDashboard, LogOut, Code, Server, Database, Globe } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import QubiraLogo, { QubiraIcon } from "@/components/brand/QubiraLogo";
import { ThemeToggle } from "@/components/common/ExperienceEnhancements";
import { getDashboardPath } from "@/lib/auth-routing";
import { MOTION_DURATIONS, MOTION_EASINGS } from "@/lib/motion";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const drawerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const drawer = drawerRef.current;
    drawer?.querySelector<HTMLElement>("[data-drawer-close]")?.focus();
    const getFocusableElements = () => drawer?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileNavOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = getFocusableElements();
      if (!focusable?.length) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !drawer?.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !drawer?.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus();
    };
  }, [mobileNavOpen]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-canvas)]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          <p className="mt-4 text-[var(--text-secondary)] font-medium text-sm">Verifying Administrator Privileges...</p>
        </div>
      </div>
    );
  }

  const normalizedRole = (user?.role || "").toLowerCase();
  const normalizedAccountType = (user?.account_type || user?.requested_role || "").toLowerCase();
  const isAdmin = Boolean(
    user?.is_superuser ||
      normalizedRole.includes("admin") ||
      normalizedRole.includes("platform") ||
      normalizedAccountType.includes("admin") ||
      normalizedAccountType.includes("platform")
  );

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--surface-canvas)] p-4">
        <div className="flex flex-col items-center justify-center gap-5 text-center max-w-md">
          <div className="rounded-2xl border border-[var(--status-danger)]/30 bg-[var(--status-danger)]/10 p-5">
            <Shield className="h-12 w-12 text-[var(--status-danger)]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Access Restricted</h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            This portal is strictly reserved for platform Administrators. If you believe this is an error, contact your system administrator.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-2 rounded-xl bg-[var(--accent)] px-6 py-2.5 font-bold text-sm text-[var(--text-on-accent)] hover:opacity-90 transition"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { title: "Overview", href: "/admin", icon: LayoutDashboard },
    { title: "SEO & Growth", href: "/admin?tab=seo", icon: Globe },
    { title: "Security Trust Center", href: "/admin?tab=security", icon: ShieldCheck },
    { title: "Daily Challenge", href: "/admin?tab=challenge", icon: Code },
    { title: "User Management", href: "/admin?tab=users", icon: Users },
    { title: "System Logs", href: "/admin?tab=logs", icon: Activity },
    { title: "Server Health", href: "/admin?tab=server", icon: Server },
    { title: "Verification Dashboard", href: "/admin?tab=verification", icon: Shield },
    { title: "Global Settings", href: "/admin?tab=settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)] selection:bg-[var(--accent)]/30">
      {/* Admin Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col border-r border-[var(--border-default)] bg-[var(--surface-sidebar,var(--surface-card))] shadow-[8px_0_24px_rgba(0,0,0,0.12)] lg:flex">
        <div className="flex h-16 items-center border-b border-[var(--border-default)] px-6">
          <Link
            href={user ? getDashboardPath(user) : "/login"}
            aria-label="Go to your Qubira dashboard"
            className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
          >
            <QubiraLogo variant="full" size="sm" portalBadge="ADMIN" />
          </Link>
        </div>

        <nav aria-label="Admin navigation" className="flex-1 space-y-2 px-3 py-5">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            Platform Controls
          </div>
          {navItems.map((item) => {
            const [targetPath, query = ""] = item.href.split("?");
            const isActive = pathname === targetPath && (
              query
                ? Array.from(new URLSearchParams(query).entries()).every(([key, value]) => searchParams.get(key) === value)
                : !searchParams.get("tab")
            );
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`group relative flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors duration-150 motion-reduce:transition-none ${
                  isActive
                    ? "bg-[var(--accent)]/[0.07] text-[var(--text-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="admin-sidebar-active-indicator"
                    aria-hidden="true"
                    className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r bg-[var(--accent)]"
                    transition={reduceMotion ? { duration: 0 } : { duration: MOTION_DURATIONS.fast, ease: MOTION_EASINGS.command }}
                  />
                )}
                <item.icon
                  className={`relative z-10 h-[18px] w-[18px] shrink-0 transition-colors duration-150 ${
                    isActive ? "text-[var(--accent-strong)]" : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]"
                  }`}
                />
                <span className="relative z-10">{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[var(--border-default)] p-3">
          <div className="mb-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)]">
                <Database className="h-4 w-4 text-[var(--text-muted)]" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">System health</p>
                <Link href="/admin?tab=server" className="text-xs text-[var(--accent-strong)] hover:underline">
                  Open live checks
                </Link>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => router.push("/dashboard")}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
          >
            <LogOut className="h-4 w-4" />
            Exit Admin Portal
          </button>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main id="main-content" className="min-w-0 flex-1 lg:ml-72">
        <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-4 border-b border-[var(--border-default)] bg-[var(--surface-canvas)] px-4 sm:px-6 lg:h-20 lg:px-10">
          <div className="flex min-w-0 items-center gap-2.5 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen((open) => !open)}
              aria-label={mobileNavOpen ? "Close admin navigation" : "Open admin navigation"}
              aria-expanded={mobileNavOpen}
              aria-controls="admin-mobile-navigation-drawer"
              data-mobile-menu-trigger
              title={mobileNavOpen ? "Close admin navigation" : "Open admin navigation"}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] transition-colors hover:border-[var(--accent)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
            >
              <QubiraIcon size={27} />
            </button>
            <Link
              href={user ? getDashboardPath(user) : "/login"}
              aria-label="Go to your Qubira dashboard"
              title="Dashboard"
              className="truncate rounded px-1 py-2 text-sm font-black tracking-[0.12em] text-[var(--text-primary)] transition-colors hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
            >
              QUBIRA
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[var(--status-success)]" />
            <span className="hidden text-sm font-semibold text-[var(--text-secondary)] sm:inline">Live System Monitor</span>
          </div>
          
          <div className="flex items-center gap-4">
             <ThemeToggle />
             <div className="hidden items-center gap-3 rounded-full border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-1.5 sm:flex">
                <span className="text-sm font-bold text-[var(--text-primary)]">{user?.username || user?.full_name}</span>
                <span className="rounded bg-[var(--accent)]/15 px-2 py-0.5 text-xs font-bold text-[var(--accent-strong)] uppercase">
                  {user?.role}
                </span>
             </div>
          </div>
        </header>

        <AnimatePresence>
          {mobileNavOpen && (
            <div className="fixed inset-0 z-[60] lg:hidden">
              <motion.button
                type="button"
                aria-label="Close admin navigation"
                onClick={() => setMobileNavOpen(false)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : MOTION_DURATIONS.fast }}
                className="absolute inset-0 cursor-default bg-black/55 backdrop-blur-[2px]"
              />
              <motion.div
                ref={drawerRef}
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={reduceMotion ? { duration: 0 } : { duration: MOTION_DURATIONS.normal, ease: MOTION_EASINGS.command }}
                role="dialog"
                aria-modal="true"
                aria-label="Admin navigation"
                id="admin-mobile-navigation-drawer"
                tabIndex={-1}
                className="relative z-10 flex h-full w-[min(86vw,22rem)] flex-col border-r border-[var(--border-default)] bg-[var(--surface-sidebar,var(--surface-card))] pt-[env(safe-area-inset-top)] shadow-2xl"
              >
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border-default)] px-3.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setMobileNavOpen(false)}
                      aria-label="Close admin navigation"
                      aria-expanded="true"
                      aria-controls="admin-mobile-navigation-drawer"
                      title="Close admin navigation"
                      data-drawer-close
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-elevated)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
                    >
                      <QubiraIcon size={27} />
                    </button>
                    <Link
                      href={user ? getDashboardPath(user) : "/login"}
                      aria-label="Go to your Qubira dashboard"
                      className="truncate rounded px-1 py-2 text-sm font-black tracking-[0.12em] text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
                    >
                      QUBIRA
                    </Link>
                  </div>
                </div>
                <nav aria-label="Admin navigation" className="flex-1 space-y-1 overflow-y-auto p-3">
                  <div className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    Platform Controls
                  </div>
                  {navItems.map((item) => {
                    const [targetPath, query = ""] = item.href.split("?");
                    const isActive = pathname === targetPath && (
                      query
                        ? Array.from(new URLSearchParams(query).entries()).every(([key, value]) => searchParams.get(key) === value)
                        : !searchParams.get("tab")
                    );
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={`relative flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-colors duration-150 motion-reduce:transition-none ${
                          isActive
                            ? "bg-[var(--accent)]/[0.07] text-[var(--text-primary)]"
                            : "text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        {isActive && (
                          <span aria-hidden="true" className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r bg-[var(--accent)]" />
                        )}
                        <item.icon className={`relative z-10 h-[18px] w-[18px] shrink-0 ${isActive ? "text-[var(--accent-strong)]" : "text-[var(--text-muted)]"}`} />
                        <span className="relative z-10">{item.title}</span>
                      </Link>
                    );
                  })}
                </nav>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="p-4 sm:p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
