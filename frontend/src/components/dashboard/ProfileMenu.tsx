"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  User,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import Image from "next/image";

export default function ProfileMenu() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const avatarUrl =
    (user as any)?.avatar_url ||
    `https://ui-avatars.com/api/?name=${(user as any)?.username || user?.full_name || "User"}&background=070B14&color=06b6d4&bold=true`;

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMobileMenuOpen]);

  async function handleLogout() {
    setIsMobileMenuOpen(false);
    try {
      await logout();
    } finally {
      router.push("/login");
    }
  }

  if (!isAuthenticated) return null;

  return (
    <>
      <div className="group relative hidden md:block">
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
            <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 opacity-70 blur-sm transition duration-300 group-hover:opacity-100"></div>
            <Image
              src={avatarUrl}
              alt="Profile"
              width={36}
              height={36}
              sizes="36px"
              className="relative h-9 w-9 rounded-full border border-white/20"
            />
          </div>

          <div className="hidden text-left md:block">
            <p className="text-sm font-bold leading-tight text-white">{user?.full_name || (user as any)?.username || "User"}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">Level {(user as any)?.level ?? 1}</p>
          </div>

          <ChevronDown size={16} className="ml-1 text-slate-400 transition group-hover:text-white" />
        </button>

        <div
          className="
            invisible
            absolute
            right-0
            top-[calc(100%+8px)]
            z-50
            w-60
            translate-y-2
            rounded-2xl
            border
            border-white/10
            bg-[#0A0E1A]/95
            p-2
            opacity-0
            shadow-2xl
            shadow-black
            backdrop-blur-xl
            transition-all
            duration-200
            group-hover:visible
            group-hover:translate-y-0
            group-hover:opacity-100
          "
        >
          <div className="mb-2 border-b border-white/5 px-3 py-2">
            <p className="text-xs font-semibold text-slate-400">Signed in as</p>
            <p className="truncate text-sm font-bold text-white">{(user as any)?.email || user?.full_name}</p>
          </div>

          <div className="space-y-1">
            <button onClick={() => router.push("/profile")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
              <User size={16} />
              My Profile
            </button>

            <button onClick={() => router.push("/settings")} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-white">
              <Settings size={16} />
              Settings
            </button>
          </div>

          <div className="mt-2 border-t border-white/5 pt-2">
            <button onClick={handleLogout} className="group/logout flex w-full items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-400 transition-all hover:bg-rose-500 hover:text-white hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]">
              <span className="flex items-center gap-2">
                <LogOut size={16} className="transition-transform group-hover/logout:-translate-x-1" />
                Sign Out
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="block md:hidden">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          suppressHydrationWarning
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#070B14] px-2.5 py-2 shadow-lg shadow-black/20"
          aria-label="Open profile menu"
        >
          <div className="relative">
            <Image
              src={avatarUrl}
              alt="Profile"
              width={32}
              height={32}
              sizes="32px"
              className="h-8 w-8 rounded-full border border-white/20"
            />
          </div>
          <div className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-cyan-300">
            Admin
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-300">Level 1</span>
        </button>
      </div>

      {isMobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Close profile menu"
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          />

          <div className="fixed inset-x-0 bottom-0 z-50 w-full rounded-t-3xl border-t border-white/10 bg-zinc-950 p-6 pb-8 shadow-2xl md:hidden">
            <div className="mx-auto mb-4 h-1 w-12 rounded-full bg-zinc-700" />

            <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  width={44}
                  height={44}
                  sizes="44px"
                  className="h-11 w-11 rounded-full border border-white/20"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">Admin</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">Level 1</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{(user as any)?.email || user?.full_name}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button onClick={() => { setIsMobileMenuOpen(false); router.push("/profile"); }} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-base font-semibold text-white transition hover:bg-white/10">
                <User size={18} className="text-cyan-300" />
                My Profile
              </button>

              <button onClick={() => { setIsMobileMenuOpen(false); router.push("/settings"); }} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-base font-semibold text-white transition hover:bg-white/10">
                <Settings size={18} className="text-violet-300" />
                Settings
              </button>
            </div>

            <button onClick={handleLogout} className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-4 text-base font-bold text-rose-300 transition hover:bg-rose-500 hover:text-white">
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </>
      )}
    </>
  );
}