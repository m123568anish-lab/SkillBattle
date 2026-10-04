"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  ChevronRight,
  LockKeyhole,
  LogOut,
  Settings,
  ShieldCheck,
  User,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getPortalKind } from "@/data/dashboard";

export default function ProfileMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const portal = getPortalKind(pathname);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const displayName = user?.full_name || user?.username || "User";
  const email = user?.email || "Your account";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "U";
  const avatarUrl = user?.avatar_url || user?.avatar || null;

  const menuActions = useMemo(() => {
    const role = (user?.role || user?.account_type || "student").toLowerCase();
    const isAdmin = Boolean(user?.is_superuser || role.includes("admin"));
    const isCollege = role.includes("college");
    const isCompany = role.includes("company");
    const items = [
      { label: "Profile", description: "View your profile", href: "/profile", icon: User },
      { label: "Settings", description: "Manage preferences", href: "/settings", icon: Settings },
      { label: "Notifications", description: "Recent activity", href: "/activity", icon: Bell },
    ];

    if (isCollege) {
      items.splice(1, 0, { label: "Organization Profile", description: "Institution details", href: "/organization-setup", icon: Building2 });
    }

    if (isCompany) {
      items.splice(1, 0, { label: "Company Profile", description: "Organization details", href: "/organization-setup", icon: BriefcaseBusiness });
    }

    if (isAdmin) {
      items.push({ label: "Admin Settings", description: "Platform controls", href: "/admin?tab=settings", icon: ShieldCheck });
      items.push({ label: "Security", description: "Account protection", href: "/settings", icon: LockKeyhole });
    }

    return items;
  }, [user]);

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
      <button
        type="button"
        suppressHydrationWarning
        aria-label="Open profile menu"
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        onClick={() => setIsMenuOpen((open) => !open)}
        className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#070B14] px-2.5 py-2 text-left transition hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] md:px-4"
      >
        <div className="relative">
          <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 opacity-70 blur-sm transition duration-300" />
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Profile"
              className="relative h-8 w-8 rounded-full border border-white/20 object-cover md:h-9 md:w-9"
            />
          ) : (
            <div className="relative grid h-8 w-8 place-items-center rounded-full border border-white/20 bg-slate-800 text-xs font-black text-cyan-200 md:h-9 md:w-9">
              {initials}
            </div>
          )}
        </div>

        <div className="hidden text-left md:block">
          <p className="text-sm font-bold text-white leading-tight">{displayName}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
            {portal === "student" ? `Level ${user?.level ?? 1}` : portal === "college" ? "College account" : portal === "company" ? "Company account" : "Admin account"}
          </p>
        </div>

        <ChevronDown size={16} className={`hidden text-slate-400 transition md:block ${isMenuOpen ? "rotate-180 text-white" : ""}`} />
      </button>

      {isMenuOpen && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[min(21rem,calc(100vw-1.5rem))] rounded-2xl border border-white/10 bg-[#0A0E1A]/95 p-2 shadow-2xl shadow-black/60 backdrop-blur-xl md:w-72">
          <div className="mb-2 flex items-center gap-3 border-b border-white/5 px-3 py-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Profile preview" className="h-11 w-11 rounded-full border border-white/20 object-cover" />
            ) : (
              <div className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-slate-800 text-sm font-black text-cyan-200">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{displayName}</p>
              <p className="truncate text-xs text-slate-400">{email}</p>
            </div>
          </div>

          <div className="space-y-1">
            {menuActions.map(({ label, description, href, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => handleNavigate(href)}
                className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition hover:border-cyan-500/20 hover:bg-white/5"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-500/10 text-cyan-300">
                  <Icon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white">{label}</span>
                  <span className="block text-[11px] text-slate-400">{description}</span>
                </span>
                <ChevronRight size={15} className="text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-cyan-300" />
              </button>
            ))}
          </div>

          <div className="mt-3 border-t border-white/5 pt-2">
            <button
              type="button"
              onClick={handleLogout}
              className="group/logout flex w-full items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2.5 text-sm font-bold text-rose-400 transition-all hover:bg-rose-500 hover:text-white hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]"
            >
              <span className="flex items-center gap-2">
                <LogOut size={16} className="transition-transform group-hover/logout:-translate-x-1" />
                Sign Out
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}