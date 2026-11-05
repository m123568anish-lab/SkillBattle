"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, Users, Activity, Settings, LayoutDashboard, LogOut, Code, Server, Database, Menu, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import QubiraLogo from "@/components/brand/QubiraLogo";
import { ThemeToggle } from "@/components/common/ExperienceEnhancements";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          <p className="mt-5 text-slate-400 font-semibold">Verifying Administrator Privileges...</p>
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
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center justify-center gap-6 text-center z-10">
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/10 p-6 shadow-2xl shadow-rose-500/20">
            <Shield className="h-16 w-16 text-rose-500" />
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight">System Locked</h2>
          <p className="max-w-md text-slate-400 text-lg">
            This portal is strictly reserved for platform Administrators. Security event logged.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-8 py-3 font-bold text-white shadow-lg shadow-cyan-500/20 hover:opacity-90 transition"
          >
            Return to Safety
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { title: "Overview", href: "/admin", icon: LayoutDashboard },
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
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col border-r border-[var(--border-default)] bg-[var(--surface-card)] lg:flex">
        <div className="flex h-20 items-center gap-3 px-8">
          <QubiraLogo variant="full" size="sm" portalBadge="ADMIN" />
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-6">
          <div className="px-4 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            Platform Controls
          </div>
          {navItems.map((item) => {
            // For this basic layout, we'll just check if it's the dashboard vs a tab link. 
            // In a real multi-page admin we'd use usePathname exactly.
            const isActive = pathname === item.href || (pathname === "/admin" && item.title === "Overview"); 
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-violet-500/10 text-violet-400"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 transition-transform duration-200 ${
                    isActive ? "scale-110" : "group-hover:scale-110"
                  }`}
                />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/5 p-4">
          <div className="mb-4 rounded-xl border border-white/5 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                <Database className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">System health</p>
                <Link href="/admin?tab=server" className="text-xs text-cyan-300 hover:text-cyan-200">
                  Open live checks
                </Link>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => router.push("/dashboard")}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            <LogOut className="h-4 w-4" />
            Exit Admin Portal
          </button>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main id="main-content" className="min-w-0 flex-1 lg:ml-72">
        <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between gap-4 border-b border-[var(--border-default)] bg-[var(--surface-canvas)] px-4 sm:px-6 lg:h-20 lg:px-10">
          <div className="flex items-center gap-3 lg:hidden">
            <button type="button" onClick={() => setMobileNavOpen((open) => !open)} aria-label={mobileNavOpen ? "Close admin navigation" : "Open admin navigation"} aria-expanded={mobileNavOpen} className="rounded-lg border border-[var(--border-default)] p-2 text-[var(--text-secondary)]">
              {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <QubiraLogo variant="icon" size="sm" />
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

        {mobileNavOpen && (
          <nav aria-label="Admin navigation" className="border-b border-[var(--border-default)] bg-[var(--surface-card)] p-3 lg:hidden">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileNavOpen(false)} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--text-primary)]">
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </nav>
        )}

        <div className="p-4 sm:p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
