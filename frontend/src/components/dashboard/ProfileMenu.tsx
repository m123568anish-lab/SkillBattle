"use client";

import { useRouter } from "next/navigation";
import {
  ChevronDown,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function ProfileMenu() {
  const router = useRouter();

  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.push("/login");
    }
  }

  if (!isAuthenticated) return null;

  return (
    <div className="group relative">

      <button
        suppressHydrationWarning
        className="
          flex
          items-center
          gap-3
          rounded-xl
          border
          border-white/10
          bg-[#070B14]
          px-4
          py-2
          transition
          hover:border-cyan-500/50
          hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]
        "
      >
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 opacity-70 blur-sm group-hover:opacity-100 transition duration-300"></div>
          <img
            src={(user as any)?.avatar_url || `https://ui-avatars.com/api/?name=${(user as any)?.username || user?.full_name || 'User'}&background=070B14&color=06b6d4&bold=true`}
            alt="Profile"
            className="relative h-9 w-9 rounded-full border border-white/20"
          />
        </div>

        <div className="hidden text-left md:block">
          <p className="text-sm font-bold text-white leading-tight">{user?.full_name || (user as any)?.username || 'User'}</p>
          <p className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">Level {(user as any)?.level ?? 1}</p>
        </div>

        <ChevronDown size={16} className="text-slate-400 ml-1 transition group-hover:text-white" />
      </button>

      <div
        className="
          invisible
          absolute
          right-0
          top-[calc(100%+8px)]
          w-60
          rounded-2xl
          border
          border-white/10
          bg-[#0A0E1A]/95
          backdrop-blur-xl
          p-2
          opacity-0
          shadow-2xl
          shadow-black
          transition-all
          duration-200
          translate-y-2
          group-hover:visible
          group-hover:opacity-100
          group-hover:translate-y-0
          z-50
        "
      >
        <div className="px-3 py-2 mb-2 border-b border-white/5">
          <p className="text-xs text-slate-400 font-semibold">Signed in as</p>
          <p className="text-sm text-white font-bold truncate">{(user as any)?.email || user?.full_name}</p>
        </div>

        <div className="space-y-1">
          <button onClick={() => router.push('/profile')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
            <User size={16} />
            My Profile
          </button>

          <button onClick={() => router.push('/settings')} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
            <Settings size={16} />
            Settings
          </button>
        </div>

        <div className="mt-2 pt-2 border-t border-white/5">
          <button onClick={handleLogout} className="group/logout flex w-full items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-400 transition-all hover:bg-rose-500 hover:text-white hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]">
            <span className="flex items-center gap-2">
              <LogOut size={16} className="transition-transform group-hover/logout:-translate-x-1" />
              Sign Out
            </span>
          </button>
        </div>
      </div>

    </div>
  );
}