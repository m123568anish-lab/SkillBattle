"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, Users, Activity, Settings, LayoutDashboard, LogOut, Code, Server, Database } from "lucide-react";
import { useDashboard } from "@/hooks/use-dashboard";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { dashboard, loading } = useDashboard();

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

  const isAdmin = dashboard?.user?.role === "admin" || dashboard?.user?.is_superuser;

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
    { title: "Global Settings", href: "/admin?tab=settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[#050505] text-slate-200 selection:bg-violet-500/30">
      {/* Admin Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/5 bg-black/40 backdrop-blur-2xl">
        <div className="flex h-20 items-center gap-3 px-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-white">
            Battle<span className="text-violet-500">Admin</span>
          </span>
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
                <p className="text-sm font-bold text-white">DB Status</p>
                <p className="text-xs text-emerald-400">Connected & Stable</p>
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
      <main className="ml-72 flex-1">
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-white/5 bg-[#050505]/80 px-10 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
            <span className="text-sm font-semibold text-slate-400">Live System Monitor</span>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                <div className="h-6 w-6 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
                <span className="text-sm font-bold text-white">{dashboard?.user?.username}</span>
                <span className="rounded bg-violet-500/20 px-2 py-0.5 text-xs font-bold text-violet-400 uppercase">
                  {dashboard?.user?.role}
                </span>
             </div>
          </div>
        </header>
        
        <div className="p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
