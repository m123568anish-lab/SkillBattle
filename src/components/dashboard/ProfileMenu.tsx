"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  User,
  Settings,
  LogOut,
  Shield,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export default function ProfileMenu() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const displayName = user?.full_name || user?.username || "User";
  const avatarUrl =
    user?.avatar_url ||
    user?.avatar ||
    `https://ui-avatars.com/api/?name=${displayName}&background=070B14&color=06b6d4&bold=true`;

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
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
            <img
              src={avatarUrl}
              alt="Profile"
              className="relative h-9 w-9 rounded-full border border-white/20"
            />
          </div>

          <div className="hidden text-left md:block">
            <p className="text-sm font-bold leading-tight text-white">{displayName}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">Level {user?.level ?? 1}</p>
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
            <p className="truncate text-sm font-bold text-white">{user?.email || displayName}</p>
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
          className="flex items-center gap-0 rounded-full border border-white/10 bg-[#070B14] p-1 shadow-lg shadow-black/20 transition-transform active:scale-[.98] sm:gap-2 sm:rounded-xl sm:px-2.5 sm:py-2"
          aria-label="Open profile menu"
        >
          <div className="relative rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-500 p-0.5">
            <img
              src={avatarUrl}
              alt="Profile"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
              className="h-9 w-9 rounded-full object-cover"
            />
          </div>
        </button>
      </div>

      {isMobileMenuOpen && typeof document !== "undefined" && createPortal(
        <>
          <button
            type="button"
            aria-label="Close profile menu"
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-40 animate-[profile-fade-in_180ms_ease-out] bg-black/70 backdrop-blur-md md:hidden"
          />

          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] w-full animate-[profile-sheet-in_240ms_cubic-bezier(0.22,1,0.36,1)] overflow-y-auto rounded-t-[2rem] border-t border-white/10 bg-[#080b14]/[.98] px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-20px_80px_rgba(0,0,0,.55)] md:hidden">
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/15" />

            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300">Account</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-white">Your profile</h2>
              </div>
              <button type="button" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close profile menu" className="rounded-full border border-white/10 bg-white/5 p-2.5 text-slate-400 transition hover:bg-white/10 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="relative mb-5 overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/15 via-blue-500/10 to-violet-500/15 p-4">
              <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
              <div className="relative flex items-center gap-3.5">
                <div className="rounded-full bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-500 p-0.5 shadow-lg shadow-cyan-500/20">
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                    className="h-14 w-14 rounded-full border-2 border-[#101522] object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-base font-bold text-white">{displayName}</p>
                    <Shield className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-400">{user?.email || displayName}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-200">Admin</span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200">Level {user?.level ?? 1}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Manage</div>
            <div className="space-y-2">
              <button onClick={() => { setIsMobileMenuOpen(false); router.push("/profile"); }} className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[.045] px-4 py-3.5 text-left transition hover:border-cyan-400/30 hover:bg-cyan-400/10">
                <span className="rounded-xl bg-cyan-400/10 p-2.5 text-cyan-300"><User size={18} /></span>
                <span className="flex-1 text-sm font-semibold text-white">My Profile<span className="mt-0.5 block text-xs font-normal text-slate-500">View and edit your profile</span></span>
                <ChevronRight size={17} className="text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-cyan-300" />
              </button>

              <button onClick={() => { setIsMobileMenuOpen(false); router.push("/settings"); }} className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[.045] px-4 py-3.5 text-left transition hover:border-violet-400/30 hover:bg-violet-400/10">
                <span className="rounded-xl bg-violet-400/10 p-2.5 text-violet-300"><Settings size={18} /></span>
                <span className="flex-1 text-sm font-semibold text-white">Settings<span className="mt-0.5 block text-xs font-normal text-slate-500">Preferences and security</span></span>
                <ChevronRight size={17} className="text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-violet-300" />
              </button>
            </div>

            <button onClick={handleLogout} className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3.5 text-sm font-bold text-rose-300 transition hover:bg-rose-500 hover:text-white">
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </>,
        document.body
      )}
    </>
  );
}